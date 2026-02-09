import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  Casa, 
  CaixaGeral, 
  SaquesAportes, 
  DiarioOperacoes,
  Aposta,
  ApostaSurebet,
  Fechamento,
  DadosReferencia
} from '@/types/database';

// Hook para Casas
export function useCasas() {
  return useQuery({
    queryKey: ['casas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('casas')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Casa[];
    },
  });
}

export function useCasaMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (casa: Omit<Partial<Casa>, 'id' | 'lucro_prejuizo' | 'percentual_retorno'> & { nome: string }) => {
      const { data, error } = await supabase.from('casas').insert(casa as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['casas'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...casa }: Partial<Casa> & { id: string }) => {
      const { lucro_prejuizo, percentual_retorno, ...updateData } = casa as any;
      const { data, error } = await supabase.from('casas').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['casas'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('casas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['casas'] }),
  });

  return { create, update, remove };
}

// Hook para Caixa Geral
export function useCaixaGeral() {
  return useQuery({
    queryKey: ['caixa_geral'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('caixa_geral')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return data as CaixaGeral[];
    },
  });
}

export function useCaixaGeralMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (item: { tipo: string; valor: number; data?: string; descricao?: string; origem_obs?: string; banco?: string }) => {
      const { data, error } = await supabase.from('caixa_geral').insert(item as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caixa_geral'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<CaixaGeral> & { id: string }) => {
      const { valor_aporte, valor_saque, valor_custo, ...updateData } = item as any;
      const { data, error } = await supabase.from('caixa_geral').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caixa_geral'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('caixa_geral').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caixa_geral'] }),
  });

  return { create, update, remove };
}

// Hook para Saques e Aportes
export function useSaquesAportes() {
  return useQuery({
    queryKey: ['saques_aportes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saques_aportes')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return data as SaquesAportes[];
    },
  });
}

export function useSaquesAportesMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (item: { tipo: string; valor: number; data?: string; casa_id?: string; casa_nome?: string; obs?: string; motivo?: string; banco?: string; status?: string }) => {
      const { data, error } = await supabase.from('saques_aportes').insert(item as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saques_aportes'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<SaquesAportes> & { id: string }) => {
      const { valor_deposito, valor_saque, ...updateData } = item as any;
      const { data, error } = await supabase.from('saques_aportes').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saques_aportes'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saques_aportes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saques_aportes'] }),
  });

  return { create, update, remove };
}

// Hook para Diário de Operações
export function useDiarioOperacoes() {
  return useQuery({
    queryKey: ['diario_operacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diario_operacoes')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return data as DiarioOperacoes[];
    },
  });
}

export function useDiarioOperacoesMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (item: { saldo_inicial: number; saldo_final: number; data?: string; obs?: string }) => {
      const { data, error } = await supabase.from('diario_operacoes').insert(item as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diario_operacoes'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<DiarioOperacoes> & { id: string }) => {
      const { tipo, valor_resultado, ...updateData } = item as any;
      const { data, error } = await supabase.from('diario_operacoes').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diario_operacoes'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('diario_operacoes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diario_operacoes'] }),
  });

  return { create, update, remove };
}

// Hook para Apostas
export function useApostas() {
  return useQuery({
    queryKey: ['apostas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apostas')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return data as Aposta[];
    },
  });
}

export function useApostasMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (item: Partial<Omit<Aposta, 'id' | 'lucro_prejuizo'>>) => {
      // Remove explicitamente campos calculados/gerados para evitar erro de DEFAULT column
      const { lucro_prejuizo, created_at, updated_at, ...insertData } = item as any;
      const { data, error } = await supabase.from('apostas').insert(insertData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apostas'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<Aposta> & { id: string }) => {
      // Remove explicitamente campos calculados/gerados para evitar erro de DEFAULT column
      const { lucro_prejuizo, created_at, updated_at, ...updateData } = item as any;
      const { data, error } = await supabase.from('apostas').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apostas'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('apostas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apostas'] }),
  });

  return { create, update, remove };
}

// Hook para Apostas Surebet
export function useApostasSurebet() {
  return useQuery({
    queryKey: ['apostas_surebet'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apostas_surebet')
        .select('*')
        .order('data', { ascending: false });
      if (error) throw error;
      return data as ApostaSurebet[];
    },
  });
}

export function useApostasSurebetMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (item: Partial<Omit<ApostaSurebet, 'id' | 'investimento_total'>>) => {
      const { data, error } = await supabase.from('apostas_surebet').insert(item as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apostas_surebet'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<ApostaSurebet> & { id: string }) => {
      const { investimento_total, ...updateData } = item as any;
      const { data, error } = await supabase.from('apostas_surebet').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apostas_surebet'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('apostas_surebet').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apostas_surebet'] }),
  });

  return { create, update, remove };
}

// Hook para Fechamento
export function useFechamentos() {
  return useQuery({
    queryKey: ['fechamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fechamento')
        .select('*')
        .order('data_fim', { ascending: false });
      if (error) throw error;
      return data as Fechamento[];
    },
  });
}

export function useFechamentoMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (item: { data_inicio: string; data_fim: string; saldo_inicial?: number; aportes_externos?: number; resumo_jogos?: number; saques_pessoais?: number; custos?: number; saldo_real?: number; obs?: string }) => {
      const { data, error } = await supabase.from('fechamento').insert(item as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fechamento'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<Fechamento> & { id: string }) => {
      const { saldo_teorico, divergencia, ...updateData } = item as any;
      const { data, error } = await supabase.from('fechamento').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fechamento'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fechamento').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fechamento'] }),
  });

  return { create, update, remove };
}

// Hook para Dados de Referência
export function useDadosReferencia(categoria?: string, includeInactive = false) {
  return useQuery({
    queryKey: ['dados_referencia', categoria, includeInactive],
    queryFn: async () => {
      let query = supabase.from('dados_referencia').select('*').order('ordem').order('valor');
      if (categoria) query = query.eq('categoria', categoria);
      if (!includeInactive) query = query.eq('ativo', true);
      const { data, error } = await supabase.from('dados_referencia').select('*');
      if (error) throw error;
      
      let result = data as DadosReferencia[];
      if (categoria) result = result.filter(d => d.categoria === categoria);
      if (!includeInactive) result = result.filter(d => d.ativo);
      
      return result.sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.valor.localeCompare(b.valor));
    },
  });
}

export function useDadosReferenciaMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (item: Omit<DadosReferencia, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('dados_referencia').insert(item as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dados_referencia'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<DadosReferencia> & { id: string }) => {
      const { data, error } = await supabase.from('dados_referencia').update(item as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dados_referencia'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dados_referencia').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dados_referencia'] }),
  });

  return { create, update, remove };
}
