import { useState, useMemo } from "react";
import { useDiarioOperacoes, useDiarioOperacoesMutations } from "@/hooks/useSupabaseData";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Calendar, Activity } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/StatCard";
import { toast } from "@/hooks/use-toast";
import { DateRangeFilter, useDateRangeFilter, SelectFilter } from "@/components/filters/DateRangeFilter";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DiarioOperacoes } from "@/types/database";

export default function DiarioPage() {
  const { data: diario, isLoading } = useDiarioOperacoes();
  const { create, update, remove } = useDiarioOperacoesMutations();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DiarioOperacoes | null>(null);

  // Filtros
  const { startDate, endDate, setStartDate, setEndDate, filterByDate, clearFilter } = useDateRangeFilter();
  const [tipoFilter, setTipoFilter] = useState("all");

  // Dados filtrados
  const diarioFiltrado = useMemo(() => {
    let result = filterByDate(diario || []);
    if (tipoFilter !== "all") result = result.filter(d => d.tipo === tipoFilter);
    return result;
  }, [diario, startDate, endDate, tipoFilter, filterByDate]);

  // Ordenação
  const { sortedData, sortConfig, handleSort } = useSort(diarioFiltrado, "data", "desc");

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
      const { error } = await supabase.from('diario_operacoes').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diario_operacoes'] }),
  });

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    saldo_inicial: "",
    saldo_final: "",
    obs: "",
  });

  // KPIs
  const kpis = useMemo(() => {
    const items = diarioFiltrado;
    const totalLucro = items.reduce((acc, d) => acc + (d.valor_resultado || 0), 0);
    const diasPositivos = items.filter(d => d.valor_resultado > 0).length;
    const diasNegativos = items.filter(d => d.valor_resultado < 0).length;
    const melhorDia = items.length > 0 ? Math.max(...items.map(d => d.valor_resultado || 0)) : 0;
    const mediaDiaria = items.length > 0 ? totalLucro / items.length : 0;
    return { totalLucro, diasPositivos, diasNegativos, melhorDia, mediaDiaria, totalDias: items.length };
  }, [diarioFiltrado]);

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      saldo_inicial: "",
      saldo_final: "",
      obs: "",
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: DiarioOperacoes) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        data: item.data,
        saldo_inicial: item.saldo_inicial.toString(),
        saldo_final: item.saldo_final.toString(),
        obs: item.obs || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        data: formData.data,
        saldo_inicial: parseFloat(formData.saldo_inicial),
        saldo_final: parseFloat(formData.saldo_final),
        obs: formData.obs || null,
      };
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, ...data });
        toast({ title: "Registro atualizado!" });
      } else {
        await create.mutateAsync(data);
        toast({ title: "Registro criado!" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: error.message || "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este registro?")) {
      try {
        await remove.mutateAsync(id);
        toast({ title: "Registro excluído!" });
      } catch (error) {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      }
    }
  };

  const getTipoBadge = (tipo: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary"> = {
      lucro: "default",
      prejuizo: "destructive",
      empate: "secondary",
    };
    const labels: Record<string, string> = {
      lucro: "✅ Lucro",
      prejuizo: "❌ Prejuízo",
      empate: "➖ Empate",
    };
    return <Badge variant={variants[tipo]}>{labels[tipo]}</Badge>;
  };

  return (
    <AppLayout title="Diário de Operações" subtitle="Registre seu resultado diário (saldo início vs fim do dia)">
      <div className="space-y-4">
        {/* 1. Filtros Primeiro */}
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={clearFilter}
          />
          <SelectFilter
            label="Tipo"
            value={tipoFilter}
            options={[
              { value: "lucro", label: "✅ Lucro" },
              { value: "prejuizo", label: "❌ Prejuízo" },
              { value: "empate", label: "➖ Empate" },
            ]}
            onValueChange={setTipoFilter}
            placeholder="Todos Tipos"
          />
        </div>

        {/* 2. Cards de KPI Depois */}
        <KPISummary columns={5}>
          <KPICard
            title="Lucro Total"
            value={formatCurrency(kpis.totalLucro)}
            icon={<Activity className="h-5 w-5 text-primary" />}
            variant={kpis.totalLucro >= 0 ? "success" : "destructive"}
          />
          <KPICard
            title="Dias Positivos"
            value={kpis.diasPositivos}
            icon={<TrendingUp className="h-5 w-5 text-success" />}
            variant="success"
          />
          <KPICard
            title="Dias Negativos"
            value={kpis.diasNegativos}
            icon={<TrendingDown className="h-5 w-5 text-destructive" />}
            variant="destructive"
          />
          <KPICard
            title="Melhor Dia"
            value={formatCurrency(kpis.melhorDia)}
            icon={<Calendar className="h-5 w-5 text-primary" />}
          />
          <KPICard
            title="Média Diária"
            value={formatCurrency(kpis.mediaDiaria)}
          />
        </KPISummary>

        {/* 3. Tabela */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Registro" : "Novo Registro Diário"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Saldo Inicial (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.saldo_inicial}
                      onChange={(e) => setFormData({ ...formData, saldo_inicial: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Saldo Final (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.saldo_final}
                      onChange={(e) => setFormData({ ...formData, saldo_final: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.obs}
                    onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                    placeholder="Notas sobre o dia..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
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
                <SortableHeader label="Saldo Inicial" sortKey="saldo_inicial" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <SortableHeader label="Saldo Final" sortKey="saldo_final" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <SortableHeader label="Resultado" sortKey="valor_resultado" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <SortableHeader label="Status" sortKey="tipo" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : sortedData.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</TableCell></TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className={isSelected(item.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox checked={isSelected(item.id)} onCheckedChange={() => toggleSelection(item.id)} />
                    </TableCell>
                    <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.saldo_inicial)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.saldo_final)}</TableCell>
                    <TableCell className={`text-right font-bold ${item.valor_resultado >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(item.valor_resultado)}
                    </TableCell>
                    <TableCell>{getTipoBadge(item.tipo)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
          onDelete={async () => { await bulkRemove.mutateAsync(Array.from(selectedIds)); clearSelection(); }}
          onClearSelection={clearSelection}
          isDeleting={bulkRemove.isPending}
          itemName="registros"
        />
      </div>
    </AppLayout>
  );
}
