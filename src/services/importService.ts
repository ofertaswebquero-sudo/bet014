// Serviço de importação de dados para o Supabase
import { supabase } from '@/integrations/supabase/client';
import { LocalBackupData } from './localStorageService';

type TableName = keyof Omit<LocalBackupData, 'lastUpdated'>;

interface ImportResult {
  table: string;
  success: number;
  errors: number;
  errorMessages: string[];
}

// Remove campos que são calculados ou gerenciados pelo banco
const sanitizeRecord = (record: any, tableName: TableName) => {
  const { id, created_at, updated_at, ...rest } = record;
  
  // Campos calculados por tabela
  const calculatedFields: Record<TableName, string[]> = {
    apostas: ['lucro_prejuizo'], // calculado por trigger
    apostas_surebet: ['investimento_total'],
    casas: ['lucro_prejuizo', 'percentual_retorno', 'depositos', 'saques', 'quantidade_depositos', 'quantidade_saques'],
    caixa_geral: ['valor_aporte', 'valor_saque', 'valor_custo'],
    saques_aportes: ['valor_deposito', 'valor_saque'],
    diario_operacoes: ['tipo', 'valor_resultado'],
    fechamento: ['saldo_teorico', 'divergencia'],
    dados_referencia: [],
    okrs: [],
  };
  
  const fieldsToRemove = calculatedFields[tableName] || [];
  const sanitized = { ...rest };
  fieldsToRemove.forEach(field => delete sanitized[field]);
  
  return sanitized;
};

// Importa dados para uma tabela específica
export const importToTable = async (
  tableName: TableName,
  records: any[]
): Promise<ImportResult> => {
  const result: ImportResult = {
    table: tableName,
    success: 0,
    errors: 0,
    errorMessages: [],
  };

  if (!records || records.length === 0) {
    return result;
  }

  // Processa em lotes de 100
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const sanitizedBatch = batch.map(r => sanitizeRecord(r, tableName));

    try {
      const { data, error } = await supabase
        .from(tableName)
        .upsert(sanitizedBatch, { onConflict: 'id', ignoreDuplicates: false })
        .select();

      if (error) {
        result.errors += batch.length;
        result.errorMessages.push(`Lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        result.success += data?.length || batch.length;
      }
    } catch (e: any) {
      result.errors += batch.length;
      result.errorMessages.push(`Lote ${Math.floor(i / batchSize) + 1}: ${e.message}`);
    }
  }

  return result;
};

// Importa backup completo para o Supabase
export const importFullBackupToSupabase = async (
  backupData: Partial<LocalBackupData>
): Promise<ImportResult[]> => {
  const results: ImportResult[] = [];

  // Ordem de importação (respeitando dependências)
  const tableOrder: TableName[] = [
    'dados_referencia',
    'casas',
    'caixa_geral',
    'saques_aportes',
    'diario_operacoes',
    'apostas',
    'apostas_surebet',
    'fechamento',
    'okrs',
  ];

  for (const tableName of tableOrder) {
    const records = backupData[tableName];
    if (records && Array.isArray(records) && records.length > 0) {
      const result = await importToTable(tableName, records);
      results.push(result);
    }
  }

  return results;
};

// Importa um arquivo JSON para o Supabase diretamente
export const importJSONFileToSupabase = async (file: File): Promise<{
  data: LocalBackupData;
  results: ImportResult[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as LocalBackupData;
        const results = await importFullBackupToSupabase(data);
        resolve({ data, results });
      } catch (error: any) {
        reject(new Error(`Erro ao processar arquivo: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};
