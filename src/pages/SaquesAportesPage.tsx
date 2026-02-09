import { useState, useMemo } from "react";
import { useSaquesAportes, useSaquesAportesMutations, useCasas, useDadosReferencia } from "@/hooks/useSupabaseData";
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
import { Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, Building2, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/StatCard";
import { toast } from "@/hooks/use-toast";
import { DateRangeFilter, useDateRangeFilter, SelectFilter } from "@/components/filters/DateRangeFilter";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SaquesAportes } from "@/types/database";

export default function SaquesAportesPage() {
  const { data: movimentacoes, isLoading } = useSaquesAportes();
  const { data: casas } = useCasas();
  const { data: bancos } = useDadosReferencia('banco');
  const { create, update, remove } = useSaquesAportesMutations();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SaquesAportes | null>(null);

  // Filtros
  const { startDate, endDate, setStartDate, setEndDate, filterByDate, clearFilter } = useDateRangeFilter();
  const [tipoFilter, setTipoFilter] = useState("all");
  const [casaFilter, setCasaFilter] = useState("all");
  const [bancoFilter, setBancoFilter] = useState("all");

  // Dados filtrados
  const movimentacoesFiltradas = useMemo(() => {
    let result = filterByDate(movimentacoes || []);
    if (tipoFilter !== "all") result = result.filter(m => m.tipo === tipoFilter);
    if (casaFilter !== "all") result = result.filter(m => m.casa_nome === casaFilter);
    if (bancoFilter !== "all") result = result.filter(m => m.banco === bancoFilter);
    return result;
  }, [movimentacoes, startDate, endDate, tipoFilter, casaFilter, bancoFilter, filterByDate]);

  // Ordenação
  const { sortedData, sortConfig, handleSort } = useSort(movimentacoesFiltradas, "data", "desc");

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
      const { error } = await supabase.from('saques_aportes').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saques_aportes'] }),
  });

  // Opções para filtros
  const casasOptions = useMemo(() => {
    const nomes = new Set(movimentacoes?.map(m => m.casa_nome).filter(Boolean) as string[]);
    return Array.from(nomes).map(n => ({ value: n, label: n }));
  }, [movimentacoes]);

  const bancosOptions = useMemo(() => {
    const nomes = new Set(movimentacoes?.map(m => m.banco).filter(Boolean) as string[]);
    return Array.from(nomes).map(n => ({ value: n, label: n }));
  }, [movimentacoes]);

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    casa_id: "",
    casa_nome: "",
    tipo: "deposito",
    valor: "",
    obs: "",
    motivo: "",
    banco: "",
    status: "concluido",
  });

  // KPIs
  const kpis = useMemo(() => {
    const items = movimentacoesFiltradas;
    const depositos = items.reduce((acc, m) => acc + (m.valor_deposito || 0), 0);
    const saques = items.reduce((acc, m) => acc + (m.valor_saque || 0), 0);
    const float = depositos - saques;
    const totalMovimentacoes = items.length;
    const casasMovimentadas = new Set(items.map(m => m.casa_nome).filter(Boolean)).size;
    return { depositos, saques, float, totalMovimentacoes, casasMovimentadas };
  }, [movimentacoesFiltradas]);

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      casa_id: "",
      casa_nome: "",
      tipo: "deposito",
      valor: "",
      obs: "",
      motivo: "",
      banco: "",
      status: "concluido",
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: SaquesAportes) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        data: item.data,
        casa_id: item.casa_id || "",
        casa_nome: item.casa_nome || "",
        tipo: item.tipo,
        valor: item.valor.toString(),
        obs: item.obs || "",
        motivo: item.motivo || "",
        banco: item.banco || "",
        status: item.status,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        data: formData.data,
        casa_id: formData.casa_id || null,
        casa_nome: formData.casa_nome || null,
        tipo: formData.tipo as 'deposito' | 'saque',
        valor: parseFloat(formData.valor),
        obs: formData.obs || null,
        motivo: formData.motivo || null,
        banco: formData.banco || null,
        status: formData.status,
      };
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, ...data });
        toast({ title: "Movimentação atualizada!" });
      } else {
        await create.mutateAsync(data);
        toast({ title: "Movimentação criada!" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir esta movimentação?")) {
      try {
        await remove.mutateAsync(id);
        toast({ title: "Movimentação excluída!" });
      } catch (error) {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      }
    }
  };

  return (
    <AppLayout title="Saques & Aportes nas Casas" subtitle="Movimentações de depósitos e saques nas casas de apostas">
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
              { value: "deposito", label: "⬇️ Depósito" },
              { value: "saque", label: "⬆️ Saque" },
            ]}
            onValueChange={setTipoFilter}
            placeholder="Todos Tipos"
          />
          <SelectFilter
            label="Casa"
            value={casaFilter}
            options={casasOptions}
            onValueChange={setCasaFilter}
            placeholder="Todas Casas"
          />
          <SelectFilter
            label="Banco"
            value={bancoFilter}
            options={bancosOptions}
            onValueChange={setBancoFilter}
            placeholder="Todos Bancos"
          />
        </div>

        {/* 2. Cards de KPI Depois */}
        <KPISummary columns={5}>
          <KPICard
            title="Float (na rua)"
            value={formatCurrency(kpis.float)}
            icon={<Activity className="h-5 w-5 text-primary" />}
            variant={kpis.float >= 0 ? "warning" : "success"}
          />
          <KPICard
            title="Total Depósitos"
            value={formatCurrency(kpis.depositos)}
            icon={<TrendingDown className="h-5 w-5 text-destructive" />}
            variant="destructive"
          />
          <KPICard
            title="Total Saques"
            value={formatCurrency(kpis.saques)}
            icon={<TrendingUp className="h-5 w-5 text-success" />}
            variant="success"
          />
          <KPICard
            title="Casas"
            value={kpis.casasMovimentadas}
            icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
          />
          <KPICard
            title="Movimentações"
            value={kpis.totalMovimentacoes}
          />
        </KPISummary>

        {/* 3. Tabela */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Movimentação" : "Nova Movimentação"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
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
                    <Label>Tipo *</Label>
                    <Select value={formData.tipo} onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="deposito">⬇️ Depósito</SelectItem>
                        <SelectItem value="saque">⬆️ Saque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
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
                    <Label>Valor (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Select value={formData.banco} onValueChange={(v) => setFormData({ ...formData, banco: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {bancos?.map((b) => (
                          <SelectItem key={b.id} value={b.nome}>{b.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="concluido">✅ Concluído</SelectItem>
                        <SelectItem value="pendente">⏳ Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                <SortableHeader label="Tipo" sortKey="tipo" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Casa" sortKey="casa_nome" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Banco" sortKey="banco" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Valor" sortKey="valor" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : sortedData.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma movimentação encontrada</TableCell></TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className={isSelected(item.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox checked={isSelected(item.id)} onCheckedChange={() => toggleSelection(item.id)} />
                    </TableCell>
                    <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant={item.tipo === 'deposito' ? 'destructive' : 'default'}>
                        {item.tipo === 'deposito' ? '⬇️ Depósito' : '⬆️ Saque'}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.casa_nome}</TableCell>
                    <TableCell>{item.banco}</TableCell>
                    <TableCell className={`text-right font-bold ${item.tipo === 'saque' ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(item.valor)}
                    </TableCell>
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
          itemName="movimentações"
        />
      </div>
    </AppLayout>
  );
}
