import { useState, useMemo } from "react";
import { useApostasSurebet, useApostasSurebetMutations, useCasas } from "@/hooks/useSupabaseData";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatPercent } from "@/components/dashboard/StatCard";
import { toast } from "@/hooks/use-toast";
import { DateRangeFilter, useDateRangeFilter, SelectFilter } from "@/components/filters/DateRangeFilter";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApostaSurebet } from "@/types/database";

export default function SurebetsPage() {
  const { data: surebets, isLoading } = useApostasSurebet();
  const { data: casas } = useCasas();
  const { create, update, remove } = useApostasSurebetMutations();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApostaSurebet | null>(null);
  
  // Filtros
  const { startDate, endDate, setStartDate, setEndDate, filterByDate, clearFilter } = useDateRangeFilter();
  const [casaFilter, setCasaFilter] = useState("all");
  const [resultadoFilter, setResultadoFilter] = useState("all");
  const [investimentoMinFilter, setInvestimentoMinFilter] = useState("");
  const [investimentoMaxFilter, setInvestimentoMaxFilter] = useState("");

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    evento: "",
    casa1_id: "",
    casa1_nome: "",
    selecao1: "",
    odd1: "",
    stake1: "",
    resultado1: "pendente",
    casa2_id: "",
    casa2_nome: "",
    selecao2: "",
    odd2: "",
    stake2: "",
    resultado2: "pendente",
    casa3_id: "",
    casa3_nome: "",
    selecao3: "",
    odd3: "",
    stake3: "",
    resultado3: "pendente",
    percentual_surebet: "",
    lucro_prejuizo: "",
    obs: "",
  });

  // Dados filtrados
  const surebetsFiltradas = useMemo(() => {
    let result = filterByDate(surebets || []);
    
    if (casaFilter !== "all") {
      result = result.filter(s => 
        s.casa1_nome === casaFilter || 
        s.casa2_nome === casaFilter || 
        s.casa3_nome === casaFilter
      );
    }
    
    if (resultadoFilter !== "all") {
      result = result.filter(s => {
        const lucro = s.lucro_prejuizo || 0;
        if (resultadoFilter === "green") return lucro > 0;
        if (resultadoFilter === "red") return lucro < 0;
        if (resultadoFilter === "pendente") return s.resultado1 === "pendente" || s.resultado2 === "pendente";
        return true;
      });
    }
    
    if (investimentoMinFilter) {
      const min = parseFloat(investimentoMinFilter);
      result = result.filter(s => (s.investimento_total || 0) >= min);
    }
    
    if (investimentoMaxFilter) {
      const max = parseFloat(investimentoMaxFilter);
      result = result.filter(s => (s.investimento_total || 0) <= max);
    }
    
    return result;
  }, [surebets, startDate, endDate, casaFilter, resultadoFilter, investimentoMinFilter, investimentoMaxFilter, filterByDate]);

  // Ordenação
  const { sortedData, sortConfig, handleSort } = useSort(surebetsFiltradas, "data", "desc");

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

  // Bulk delete mutation
  const bulkRemove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('apostas_surebet').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apostas_surebet'] }),
  });

  const casasOptions = useMemo(() => {
    const nomes = new Set<string>();
    surebets?.forEach(s => {
      if (s.casa1_nome) nomes.add(s.casa1_nome);
      if (s.casa2_nome) nomes.add(s.casa2_nome);
      if (s.casa3_nome) nomes.add(s.casa3_nome);
    });
    return Array.from(nomes).sort().map(n => ({ value: n, label: n }));
  }, [surebets]);

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      evento: "",
      casa1_id: "",
      casa1_nome: "",
      selecao1: "",
      odd1: "",
      stake1: "",
      resultado1: "pendente",
      casa2_id: "",
      casa2_nome: "",
      selecao2: "",
      odd2: "",
      stake2: "",
      resultado2: "pendente",
      casa3_id: "",
      casa3_nome: "",
      selecao3: "",
      odd3: "",
      stake3: "",
      resultado3: "pendente",
      percentual_surebet: "",
      lucro_prejuizo: "",
      obs: "",
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: ApostaSurebet) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        data: item.data,
        evento: item.evento || "",
        casa1_id: item.casa1_id || "",
        casa1_nome: item.casa1_nome || "",
        selecao1: item.selecao1 || "",
        odd1: item.odd1?.toString() || "",
        stake1: item.stake1?.toString() || "",
        resultado1: item.resultado1 || "pendente",
        casa2_id: item.casa2_id || "",
        casa2_nome: item.casa2_nome || "",
        selecao2: item.selecao2 || "",
        odd2: item.odd2?.toString() || "",
        stake2: item.stake2?.toString() || "",
        resultado2: item.resultado2 || "pendente",
        casa3_id: item.casa3_id || "",
        casa3_nome: item.casa3_nome || "",
        selecao3: item.selecao3 || "",
        odd3: item.odd3?.toString() || "",
        stake3: item.stake3?.toString() || "",
        resultado3: item.resultado3 || "pendente",
        percentual_surebet: item.percentual_surebet?.toString() || "",
        lucro_prejuizo: item.lucro_prejuizo?.toString() || "",
        obs: item.obs || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCasaChange = (field: 'casa1_id' | 'casa2_id' | 'casa3_id', casaId: string) => {
    const casa = casas?.find(c => c.id === casaId);
    const nomeField = field.replace('_id', '_nome') as 'casa1_nome' | 'casa2_nome' | 'casa3_nome';
    setFormData({
      ...formData,
      [field]: casaId,
      [nomeField]: casa?.nome || "",
    });
  };

  const calcularSurebet = (currentFormData = formData) => {
    const odd1 = parseFloat(currentFormData.odd1);
    const odd2 = parseFloat(currentFormData.odd2);
    const odd3 = parseFloat(currentFormData.odd3);
    const stake1 = parseFloat(currentFormData.stake1) || 0;
    const stake2 = parseFloat(currentFormData.stake2) || 0;
    const stake3 = parseFloat(currentFormData.stake3) || 0;
    
    let sum = 0;
    if (odd1) sum += 1/odd1;
    if (odd2) sum += 1/odd2;
    if (odd3) sum += 1/odd3;
    
    const percentualSurebet = sum > 0 ? 100 - (sum * 100) : 0;
    const investimentoTotal = stake1 + stake2 + stake3;
    
    let lucroGarantido = 0;
    if (percentualSurebet > 0 && investimentoTotal > 0) {
      lucroGarantido = investimentoTotal * (percentualSurebet / 100);
    }
    
    setFormData({ 
      ...currentFormData, 
      percentual_surebet: percentualSurebet.toFixed(2),
      lucro_prejuizo: lucroGarantido > 0 ? lucroGarantido.toFixed(2) : currentFormData.lucro_prejuizo
    });
  };

  const handleFormChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    if (field.includes('odd') || field.includes('stake')) {
      setTimeout(() => calcularSurebet(newFormData), 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        data: formData.data,
        evento: formData.evento || null,
        casa1_id: formData.casa1_id || null,
        casa1_nome: formData.casa1_nome || null,
        selecao1: formData.selecao1 || null,
        odd1: formData.odd1 ? parseFloat(formData.odd1) : null,
        stake1: formData.stake1 ? parseFloat(formData.stake1) : null,
        resultado1: formData.resultado1 || null,
        casa2_id: formData.casa2_id || null,
        casa2_nome: formData.casa2_nome || null,
        selecao2: formData.selecao2 || null,
        odd2: formData.odd2 ? parseFloat(formData.odd2) : null,
        stake2: formData.stake2 ? parseFloat(formData.stake2) : null,
        resultado2: formData.resultado2 || null,
        casa3_id: formData.casa3_id || null,
        casa3_nome: formData.casa3_nome || null,
        selecao3: formData.selecao3 || null,
        odd3: formData.odd3 ? parseFloat(formData.odd3) : null,
        stake3: formData.stake3 ? parseFloat(formData.stake3) : null,
        resultado3: formData.resultado3 || null,
        percentual_surebet: formData.percentual_surebet ? parseFloat(formData.percentual_surebet) : null,
        lucro_prejuizo: formData.lucro_prejuizo ? parseFloat(formData.lucro_prejuizo) : null,
        obs: formData.obs || null,
      };

      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, ...data });
        toast({ title: "Surebet atualizada!" });
      } else {
        await create.mutateAsync(data);
        toast({ title: "Surebet criada!" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir esta surebet?")) {
      try {
        await remove.mutateAsync(id);
        toast({ title: "Surebet excluída!" });
      } catch (error) {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      }
    }
  };

  const totais = surebetsFiltradas.reduce(
    (acc, item) => ({
      investido: acc.investido + (item.investimento_total || 0),
      lucro: acc.lucro + (item.lucro_prejuizo || 0),
    }),
    { investido: 0, lucro: 0 }
  );

  return (
    <AppLayout title="Surebets" subtitle="Gestão de apostas seguras (arbitragem)">
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
            options={[
              { value: "green", label: "✅ Green" },
              { value: "red", label: "❌ Red" },
              { value: "pendente", label: "⏳ Pendente" },
            ]}
            onValueChange={setResultadoFilter}
            placeholder="Todos Resultados"
          />
        </div>

        <KPISummary columns={3}>
          <KPICard
            title="Total Investido"
            value={formatCurrency(totais.investido)}
            tooltipKey="surebetsTotalInvestido"
          />
          <KPICard
            title="Lucro/Prejuízo"
            value={formatCurrency(totais.lucro)}
            variant={totais.lucro >= 0 ? "success" : "destructive"}
            tooltipKey="lucroSurebets"
          />
          <KPICard
            title="Total Surebets"
            value={surebetsFiltradas.length}
            tooltipKey="surebetsTotal"
          />
        </KPISummary>

        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" /> Nova Surebet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Surebet" : "Nova Surebet"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                    <Label>Evento</Label>
                    <Input
                      value={formData.evento}
                      onChange={(e) => setFormData({ ...formData, evento: e.target.value })}
                      placeholder="Ex: Flamengo x Palmeiras"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Casa 1 */}
                  <div className="p-4 rounded-lg border bg-secondary/30">
                    <h4 className="font-semibold mb-3">🅐 Casa 1</h4>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Casa</Label>
                        <Select value={formData.casa1_id} onValueChange={(v) => handleCasaChange('casa1_id', v)}>
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
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Seleção</Label>
                          <Input value={formData.selecao1} onChange={(e) => setFormData({ ...formData, selecao1: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Odd</Label>
                          <Input type="number" step="0.01" value={formData.odd1} onChange={(e) => handleFormChange('odd1', e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Stake (R$)</Label>
                        <Input type="number" step="0.01" value={formData.stake1} onChange={(e) => handleFormChange('stake1', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Casa 2 */}
                  <div className="p-4 rounded-lg border bg-secondary/30">
                    <h4 className="font-semibold mb-3">🅑 Casa 2</h4>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Casa</Label>
                        <Select value={formData.casa2_id} onValueChange={(v) => handleCasaChange('casa2_id', v)}>
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
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Seleção</Label>
                          <Input value={formData.selecao2} onChange={(e) => setFormData({ ...formData, selecao2: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Odd</Label>
                          <Input type="number" step="0.01" value={formData.odd2} onChange={(e) => handleFormChange('odd2', e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Stake (R$)</Label>
                        <Input type="number" step="0.01" value={formData.stake2} onChange={(e) => handleFormChange('stake2', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Casa 3 (Opcional) */}
                <div className="p-4 rounded-lg border bg-secondary/30">
                  <h4 className="font-semibold mb-3">🅲 Casa 3 <span className="text-muted-foreground text-sm">(opcional)</span></h4>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Casa</Label>
                      <Select value={formData.casa3_id || "none"} onValueChange={(v) => handleCasaChange('casa3_id', v === "none" ? "" : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {casas?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Seleção</Label>
                      <Input value={formData.selecao3} onChange={(e) => setFormData({ ...formData, selecao3: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Odd</Label>
                      <Input value={formData.odd3} onChange={(e) => handleFormChange('odd3', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Stake (R$)</Label>
                      <Input value={formData.stake3} onChange={(e) => handleFormChange('stake3', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>% Surebet</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.percentual_surebet}
                      onChange={(e) => setFormData({ ...formData, percentual_surebet: e.target.value })}
                      className={parseFloat(formData.percentual_surebet) > 0 ? 'border-success' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lucro/Prejuízo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.lucro_prejuizo}
                      onChange={(e) => setFormData({ ...formData, lucro_prejuizo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.obs}
                    onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                    placeholder="Notas adicionais..."
                  />
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
                <SortableHeader label="Evento" sortKey="evento" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} />
                <TableHead>Casa 1</TableHead>
                <TableHead>Casa 2</TableHead>
                <TableHead>Casa 3</TableHead>
                <SortableHeader label="Investido" sortKey="investimento_total" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <SortableHeader label="% Surebet" sortKey="percentual_surebet" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
                <SortableHeader label="Lucro" sortKey="lucro_prejuizo" currentSortKey={sortConfig.key} order={sortConfig.order} onSort={handleSort} align="right" />
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
                    Nenhuma surebet registrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id} className={isSelected(item.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox checked={isSelected(item.id)} onCheckedChange={() => toggleSelection(item.id)} />
                    </TableCell>
                    <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.evento}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <span className="font-medium">{item.casa1_nome}</span>
                        <br />
                        <span className="text-muted-foreground">{item.selecao1} @ {item.odd1?.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <span className="font-medium">{item.casa2_nome}</span>
                        <br />
                        <span className="text-muted-foreground">{item.selecao2} @ {item.odd2?.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.casa3_nome ? (
                        <div className="text-xs">
                          <span className="font-medium">{item.casa3_nome}</span>
                          <br />
                          <span className="text-muted-foreground">{item.selecao3} @ {item.odd3?.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.investimento_total)}</TableCell>
                    <TableCell className="text-right">
                      {item.percentual_surebet !== null && (
                        <Badge variant={item.percentual_surebet > 0 ? 'default' : 'secondary'}>
                          {formatPercent(item.percentual_surebet)}
                        </Badge>
                      )}
                    </TableCell>
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
          onDelete={async () => {
            try {
              await bulkRemove.mutateAsync(Array.from(selectedIds));
              toast({ title: `${selectedIds.size} surebets excluídas!` });
              clearSelection();
            } catch (error) {
              toast({ title: "Erro ao excluir", variant: "destructive" });
            }
          }}
          onClearSelection={clearSelection}
          isDeleting={bulkRemove.isPending}
          itemName="surebets"
        />
      </div>
    </AppLayout>
  );
}
