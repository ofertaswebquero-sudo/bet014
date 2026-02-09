import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OKR {
  id: string;
  tipo: string;
  objetivo: string;
  key_result: string;
  meta_valor: number | null;
  valor_atual: number;
  data_inicio: string;
  data_fim: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useOKRs() {
  return useQuery({
    queryKey: ['okrs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('okrs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OKR[];
    },
  });
}

export function useOKRMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (okr: Omit<OKR, 'id' | 'created_at' | 'updated_at' | 'valor_atual' | 'data_inicio' | 'status'>) => {
      const { data, error } = await supabase
        .from('okrs')
        .insert(okr)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OKR> & { id: string }) => {
      const { data, error } = await supabase
        .from('okrs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('okrs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] });
    },
  });

  return { create, update, remove };
}
