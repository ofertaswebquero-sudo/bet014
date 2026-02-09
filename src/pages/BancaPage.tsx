import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCasas, useSaquesAportes, useCaixaGeral, useDiarioOperacoes, useApostas, useApostasSurebet } from "@/hooks/useSupabaseData";
import { formatCurrency, formatPercent } from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, Building2, ArrowUpRight, ArrowDownRight, Activity, Banknote, Calculator } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { DateRangeFilter, useDateRangeFilter } from "@/components/filters/DateRangeFilter";

export default function BancaPage() {
  const { data: casas } = useCasas();
  const { data: saquesAportes } = useSaquesAportes();
  const { data: caixaGeral } = useCaixaGeral();
  const { data: diario } = useDiarioOperacoes();
  const { data: apostas } = useApostas();
  const { data: surebets } = useApostasSurebet();

  // Filtros
  const { startDate, endDate, setStartDate, setEndDate, filterByDate, clearFilter } = useDateRangeFilter();

  // Dados filtrados
  const caixaFiltrado = useMemo(() => filterByDate(caixaGeral || []), [caixaGeral, startDate, endDate, filterByDate]);
  const diarioFiltrado = useMemo(() => filterByDate(diario || []), [diario, startDate, endDate, filterByDate]);
  const saquesAportesFiltrados = useMemo(() => filterByDate(saquesAportes || []), [saquesAportes, startDate, endDate, filterByDate]);

  // Cálculos da Banca
  const bancaStats = useMemo(() => {
    const capitalInjetado = caixaFiltrado?.filter(c => c.tipo === 'aporte').reduce((acc, c) => acc + c.valor, 0) || 0;
    const capitalRetirado = caixaFiltrado?.filter(c => c.tipo === 'saque').reduce((acc, c) => acc + c.valor, 0) || 0;
    const custosTotais = caixaFiltrado?.filter(c => c.tipo === 'custo').reduce((acc, c) => acc + c.valor, 0) || 0;
    const resultadoOperacional = diarioFiltrado?.reduce((acc, d) => acc + (d.valor_resultado || 0), 0) || 0;
    const lucroLiquido = resultadoOperacional - custosTotais;
    const bancaAtual = capitalInjetado - capitalRetirado + lucroLiquido;
    
    const depositadoCasas = saquesAportesFiltrados?.filter(s => s.tipo === 'deposito').reduce((acc, s) => acc + s.valor, 0) || 0;
    const sacadoCasas = saquesAportesFiltrados?.filter(s => s.tipo === 'saque').reduce((acc, s) => acc + s.valor, 0) || 0;
    const float = depositadoCasas - sacadoCasas;
    
    const roi = capitalInjetado > 0 ? (lucroLiquido / capitalInjetado) * 100 : 0;
    const saldoRealCasas = casas?.reduce((acc, c) => acc + (c.saldo_real || 0), 0) || 0;

    return {
      capitalInjetado,
      capitalRetirado,
      custosTotais,
      resultadoOperacional,
      lucroLiquido,
      bancaAtual,
      float,
      roi,
      saldoRealCasas,
    };
  }, [caixaFiltrado, diarioFiltrado, saquesAportesFiltrados, casas]);

  // Evolução da banca
  const evolucaoBanca = useMemo(() => {
    if (!diarioFiltrado?.length) return [];
    const sorted = [...diarioFiltrado].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    let acumulado = bancaStats.capitalInjetado - bancaStats.capitalRetirado - bancaStats.lucroLiquido;
    return sorted.map(d => {
      acumulado += d.valor_resultado || 0;
      return {
        data: new Date(d.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        resultado: d.valor_resultado || 0,
        banca: acumulado,
      };
    });
  }, [diarioFiltrado, bancaStats]);

  const COLORS = ['hsl(142, 70%, 45%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(280, 70%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(180, 70%, 45%)'];

  return (
    <AppLayout title="Banca" subtitle="Visão completa do seu capital e movimentações">
      <div className="space-y-6">
        {/* 1. Filtros Primeiro */}
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={clearFilter}
          />
        </div>

        {/* 2. Cards de KPI Depois */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banca Atual</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(bancaStats.bancaAtual)}</div>
              <p className="text-xs text-muted-foreground">Capital + Lucro Líquido</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${bancaStats.lucroLiquido >= 0 ? 'from-success/10 to-success/5' : 'from-destructive/10 to-destructive/5'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${bancaStats.lucroLiquido >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(bancaStats.lucroLiquido)}
              </div>
              <p className="text-xs text-muted-foreground">ROI: {formatPercent(bancaStats.roi)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Float (Nas Casas)</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(bancaStats.float)}</div>
              <p className="text-xs text-muted-foreground">Capital em trânsito</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Real Casas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(bancaStats.saldoRealCasas)}</div>
              <p className="text-xs text-muted-foreground">Soma dos saldos reais</p>
            </CardContent>
          </Card>
        </div>

        {/* 3. Gráficos e Detalhes */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📈 Evolução da Banca</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucaoBanca}>
                  <defs>
                    <linearGradient id="colorBanca" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                  <XAxis dataKey="data" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    formatter={(v: any) => [formatCurrency(v), 'Banca']}
                  />
                  <Area type="monotone" dataKey="banca" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorBanca)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💰 Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-success" />
                  <span>Capital Injetado</span>
                </div>
                <span className="font-bold text-success">{formatCurrency(bancaStats.capitalInjetado)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-destructive" />
                  <span>Capital Retirado</span>
                </div>
                <span className="font-bold text-destructive">{formatCurrency(bancaStats.capitalRetirado)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>Resultado Operacional</span>
                </div>
                <span className={`font-bold ${bancaStats.resultadoOperacional >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(bancaStats.resultadoOperacional)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-warning" />
                  <span>Custos Totais</span>
                </div>
                <span className="font-bold text-warning">{formatCurrency(bancaStats.custosTotais)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
