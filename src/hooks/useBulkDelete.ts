import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type TableName = 
  | 'apostas' 
  | 'apostas_surebet' 
  | 'casas' 
  | 'caixa_geral' 
  | 'saques_aportes' 
  | 'diario_operacoes' 
  | 'fechamento' 
  | 'dados_referencia' 
  | 'okrs';

const tableQueryKeys: Record<TableName, string> = {
  apostas: 'apostas',
  apostas_surebet: 'apostas_surebet',
  casas: 'casas',
  caixa_geral: 'caixa_geral',
  saques_aportes: 'saques_aportes',
  diario_operacoes: 'diario_operacoes',
  fechamento: 'fechamento',
  dados_referencia: 'dados_referencia',
  okrs: 'okrs',
};

export function useBulkDelete() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Deletar múltiplos itens por IDs
  const deleteSelected = useMutation({
    mutationFn: async ({ tableName, ids }: { tableName: TableName; ids: string[] }) => {
      if (ids.length === 0) {
        throw new Error('Nenhum item selecionado');
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count, { tableName }) => {
      queryClient.invalidateQueries({ queryKey: [tableQueryKeys[tableName]] });
      toast({
        title: 'Itens removidos!',
        description: `${count} registros excluídos com sucesso`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  // Deletar TODOS os itens de uma tabela
  const deleteAll = useMutation({
    mutationFn: async (tableName: TableName) => {
      // Primeiro conta quantos registros existem
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;

      // Deleta todos (usando neq para pegar todos os registros)
      const { error } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Truque para deletar todos
      
      if (error) throw error;
      return count || 0;
    },
    onSuccess: (count, tableName) => {
      queryClient.invalidateQueries({ queryKey: [tableQueryKeys[tableName]] });
      toast({
        title: 'Tabela limpa!',
        description: `${count} registros excluídos de ${tableName}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao limpar tabela',
        description: (error as Error).message,
        variant: 'destructive',
      });
    },
  });

  return { deleteSelected, deleteAll };
}
