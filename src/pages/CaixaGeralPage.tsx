import { useState, useMemo } from "react";
import { useCaixaGeral, useCaixaGeralMutations } from "@/hooks/useSupabaseData";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/shared/TablePagination";
import { SortableHeader } from "@/components/shared/SortableHeader";
import { useSort } from "@/hooks/useSort";
import { AppLayout } from "@/components/layout/AppLayout";
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
import { Plus, Pencil, Trash2, Wallet, Activity, TrendingUp, TrendingDown, Landmark, Search } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/StatCard";
import { toast } from "@/hooks/use-toast";
import { DateRangeFilter, useDateRangeFilter, SelectFilter } from "@/components/filters/DateRangeFilter";
import type { CaixaGeral } from "@/types/database";
import { useLogs } from "@/hooks/useLogs";

export default function CaixaGeralPage() {
  const { data: caixa, isLoading, error: loadError } = useCaixaGeral();
  const { create, update, remove } = useCaixaGeralMutations();
  const { logActivity } = useLogs();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CaixaGeral | null>(null);

  // Filtros
  const { startDate, endDate, setStartDate, setEndDate, filterByDate, clearFilter } = useDateRangeFilter();
  const [tipoFilter, setTipoFilter] = useState("all");
  const [bancoFilter, setBancoFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Opções para filtros
  const bancosOptions = useMemo(() => {
    const nomes = new Set(caixa?.map(c => c.banco).filter(Boolean) as string[]);
    return Array.from(nomes).map(n => ({ value: n, label: n }));
  }, [caixa]);

  // Dados filtrados
  const caixaFiltrado = useMemo(() => {
    let result = filterByDate(caixa || []);
    if (tipoFilter !== "all") result = result.filter(c => c.tipo === tipoFilter);
    if (bancoFilter !== "all") result = result.filter(c => c.banco === bancoFilter);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.descricao?.toLowerCase().includes(query) || 
        c.banco?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [caixa, startDate, endDate, tipoFilter, bancoFilter, searchQuery, filterByDate]);

  // Ordenação
  const { sortedData, sortConfig, handleSort } = useSort(caixaFiltrado, "data", "desc");

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
  const { selectedIds, toggleSelection, toggleAll, isSelected, isAllSelected } = useBulkSelection(paginatedData);

  // KPIs
  const kpis = useMemo(() => {
    const items = caixaFiltrado;
    const aportes = items.reduce((acc, c) => acc + (c.valor_aporte || 0), 0);
    const saques = items.reduce((acc, c) => acc + (c.valor_saque || 0), 0);
    const custos = items.reduce((acc, c) => acc + (c.valor_custo || 0), 0);
    const saldo = aportes - saques - custos;
    return { aportes, saques, custos, saldo, totalRegistros: items.length };
  }, [caixaFiltrado]);

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo: "aporte",
    valor: "",
    descricao: "",
    banco: "",
  });

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      tipo: "aporte",
      valor: "",
      descricao: "",
      banco: "",
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: CaixaGeral) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        data: item.data,
        tipo: item.tipo,
        valor: item.valor.toString(),
        descricao: item.descricao || "",
        banco: item.banco || "",
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
        tipo: formData.tipo as 'aporte' | 'saque' | 'custo',
        valor: parseFloat(formData.valor),
        descricao: formData.descricao || null,
        banco: formData.banco || null,
      };
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, ...data });
        logActivity('INFO', `Registro de caixa atualizado: ${data.tipo}`, 'Caixa');
        toast({ title: "Registro atualizado!" });
      } else {
        await create.mutateAsync(data);
        logActivity('INFO', `Novo registro de caixa: ${data.tipo}`, 'Caixa');
        toast({ title: "Registro criado!" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      logActivity('ERROR', `Erro ao salvar caixa: ${error.message}`, 'Caixa');
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  if (loadError) return <AppLayout title="Caixa Geral"><div className="p-8 text-center text-destructive">Erro ao carregar dados.</div></AppLayout>;

  return (
    <AppLayout title="Caixa Geral" subtitle="Controle de aportes, saques e custos operacionais">
      <div className="space-y-4">
        {/* 1. Filtros Primeiro (Padrão Saques & Aportes) */}
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
              { value: "aporte", label: "💵 Aporte" },
              { value: "saque", label: "💸 Saque" },
              { value: "custo", label: "💰 Custo" },
            ]}
            onValueChange={setTipoFilter}
            placeholder="Todos Tipos"
          />
          <SelectFilter
            label="Banco"
            value={bancoFilter}
            options={bancosOptions}
            onValueChange={setBancoFilter}
            placeholder="Todos Bancos"
          />
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar descrição..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* 2. Cards de KPI Depois */}
        <KPISummary columns={5}>
          <KPICard
            title="Saldo em Caixa"
            value={formatCurrency(kpis.saldo)}
            icon={<Wallet className="h-5 w-5 text-primary" />}
            variant={kpis.saldo >= 0 ? "success" : "destructive"}
          />
          <KPICard
            title="Total Aportes"
            value={formatCurrency(kpis.aportes)}
            icon={<TrendingUp className="h-5 w-5 text-success" />}
            variant="success"
          />
          <KPICard
            title="Total Saques"
            value={formatCurrency(kpis.saques)}
            icon={<TrendingDown className="h-5 w-5 text-destructive" />}
            variant="destructive"
          />
          <KPICard
            title="Total Custos"
            value={formatCurrency(kpis.custos)}
            icon={<Activity className="h-5 w-5 text-warning" />}
            variant="warning"
          />
          <KPICard
            title="Registros"
            value={kpis.totalRegistros}
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
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Registro" : "Novo Registro"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input type="date" required value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select value={formData.tipo} onValueChange={v => setFormData({...formData, tipo: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="aporte">💵 Aporte</SelectItem>
                        <SelectItem value="saque">💸 Saque</SelectItem>
                        <SelectItem value="custo">💰 Custo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Input required value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$) *</Label>
                    <Input type="number" step="0.01" required value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Banco / Origem</Label>
                    <Input value={formData.banco} onChange={e => setFormData({...formData, banco: e.target.value})} />
                  </div>
                </div>
                <Button type="submit" className="w-full pt-4">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-xl border border-border overflow-hidden shadow-sm bg-card">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <SortableHeader label="Data" sortKey="data" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Tipo" sortKey="tipo" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Descrição" sortKey="descricao" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Banco" sortKey="banco" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Valor" sortKey="valor" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground animate-pulse">Carregando...</TableCell></TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Nenhum registro encontrado.</TableCell></TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell>
                      <Checkbox checked={isSelected(item.id)} onCheckedChange={() => toggleSelection(item.id)} />
                    </TableCell>
                    <TableCell className="text-xs font-medium">{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant={item.tipo === 'aporte' ? 'success' : item.tipo === 'saque' ? 'danger' : 'warning'} className="capitalize text-[9px] h-5">
                        {item.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{item.descricao}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.banco || "-"}</TableCell>
                    <TableCell className={`text-right font-mono font-bold text-sm ${item.tipo === 'aporte' ? 'text-success' : 'text-destructive'}`}>
                      {item.tipo === 'aporte' ? '+' : '-'}{formatCurrency(item.valor)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenDialog(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Excluir?")) remove.mutate(item.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalRecords={totalRecords} onPageChange={handlePageChange} onPageSizeChange={handlePageSizeChange} />
      </div>
    </AppLayout>
  );
}
