import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Tag {
  id: string;
  nome: string;
  cor: string | null;
  descricao: string | null;
  created_at: string;
  updated_at: string;
}

export interface CasaTag {
  id: string;
  casa_id: string;
  tag_id: string;
  created_at: string;
}

// Hook para buscar todas as tags
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Tag[];
    },
  });
}

// Hook para buscar tags de uma casa específica
export function useCasaTags(casaId: string | null) {
  return useQuery({
    queryKey: ['casas_tags', casaId],
    queryFn: async () => {
      if (!casaId) return [];
      const { data, error } = await supabase
        .from('casas_tags')
        .select('*, tag:tags(*)')
        .eq('casa_id', casaId);
      if (error) throw error;
      return data as (CasaTag & { tag: Tag })[];
    },
    enabled: !!casaId,
  });
}

// Hook para buscar todas as associações casa-tag
export function useAllCasasTags() {
  return useQuery({
    queryKey: ['casas_tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('casas_tags')
        .select('*, tag:tags(*)');
      if (error) throw error;
      return data as (CasaTag & { tag: Tag })[];
    },
  });
}

// Mutations para Tags
export function useTagMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (tag: { nome: string; cor?: string; descricao?: string }) => {
      const { data, error } = await supabase.from('tags').insert(tag).select().single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...tag }: Partial<Tag> & { id: string }) => {
      const { data, error } = await supabase.from('tags').update(tag).eq('id', id).select().single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['casas_tags'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // Primeiro remove associações
      await supabase.from('casas_tags').delete().eq('tag_id', id);
      // Depois remove a tag
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['casas_tags'] });
    },
  });

  return { create, update, remove };
}

// Mutations para associações Casa-Tag
export function useCasaTagMutations() {
  const queryClient = useQueryClient();

  const addTag = useMutation({
    mutationFn: async ({ casaId, tagId }: { casaId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from('casas_tags')
        .insert({ casa_id: casaId, tag_id: tagId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casas_tags'] });
    },
  });

  const removeTag = useMutation({
    mutationFn: async ({ casaId, tagId }: { casaId: string; tagId: string }) => {
      const { error } = await supabase
        .from('casas_tags')
        .delete()
        .eq('casa_id', casaId)
        .eq('tag_id', tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casas_tags'] });
    },
  });

  const setTags = useMutation({
    mutationFn: async ({ casaId, tagIds }: { casaId: string; tagIds: string[] }) => {
      // Remove todas as tags existentes
      await supabase.from('casas_tags').delete().eq('casa_id', casaId);
      
      // Adiciona as novas tags
      if (tagIds.length > 0) {
        const inserts = tagIds.map(tagId => ({ casa_id: casaId, tag_id: tagId }));
        const { error } = await supabase.from('casas_tags').insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casas_tags'] });
    },
  });

  return { addTag, removeTag, setTags };
}
