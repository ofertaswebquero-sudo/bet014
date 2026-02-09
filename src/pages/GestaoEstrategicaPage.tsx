import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useKPIs } from "@/hooks/useKPIs";
import { useCaixaGeral, useSaquesAportes, useCasas, useApostas, useApostasSurebet, useDiarioOperacoes } from "@/hooks/useSupabaseData";
import { useOKRs, useOKRMutations } from "@/hooks/useOKRs";
import { formatCurrency, formatPercent } from "@/components/dashboard/StatCard";
import { AlertTriangle, TrendingUp, TrendingDown, Target, Plus, Trash2, DollarSign, PiggyBank, Clock, Activity, Lightbulb, Pencil, CheckCircle2, XCircle, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from "@/hooks/use-toast";
import { OKRsManager } from "@/components/okrs/OKRsManager";

export default function GestaoEstrategicaPage() {
  const { kpis, okrs: okrsCalculados, apostasStats } = useKPIs();
  const { data: caixaGeral } = useCaixaGeral();
  const { data: saquesAportes } = useSaquesAportes();
  const { data: casas } = useCasas();
  const { data: diario } = useDiarioOperacoes();
  const { data: okrs } = useOKRs();
  const { create, update, remove } = useOKRMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOKR, setEditingOKR] = useState<any>(null);
  const [formData, setFormData] = useState({
    tipo: "financeiro",
    objetivo: "",
    key_result: "",
    meta_valor: "",
    valor_atual: "",
    data_fim: "",
  });

  // Cálculos de KPIs avançados
  const totalDepositadoCasas = saquesAportes?.reduce((acc, item) => acc + (item.valor_deposito || 0), 0) || 0;
  const totalSacadoCasas = saquesAportes?.reduce((acc, item) => acc + (item.valor_saque || 0), 0) || 0;
  const float = totalDepositadoCasas - totalSacadoCasas;
  const floatPercentual = kpis.bancaAtual > 0 ? (float / kpis.bancaAtual) * 100 : 0;

  // ROI Real vs ROI Virtual
  const totalSaquesPessoais = caixaGeral?.filter(c => c.tipo === 'saque').reduce((acc, c) => acc + c.valor, 0) || 0;
  const totalAportes = caixaGeral?.filter(c => c.tipo === 'aporte').reduce((acc, c) => acc + c.valor, 0) || 0;
  const lucroReal = totalSaquesPessoais;
  const roiReal = totalAportes > 0 ? (lucroReal / totalAportes) * 100 : 0;
  const roiVirtual = kpis.roiGeral;

  // Custo Operacional Total
  const custoOperacional = caixaGeral?.filter(c => c.tipo === 'custo').reduce((acc, c) => acc + c.valor, 0) || 0;

  // Volume de Giro por Casa
  const volumeGiroPorCasa = casas?.map(casa => ({
    nome: casa.nome,
    volume: casa.depositos + casa.saques,
    percentual: kpis.giroTotal > 0 ? ((casa.depositos + casa.saques) / kpis.giroTotal) * 100 : 0,
  })).sort((a, b) => b.volume - a.volume) || [];

  // Máximo Drawdown (MDD)
  const mdd = useMemo(() => {
    if (!diario?.length) return 0;
    const sorted = [...diario].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    let peak = 0;
    let maxDrawdown = 0;
    let acumulado = 0;
    
    sorted.forEach(d => {
      acumulado += d.valor_resultado || 0;
      if (acumulado > peak) peak = acumulado;
      const drawdown = peak > 0 ? ((peak - acumulado) / peak) * 100 : 0;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    return maxDrawdown;
  }, [diario]);

  // Dados para gráfico ROI Real vs Virtual
  const roiComparison = [
    { name: 'ROI Real', valor: roiReal, fill: 'hsl(142, 70%, 45%)' },
    { name: 'ROI Virtual', valor: roiVirtual, fill: 'hsl(217, 91%, 60%)' },
  ];

  // Insights Analíticos
  const insights = useMemo(() => {
    const lista = [];

    // Float elevado
    if (floatPercentual > 50) {
      lista.push({
        tipo: 'error',
        icone: '🚨',
        titulo: 'Float Elevado',
        descricao: `Seu Dinheiro na Rua (${formatCurrency(float)}) representa ${floatPercentual.toFixed(1)}% da Banca Atual.`,
        acao: `Planeje um saque de ${formatCurrency(float * 0.5)} para reduzir o risco de bloqueio.`
      });
    } else if (floatPercentual > 30) {
      lista.push({
        tipo: 'warning',
        icone: '⚠️',
        titulo: 'Float Moderado',
        descricao: `${floatPercentual.toFixed(1)}% da sua banca está nas casas.`,
        acao: 'Considere realizar alguns saques para materializar os lucros.'
      });
    }

    // Runway baixo
    if (okrsCalculados.runway < 30) {
      lista.push({
        tipo: 'error',
        icone: '⏰',
        titulo: 'Taxa de Sobrevivência Baixa',
        descricao: `Sua banca aguenta apenas ${okrsCalculados.runway} dias no pior cenário.`,
        acao: 'Reduza o valor da sua Unidade (Unit) em 10% ou faça um aporte.'
      });
    }

    // ROI Virtual muito maior que Real
    if (roiVirtual > roiReal * 2 && roiReal > 0) {
      lista.push({
        tipo: 'warning',
        icone: '💸',
        titulo: 'Lucro Preso nas Casas',
        descricao: `ROI Virtual (${roiVirtual.toFixed(1)}%) é muito maior que o ROI Real (${roiReal.toFixed(1)}%).`,
        acao: 'Realize saques para materializar seus lucros.'
      });
    }

    // Concentração de volume
    const casaConcentrada = volumeGiroPorCasa.find(c => c.percentual > 60);
    if (casaConcentrada) {
      lista.push({
        tipo: 'warning',
        icone: '🏦',
        titulo: 'Concentração de Volume',
        descricao: `${casaConcentrada.nome} concentra ${casaConcentrada.percentual.toFixed(1)}% do volume de giro.`,
        acao: 'Diversifique suas operações entre mais casas para reduzir o risco de limitação.'
      });
    }

    // MDD alto
    if (mdd > 20) {
      lista.push({
        tipo: 'error',
        icone: '📉',
        titulo: 'Máximo Drawdown Elevado',
        descricao: `MDD atingiu ${mdd.toFixed(1)}% em algum período.`,
        acao: 'Revise sua estratégia de stake e considere reduzir o risco por aposta.'
      });
    }

    // Taxa de acerto baixa
    if (apostasStats.taxaAcerto < 45 && apostasStats.totalApostas > 20) {
      lista.push({
        tipo: 'warning',
        icone: '🎯',
        titulo: 'Taxa de Acerto Baixa',
        descricao: `Sua taxa de acerto está em ${apostasStats.taxaAcerto.toFixed(1)}%.`,
        acao: 'Analise seus mercados de aposta e foque nos que têm melhor desempenho.'
      });
    }

    // Poucos dias de operação
    if (kpis.diasPositivos + kpis.diasNegativos < 7) {
      lista.push({
        tipo: 'info',
        icone: '📊',
        titulo: 'Poucos Dados',
        descricao: 'Você tem poucos dias de operação registrados.',
        acao: 'Continue registrando suas operações para obter insights mais precisos.'
      });
    }

    // Custo operacional alto
    if (custoOperacional > kpis.lucroLiquidoTotal * 0.2 && custoOperacional > 0) {
      lista.push({
        tipo: 'warning',
        icone: '💰',
        titulo: 'Custos Operacionais Elevados',
        descricao: `Seus custos representam ${((custoOperacional / kpis.lucroLiquidoTotal) * 100).toFixed(0)}% do lucro.`,
        acao: 'Revise suas despesas e busque formas de otimizar os custos.'
      });
    }

    // Dicas positivas
    if (kpis.lucroLiquidoTotal > 0 && roiVirtual > 5) {
      lista.push({
        tipo: 'success',
        icone: '✅',
        titulo: 'Bom Desempenho',
        descricao: `ROI de ${roiVirtual.toFixed(1)}% está acima da média do mercado.`,
        acao: 'Continue com sua estratégia atual e considere aumentar gradualmente o stake.'
      });
    }

    if (kpis.diasPositivos > kpis.diasNegativos * 2) {
      lista.push({
        tipo: 'success',
        icone: '🔥',
        titulo: 'Consistência Excelente',
        descricao: `${kpis.diasPositivos} dias positivos vs ${kpis.diasNegativos} negativos.`,
        acao: 'Sua consistência está ótima! Mantenha a disciplina.'
      });
    }

    return lista;
  }, [float, floatPercentual, okrsCalculados.runway, roiVirtual, roiReal, volumeGiroPorCasa, mdd, apostasStats, kpis, custoOperacional]);

  const handleOpenDialog = (okr?: any) => {
    if (okr) {
      setEditingOKR(okr);
      setFormData({
        tipo: okr.tipo,
        objetivo: okr.objetivo,
        key_result: okr.key_result,
        meta_valor: okr.meta_valor?.toString() || "",
        valor_atual: okr.valor_atual?.toString() || "",
        data_fim: okr.data_fim || "",
      });
    } else {
      setEditingOKR(null);
      setFormData({ tipo: "financeiro", objetivo: "", key_result: "", meta_valor: "", valor_atual: "", data_fim: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        tipo: formData.tipo,
        objetivo: formData.objetivo,
        key_result: formData.key_result,
        meta_valor: formData.meta_valor ? parseFloat(formData.meta_valor) : null,
        valor_atual: formData.valor_atual ? parseFloat(formData.valor_atual) : 0,
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
      setEditingOKR(null);
      setFormData({ tipo: "financeiro", objetivo: "", key_result: "", meta_valor: "", valor_atual: "", data_fim: "" });
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este OKR?")) {
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

  return (
    <AppLayout title="Gestão Estratégica" subtitle="OKRs, KPIs avançados de risco e insights analíticos">
      <div className="space-y-6">
        {/* Insights e Dicas */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            Insights e Recomendações
          </h3>
          {insights.length === 0 ? (
            <Card className="border-l-4 border-l-muted">
              <CardContent className="p-4">
                <p className="text-muted-foreground">Sem insights disponíveis no momento. Continue operando para receber recomendações.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {insights.map((insight, index) => (
                <Card 
                  key={index} 
                  className={`border-l-4 ${
                    insight.tipo === 'error' ? 'border-l-destructive bg-destructive/5' : 
                    insight.tipo === 'warning' ? 'border-l-warning bg-warning/5' :
                    insight.tipo === 'success' ? 'border-l-success bg-success/5' :
                    'border-l-primary bg-primary/5'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{insight.icone}</span>
                      <div className="space-y-1 flex-1">
                        <p className="font-semibold">{insight.titulo}</p>
                        <p className="text-sm text-muted-foreground">{insight.descricao}</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          {insight.acao}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* KPIs de Risco */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Float (Na Rua)</CardTitle>
              <DollarSign className={`h-4 w-4 ${floatPercentual > 50 ? 'text-destructive' : 'text-success'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(float)}</div>
              <p className={`text-xs ${floatPercentual > 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {floatPercentual.toFixed(1)}% da banca
              </p>
              <Progress value={Math.min(floatPercentual, 100)} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Operacional</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(custoOperacional)}</div>
              <p className="text-xs text-muted-foreground">Total de despesas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Sobrevivência</CardTitle>
              <Clock className={`h-4 w-4 ${okrsCalculados.runway < 30 ? 'text-destructive' : 'text-success'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{okrsCalculados.runway} dias</div>
              <p className={`text-xs ${okrsCalculados.runway < 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                Runway no pior cenário
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Máximo Drawdown</CardTitle>
              <TrendingDown className={`h-4 w-4 ${mdd > 20 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${mdd > 20 ? 'text-destructive' : ''}`}>
                {mdd.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Maior perda percentual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Realizado</CardTitle>
              <Activity className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(lucroReal)}</div>
              <p className="text-xs text-muted-foreground">Já sacado para conta</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 ROI Real vs ROI Virtual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roiComparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tickFormatter={(v) => `${v.toFixed(1)}%`} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(2)}%`}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="valor" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ background: 'hsl(142, 70%, 45%)' }} />
                  <span>ROI Real: {formatPercent(roiReal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ background: 'hsl(217, 91%, 60%)' }} />
                  <span>ROI Virtual: {formatPercent(roiVirtual)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🏦 Volume de Giro por Casa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeGiroPorCasa.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="nome" width={80} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="volume" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} name="Volume" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* OKRs com Tabs para Manual e Automático */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              OKRs (Objetivos e Resultados-Chave)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="automaticos" className="space-y-4">
              <TabsList>
                <TabsTrigger value="automaticos" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Automáticos
                </TabsTrigger>
                <TabsTrigger value="manuais" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Manuais ({okrs?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="automaticos">
                <OKRsManager />
              </TabsContent>

              <TabsContent value="manuais">
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => handleOpenDialog()}>
                          <Plus className="mr-2 h-4 w-4" /> Novo OKR Manual
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingOKR ? "Editar OKR" : "Novo OKR"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="tipo">Tipo</Label>
                            <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover">
                                <SelectItem value="financeiro">💰 Financeiro</SelectItem>
                                <SelectItem value="risco">🛡️ Risco</SelectItem>
                                <SelectItem value="performance">📈 Performance</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="objetivo">Objetivo</Label>
                            <Input
                              id="objetivo"
                              value={formData.objetivo}
                              onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                              placeholder="Ex: Aumentar banca para R$ 10k"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="key_result">Key Result (Resultado-Chave)</Label>
                            <Input
                              id="key_result"
                              value={formData.key_result}
                              onChange={(e) => setFormData({ ...formData, key_result: e.target.value })}
                              placeholder="Ex: Lucro de R$ 2.000 no mês"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="meta_valor">Meta (Valor)</Label>
                              <Input
                                id="meta_valor"
                                type="number"
                                value={formData.meta_valor}
                                onChange={(e) => setFormData({ ...formData, meta_valor: e.target.value })}
                                placeholder="2000"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="valor_atual">Valor Atual</Label>
                              <Input
                                id="valor_atual"
                                type="number"
                                value={formData.valor_atual}
                                onChange={(e) => setFormData({ ...formData, valor_atual: e.target.value })}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="data_fim">Data Limite</Label>
                            <Input
                              id="data_fim"
                              type="date"
                              value={formData.data_fim}
                              onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            {editingOKR ? "Atualizar OKR" : "Criar OKR"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {okrs?.filter(o => !o.key_result.startsWith("AUTO:")).map((okr) => (
                      <Card key={okr.id}>
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={okr.tipo === 'financeiro' ? 'default' : okr.tipo === 'risco' ? 'destructive' : 'secondary'}>
                                  {okr.tipo}
                                </Badge>
                                <Badge variant="outline">{okr.status}</Badge>
                              </div>
                              <h4 className="font-bold">{okr.objetivo}</h4>
                              <p className="text-sm text-muted-foreground">{okr.key_result}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(okr)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(okr.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progresso</span>
                              <span>{Math.round((okr.valor_atual / (okr.meta_valor || 1)) * 100)}%</span>
                            </div>
                            <Progress value={(okr.valor_atual / (okr.meta_valor || 1)) * 100} />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Atual: {okr.valor_atual}</span>
                              <span>Meta: {okr.meta_valor}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleStatusChange(okr, 'concluido')}
                            >
                              Concluir
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleStatusChange(okr, 'cancelado')}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
