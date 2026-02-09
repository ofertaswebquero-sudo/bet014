import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  fetchSpreadsheetMetadata,
  fetchSheetData,
  writeSheetData,
  initGoogleAuth,
  isOAuthConfigured,
  SheetInfo,
  TableMapping,
  GoogleSheetsConfig,
} from '@/services/googleSheetsService';
import {
  autoDetectColumnMappings,
  mapSheetRowToSystem,
  validateRow,
  cleanDataForSupabase,
  ColumnMapping,
  TABLE_SCHEMAS,
} from '@/services/sheetColumnMapper';
import { SyncPreviewData, ValidationIssue } from '@/components/sheets/SheetSyncPreview';

type TableName = 'apostas' | 'apostas_surebet' | 'casas' | 'caixa_geral' | 'saques_aportes' | 'diario_operacoes' | 'fechamento' | 'dados_referencia' | 'okrs';

interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  nextSync: string | null;
  errors: string[];
}

interface SyncResult {
  table: string;
  direction: 'read' | 'write';
  added: number;
  updated: number;
  deleted: number;
  errors: string[];
}

interface ColumnMappingState {
  sheetName: string;
  tableName: string;
  headers: string[];
  sampleData: any[][];
  mappings: ColumnMapping[];
}

export const useGoogleSheetsSync = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [mappings, setMappings] = useState<TableMapping[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSync: null,
    nextSync: null,
    errors: [],
  });
  const [config, setConfig] = useState<GoogleSheetsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<SyncPreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [columnMappingState, setColumnMappingState] = useState<ColumnMappingState | null>(null);
  const [showColumnMapping, setShowColumnMapping] = useState(false);

  useEffect(() => {
    const savedConfig = getGoogleSheetsConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      setMappings(savedConfig.tableMappings || []);
    }
  }, []);

  const loadSheets = useCallback(async () => {
    setIsLoading(true);
    try {
      const sheetList = await fetchSpreadsheetMetadata();
      setSheets(sheetList);
      return sheetList;
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar abas',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateMapping = useCallback((mapping: TableMapping) => {
    setMappings(prev => {
      const existing = prev.findIndex(m => m.sheetName === mapping.sheetName);
      let updated: TableMapping[];
      
      if (existing >= 0) {
        updated = [...prev];
        updated[existing] = mapping;
      } else {
        updated = [...prev, mapping];
      }
      
      saveGoogleSheetsConfig({ tableMappings: updated });
      return updated;
    });
  }, []);

  const removeMapping = useCallback((sheetName: string) => {
    setMappings(prev => {
      const updated = prev.filter(m => m.sheetName !== sheetName);
      saveGoogleSheetsConfig({ tableMappings: updated });
      return updated;
    });
  }, []);

  const fetchExistingData = async (tableName: TableName): Promise<any[]> => {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
      console.error(`Erro ao buscar dados de ${tableName}:`, error);
      return [];
    }
    return data || [];
  };

  const openColumnMappingEditor = useCallback(async (sheetName: string, tableName: TableName) => {
    setIsLoading(true);
    try {
      const sheetData = await fetchSheetData(sheetName);
      const { headers, rows } = sheetData;
      
      const existingMapping = mappings.find(m => m.sheetName === sheetName);
      const detectedMappings = existingMapping?.columnMappings || autoDetectColumnMappings(headers, tableName);
      
      setColumnMappingState({
        sheetName,
        tableName,
        headers,
        sampleData: rows.slice(0, 3),
        mappings: detectedMappings,
      });
      setShowColumnMapping(true);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar colunas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, mappings]);

  const generatePreview = useCallback(async (sheetName: string, tableName: TableName, customMappings?: ColumnMapping[]): Promise<SyncPreviewData> => {
    const sheetData = await fetchSheetData(sheetName);
    const { headers, rows } = sheetData;
    
    const existingMapping = mappings.find(m => m.sheetName === sheetName);
    const columnMappings = customMappings || existingMapping?.columnMappings || autoDetectColumnMappings(headers, tableName);
    
    const existingData = await fetchExistingData(tableName);
    const existingIds = new Set(existingData.map(item => item.id));
    
    const mappedRows: any[] = [];
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    
    rows.forEach((row, rowIndex) => {
      const mapped = mapSheetRowToSystem(row, headers, columnMappings, tableName);
      const validation = validateRow(mapped, tableName, existingIds);
      validation.errors.forEach(err => errors.push({ row: rowIndex + 2, field: err.field, message: err.message, severity: 'error' }));
      validation.warnings.forEach(warn => warnings.push({ row: rowIndex + 2, field: warn.field, message: warn.message, severity: 'warning' }));
      if (validation.isValid || validation.errors.length === 0) mappedRows.push(mapped);
    });
    
    const toAdd: any[] = [];
    const toUpdate: any[] = [];
    mappedRows.forEach(row => {
      if (row.id && existingIds.has(row.id)) toUpdate.push(row);
      else {
        if (!row.id) row.id = crypto.randomUUID();
        toAdd.push(row);
      }
    });
    
    const sheetIds = new Set(mappedRows.filter(r => r.id).map(r => r.id));
    const toDelete = existingData.filter(item => !sheetIds.has(item.id));
    
    return { sheetName, tableName, columnMappings, toAdd, toUpdate, toDelete, errors, warnings };
  }, [mappings]);

  const confirmColumnMapping = useCallback(async (customMappings: ColumnMapping[]) => {
    if (!columnMappingState) return;
    
    const { sheetName, tableName } = columnMappingState;
    setShowColumnMapping(false);
    setSyncStatus(prev => ({ ...prev, isRunning: true }));
    
    try {
      const existingMapping = mappings.find(m => m.sheetName === sheetName);
      if (!existingMapping) {
        updateMapping({
          sheetName,
          tableName,
          direction: 'bidirectional',
          enabled: true,
          columnMappings: customMappings
        });
      } else {
        updateMapping({
          ...existingMapping,
          columnMappings: customMappings
        });
      }

      const preview = await generatePreview(sheetName, tableName as TableName, customMappings);
      
      setPreviewData(preview);
      setShowPreview(true);
      setSyncStatus(prev => ({ ...prev, isRunning: false }));
      setColumnMappingState(null);
    } catch (error: any) {
      toast({ title: 'Erro ao processar dados', description: error.message, variant: 'destructive' });
      setSyncStatus(prev => ({ ...prev, isRunning: false, errors: [error.message] }));
    }
  }, [columnMappingState, mappings, updateMapping, generatePreview, toast]);

  const cancelColumnMapping = useCallback(() => {
    setShowColumnMapping(false);
    setColumnMappingState(null);
  }, []);

  const syncFromSheet = useCallback(async (sheetName: string, tableName: TableName, options: { skipPreview?: boolean; previewData?: SyncPreviewData } = {}): Promise<SyncResult> => {
    const result: SyncResult = { table: tableName, direction: 'read', added: 0, updated: 0, deleted: 0, errors: [] };
    try {
      let preview = options.previewData;
      if (!preview && !options.skipPreview) {
        preview = await generatePreview(sheetName, tableName);
        setPreviewData(preview);
        setShowPreview(true);
        return result;
      }
      if (!preview) preview = await generatePreview(sheetName, tableName);
      
      if (preview.toAdd.length > 0) {
        const cleanedAdd = preview.toAdd.map(row => cleanDataForSupabase(row, tableName));
        console.log('DEBUG - INSERINDO NO SUPABASE:', {
          table: tableName,
          count: cleanedAdd.length,
          firstRowKeys: Object.keys(cleanedAdd[0]),
          firstRowData: cleanedAdd[0]
        });
        const { error } = await supabase.from(tableName).insert(cleanedAdd);
        if (error) {
          console.error('DEBUG - ERRO AO INSERIR:', error);
          result.errors.push(`Erro ao inserir: ${error.message}`);
        } else {
          result.added = preview.toAdd.length;
        }
      }
      
      for (const row of preview.toUpdate) {
        const cleanedUpdate = cleanDataForSupabase(row, tableName);
        console.log('DEBUG - ATUALIZANDO NO SUPABASE:', {
          table: tableName,
          id: row.id,
          keys: Object.keys(cleanedUpdate),
          data: cleanedUpdate
        });
        const { error } = await supabase.from(tableName).update(cleanedUpdate).eq('id', row.id);
        if (error) {
          console.error('DEBUG - ERRO AO ATUALIZAR:', error);
          result.errors.push(`Erro ao atualizar ${row.id}: ${error.message}`);
        } else {
          result.updated++;
        }
      }
    } catch (error: any) {
      result.errors.push(error.message);
    }
    return result;
  }, [generatePreview]);

  const syncToSheet = useCallback(async (sheetName: string, tableName: TableName): Promise<SyncResult> => {
    const result: SyncResult = { table: tableName, direction: 'write', added: 0, updated: 0, deleted: 0, errors: [] };
    if (!isOAuthConfigured()) {
      result.errors.push('OAuth não configurado. Faça login com Google para escrever.');
      return result;
    }
    try {
      const supabaseData = await fetchExistingData(tableName);
      if (supabaseData.length === 0) {
        result.errors.push('Nenhum dado para exportar');
        return result;
      }
      const { updatedRows } = await writeSheetData(sheetName, supabaseData, { clearFirst: true });
      result.added = updatedRows;
    } catch (error: any) {
      result.errors.push(error.message);
    }
    return result;
  }, []);

  const confirmSync = useCallback(async (options: { skipErrors: boolean }) => {
    if (!previewData) return;
    setSyncStatus(prev => ({ ...prev, isRunning: true }));
    
    const result = await syncFromSheet(previewData.sheetName, previewData.tableName as TableName, { skipPreview: true, previewData });
    setShowPreview(false);
    setPreviewData(null);
    
    const now = new Date().toISOString();
    setSyncStatus(prev => ({ ...prev, isRunning: false, lastSync: now, errors: result.errors }));
    
    const mapping = mappings.find(m => m.sheetName === previewData.sheetName);
    if (mapping) updateMapping({ ...mapping, lastSyncAt: now });
    
    saveGoogleSheetsConfig({ lastSyncAt: now });
    queryClient.invalidateQueries();
    
    if (result.errors.length === 0) {
      toast({ title: 'Sincronização concluída!', description: `${result.added} adicionados, ${result.updated} atualizados` });
      if (mapping && mapping.direction === 'bidirectional' && isOAuthConfigured()) {
        await syncToSheet(previewData.sheetName, previewData.tableName as TableName);
      }
    } else {
      toast({ title: 'Sincronização com erros', description: result.errors[0], variant: 'destructive' });
    }
  }, [previewData, syncFromSheet, syncToSheet, mappings, updateMapping, queryClient, toast]);

  const cancelPreview = useCallback(() => {
    setShowPreview(false);
    setPreviewData(null);
    setSyncStatus(prev => ({ ...prev, isRunning: false }));
  }, []);

  const syncBidirectional = useCallback(async (sheetName: string, tableName: TableName): Promise<SyncResult[]> => {
    const results: SyncResult[] = [];
    const readResult = await syncFromSheet(sheetName, tableName);
    results.push(readResult);
    if (showPreview) return results;
    if (isOAuthConfigured()) results.push(await syncToSheet(sheetName, tableName));
    return results;
  }, [syncFromSheet, syncToSheet, showPreview]);

  const syncAll = useCallback(async (): Promise<SyncResult[]> => {
    const allResults: SyncResult[] = [];
    const enabledMappings = mappings.filter(m => m.enabled);
    if (enabledMappings.length === 0) {
      toast({ title: 'Nenhum mapeamento ativo', description: 'Configure pelo menos um mapeamento de aba', variant: 'destructive' });
      return allResults;
    }
    
    setSyncStatus(prev => ({ ...prev, isRunning: true }));
    try {
      for (const mapping of enabledMappings) {
        if (mapping.direction === 'write') {
          const result = await syncToSheet(mapping.sheetName, mapping.tableName as TableName);
          allResults.push(result);
        } else {
          if (mapping.columnMappings && mapping.columnMappings.length > 0) {
            const result = await syncFromSheet(mapping.sheetName, mapping.tableName as TableName);
            allResults.push(result);
          } else {
            await openColumnMappingEditor(mapping.sheetName, mapping.tableName as TableName);
            setSyncStatus(prev => ({ ...prev, isRunning: false }));
            return allResults;
          }
        }
      }
      setSyncStatus(prev => ({ ...prev, isRunning: false }));
    } catch (error: any) {
      setSyncStatus(prev => ({ ...prev, isRunning: false, errors: [error.message] }));
    }
    return allResults;
  }, [mappings, syncToSheet, syncFromSheet, openColumnMappingEditor, toast]);

  const syncSelected = useCallback(async (sheetNames: string[]): Promise<SyncResult[]> => {
    const allResults: SyncResult[] = [];
    const selectedMappings = mappings.filter(m => sheetNames.includes(m.sheetName) && m.enabled);
    
    if (selectedMappings.length === 0) return allResults;

    setSyncStatus(prev => ({ ...prev, isRunning: true }));
    try {
      for (const mapping of selectedMappings) {
        if (mapping.direction === 'write') {
          const result = await syncToSheet(mapping.sheetName, mapping.tableName as TableName);
          allResults.push(result);
        } else {
          if (mapping.columnMappings && mapping.columnMappings.length > 0) {
            const result = await syncFromSheet(mapping.sheetName, mapping.tableName as TableName);
            allResults.push(result);
          } else {
            await openColumnMappingEditor(mapping.sheetName, mapping.tableName as TableName);
            setSyncStatus(prev => ({ ...prev, isRunning: false }));
            return allResults;
          }
        }
      }
      setSyncStatus(prev => ({ ...prev, isRunning: false }));
    } catch (error: any) {
      setSyncStatus(prev => ({ ...prev, isRunning: false, errors: [error.message] }));
    }
    return allResults;
  }, [mappings, syncToSheet, syncFromSheet, openColumnMappingEditor]);

  const startAutoSync = useCallback((intervalMinutes: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const intervalMs = intervalMinutes * 60 * 1000;
    intervalRef.current = setInterval(() => syncAll(), intervalMs);
    setSyncStatus(prev => ({ ...prev, nextSync: new Date(Date.now() + intervalMs).toISOString() }));
    saveGoogleSheetsConfig({ syncEnabled: true, syncIntervalMinutes: intervalMinutes, syncMode: 'auto' });
    toast({ title: 'Sincronização automática ativada', description: `Sincronizando a cada ${intervalMinutes} minuto(s)` });
  }, [syncAll, toast]);

  const stopAutoSync = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSyncStatus(prev => ({ ...prev, nextSync: null }));
    saveGoogleSheetsConfig({ syncEnabled: false, syncMode: 'manual' });
    toast({ title: 'Sincronização automática desativada' });
  }, [toast]);

  const loginWithGoogle = useCallback(async () => {
    const currentConfig = getGoogleSheetsConfig();
    if (!currentConfig?.clientId) {
      toast({ title: 'Client ID não configurado', description: 'Configure o Client ID do Google Cloud para habilitar escrita.', variant: 'destructive' });
      return;
    }
    try {
      await initGoogleAuth(currentConfig.clientId);
      setConfig(getGoogleSheetsConfig());
      toast({ title: 'Login realizado!', description: 'Agora você pode escrever na planilha.' });
    } catch (error: any) {
      toast({ title: 'Erro no login', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    sheets, mappings, syncStatus, config, isLoading, isOAuthReady: isOAuthConfigured(), previewData, showPreview, columnMappingState, showColumnMapping,
    loadSheets, updateMapping, removeMapping, syncFromSheet, syncToSheet, syncBidirectional, syncAll, syncSelected, startAutoSync, stopAutoSync, loginWithGoogle, generatePreview, confirmSync, cancelPreview, openColumnMappingEditor, confirmColumnMapping, cancelColumnMapping,
  };
};
