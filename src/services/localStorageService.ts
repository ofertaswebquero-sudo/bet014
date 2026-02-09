// Serviço de LocalStorage para modo offline
// Sincroniza dados automaticamente com o navegador
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'bet_balance_boss_backup';

export interface LocalBackupData {
  apostas: any[];
  apostas_surebet: any[];
  casas: any[];
  caixa_geral: any[];
  saques_aportes: any[];
  diario_operacoes: any[];
  fechamento: any[];
  dados_referencia: any[];
  okrs: any[];
  lastUpdated: string;
}

const getEmptyBackup = (): LocalBackupData => ({
  apostas: [],
  apostas_surebet: [],
  casas: [],
  caixa_geral: [],
  saques_aportes: [],
  diario_operacoes: [],
  fechamento: [],
  dados_referencia: [],
  okrs: [],
  lastUpdated: new Date().toISOString(),
});

// Salvar backup completo
export const saveLocalBackup = (data: Partial<LocalBackupData>): void => {
  try {
    const existing = getLocalBackup();
    const updated: LocalBackupData = {
      ...existing,
      ...data,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    console.log('✅ Backup local salvo:', updated.lastUpdated);
  } catch (error) {
    console.error('❌ Erro ao salvar backup local:', error);
  }
};

// Recuperar backup
export const getLocalBackup = (): LocalBackupData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('❌ Erro ao recuperar backup local:', error);
  }
  return getEmptyBackup();
};

// Salvar tabela específica
export const saveTableToLocal = <T extends keyof Omit<LocalBackupData, 'lastUpdated'>>(
  tableName: T,
  data: LocalBackupData[T]
): void => {
  saveLocalBackup({ [tableName]: data });
};

// Recuperar tabela específica
export const getTableFromLocal = <T extends keyof Omit<LocalBackupData, 'lastUpdated'>>(
  tableName: T
): LocalBackupData[T] => {
  const backup = getLocalBackup();
  return backup[tableName];
};

// Limpar backup
export const clearLocalBackup = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🗑️ Backup local limpo');
};

// Exportar para CSV
export const exportTableToCSV = (data: any[], tableName: string): void => {
  if (!data || data.length === 0) {
    console.warn('Nenhum dado para exportar');
    return;
  }

  // Pegar headers das chaves do primeiro objeto
  const headers = Object.keys(data[0]);
  
  // Criar linhas CSV
  const csvRows = [
    headers.join(';'), // Header row com ; para Excel BR
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar valores com vírgulas ou aspas
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(';')
    )
  ];

  const csvContent = csvRows.join('\n');
  
  // Criar blob com BOM para UTF-8 (importante para Excel)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`📥 Exportado ${tableName}: ${data.length} registros`);
};

// Exportar backup completo (todas as tabelas em um JSON)
export const exportFullBackupToJSON = (): void => {
  const backup = getLocalBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_completo_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('📥 Backup completo exportado');
};

// Exportar para XLSX (Excel)
export const exportTableToXLSX = (data: any[], tableName: string): void => {
  if (!data || data.length === 0) {
    console.warn('Nenhum dado para exportar');
    return;
  }

  // Criar workbook e worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Auto-ajustar largura das colunas
  const colWidths = Object.keys(data[0]).map(key => {
    const maxLen = Math.max(
      key.length,
      ...data.map(row => String(row[key] || '').length)
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, tableName);
  
  // Gerar e baixar arquivo
  XLSX.writeFile(wb, `${tableName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  
  console.log(`📥 Exportado ${tableName}.xlsx: ${data.length} registros`);
};

// Exportar backup completo para XLSX (todas as tabelas em abas diferentes)
export const exportFullBackupToXLSX = (): void => {
  const backup = getLocalBackup();
  const wb = XLSX.utils.book_new();

  // Sempre adiciona uma aba de metadados para evitar erro quando todas as tabelas estiverem vazias
  // e para manter contexto (data do backup) no arquivo único.
  const metaWs = XLSX.utils.json_to_sheet([
    {
      lastUpdated: backup.lastUpdated,
      exportedAt: new Date().toISOString(),
    },
  ]);
  XLSX.utils.book_append_sheet(wb, metaWs, 'meta');
  
  const tables: (keyof Omit<LocalBackupData, 'lastUpdated'>)[] = [
    'apostas',
    'apostas_surebet',
    'casas',
    'caixa_geral',
    'saques_aportes',
    'diario_operacoes',
    'fechamento',
    'dados_referencia',
    'okrs',
  ];

  tables.forEach(tableName => {
    const data = (backup[tableName] ?? []) as any[];
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-ajustar largura das colunas quando houver dados
    if (data.length > 0) {
      const colWidths = Object.keys(data[0]).map(key => {
        const maxLen = Math.max(
          key.length,
          ...data.map(row => String(row[key] ?? '').length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
      ws['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(wb, ws, tableName.substring(0, 31)); // Excel limita 31 chars
  });

  try {
    XLSX.writeFile(wb, `backup_completo_${new Date().toISOString().split('T')[0]}.xlsx`);
    console.log('📥 Backup completo XLSX exportado');
  } catch (error) {
    console.error('❌ Erro ao exportar XLSX único:', error);
    throw error;
  }
};

// Deletar itens específicos de uma tabela no backup local
export const deleteItemsFromLocal = <T extends keyof Omit<LocalBackupData, 'lastUpdated'>>(
  tableName: T,
  ids: string[]
): void => {
  const backup = getLocalBackup();
  const tableData = backup[tableName] as any[];
  const filtered = tableData.filter(item => !ids.includes(item.id));
  saveLocalBackup({ [tableName]: filtered });
  console.log(`🗑️ ${ids.length} itens removidos de ${tableName}`);
};

// Limpar tabela específica do backup local
export const clearTableFromLocal = <T extends keyof Omit<LocalBackupData, 'lastUpdated'>>(
  tableName: T
): void => {
  saveLocalBackup({ [tableName]: [] });
  console.log(`🗑️ Tabela ${tableName} limpa do backup local`);
};

// Importar backup de JSON
export const importBackupFromJSON = (file: File): Promise<LocalBackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        saveLocalBackup(data);
        resolve(data);
      } catch (error) {
        reject(new Error('Arquivo JSON inválido'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};

// Importar CSV para tabela específica
export const importCSVToTable = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV deve ter pelo menos header e uma linha de dados'));
          return;
        }

        // Detectar separador (vírgula ou ponto-e-vírgula)
        const separator = lines[0].includes(';') ? ';' : ',';
        
        const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ''));
        
        const data = lines.slice(1).map(line => {
          const values = line.split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            let value: any = values[index] || '';
            // Tentar converter números
            if (!isNaN(Number(value)) && value !== '') {
              value = Number(value);
            }
            // Converter booleanos
            if (value === 'true') value = true;
            if (value === 'false') value = false;
            obj[header] = value;
          });
          return obj;
        });

        resolve(data);
      } catch (error) {
        reject(new Error('Erro ao processar CSV'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};

// Verificar se há backup local
export const hasLocalBackup = (): boolean => {
  const backup = getLocalBackup();
  return backup.lastUpdated !== getEmptyBackup().lastUpdated;
};

// Obter timestamp do último backup
export const getLastBackupTime = (): string | null => {
  const backup = getLocalBackup();
  return backup.lastUpdated;
};
