import { useState, useMemo } from "react";
import { 
  useFechamentos, 
  useFechamentoMutations, 
  useApostas, 
  useApostasSurebet, 
  useSaquesAportes,
  useCaixaGeral,
  useCasas
} from "@/hooks/useSupabaseData";
import { useCassino } from "@/hooks/useCassino";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { 
  Plus, Download, TrendingUp, Target, Percent, DollarSign, 
  Calendar, Save, RefreshCw, CheckCircle2, AlertTriangle, Pencil, Trash2, Building2, Landmark
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/components/dashboard/StatCard";
import { toast } from "@/hooks/use-toast";
import type { Fechamento } from "@/types/database";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ReconciliacaoVisual } from "@/components/fechamento/ReconciliacaoVisual";
import { TabelaDadosPeriodo } from "@/components/fechamento/TabelaDadosPeriodo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PeriodoTipo = "semanal" | "mensal" | "anual";

export default function FechamentoPage() {
  const { data: fechamentos, isLoading } = useFechamentos();
  const { data: apostas } = useApostas();
  const { data: surebets } = useApostasSurebet();
  const { data: cassino } = useCassino();
  const { data: saquesAportes } = useSaquesAportes();
  const { data: caixaGeral } = useCaixaGeral();
  const { data: casas } = useCasas();
  const { create, update, remove } = useFechamentoMutations();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Fechamento | null>(null);
  const [periodoTipo, setPeriodoTipo] = useState<PeriodoTipo>("mensal");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [saldoRealInput, setSaldoRealInput] = useState<string>("");
  const [saldoBancoInput, setSaldoBancoInput] = useState<string>("");
  const [saldoCasasInput, setSaldoCasasInput] = useState<string>("");
  const [metaLucroInput, setMetaLucroInput] = useState<string>("");
  const [obsInput, setObsInput] = useState<string>("");

  // Calcular totais das casas (saldo atual)
  const totalSaldoCasas = useMemo(() => {
    return casas?.reduce((acc, casa) => acc + (casa.saldo_real || 0), 0) || 0;
  }, [casas]);

  // Período atual baseado no tipo selecionado
  const periodo = useMemo(() => {
    let inicio: Date, fim: Date;
    
    switch (periodoTipo) {
      case "semanal":
        inicio = startOfWeek(selectedDate, { weekStartsOn: 0 });
        fim = endOfWeek(selectedDate, { weekStartsOn: 0 });
        break;
      case "anual":
        inicio = startOfYear(selectedDate);
        fim = endOfYear(selectedDate);
        break;
      default:
        inicio = startOfMonth(selectedDate);
        fim = endOfMonth(selectedDate);
    }

    return {
      inicio: format(inicio, "yyyy-MM-dd"),
      fim: format(fim, "yyyy-MM-dd"),
      label: periodoTipo === "anual" 
        ? format(selectedDate, "yyyy")
        : format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR }),
    };
  }, [periodoTipo, selectedDate]);

  // Buscar fechamento existente para o período
  const fechamentoExistente = useMemo(() => {
    return fechamentos?.find(f => 
      f.data_inicio === periodo.inicio && f.data_fim === periodo.fim
    ) || null;
  }, [fechamentos, periodo]);

  // Calcular todos os dados automaticamente do banco
  const dadosAutomaticos = useMemo(() => {
    // Filtrar por período
    const apostasFiltradas = apostas?.filter(a => a.data >= periodo.inicio && a.data <= periodo.fim) || [];
    const surebetsFiltradas = surebets?.filter(s => s.data >= periodo.inicio && s.data <= periodo.fim) || [];
    const cassinoFiltrado = cassino?.filter(c => c.data >= periodo.inicio && c.data <= periodo.fim) || [];
    const movimentacoesFiltradas = saquesAportes?.filter(s => s.data >= periodo.inicio && s.data <= periodo.fim) || [];
    const caixaFiltrada = caixaGeral?.filter(c => c.data >= periodo.inicio && c.data <= periodo.fim) || [];

    // Lucros por fonte
    const lucroApostas = apostasFiltradas.reduce((acc, a) => acc + (a.lucro_prejuizo || 0), 0);
    const lucroSurebets = surebetsFiltradas.reduce((acc, a) => acc + (a.lucro_prejuizo || 0), 0);
    const lucroCassino = cassinoFiltrado.reduce((acc, c) => acc + (c.valor_resultado || 0), 0);
    const lucroJogos = lucroApostas + lucroSurebets + lucroCassino;

    // Movimentações nas casas
    const depositosCasas = movimentacoesFiltradas
      .filter(s => s.tipo === "deposito")
      .reduce((acc, s) => acc + s.valor, 0);
    const saquesCasas = movimentacoesFiltradas
      .filter(s => s.tipo === "saque")
      .reduce((acc, s) => acc + s.valor, 0);

    // Caixa Geral (aportes externos, saques pessoais, custos)
    const aportesExternos = caixaFiltrada
      .filter(c => c.tipo === "aporte")
      .reduce((acc, c) => acc + c.valor, 0);
    const saquesPessoais = caixaFiltrada
      .filter(c => c.tipo === "saque")
      .reduce((acc, c) => acc + c.valor, 0);
    const custos = caixaFiltrada
      .filter(c => c.tipo === "custo")
      .reduce((acc, c) => acc + c.valor, 0);

    // Estatísticas de apostas
    const totalApostas = apostasFiltradas.length + surebetsFiltradas.length;
    const greens = apostasFiltradas.filter(a => a.resultado === "green").length;
    const finalizadas = apostasFiltradas.filter(a => a.resultado === "green" || a.resultado === "red").length;
    const taxaAcerto = finalizadas > 0 ? (greens / finalizadas) * 100 : 0;
    const totalStake = apostasFiltradas.reduce((acc, a) => acc + a.stake, 0);
    const yield_ = totalStake > 0 ? (lucroApostas / totalStake) * 100 : 0;

    // Análise diária baseada em apostas agrupadas por data
    const lucrosPorDia = new Map<string, number>();
    apostasFiltradas.forEach(a => {
      const atual = lucrosPorDia.get(a.data) || 0;
      lucrosPorDia.set(a.data, atual + (a.lucro_prejuizo || 0));
    });
    cassinoFiltrado.forEach(c => {
      const atual = lucrosPorDia.get(c.data) || 0;
      lucrosPorDia.set(c.data, atual + (c.valor_resultado || 0));
    });

    const valoresDiarios = Array.from(lucrosPorDia.values());
    const diasPositivos = valoresDiarios.filter(v => v > 0).length;
    const diasNegativos = valoresDiarios.filter(v => v < 0).length;
    const melhorDia = valoresDiarios.length > 0 ? Math.max(...valoresDiarios) : 0;
    const piorDia = valoresDiarios.length > 0 ? Math.min(...valoresDiarios) : 0;

    // Saldo inicial = último fechamento do período anterior OU 0
    // Na prática, buscar do fechamento anterior ou pegar soma de aportes históricos
    const saldoInicial = fechamentoExistente?.saldo_inicial || 0;

    // Saldo Teórico = Inicial + Aportes + Lucros - Saques - Custos
    const saldoTeorico = saldoInicial + aportesExternos + lucroJogos - saquesPessoais - custos;

    return {
      lucroApostas,
      lucroSurebets,
      lucroCassino,
      lucroJogos,
      depositosCasas,
      saquesCasas,
      aportesExternos,
      saquesPessoais,
      custos,
      totalApostas,
      taxaAcerto,
      yield_,
      diasPositivos,
      diasNegativos,
      melhorDia,
      piorDia,
      saldoInicial,
      saldoTeorico,
      ticketMedio: totalApostas > 0 ? totalStake / apostasFiltradas.length : 0,
    };
  }, [apostas, surebets, cassino, saquesAportes, caixaGeral, periodo, fechamentoExistente]);

  // Saldo real e divergência
  const saldoReal = fechamentoExistente?.saldo_real ?? (saldoRealInput ? parseFloat(saldoRealInput) : null);
  const divergencia = saldoReal !== null ? saldoReal - dadosAutomaticos.saldoTeorico : 0;

  // Dados para reconciliação visual
  const reconciliacaoData = useMemo(() => ({
    saldoInicial: dadosAutomaticos.saldoInicial,
    aportesExternos: dadosAutomaticos.aportesExternos,
    lucroJogos: dadosAutomaticos.lucroJogos,
    saquesPessoais: dadosAutomaticos.saquesPessoais,
    custos: dadosAutomaticos.custos,
    saldoTeorico: dadosAutomaticos.saldoTeorico,
    saldoReal,
    divergencia,
    lucroApostas: dadosAutomaticos.lucroApostas,
    lucroSurebets: dadosAutomaticos.lucroSurebets,
    lucroCassino: dadosAutomaticos.lucroCassino,
    depositosCasas: dadosAutomaticos.depositosCasas,
    saquesCasas: dadosAutomaticos.saquesCasas,
  }), [dadosAutomaticos, saldoReal, divergencia]);

  const navegarPeriodo = (direcao: number) => {
    const novaData = new Date(selectedDate);
    switch (periodoTipo) {
      case "semanal":
        novaData.setDate(novaData.getDate() + (direcao * 7));
        break;
      case "anual":
        novaData.setFullYear(novaData.getFullYear() + direcao);
        break;
      default:
        novaData.setMonth(novaData.getMonth() + direcao);
    }
    setSelectedDate(novaData);
    setSaldoRealInput("");
    setSaldoBancoInput("");
    setSaldoCasasInput("");
    setMetaLucroInput("");
    setObsInput("");
  };

  // Update saldoRealInput when banco or casas inputs change
  useMemo(() => {
    const banco = parseFloat(saldoBancoInput) || 0;
    const casas = parseFloat(saldoCasasInput) || 0;
    if (saldoBancoInput || saldoCasasInput) {
      setSaldoRealInput((banco + casas).toString());
    }
  }, [saldoBancoInput, saldoCasasInput]);

  const handleDeleteFechamento = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast({ title: "Fechamento excluído!" });
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleEditFechamento = (fechamento: Fechamento) => {
    const [year, month] = fechamento.data_inicio.split("-");
    setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, 1));
    setSaldoRealInput(fechamento.saldo_real?.toString() || "");
    setMetaLucroInput(fechamento.meta_lucro?.toString() || "");
    setObsInput(fechamento.obs || "");
  };

  const handleSalvarFechamento = async () => {
    try {
      const data = {
        data_inicio: periodo.inicio,
        data_fim: periodo.fim,
        saldo_inicial: dadosAutomaticos.saldoInicial,
        aportes_externos: dadosAutomaticos.aportesExternos,
        resumo_jogos: dadosAutomaticos.lucroJogos,
        saques_pessoais: dadosAutomaticos.saquesPessoais,
        custos: dadosAutomaticos.custos,
        saldo_real: saldoRealInput ? parseFloat(saldoRealInput) : null,
        meta_lucro: metaLucroInput ? parseFloat(metaLucroInput) : null,
        lucro_liquido: dadosAutomaticos.lucroJogos - dadosAutomaticos.custos,
        roi_periodo: dadosAutomaticos.yield_,
        total_apostas: dadosAutomaticos.totalApostas,
        taxa_acerto: dadosAutomaticos.taxaAcerto,
        ticket_medio: dadosAutomaticos.ticketMedio,
        dias_positivos: dadosAutomaticos.diasPositivos,
        dias_negativos: dadosAutomaticos.diasNegativos,
        melhor_dia: dadosAutomaticos.melhorDia,
        pior_dia: dadosAutomaticos.piorDia,
        obs: obsInput || null,
      };

      if (fechamentoExistente) {
        await update.mutateAsync({ id: fechamentoExistente.id, ...data });
        toast({ title: "Fechamento atualizado!" });
      } else {
        await create.mutateAsync(data);
        toast({ title: "Fechamento salvo!" });
      }
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleExportReport = () => {
    const report = `
RELATÓRIO DE FECHAMENTO - ${periodo.label.toUpperCase()}
================================================================
Período: ${periodo.inicio} a ${periodo.fim}

RESUMO GERAL
- Lucro Total dos Jogos: ${formatCurrency(dadosAutomaticos.lucroJogos)}
- Yield: ${formatPercent(dadosAutomaticos.yield_)}
- Taxa de Acerto: ${formatPercent(dadosAutomaticos.taxaAcerto)}
- Dias Positivos: ${dadosAutomaticos.diasPositivos} | Negativos: ${dadosAutomaticos.diasNegativos}

DETALHAMENTO DOS JOGOS
- Apostas Esportivas: ${formatCurrency(dadosAutomaticos.lucroApostas)}
- Surebets: ${formatCurrency(dadosAutomaticos.lucroSurebets)}
- Cassino: ${formatCurrency(dadosAutomaticos.lucroCassino)}

FLUXO FINANCEIRO
- Aportes Externos: ${formatCurrency(dadosAutomaticos.aportesExternos)}
- Saques Pessoais: ${formatCurrency(dadosAutomaticos.saquesPessoais)}
- Custos Operacionais: ${formatCurrency(dadosAutomaticos.custos)}

RECONCILIAÇÃO
- Saldo Inicial: ${formatCurrency(dadosAutomaticos.saldoInicial)}
- Saldo Teórico: ${formatCurrency(dadosAutomaticos.saldoTeorico)}
- Saldo Real: ${saldoReal !== null ? formatCurrency(saldoReal) : "Não informado"}
- Divergência: ${saldoReal !== null ? formatCurrency(divergencia) : "N/A"}

MOVIMENTAÇÃO NAS CASAS
- Depósitos: ${formatCurrency(dadosAutomaticos.depositosCasas)}
- Saques: ${formatCurrency(dadosAutomaticos.saquesCasas)}
- Float: ${formatCurrency(dadosAutomaticos.depositosCasas - dadosAutomaticos.saquesCasas)}
    `;
    
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fechamento_${periodo.inicio}_${periodo.fim}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Relatório exportado!" });
  };

  // Carregar dados do fechamento existente quando mudar período
  useMemo(() => {
    if (fechamentoExistente) {
      setSaldoRealInput(fechamentoExistente.saldo_real?.toString() || "");
      setMetaLucroInput(fechamentoExistente.meta_lucro?.toString() || "");
      setObsInput(fechamentoExistente.obs || "");
    }
  }, [fechamentoExistente]);

  return (
    <AppLayout title="Fechamento" subtitle="Fechamento automático com reconciliação">
      <div className="space-y-6">
        {/* Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Período</Label>
              <Select value={periodoTipo} onValueChange={(v) => setPeriodoTipo(v as PeriodoTipo)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mês/Ano</Label>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => navegarPeriodo(-1)}>
                  {"<"}
                </Button>
                <Input
                  type="month"
                  value={format(selectedDate, "yyyy-MM")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value + "-01"))}
                  className="w-[160px]"
                />
                <Button variant="ghost" size="icon" onClick={() => navegarPeriodo(1)}>
                  {">"}
                </Button>
              </div>
            </div>
            {fechamentoExistente && (
              <Badge variant="secondary" className="ml-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Fechamento salvo
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Tabs: Resumo / Reconciliação */}
        <Tabs defaultValue="resumo" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="resumo">📊 Resumo do Período</TabsTrigger>
            <TabsTrigger value="reconciliacao">⚖️ Reconciliação</TabsTrigger>
          </TabsList>

          {/* Tab Resumo */}
          <TabsContent value="resumo" className="space-y-6">
            {/* Cards KPIs Principais */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro dos Jogos</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${dadosAutomaticos.lucroJogos >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(dadosAutomaticos.lucroJogos)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Apostas + Surebets + Cassino
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-success/10 to-success/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Yield</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${dadosAutomaticos.yield_ >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercent(dadosAutomaticos.yield_)}
                  </div>
                  <p className="text-xs text-muted-foreground">Retorno sobre stake</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa Acerto</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${dadosAutomaticos.taxaAcerto >= 50 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercent(dadosAutomaticos.taxaAcerto)}
                  </div>
                  <p className="text-xs text-muted-foreground">Apostas ganhas</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dias Positivos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{dadosAutomaticos.diasPositivos}</div>
                  <p className="text-xs text-muted-foreground">Negativos: {dadosAutomaticos.diasNegativos}</p>
                </CardContent>
              </Card>
            </div>

            {/* Cards Detalhados */}
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Apostas Esportivas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    📈 Apostas Esportivas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lucro</span>
                    <span className={`font-medium ${dadosAutomaticos.lucroApostas >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(dadosAutomaticos.lucroApostas)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa Acerto</span>
                    <span className="font-medium">{formatPercent(dadosAutomaticos.taxaAcerto)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Melhor Dia</span>
                    <span className="font-medium text-success">{formatCurrency(dadosAutomaticos.melhorDia)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pior Dia</span>
                    <span className="font-medium text-destructive">{formatCurrency(dadosAutomaticos.piorDia)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Surebets */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    🔄 Surebets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lucro</span>
                    <span className={`font-medium ${dadosAutomaticos.lucroSurebets >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(dadosAutomaticos.lucroSurebets)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Cassino */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    🎰 Cassino
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lucro/Prejuízo</span>
                    <span className={`font-medium ${dadosAutomaticos.lucroCassino >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(dadosAutomaticos.lucroCassino)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fluxo Financeiro */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">💰 Fluxo Financeiro (Caixa Geral)</CardTitle>
                <CardDescription>Dados puxados automaticamente de Caixa Geral</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Aportes Externos</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(dadosAutomaticos.aportesExternos)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saques Pessoais</p>
                    <p className="text-xl font-bold text-destructive">{formatCurrency(dadosAutomaticos.saquesPessoais)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Custos</p>
                    <p className="text-xl font-bold text-destructive">{formatCurrency(dadosAutomaticos.custos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Reconciliação */}
          <TabsContent value="reconciliacao" className="space-y-6">
            <ReconciliacaoVisual data={reconciliacaoData} periodoLabel={periodo.label} />
          </TabsContent>
        </Tabs>

        {/* Seção de Conferência Manual */}
        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              ✍️ Conferência Manual
            </CardTitle>
            <CardDescription>
              Informe o saldo real conferido para identificar divergências
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Saldo Inicial do Período (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={dadosAutomaticos.saldoInicial || ""}
                  onChange={() => {}}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Do fechamento anterior</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Landmark className="h-3.5 w-3.5" />
                  Saldo no Banco (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Saldo em conta bancária"
                  value={saldoBancoInput}
                  onChange={(e) => setSaldoBancoInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Conta corrente, poupança, etc.</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  Saldo nas Casas (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Soma das casas"
                  value={saldoCasasInput}
                  onChange={(e) => setSaldoCasasInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Atual sistema: {formatCurrency(totalSaldoCasas)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Saldo Real Total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Calculado automaticamente"
                  value={saldoRealInput}
                  onChange={(e) => setSaldoRealInput(e.target.value)}
                  className="bg-primary/5 font-semibold"
                />
                <p className="text-xs text-muted-foreground">Banco + Casas</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Meta de Lucro (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Opcional"
                  value={metaLucroInput}
                  onChange={(e) => setMetaLucroInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Notas sobre o período..."
                  value={obsInput}
                  onChange={(e) => setObsInput(e.target.value)}
                  className="min-h-[40px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={handleSalvarFechamento}>
                <Save className="mr-2 h-4 w-4" />
                {fechamentoExistente ? "Atualizar Fechamento" : "Salvar Fechamento"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Dados do Período */}
        <TabelaDadosPeriodo
          apostas={apostas || []}
          surebets={surebets || []}
          cassino={cassino || []}
          saquesAportes={saquesAportes || []}
          caixaGeral={caixaGeral || []}
          periodoInicio={periodo.inicio}
          periodoFim={periodo.fim}
        />

        {/* Histórico de Fechamentos */}
        {fechamentos && fechamentos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📅 Histórico de Fechamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {fechamentos.slice(0, 10).map((f) => (
                  <div 
                    key={f.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted group"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => handleEditFechamento(f)}
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(new Date(f.data_inicio), "dd/MM/yyyy")} - {format(new Date(f.data_fim), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${f.resumo_jogos >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(f.resumo_jogos)}
                      </span>
                      {f.divergencia !== null && Math.abs(f.divergencia) > 0 && (
                        <Badge variant={Math.abs(f.divergencia) < 100 ? "secondary" : "destructive"}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {formatCurrency(f.divergencia)}
                        </Badge>
                      )}
                      
                      {/* Botões de Ação */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditFechamento(f);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir fechamento?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O fechamento do período{" "}
                                {format(new Date(f.data_inicio), "dd/MM/yyyy")} - {format(new Date(f.data_fim), "dd/MM/yyyy")}{" "}
                                será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteFechamento(f.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
