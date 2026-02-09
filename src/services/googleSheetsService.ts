// Serviço para integração com Google Sheets API

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  clientId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  configuredAt?: string;
  // Configurações de sincronização
  syncEnabled?: boolean;
  syncIntervalMinutes?: number;
  syncMode?: 'manual' | 'auto';
  lastSyncAt?: string;
  tableMappings?: TableMapping[];
}

export interface TableMapping {
  sheetName: string;
  tableName: string;
  direction: 'read' | 'write' | 'bidirectional';
  lastSyncAt?: string;
  enabled: boolean;
}

export interface SheetInfo {
  title: string;
  sheetId: number;
  index: number;
}

export interface SheetData {
  headers: string[];
  rows: any[][];
}

const CONFIG_KEY = 'google_sheets_config';

// Obter configuração salva
export const getGoogleSheetsConfig = (): GoogleSheetsConfig | null => {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Erro ao recuperar config do Google Sheets:', error);
  }
  return null;
};

// Salvar configuração
export const saveGoogleSheetsConfig = (config: Partial<GoogleSheetsConfig>): void => {
  try {
    const existing = getGoogleSheetsConfig() || {};
    const updated = { ...existing, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Erro ao salvar config do Google Sheets:', error);
  }
};

// Verificar se está configurado
export const isGoogleSheetsConfigured = (): boolean => {
  const config = getGoogleSheetsConfig();
  return !!(config?.apiKey && config?.spreadsheetId);
};

// Verificar se OAuth está configurado (necessário para escrita)
export const isOAuthConfigured = (): boolean => {
  const config = getGoogleSheetsConfig();
  return !!(config?.accessToken && config?.clientId);
};

// Buscar metadados da planilha (lista de abas)
export const fetchSpreadsheetMetadata = async (): Promise<SheetInfo[]> => {
  const config = getGoogleSheetsConfig();
  if (!config?.apiKey || !config?.spreadsheetId) {
    throw new Error('Google Sheets não configurado');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?key=${config.apiKey}&fields=sheets.properties`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao acessar planilha');
  }

  const data = await response.json();
  
  return data.sheets.map((sheet: any) => ({
    title: sheet.properties.title,
    sheetId: sheet.properties.sheetId,
    index: sheet.properties.index,
  }));
};

// Buscar dados de uma aba específica
export const fetchSheetData = async (sheetName: string, range?: string): Promise<SheetData> => {
  const config = getGoogleSheetsConfig();
  if (!config?.apiKey || !config?.spreadsheetId) {
    throw new Error('Google Sheets não configurado');
  }

  const rangeQuery = range || sheetName;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(rangeQuery)}?key=${config.apiKey}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao buscar dados da planilha');
  }

  const data = await response.json();
  const values = data.values || [];
  
  if (values.length === 0) {
    return { headers: [], rows: [] };
  }

  return {
    headers: values[0] || [],
    rows: values.slice(1) || [],
  };
};

// Buscar dados de múltiplas abas de uma vez
export const fetchMultipleSheetsData = async (sheetNames: string[]): Promise<Record<string, SheetData>> => {
  const results: Record<string, SheetData> = {};
  
  await Promise.all(
    sheetNames.map(async (sheetName) => {
      try {
        results[sheetName] = await fetchSheetData(sheetName);
      } catch (error) {
        console.error(`Erro ao buscar aba ${sheetName}:`, error);
        results[sheetName] = { headers: [], rows: [] };
      }
    })
  );
  
  return results;
};

// Escrever dados em uma aba (requer OAuth)
export const writeSheetData = async (
  sheetName: string, 
  data: any[], 
  options: { append?: boolean; clearFirst?: boolean } = {}
): Promise<{ updatedRows: number }> => {
  const config = getGoogleSheetsConfig();
  
  if (!config?.accessToken) {
    throw new Error('OAuth não configurado. Faça login com Google para escrever na planilha.');
  }
  
  if (!config?.spreadsheetId) {
    throw new Error('ID da planilha não configurado');
  }

  if (data.length === 0) {
    return { updatedRows: 0 };
  }

  // Preparar dados para envio (converter objetos para array de arrays)
  // Usar todas as chaves possíveis de todos os objetos para garantir que nenhuma coluna seja perdida
  const allKeys = new Set<string>();
  data.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
  const headers = Array.from(allKeys);
  
  const rows = data.map(item => headers.map(h => item[h] ?? ''));
  const values = [headers, ...rows];

  const range = `${sheetName}!A1`;
  const valueInputOption = 'USER_ENTERED';

  // Se for append, usar endpoint de append
  if (options.append) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=${valueInputOption}&insertDataOption=INSERT_ROWS`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }), // Só as linhas, sem header
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao adicionar dados');
    }

    const result = await response.json();
    return { updatedRows: result.updates?.updatedRows || rows.length };
  }

  // Limpar aba antes de escrever (opcional)
  if (options.clearFirst) {
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Escrever dados
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=${valueInputOption}`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao escrever dados');
  }

  const result = await response.json();
  return { updatedRows: result.updatedRows || data.length };
};

// Converter dados da planilha para objetos
export const sheetDataToObjects = (sheetData: SheetData): Record<string, any>[] => {
  const { headers, rows } = sheetData;
  
  return rows.map(row => {
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      let value: any = row[index] ?? '';
      
      // Tentar converter números
      if (value !== '' && !isNaN(Number(value.toString().replace(',', '.')))) {
        value = Number(value.toString().replace(',', '.'));
      }
      
      // Converter booleanos
      if (value === 'true' || value === 'TRUE' || value === 'Sim' || value === 'sim') value = true;
      if (value === 'false' || value === 'FALSE' || value === 'Não' || value === 'nao') value = false;
      
      obj[header] = value;
    });
    return obj;
  });
};

// Mapear colunas da planilha para campos do sistema
export interface ColumnMapping {
  sheetColumn: string;
  systemField: string;
}

export const mapSheetDataToSystem = (
  data: Record<string, any>[],
  mappings: ColumnMapping[]
): Record<string, any>[] => {
  return data.map(row => {
    const mapped: Record<string, any> = {};
    mappings.forEach(({ sheetColumn, systemField }) => {
      if (row[sheetColumn] !== undefined) {
        mapped[systemField] = row[sheetColumn];
      }
    });
    return mapped;
  });
};

// Comparar dados para detectar mudanças (usado na sincronização)
export const detectChanges = (
  localData: any[],
  sheetData: any[],
  idField: string = 'id'
): { toAdd: any[]; toUpdate: any[]; toDelete: any[] } => {
  const localMap = new Map(localData.map(item => [item[idField], item]));
  const sheetMap = new Map(sheetData.map(item => [item[idField], item]));
  
  const toAdd: any[] = [];
  const toUpdate: any[] = [];
  const toDelete: any[] = [];
  
  // Itens no sheet que não estão no local (adicionar)
  // Itens no sheet que estão no local mas diferentes (atualizar)
  sheetData.forEach(sheetItem => {
    const id = sheetItem[idField];
    const localItem = localMap.get(id);
    
    if (!localItem) {
      toAdd.push(sheetItem);
    } else if (JSON.stringify(localItem) !== JSON.stringify(sheetItem)) {
      toUpdate.push(sheetItem);
    }
  });
  
  // Itens no local que não estão no sheet (deletar - opcional)
  localData.forEach(localItem => {
    const id = localItem[idField];
    if (!sheetMap.has(id)) {
      toDelete.push(localItem);
    }
  });
  
  return { toAdd, toUpdate, toDelete };
};

// Inicialização do OAuth (Google Identity Services)
export const initGoogleAuth = async (clientId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Carregar script do Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: (response: any) => {
          if (response.access_token) {
            saveGoogleSheetsConfig({
              accessToken: response.access_token,
              tokenExpiry: new Date(Date.now() + response.expires_in * 1000).toISOString(),
            });
            resolve(response.access_token);
          } else {
            reject(new Error('Falha ao obter token'));
          }
        },
      });
      
      tokenClient.requestAccessToken({ prompt: 'consent' });
    };
    script.onerror = () => reject(new Error('Falha ao carregar Google Identity Services'));
    document.head.appendChild(script);
  });
};
