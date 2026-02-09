import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  saveLocalBackup, 
  getLocalBackup, 
  exportTableToCSV,
  exportTableToXLSX,
  exportFullBackupToJSON,
  exportFullBackupToXLSX,
  importBackupFromJSON,
  importCSVToTable,
  getLastBackupTime,
  deleteItemsFromLocal,
  clearTableFromLocal,
  LocalBackupData 
} from '@/services/localStorageService';
import { importJSONFileToSupabase, importFullBackupToSupabase } from '@/services/importService';
import { useToast } from '@/hooks/use-toast';

type TableName = keyof Omit<LocalBackupData, 'lastUpdated'>;

export const useLocalBackup = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sincronizar dados do Supabase para LocalStorage
  const syncFromSupabase = useCallback(async () => {
    try {
      const [
        apostasRes,
        surebesRes,
        casasRes,
        caixaRes,
        saquesRes,
        diarioRes,
        fechamentoRes,
        dadosRes,
        okrsRes,
      ] = await Promise.all([
        supabase.from('apostas').select('*'),
        supabase.from('apostas_surebet').select('*'),
        supabase.from('casas').select('*'),
        supabase.from('caixa_geral').select('*'),
        supabase.from('saques_aportes').select('*'),
        supabase.from('diario_operacoes').select('*'),
        supabase.from('fechamento').select('*'),
        supabase.from('dados_referencia').select('*'),
        supabase.from('okrs').select('*'),
      ]);

      const backupData: Partial<LocalBackupData> = {
        apostas: apostasRes.data || [],
        apostas_surebet: surebesRes.data || [],
        casas: casasRes.data || [],
        caixa_geral: caixaRes.data || [],
        saques_aportes: saquesRes.data || [],
        diario_operacoes: diarioRes.data || [],
        fechamento: fechamentoRes.data || [],
        dados_referencia: dadosRes.data || [],
        okrs: okrsRes.data || [],
      };

      saveLocalBackup(backupData);
      
      toast({
        title: "Backup sincronizado",
        description: "Dados salvos localmente com sucesso!",
      });

      return backupData;
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os dados",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Importar backup JSON para o banco de dados (Supabase)
  const importBackupToDatabase = useCallback(async (file: File) => {
    try {
      const { data, results } = await importJSONFileToSupabase(file);
      
      // Também salva no localStorage
      saveLocalBackup(data);
      
      // Calcula totais
      const totalSuccess = results.reduce((acc, r) => acc + r.success, 0);
      const totalErrors = results.reduce((acc, r) => acc + r.errors, 0);
      
      // Invalida queries para atualizar UI
      queryClient.invalidateQueries();
      
      if (totalErrors > 0) {
        toast({
          title: "Importação parcial",
          description: `${totalSuccess} registros importados, ${totalErrors} erros`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Importação concluída!",
          description: `${totalSuccess} registros salvos no banco de dados`,
        });
      }
      
      return { data, results };
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, queryClient]);

  // Importar do localStorage para o banco de dados
  const syncLocalToDatabase = useCallback(async () => {
    try {
      const backup = getLocalBackup();
      const results = await importFullBackupToSupabase(backup);
      
      const totalSuccess = results.reduce((acc, r) => acc + r.success, 0);
      const totalErrors = results.reduce((acc, r) => acc + r.errors, 0);
      
      queryClient.invalidateQueries();
      
      if (totalErrors > 0) {
        toast({
          title: "Sincronização parcial",
          description: `${totalSuccess} registros enviados, ${totalErrors} erros`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sincronização concluída!",
          description: `${totalSuccess} registros enviados para o banco`,
        });
      }
      
      return results;
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, queryClient]);

  // Exportar tabela específica para CSV
  const exportToCSV = useCallback((tableName: TableName) => {
    const backup = getLocalBackup();
    const data = backup[tableName];
    
    if (!data || data.length === 0) {
      toast({
        title: "Sem dados",
        description: `A tabela ${tableName} está vazia`,
        variant: "destructive",
      });
      return;
    }

    exportTableToCSV(data, tableName);
    toast({
      title: "Exportado!",
      description: `${data.length} registros exportados para CSV`,
    });
  }, [toast]);

  // Exportar tabela para XLSX
  const exportToXLSX = useCallback((tableName: TableName) => {
    const backup = getLocalBackup();
    const data = backup[tableName];
    
    if (!data || data.length === 0) {
      toast({
        title: "Sem dados",
        description: `A tabela ${tableName} está vazia`,
        variant: "destructive",
      });
      return;
    }

    exportTableToXLSX(data, tableName);
    toast({
      title: "Exportado!",
      description: `${data.length} registros exportados para XLSX`,
    });
  }, [toast]);

  // Exportar backup completo
  const exportFullBackup = useCallback(() => {
    exportFullBackupToJSON();
    toast({
      title: "Backup exportado!",
      description: "Arquivo JSON com todos os dados gerado",
    });
  }, [toast]);

  // Exportar backup completo para XLSX
  const exportFullBackupXLSX = useCallback(() => {
    exportFullBackupToXLSX();
    toast({
      title: "Backup XLSX exportado!",
      description: "Arquivo Excel com todas as abas gerado",
    });
  }, [toast]);

  // Importar backup de JSON
  const importBackup = useCallback(async (file: File) => {
    try {
      const data = await importBackupFromJSON(file);
      toast({
        title: "Backup importado!",
        description: `Dados de ${data.lastUpdated} restaurados`,
      });
      // Invalidar queries para atualizar UI
      queryClient.invalidateQueries();
      return data;
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, queryClient]);

  // Importar CSV para tabela
  const importCSV = useCallback(async (file: File) => {
    try {
      const data = await importCSVToTable(file);
      toast({
        title: "CSV importado!",
        description: `${data.length} registros lidos do arquivo`,
      });
      return data;
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Deletar itens selecionados do backup local
  const deleteSelectedItems = useCallback((tableName: TableName, ids: string[]) => {
    if (ids.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        variant: "destructive",
      });
      return;
    }
    
    deleteItemsFromLocal(tableName, ids);
    toast({
      title: "Itens removidos!",
      description: `${ids.length} registros removidos do backup local`,
    });
  }, [toast]);

  // Limpar tabela do backup local
  const clearTable = useCallback((tableName: TableName) => {
    clearTableFromLocal(tableName);
    toast({
      title: "Tabela limpa!",
      description: `Todos os dados de ${tableName} foram removidos do backup local`,
    });
  }, [toast]);

  // Obter dados do backup local
  const getBackupData = useCallback(() => {
    return getLocalBackup();
  }, []);

  // Obter timestamp do último backup
  const lastBackupTime = getLastBackupTime();

  return {
    syncFromSupabase,
    exportToCSV,
    exportToXLSX,
    exportFullBackup,
    exportFullBackupXLSX,
    importBackup,
    importBackupToDatabase,
    syncLocalToDatabase,
    importCSV,
    deleteSelectedItems,
    clearTable,
    getBackupData,
    lastBackupTime,
  };
};
