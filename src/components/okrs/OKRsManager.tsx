import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Target, Zap, CheckCircle2, XCircle } from "lucide-react";
import { useOKRs, useOKRMutations } from "@/hooks/useOKRs";
import { useKPIs } from "@/hooks/useKPIs";
import { formatCurrency, formatPercent } from "@/components/dashboard/StatCard";
import { toast } from "@/hooks/use-toast";

// Métricas automáticas disponíveis
const METRICAS_AUTOMATICAS = [
  { key: "lucroLiquidoTotal", label: "Lucro Líquido Total", format: "currency" },
  { key: "roiGeral", label: "ROI Geral", format: "percent" },
  { key: "bancaAtual", label: "Banca Atual", format: "currency" },
  { key: "velocidadeCruzeiro", label: "Lucro Médio Diário", format: "currency" },
  { key: "diasPositivos", label: "Dias Positivos", format: "number" },
  { key: "casasAtivas", label: "Casas Ativas", format: "number" },
  { key: "totalApostas", label: "Total de Apostas", format: "number" },
  { key: "taxaAcerto", label: "Taxa de Acerto", format: "percent" },
  { key: "runway", label: "Runway (Dias)", format: "number" },
  { key: "ticketMedio", label: "Ticket Médio", format: "currency" },
];

const TIPOS_OKR = [
  { value: "financeiro", label: "💰 Financeiro", color: "bg-success/20 text-success" },
  { value: "risco", label: "⚠️ Risco", color: "bg-warning/20 text-warning" },
  { value: "performance", label: "📈 Performance", color: "bg-primary/20 text-primary" },
  { value: "operacional", label: "⚙️ Operacional", color: "bg-info/20 text-info" },
];

export function OKRsManager() {
  const { data: okrs, isLoading } = useOKRs();
  const { create, update, remove } = useOKRMutations();
  const { kpis, okrs: okrsCalculados, apostasStats } = useKPIs();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOKR, setEditingOKR] = useState<any>(null);
  const [useAutoMetric, setUseAutoMetric] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo: "financeiro",
    objetivo: "",
    key_result: "",
    meta_valor: "",
    valor_atual: "",
    data_fim: "",
    metrica_automatica: "",
  });

  // Mapa de valores automáticos
  const valoresAutomaticos = useMemo(() => ({
    lucroLiquidoTotal: kpis.lucroLiquidoTotal,
    roiGeral: kpis.roiGeral,
    bancaAtual: kpis.bancaAtual,
    velocidadeCruzeiro: kpis.velocidadeCruzeiro,
    diasPositivos: kpis.diasPositivos,
    casasAtivas: kpis.casasAtivas,
    totalApostas: apostasStats.totalApostas,
    taxaAcerto: apostasStats.taxaAcerto,
    runway: okrsCalculados.runway,
    ticketMedio: apostasStats.ticketMedio,
  }), [kpis, okrsCalculados, apostasStats]);

  // Calcular valor atual com base na métrica automática
  const getValorAtualOKR = (okr: any) => {
    if (okr.key_result && okr.key_result.startsWith("AUTO:")) {
      const metricaKey = okr.key_result.replace("AUTO:", "");
      return valoresAutomaticos[metricaKey as keyof typeof valoresAutomaticos] || okr.valor_atual;
    }
    return okr.valor_atual;
  };

  const calcularProgresso = (okr: any) => {
    const valorAtual = getValorAtualOKR(okr);
    if (!okr.meta_valor || okr.meta_valor === 0) return 0;
    return Math.min((valorAtual / okr.meta_valor) * 100, 100);
  };

  const formatarValor = (valor: number, metricaKey?: string) => {
    const metrica = METRICAS_AUTOMATICAS.find(m => m.key === metricaKey);
    if (!metrica) return valor.toLocaleString('pt-BR');
    
    switch (metrica.format) {
      case "currency": return formatCurrency(valor);
      case "percent": return formatPercent(valor);
      default: return valor.toLocaleString('pt-BR');
    }
  };

  const handleOpenDialog = (okr?: any) => {
    if (okr) {
      setEditingOKR(okr);
      const isAuto = okr.key_result?.startsWith("AUTO:");
      setUseAutoMetric(isAuto);
      setFormData({
        tipo: okr.tipo,
        objetivo: okr.objetivo,
        key_result: isAuto ? "" : okr.key_result,
        meta_valor: okr.meta_valor?.toString() || "",
        valor_atual: okr.valor_atual?.toString() || "",
        data_fim: okr.data_fim || "",
        metrica_automatica: isAuto ? okr.key_result.replace("AUTO:", "") : "",
      });
    } else {
      setEditingOKR(null);
      setUseAutoMetric(false);
      setFormData({ tipo: "financeiro", objetivo: "", key_result: "", meta_valor: "", valor_atual: "", data_fim: "", metrica_automatica: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const keyResult = useAutoMetric 
        ? `AUTO:${formData.metrica_automatica}`
        : formData.key_result;
      
      const valorAtual = useAutoMetric 
        ? valoresAutomaticos[formData.metrica_automatica as keyof typeof valoresAutomaticos] || 0
        : parseFloat(formData.valor_atual) || 0;

      const data = {
        tipo: formData.tipo,
        objetivo: formData.objetivo,
        key_result: keyResult,
        meta_valor: formData.meta_valor ? parseFloat(formData.meta_valor) : null,
        valor_atual: valorAtual,
        data_fim: formData.data_fim || null,
      };

      if (editingOKR) {
        await update.mutateAsync({ id: editingOKR.id, ...data });
        toast({ title: "OKR atualizado!" });
      } else {
        await create.mutateAsync(data);
        toast({ title: "OKR criado!" });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este OKR?")) {
      try {
        await remove.mutateAsync(id);
        toast({ title: "OKR excluído!" });
      } catch (error) {
        toast({ title: "Erro ao excluir", variant: "destructive" });
      }
    }
  };

  const handleStatusChange = async (okr: any, newStatus: string) => {
    try {
      await update.mutateAsync({ id: okr.id, status: newStatus });
      toast({ title: `OKR marcado como ${newStatus}!` });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const getTipoBadge = (tipo: string) => {
    const t = TIPOS_OKR.find(t => t.value === tipo);
    return <Badge className={t?.color || ""}>{t?.label || tipo}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      em_andamento: "bg-primary/20 text-primary",
      concluido: "bg-success/20 text-success",
      cancelado: "bg-destructive/20 text-destructive",
    };
    const labels: Record<string, string> = {
      em_andamento: "Em Andamento",
      concluido: "Concluído",
      cancelado: "Cancelado",
    };
    return <Badge className={styles[status] || ""}>{labels[status] || status}</Badge>;
  };

  // Agrupar OKRs por tipo
  const okrsAgrupados = useMemo(() => {
    if (!okrs) return {};
    return okrs.reduce((acc, okr) => {
      if (!acc[okr.tipo]) acc[okr.tipo] = [];
      acc[okr.tipo].push(okr);
      return acc;
    }, {} as Record<string, typeof okrs>);
  }, [okrs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            OKRs - Objetivos e Resultados-Chave
          </h3>
          <p className="text-sm text-muted-foreground">
            Defina metas e acompanhe o progresso automaticamente
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Novo OKR
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingOKR ? "Editar OKR" : "Novo OKR"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {TIPOS_OKR.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prazo</Label>
                  <Input
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Objetivo *</Label>
                <Input
                  value={formData.objetivo}
                  onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                  placeholder="Ex: Aumentar lucro mensal"
                  required
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30">
                <Switch
                  checked={useAutoMetric}
                  onCheckedChange={setUseAutoMetric}
                />
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Zap className="h-4 w-4 text-warning" />
                    Usar Métrica Automática
                  </Label>
                  <p className="text-xs text-muted-foreground">Valor atual será calculado automaticamente dos dados</p>
                </div>
              </div>

              {useAutoMetric ? (
                <div className="space-y-2">
                  <Label>Métrica Automática *</Label>
                  <Select 
                    value={formData.metrica_automatica} 
                    onValueChange={(v) => setFormData({ ...formData, metrica_automatica: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma métrica" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {METRICAS_AUTOMATICAS.map(m => (
                        <SelectItem key={m.key} value={m.key}>
                          {m.label} ({formatarValor(valoresAutomaticos[m.key as keyof typeof valoresAutomaticos] || 0, m.key)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Valor atual: {formData.metrica_automatica && formatarValor(
                      valoresAutomaticos[formData.metrica_automatica as keyof typeof valoresAutomaticos] || 0,
                      formData.metrica_automatica
                    )}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Key Result (Resultado-Chave) *</Label>
                    <Input
                      value={formData.key_result}
                      onChange={(e) => setFormData({ ...formData, key_result: e.target.value })}
                      placeholder="Ex: Lucro de R$ 5.000"
                      required={!useAutoMetric}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Atual</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.valor_atual}
                      onChange={(e) => setFormData({ ...formData, valor_atual: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Meta (Valor Numérico) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.meta_valor}
                  onChange={(e) => setFormData({ ...formData, meta_valor: e.target.value })}
                  placeholder="Ex: 5000"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingOKR ? "Salvar" : "Criar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !okrs?.length ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum OKR cadastrado. Crie seu primeiro objetivo!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {TIPOS_OKR.map(tipo => {
            const tipoOkrs = okrsAgrupados[tipo.value];
            if (!tipoOkrs?.length) return null;

            return (
              <div key={tipo.value} className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {tipo.label} ({tipoOkrs.length})
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {tipoOkrs.map((okr) => {
                    const valorAtual = getValorAtualOKR(okr);
                    const progresso = calcularProgresso(okr);
                    const isAuto = okr.key_result?.startsWith("AUTO:");
                    const metricaKey = isAuto ? okr.key_result.replace("AUTO:", "") : undefined;

                    return (
                      <Card key={okr.id} className={okr.status === "concluido" ? "border-success/50" : ""}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(okr.status)}
                                {isAuto && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <Zap className="h-3 w-3" /> Auto
                                  </Badge>
                                )}
                              </div>
                              <p className="font-semibold">{okr.objetivo}</p>
                              <p className="text-sm text-muted-foreground">
                                {isAuto 
                                  ? METRICAS_AUTOMATICAS.find(m => m.key === metricaKey)?.label 
                                  : okr.key_result}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(okr)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(okr.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Progresso</span>
                              <span className="font-medium">{progresso.toFixed(0)}%</span>
                            </div>
                            <Progress value={progresso} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Atual: {formatarValor(valorAtual, metricaKey)}</span>
                              <span>Meta: {formatarValor(okr.meta_valor || 0, metricaKey)}</span>
                            </div>
                          </div>

                          {okr.data_fim && (
                            <p className="text-xs text-muted-foreground">
                              Prazo: {new Date(okr.data_fim).toLocaleDateString('pt-BR')}
                            </p>
                          )}

                          {okr.status === "em_andamento" && (
                            <div className="flex gap-2 pt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 text-success border-success/30"
                                onClick={() => handleStatusChange(okr, "concluido")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 text-destructive border-destructive/30"
                                onClick={() => handleStatusChange(okr, "cancelado")}
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Cancelar
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
