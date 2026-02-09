import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Cassino } from '@/types/database';

export function useCassino() {
  return useQuery({
    queryKey: ['cassino'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cassino')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return data as unknown as Cassino[];
    },
  });
}

export function useCassinoMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (item: {
      data?: string;
      tipo_registro: 'diario' | 'sessao';
      saldo_inicial?: number;
      saldo_final?: number;
      jogo?: string;
      plataforma?: string;
      plataforma_id?: string;
      buy_in?: number;
      cash_out?: number;
      duracao_minutos?: number;
      obs?: string;
    }) => {
      const { data, error } = await supabase.from('cassino').insert(item as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cassino'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<Cassino> & { id: string }) => {
      // Remove campos gerados pelo banco de dados para evitar erro de atualização
      const { tipo, valor_resultado, created_at, updated_at, ...updateData } = item as any;
      const { data, error } = await supabase.from('cassino').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cassino'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cassino').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cassino'] }),
  });

  const bulkRemove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('cassino').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cassino'] }),
  });

  return { create, update, remove, bulkRemove };
}
