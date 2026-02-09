import { useState, useMemo } from "react";
import { useCassino, useCassinoMutations } from "@/hooks/useCassino";
import { useCasas } from "@/hooks/useSupabaseData";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Dices, Clock, TrendingUp, DollarSign, Target } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/StatCard";
import { toast } from "@/hooks/use-toast";
import { DateRangeFilter, useDateRangeFilter, SelectFilter } from "@/components/filters/DateRangeFilter";
import type { Cassino } from "@/types/database";

export default function CassinoPage() {
  const { data: cassino, isLoading } = useCassino();
  const { data: casas } = useCasas();
  const { create, update, remove, bulkRemove } = useCassinoMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Cassino | null>(null);
  const [tipoRegistro, setTipoRegistro] = useState<'diario' | 'sessao'>('diario');

  // Filtros
  const { startDate, endDate, setStartDate, setEndDate, filterByDate, clearFilter } = useDateRangeFilter();
  const [tipoFilter, setTipoFilter] = useState("all");
  const [jogoFilter, setJogoFilter] = useState("all");

  // Filtragem inicial
  const cassinoFiltrado = useMemo(() => {
    let result = filterByDate(cassino || []);
    if (tipoFilter !== "all") {
      result = result.filter(c => c.tipo_registro === tipoFilter);
    }
    if (jogoFilter !== "all") {
      result = result.filter(c => c.jogo === jogoFilter);
    }
    return result;
  }, [cassino, startDate, endDate, tipoFilter, jogoFilter, filterByDate]);

  // Ordenação
  const { sortedData, sortConfig, handleSort } = useSort(cassinoFiltrado, "data", "desc");

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

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo_registro: 'diario' as 'diario' | 'sessao',
    saldo_inicial: "",
    saldo_final: "",
    jogo: "",
    plataforma: "",
    plataforma_id: "",
    buy_in: "",
    cash_out: "",
    duracao_minutos: "",
    obs: "",
  });

  // Opções de jogos
  const jogosOptions = useMemo(() => {
    const jogos = new Set(cassino?.map(c => c.jogo).filter(Boolean) as string[]);
    return Array.from(jogos).map(j => ({ value: j, label: j }));
  }, [cassino]);

  // KPIs
  const kpis = useMemo(() => {
    const items = cassinoFiltrado;
    const totalLucro = items.reduce((acc, c) => acc + (c.valor_resultado || 0), 0);
    const totalSessoes = items.filter(c => c.tipo_registro === 'sessao').length;
    const totalDiarios = items.filter(c => c.tipo_registro === 'diario').length;
    const diasPositivos = items.filter(c => c.valor_resultado > 0).length;
    const diasNegativos = items.filter(c => c.valor_resultado < 0).length;
    const totalBuyIn = items.reduce((acc, c) => acc + (c.buy_in || 0), 0);
    
    return {
      totalLucro,
      totalSessoes,
      totalDiarios,
      diasPositivos,
      diasNegativos,
      totalBuyIn,
      roi: totalBuyIn > 0 ? (totalLucro / totalBuyIn) * 100 : 0,
    };
  }, [cassinoFiltrado]);

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      tipo_registro: tipoRegistro,
      saldo_inicial: "",
      saldo_final: "",
      jogo: "",
      plataforma: "",
      plataforma_id: "",
      buy_in: "",
      cash_out: "",
      duracao_minutos: "",
      obs: "",
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: Cassino) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        data: item.data,
        tipo_registro: item.tipo_registro,
        saldo_inicial: item.saldo_inicial?.toString() || "",
        saldo_final: item.saldo_final?.toString() || "",
        jogo: item.jogo || "",
        plataforma: item.plataforma || "",
        plataforma_id: item.plataforma_id || "",
        buy_in: item.buy_in?.toString() || "",
        cash_out: item.cash_out?.toString() || "",
        duracao_minutos: item.duracao_minutos?.toString() || "",
        obs: item.obs || "",
      });
      setTipoRegistro(item.tipo_registro);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handlePlataformaChange = (casaId: string) => {
    const casa = casas?.find(c => c.id === casaId);
    setFormData({
      ...formData,
      plataforma_id: casaId,
      plataforma: casa?.nome || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        data: formData.data,
        tipo_registro: formData.tipo_registro,
        saldo_inicial: formData.saldo_inicial ? parseFloat(formData.saldo_inicial) : 0,
        saldo_final: formData.saldo_final ? parseFloat(formData.saldo_final) : 0,
        jogo: formData.jogo || null,
        plataforma: formData.plataforma || null,
        plataforma_id: formData.plataforma_id || null,
        buy_in: formData.buy_in ? parseFloat(formData.buy_in) : null,
        cash_out: formData.cash_out ? parseFloat(formData.cash_out) : null,
        duracao_minutos: formData.duracao_minutos ? parseInt(formData.duracao_minutos) : null,
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
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
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
    return <Badge variant={variants[tipo] || "secondary"}>{labels[tipo] || tipo}</Badge>;
  };

  return (
    <AppLayout title="Cassino" subtitle="Registre suas operações de cassino (diário ou por sessão)">
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
              { value: "diario", label: "Diário" },
              { value: "sessao", label: "Sessão" },
            ]}
            onValueChange={setTipoFilter}
            placeholder="Todos Tipos"
          />
          <SelectFilter
            label="Jogo"
            value={jogoFilter}
            options={jogosOptions}
            onValueChange={setJogoFilter}
            placeholder="Todos Jogos"
          />
        </div>

        {/* 2. Cards de KPI Depois */}
        <KPISummary columns={5}>
          <KPICard
            title="Lucro/Prejuízo"
            value={formatCurrency(kpis.totalLucro)}
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            variant={kpis.totalLucro >= 0 ? "success" : "destructive"}
          />
          <KPICard
            title="Total Buy-in"
            value={formatCurrency(kpis.totalBuyIn)}
            icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          />
          <KPICard
            title="ROI"
            value={`${kpis.roi.toFixed(1)}%`}
            icon={<Target className="h-5 w-5 text-primary" />}
            variant={kpis.roi >= 0 ? "success" : "destructive"}
          />
          <KPICard
            title="Dias Positivos"
            value={kpis.diasPositivos}
            variant="success"
          />
          <KPICard
            title="Dias Negativos"
            value={kpis.diasNegativos}
            variant="destructive"
          />
        </KPISummary>

        {/* 3. Tabela */}
        <div className="flex justify-end gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Registro" : "Novo Registro"}</DialogTitle>
              </DialogHeader>
              <Tabs value={tipoRegistro} onValueChange={(v: any) => { setTipoRegistro(v); setFormData({...formData, tipo_registro: v}); }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="diario">📅 Diário (Saldo)</TabsTrigger>
                  <TabsTrigger value="sessao">🎰 Sessão (Buy-in/Out)</TabsTrigger>
                </TabsList>
                
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                      <Label>Plataforma/Casa *</Label>
                      <Select value={formData.plataforma_id} onValueChange={handlePlataformaChange}>
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
                  </div>

                  <TabsContent value="diario" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Saldo Inicial (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.saldo_inicial}
                          onChange={(e) => setFormData({ ...formData, saldo_inicial: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Saldo Final (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.saldo_final}
                          onChange={(e) => setFormData({ ...formData, saldo_final: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="sessao" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Jogo</Label>
                        <Input
                          value={formData.jogo}
                          onChange={(e) => setFormData({ ...formData, jogo: e.target.value })}
                          placeholder="Ex: Aviator, Roulette"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duração (minutos)</Label>
                        <Input
                          type="number"
                          value={formData.duracao_minutos}
                          onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Buy-in (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.buy_in}
                          onChange={(e) => setFormData({ ...formData, buy_in: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cash-out (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.cash_out}
                          onChange={(e) => setFormData({ ...formData, cash_out: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.obs}
                      onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                      placeholder="Detalhes da operação..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingItem ? "Salvar" : "Criar"}</Button>
                  </div>
                </form>
              </Tabs>
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
                <SortableHeader label="Tipo" sortKey="tipo_registro" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Plataforma" sortKey="plataforma" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Jogo" sortKey="jogo" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Resultado" sortKey="valor_resultado" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <SortableHeader label="Status" sortKey="tipo" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum registro de cassino encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className={isSelected(item.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox checked={isSelected(item.id)} onCheckedChange={() => toggleSelection(item.id)} />
                    </TableCell>
                    <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="capitalize">{item.tipo_registro}</TableCell>
                    <TableCell>{item.plataforma}</TableCell>
                    <TableCell>{item.jogo || '-'}</TableCell>
                    <TableCell className={`text-right font-bold ${item.valor_resultado >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(item.valor_resultado)}
                    </TableCell>
                    <TableCell>{getTipoBadge(item.tipo)}</TableCell>
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
          onDelete={async () => { await bulkRemove.mutateAsync(Array.from(selectedIds)); clearSelection(); }}
          onClearSelection={clearSelection}
          isDeleting={bulkRemove.isPending}
          itemName="registros"
        />
      </div>
    </AppLayout>
  );
}
