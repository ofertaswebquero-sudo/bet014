import { useMemo } from 'react';
import { useTags, useAllCasasTags, useCasaTagMutations, Tag } from '@/hooks/useTags';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tag as TagIcon, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TagSelectorProps {
  casaId: string;
  onTagsChange?: () => void;
}

export function TagSelector({ casaId, onTagsChange }: TagSelectorProps) {
  const { data: allTags } = useTags();
  const { data: casasTags } = useAllCasasTags();
  const { setTags } = useCasaTagMutations();

  const currentTagIds = useMemo(() => {
    if (!casasTags) return new Set<string>();
    return new Set(
      casasTags.filter((ct) => ct.casa_id === casaId).map((ct) => ct.tag_id)
    );
  }, [casasTags, casaId]);

  const currentTags = useMemo(() => {
    if (!allTags) return [];
    return allTags.filter((t) => currentTagIds.has(t.id));
  }, [allTags, currentTagIds]);

  const handleToggleTag = async (tagId: string) => {
    const newTagIds = new Set(currentTagIds);
    if (newTagIds.has(tagId)) {
      newTagIds.delete(tagId);
    } else {
      newTagIds.add(tagId);
    }
    
    try {
      await setTags.mutateAsync({ casaId, tagIds: Array.from(newTagIds) });
      onTagsChange?.();
    } catch (error) {
      toast({ title: 'Erro ao atualizar tags', variant: 'destructive' });
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {currentTags.map((tag) => (
        <Badge
          key={tag.id}
          style={{ backgroundColor: tag.cor || '#6366f1', color: 'white' }}
          className="text-xs"
        >
          {tag.nome}
        </Badge>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <TagIcon className="h-4 w-4" />
              Selecionar Tags
            </div>
            {!allTags || allTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tag criada</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allTags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={currentTagIds.has(tag.id)}
                      onCheckedChange={() => handleToggleTag(tag.id)}
                    />
                    <Label
                      htmlFor={`tag-${tag.id}`}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.cor || '#6366f1' }}
                      />
                      {tag.nome}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Componente para exibir tags (read-only)
export function TagDisplay({ casaId }: { casaId: string }) {
  const { data: allTags } = useTags();
  const { data: casasTags } = useAllCasasTags();

  const currentTags = useMemo(() => {
    if (!casasTags || !allTags) return [];
    const tagIds = new Set(
      casasTags.filter((ct) => ct.casa_id === casaId).map((ct) => ct.tag_id)
    );
    return allTags.filter((t) => tagIds.has(t.id));
  }, [casasTags, allTags, casaId]);

  if (currentTags.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {currentTags.map((tag) => (
        <Badge
          key={tag.id}
          style={{ backgroundColor: tag.cor || '#6366f1', color: 'white' }}
          className="text-xs"
        >
          {tag.nome}
        </Badge>
      ))}
    </div>
  );
}
