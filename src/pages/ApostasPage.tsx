import { useState, useMemo } from "react";
import { useApostas, useApostasMutations, useCasas, useDadosReferencia } from "@/hooks/useSupabaseData";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/shared/TablePagination";
import { SortableHeader } from "@/components/shared/SortableHeader";
import { useSort } from "@/hooks/useSort";
import { AppLayout } from "@/components/layout/AppLayout";
import { BulkDeleteBar } from "@/components/shared/BulkDeleteBar";
import { KPISummary, KPICard } from "@/components/shared/KPISummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/StatCard";
import { toast } from "@/hooks/use-toast";
import { DateRangeFilter, useDateRangeFilter, SelectFilter } from "@/components/filters/DateRangeFilter";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Aposta } from "@/types/database";

export default function ApostasPage() {
  const { data: apostas, isLoading } = useApostas();
  const { data: casas } = useCasas();
  const { data: mercadosRef } = useDadosReferencia('mercado');
  const { create, update, remove } = useApostasMutations();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Aposta | null>(null);

  // Filtros
  const { startDate, endDate, setStartDate, setEndDate, filterByDate, clearFilter } = useDateRangeFilter();
  const [casaFilter, setCasaFilter] = useState("all");
  const [resultadoFilter, setResultadoFilter] = useState("all");
  const [mercadoFilter, setMercadoFilter] = useState("all");

  // Dados filtrados
  const apostasFiltradas = useMemo(() => {
    let result = filterByDate(apostas || []);
    if (casaFilter !== "all") result = result.filter(a => a.casa_nome === casaFilter);
    if (resultadoFilter !== "all") result = result.filter(a => a.resultado === resultadoFilter);
    if (mercadoFilter !== "all") result = result.filter(a => a.mercado === mercadoFilter);
    return result;
  }, [apostas, startDate, endDate, casaFilter, resultadoFilter, mercadoFilter, filterByDate]);

  // Ordenação
  const { sortedData, sortConfig, handleSort } = useSort(apostasFiltradas, "data", "desc");

  // Paginação
  const {
    currentPage,
    totalPages,
    pageSize,
    totalRecords,
    paginatedData,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(sortedData, 20);

  // Bulk selection
  const { selectedIds, selectedCount, toggleSelection, toggleAll, clearSelection, isSelected, isAllSelected } = useBulkSelection(paginatedData);

  // Bulk delete
  const bulkRemove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('apostas').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apostas'] }),
  });

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    casa_id: "",
    casa_nome: "",
    evento: "",
    mercado: "",
    selecao: "",
    odd: "",
    stake: "",
    resultado: "pendente",
    lucro_prejuizo: "",
    obs: "",
  });

  // Opções para filtros
  const casasOptions = useMemo(() => {
    const nomes = new Set(apostas?.map(a => a.casa_nome).filter(Boolean) as string[]);
    return Array.from(nomes).map(n => ({ value: n, label: n }));
  }, [apostas]);

  const mercadosOptions = useMemo(() => {
    const mercados = new Set(apostas?.map(a => a.mercado).filter(Boolean) as string[]);
    return Array.from(mercados).map(m => ({ value: m, label: m }));
  }, [apostas]);

  const resultadoOptions = [
    { value: "green", label: "✅ Green" },
    { value: "red", label: "❌ Red" },
    { value: "void", label: "↩️ Void" },
    { value: "cashout", label: "💰 Cashout" },
    { value: "pendente", label: "⏳ Pendente" },
  ];

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      casa_id: "",
      casa_nome: "",
      evento: "",
      mercado: "",
      selecao: "",
      odd: "",
      stake: "",
      resultado: "pendente",
      lucro_prejuizo: "",
      obs: "",
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: Aposta) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        data: item.data,
        casa_id: item.casa_id || "",
        casa_nome: item.casa_nome || "",
        evento: item.evento || "",
        mercado: item.mercado || "",
        selecao: item.selecao || "",
        odd: item.odd?.toString() || "",
        stake: item.stake.toString(),
        resultado: item.resultado || "pendente",
        lucro_prejuizo: item.lucro_prejuizo?.toString() || "",
        obs: item.obs || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCasaChange = (casaId: string) => {
    const casa = casas?.find(c => c.id === casaId);
    setFormData({
      ...formData,
      casa_id: casaId,
      casa_nome: casa?.nome || "",
    });
  };

  const calcularResultadoVisual = () => {
    const odd = parseFloat(formData.odd);
    const stake = parseFloat(formData.stake);
    if (!odd || !stake) return;

    let lucro = 0;
    switch (formData.resultado) {
      case 'green':
        lucro = (odd * stake) - stake;
        break;
      case 'red':
        lucro = -stake;
        break;
      case 'cashout':
        return;
      case 'void':
        lucro = 0;
        break;
      default:
        lucro = 0;
    }
    setFormData({ ...formData, lucro_prejuizo: lucro.toFixed(2) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.casa_id) {
      toast({ title: "Selecione uma casa de aposta.", variant: "destructive" });
      return;
    }

    const stakeValue = parseFloat(formData.stake);
    if (!formData.stake || isNaN(stakeValue) || stakeValue <= 0) {
      toast({ title: "Stake inválida. Digite um valor maior que zero.", variant: "destructive" });
      return;
    }
    
    try {
      // IMPORTANTE: Não enviamos lucro_prejuizo para o banco de dados
      // O banco de dados calcula isso automaticamente via trigger calc_aposta_lucro
      // Se enviarmos, o Supabase retorna erro de DEFAULT column
      const data: any = {
        data: formData.data,
        casa_id: formData.casa_id,
        casa_nome: formData.casa_nome,
        evento: formData.evento || null,
        mercado: formData.mercado || null,
        selecao: formData.selecao || null,
        odd: formData.odd ? parseFloat(formData.odd) : null,
        stake: stakeValue,
        resultado: formData.resultado as any,
        obs: formData.obs || null,
      };

      if (editingItem) {
        // No update, removemos explicitamente o lucro_prejuizo se ele existir no objeto
        const { id, ...updateData } = data;
        await update.mutateAsync({ id: editingItem.id, ...updateData });
        toast({ title: "Aposta atualizada!" });
      } else {
        await create.mutateAsync(data);
        toast({ title: "Aposta registrada!" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar aposta:', error);
      toast({ title: error?.message || "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir esta aposta?")) {
      try {
        await remove.mutateAsync(id);
        toast({ title: "Aposta excluída!" });
      } catch (error) {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      }
    }
  };

  const getResultadoBadge = (resultado: string | null) => {
    const config: Record<string, { variant: "default" | "destructive" | "secondary" | "outline"; label: string }> = {
      green: { variant: "default", label: "✅ Green" },
      red: { variant: "destructive", label: "❌ Red" },
      void: { variant: "secondary", label: "↩️ Void" },
      cashout: { variant: "outline", label: "💰 Cashout" },
      pendente: { variant: "secondary", label: "⏳ Pendente" },
    };
    const c = config[resultado || 'pendente'];
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const totais = apostasFiltradas.reduce(
    (acc, item) => ({
      investido: acc.investido + item.stake,
      lucro: acc.lucro + (item.lucro_prejuizo || 0),
      greens: acc.greens + (item.resultado === 'green' ? 1 : 0),
      reds: acc.reds + (item.resultado === 'red' ? 1 : 0),
    }),
    { investido: 0, lucro: 0, greens: 0, reds: 0 }
  );

  return (
    <AppLayout title="Apostas Esportivas" subtitle="Registre suas apostas esportivas normais">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={clearFilter}
          />
          <SelectFilter
            label="Casa"
            value={casaFilter}
            options={casasOptions}
            onValueChange={setCasaFilter}
            placeholder="Todas Casas"
          />
          <SelectFilter
            label="Resultado"
            value={resultadoFilter}
            options={resultadoOptions}
            onValueChange={setResultadoFilter}
            placeholder="Todos Resultados"
          />
          <SelectFilter
            label="Mercado"
            value={mercadoFilter}
            options={mercadosOptions}
            onValueChange={setMercadoFilter}
            placeholder="Todos Mercados"
          />
        </div>

        <KPISummary columns={4}>
          <KPICard
            title="Total Investido"
            value={formatCurrency(totais.investido)}
            tooltipKey="totalInvestido"
          />
          <KPICard
            title="Lucro/Prejuízo"
            value={formatCurrency(totais.lucro)}
            variant={totais.lucro >= 0 ? "success" : "destructive"}
            tooltipKey="lucroApostas"
          />
          <KPICard
            title="Greens"
            value={totais.greens}
            variant="success"
          />
          <KPICard
            title="Reds"
            value={totais.reds}
            variant="destructive"
            tooltipKey="apostasReds"
          />
        </KPISummary>

        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Nova Aposta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Aposta" : "Nova Aposta"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Casa *</Label>
                    <Select value={formData.casa_id} onValueChange={handleCasaChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {casas?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Resultado</Label>
                    <Select 
                      value={formData.resultado} 
                      onValueChange={(v) => {
                        setFormData({ ...formData, resultado: v });
                        setTimeout(calcularResultadoVisual, 0);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="pendente">⏳ Pendente</SelectItem>
                        <SelectItem value="green">✅ Green</SelectItem>
                        <SelectItem value="red">❌ Red</SelectItem>
                        <SelectItem value="void">↩️ Void</SelectItem>
                        <SelectItem value="cashout">💰 Cashout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Evento</Label>
                  <Input
                    value={formData.evento}
                    onChange={(e) => setFormData({ ...formData, evento: e.target.value })}
                    placeholder="Ex: Flamengo x Palmeiras"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Mercado</Label>
                    <Select 
                      value={formData.mercado} 
                      onValueChange={(v) => setFormData({ ...formData, mercado: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o mercado..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {mercadosRef?.map((m) => (
                          <SelectItem key={m.id} value={m.valor}>{m.valor}</SelectItem>
                        ))}
                        {mercadosRef?.length === 0 && (
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            Nenhum mercado cadastrado na Central de Dados
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Seleção</Label>
                    <Input
                      value={formData.selecao}
                      onChange={(e) => setFormData({ ...formData, selecao: e.target.value })}
                      placeholder="Ex: Flamengo"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Odd</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.odd}
                      onChange={(e) => setFormData({ ...formData, odd: e.target.value })}
                      onBlur={calcularResultadoVisual}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stake (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.stake}
                      onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                      onBlur={calcularResultadoVisual}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lucro/Prejuízo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.lucro_prejuizo}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      placeholder="Calculado automaticamente"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingItem ? "Salvar" : "Criar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <SortableHeader label="Data" sortKey="data" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Casa" sortKey="casa_nome" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Evento" sortKey="evento" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Seleção" sortKey="selecao" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Odd" sortKey="odd" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <SortableHeader label="Stake" sortKey="stake" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <SortableHeader label="Resultado" sortKey="resultado" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="L/P" sortKey="lucro_prejuizo" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Nenhuma aposta registrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className={isSelected(item.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox checked={isSelected(item.id)} onCheckedChange={() => toggleSelection(item.id)} />
                    </TableCell>
                    <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{item.casa_nome}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.evento}</TableCell>
                    <TableCell>{item.selecao}</TableCell>
                    <TableCell className="text-right">{item.odd?.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.stake)}</TableCell>
                    <TableCell>{getResultadoBadge(item.resultado)}</TableCell>
                    <TableCell className={`text-right font-bold ${(item.lucro_prejuizo || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {item.lucro_prejuizo !== null ? formatCurrency(item.lucro_prejuizo) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalRecords={totalRecords}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />

        <BulkDeleteBar
          selectedCount={selectedCount}
          onDelete={async () => { await bulkRemove.mutateAsync(Array.from(selectedIds)); toast({ title: `${selectedIds.size} apostas excluídas!` }); clearSelection(); }}
          onClearSelection={clearSelection}
          isDeleting={bulkRemove.isPending}
          itemName="apostas"
        />
      </div>
    </AppLayout>
  );
}
