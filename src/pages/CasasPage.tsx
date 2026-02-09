import { useState, useMemo } from "react";
import { useCasas, useCasaMutations } from "@/hooks/useSupabaseData";
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
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Building2, CheckCircle2, XCircle, Search, Wallet, Activity, ShieldCheck, Percent, TrendingUp } from "lucide-react";
import { formatCurrency, formatPercent } from "@/components/dashboard/StatCard";
import { toast } from "@/hooks/use-toast";
import { SelectFilter } from "@/components/filters/DateRangeFilter";
import type { Casa } from "@/types/database";
import { useLogs } from "@/hooks/useLogs";

export default function CasasPage() {
  const { data: casas, isLoading, error: loadError } = useCasas();
  const { create, update, remove } = useCasaMutations();
  const { logActivity } = useLogs();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Casa | null>(null);

  // Filtros
  const [situacaoFilter, setSituacaoFilter] = useState("all");
  const [verificadaFilter, setVerificadaFilter] = useState("all");
  const [usandoFilter, setUsandoFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dados filtrados
  const casasFiltradas = useMemo(() => {
    let result = casas || [];
    if (situacaoFilter !== "all") result = result.filter(c => c.situacao === situacaoFilter);
    if (verificadaFilter !== "all") result = result.filter(c => c.verificada === (verificadaFilter === "true"));
    if (usandoFilter !== "all") result = result.filter(c => c.usando === (usandoFilter === "true"));
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.nome.toLowerCase().includes(query) || 
        c.login?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
      );
    }
    return result;
  }, [casas, situacaoFilter, verificadaFilter, usandoFilter, searchQuery]);

  // Ordenação
  const { sortedData, sortConfig, handleSort } = useSort(casasFiltradas, "nome", "asc");

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
    const items = casasFiltradas;
    const totalCasas = items.length;
    const totalSaldo = items.reduce((acc, c) => acc + (c.saldo_real || 0), 0);
    const totalLucro = items.reduce((acc, c) => acc + (c.lucro_prejuizo || 0), 0);
    const verificadas = items.filter(c => c.verificada).length;
    const emUso = items.filter(c => c.usando).length;
    const ativas = items.filter(c => c.situacao === 'ativa').length;
    const roiMedio = items.length > 0 ? items.reduce((acc, c) => acc + (c.percentual_retorno || 0), 0) / items.length : 0;
    return { totalCasas, totalSaldo, totalLucro, verificadas, emUso, ativas, roiMedio };
  }, [casasFiltradas]);

  const [formData, setFormData] = useState({
    nome: "",
    login: "",
    email: "",
    senha: "",
    situacao: "ativa",
    verificada: false,
    usando: true,
    saldo_real: "0",
    percentual_maximo_banca: "20",
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      login: "",
      email: "",
      senha: "",
      situacao: "ativa",
      verificada: false,
      usando: true,
      saldo_real: "0",
      percentual_maximo_banca: "20",
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: Casa) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nome: item.nome,
        login: item.login || "",
        email: item.email || "",
        senha: item.senha || "",
        situacao: item.situacao || "ativa",
        verificada: item.verificada,
        usando: item.usando,
        saldo_real: item.saldo_real?.toString() || "0",
        percentual_maximo_banca: item.percentual_maximo_banca?.toString() || "20",
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
        ...formData,
        saldo_real: parseFloat(formData.saldo_real),
        percentual_maximo_banca: parseFloat(formData.percentual_maximo_banca),
      };
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, ...data });
        logActivity('INFO', `Casa atualizada: ${data.nome}`, 'Casas');
        toast({ title: "Casa atualizada!" });
      } else {
        await create.mutateAsync(data);
        logActivity('INFO', `Nova casa criada: ${data.nome}`, 'Casas');
        toast({ title: "Casa criada!" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      logActivity('ERROR', `Erro ao salvar casa: ${error.message}`, 'Casas');
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  if (loadError) return <AppLayout title="Casas de Apostas"><div className="p-8 text-center text-destructive">Erro ao carregar dados.</div></AppLayout>;

  return (
    <AppLayout title="Casas de Apostas" subtitle="Gerenciamento de contas e saldos nas casas">
      <div className="space-y-4">
        {/* 1. Filtros Primeiro (Padrão Saques & Aportes) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar nome, login ou e-mail..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <SelectFilter
            label="Situação"
            value={situacaoFilter}
            options={[
              { value: "ativa", label: "🟢 Ativa" },
              { value: "limitada", label: "🟡 Limitada" },
              { value: "bloqueada", label: "🔴 Bloqueada" },
            ]}
            onValueChange={setSituacaoFilter}
            placeholder="Todas Situações"
          />
          <SelectFilter
            label="Verificada"
            value={verificadaFilter}
            options={[
              { value: "true", label: "✅ Sim" },
              { value: "false", label: "❌ Não" },
            ]}
            onValueChange={setVerificadaFilter}
            placeholder="Verificada?"
          />
          <SelectFilter
            label="Em Uso"
            value={usandoFilter}
            options={[
              { value: "true", label: "✅ Sim" },
              { value: "false", label: "❌ Não" },
            ]}
            onValueChange={setUsandoFilter}
            placeholder="Em Uso?"
          />
        </div>

        {/* 2. Cards de KPI Depois */}
        <KPISummary columns={5}>
          <KPICard
            title="Saldo Total"
            value={formatCurrency(kpis.totalSaldo)}
            icon={<Wallet className="h-5 w-5 text-primary" />}
            variant="primary"
          />
          <KPICard
            title="Lucro Total"
            value={formatCurrency(kpis.totalLucro)}
            icon={<TrendingUp className="h-5 w-5 text-success" />}
            variant={kpis.totalLucro >= 0 ? "success" : "destructive"}
          />
          <KPICard
            title="ROI Médio"
            value={formatPercent(kpis.roiMedio)}
            icon={<Percent className="h-5 w-5 text-info" />}
            variant="info"
          />
          <KPICard
            title="Casas Ativas"
            value={kpis.ativas}
            icon={<Activity className="h-5 w-5 text-success" />}
            variant="success"
          />
          <KPICard
            title="Total de Casas"
            value={kpis.totalCasas}
            icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
          />
        </KPISummary>

        {/* 3. Tabela */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Nova Casa
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Casa" : "Nova Casa"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Casa *</Label>
                    <Input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Saldo Real (R$)</Label>
                    <Input type="number" step="0.01" value={formData.saldo_real} onChange={e => setFormData({...formData, saldo_real: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Login / Usuário</Label>
                    <Input value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail Vinculado</Label>
                    <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Situação</Label>
                    <SelectFilter label="" value={formData.situacao} options={[{value:"ativa",label:"Ativa"},{value:"limitada",label:"Limitada"},{value:"bloqueada",label:"Bloqueada"}]} onValueChange={v => setFormData({...formData, situacao: v})} />
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox id="verificada" checked={formData.verificada} onCheckedChange={v => setFormData({...formData, verificada: !!v})} />
                    <Label htmlFor="verificada">Verificada</Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-8">
                    <Checkbox id="usando" checked={formData.usando} onCheckedChange={v => setFormData({...formData, usando: !!v})} />
                    <Label htmlFor="usando">Em Uso</Label>
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
                <SortableHeader label="Nome" sortKey="nome" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Login" sortKey="login" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="E-mail" sortKey="email" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Situação" sortKey="situacao" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Verificada" sortKey="verificada" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Usando" sortKey="usando" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <SortableHeader label="Saldo" sortKey="saldo_real" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground animate-pulse">Carregando...</TableCell></TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">Nenhuma casa encontrada.</TableCell></TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell>
                      <Checkbox checked={isSelected(item.id)} onCheckedChange={() => toggleSelection(item.id)} />
                    </TableCell>
                    <TableCell className="text-sm font-bold">{item.nome}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.login || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={item.situacao === 'ativa' ? 'success' : item.situacao === 'limitada' ? 'warning' : 'danger'} className="capitalize text-[9px] h-5">
                        {item.situacao}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.verificada ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground/30" />}
                    </TableCell>
                    <TableCell>
                      {item.usando ? <Badge variant="outline" className="text-[9px] h-5 border-primary text-primary">Sim</Badge> : <Badge variant="outline" className="text-[9px] h-5 text-muted-foreground">Não</Badge>}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm text-primary">
                      {formatCurrency(item.saldo_real || 0)}
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
