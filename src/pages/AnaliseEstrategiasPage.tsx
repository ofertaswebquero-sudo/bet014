import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApostas, useApostasSurebet } from "@/hooks/useSupabaseData";
import { formatCurrency, formatPercent } from "@/components/dashboard/StatCard";
import { TrendingUp, TrendingDown, Target, Percent, Flame, Award, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell, PieChart, Pie, Legend } from 'recharts';
import { DateRangeFilter, useDateRangeFilter, SelectFilter } from "@/components/filters/DateRangeFilter";

export default function AnaliseEstrategiasPage() {
  const { data: apostas } = useApostas();
  const { data: surebets } = useApostasSurebet();
  
  // Filtros
  const { startDate, endDate, setStartDate, setEndDate, filterByDate, clearFilter } = useDateRangeFilter();
  const [tipoAposta, setTipoAposta] = useState<"normais" | "surebets">("normais");

  // Filtrar dados
  const apostasFiltradas = useMemo(() => filterByDate(apostas), [apostas, startDate, endDate, filterByDate]);
  const surebetsFiltradas = useMemo(() => filterByDate(surebets), [surebets, startDate, endDate, filterByDate]);

  // ROI por Mercado (Apostas Normais)
  const roiPorMercado = useMemo(() => {
    const mercados: Record<string, { stake: number; lucro: number; count: number }> = {};
    
    apostasFiltradas.forEach(aposta => {
      const mercado = aposta.mercado || 'Não especificado';
      if (!mercados[mercado]) {
        mercados[mercado] = { stake: 0, lucro: 0, count: 0 };
      }
      mercados[mercado].stake += aposta.stake;
      mercados[mercado].lucro += aposta.lucro_prejuizo || 0;
      mercados[mercado].count += 1;
    });

    return Object.entries(mercados).map(([mercado, data]) => ({
      mercado,
      roi: data.stake > 0 ? (data.lucro / data.stake) * 100 : 0,
      lucro: data.lucro,
      apostas: data.count,
    })).sort((a, b) => b.roi - a.roi);
  }, [apostasFiltradas]);

  // ROI por Casa (Apostas Normais)
  const roiPorCasa = useMemo(() => {
    const casas: Record<string, { stake: number; lucro: number; count: number }> = {};
    
    apostasFiltradas.forEach(aposta => {
      const casa = aposta.casa_nome || 'Não especificada';
      if (!casas[casa]) {
        casas[casa] = { stake: 0, lucro: 0, count: 0 };
      }
      casas[casa].stake += aposta.stake;
      casas[casa].lucro += aposta.lucro_prejuizo || 0;
      casas[casa].count += 1;
    });

    return Object.entries(casas).map(([casa, data]) => ({
      casa,
      roi: data.stake > 0 ? (data.lucro / data.stake) * 100 : 0,
      lucro: data.lucro,
      apostas: data.count,
    })).sort((a, b) => b.roi - a.roi);
  }, [apostasFiltradas]);

  // ROI por Casa (Surebets)
  const roiPorCasaSurebet = useMemo(() => {
    const casas: Record<string, { investido: number; lucro: number; count: number }> = {};
    
    surebetsFiltradas.forEach(surebet => {
      [surebet.casa1_nome, surebet.casa2_nome, surebet.casa3_nome].filter(Boolean).forEach(casa => {
        if (!casas[casa!]) {
          casas[casa!] = { investido: 0, lucro: 0, count: 0 };
        }
        casas[casa!].investido += surebet.investimento_total / (surebet.casa3_nome ? 3 : 2);
        casas[casa!].lucro += (surebet.lucro_prejuizo || 0) / (surebet.casa3_nome ? 3 : 2);
        casas[casa!].count += 1;
      });
    });

    return Object.entries(casas).map(([casa, data]) => ({
      casa,
      roi: data.investido > 0 ? (data.lucro / data.investido) * 100 : 0,
      lucro: data.lucro,
      surebets: data.count,
    })).sort((a, b) => b.roi - a.roi);
  }, [surebetsFiltradas]);

  // Taxa de Acerto por Faixa de Odd (Apostas Normais)
  const hitRatePorOdd = useMemo(() => {
    const faixas = [
      { min: 1.0, max: 1.5, label: '1.00-1.50' },
      { min: 1.5, max: 1.8, label: '1.51-1.80' },
      { min: 1.8, max: 2.2, label: '1.81-2.20' },
      { min: 2.2, max: 3.0, label: '2.21-3.00' },
      { min: 3.0, max: 99, label: '3.00+' },
    ];

    return faixas.map(faixa => {
      const apostasNaFaixa = apostasFiltradas.filter(a => 
        a.odd && a.odd >= faixa.min && a.odd < faixa.max && a.resultado
      );
      const greens = apostasNaFaixa.filter(a => a.resultado === 'green').length;
      const total = apostasNaFaixa.length;
      const taxaAcerto = total > 0 ? (greens / total) * 100 : 0;
      const lucro = apostasNaFaixa.reduce((acc, a) => acc + (a.lucro_prejuizo || 0), 0);

      return {
        faixa: faixa.label,
        taxaAcerto,
        total,
        greens,
        lucro,
      };
    });
  }, [apostasFiltradas]);

  // % Surebet por faixa (Surebets)
  const surebetPorFaixa = useMemo(() => {
    const faixas = [
      { min: 0, max: 1, label: '0-1%' },
      { min: 1, max: 2, label: '1-2%' },
      { min: 2, max: 3, label: '2-3%' },
      { min: 3, max: 5, label: '3-5%' },
      { min: 5, max: 100, label: '5%+' },
    ];

    return faixas.map(faixa => {
      const sbNaFaixa = surebetsFiltradas.filter(s => 
        s.percentual_surebet && s.percentual_surebet >= faixa.min && s.percentual_surebet < faixa.max
      );
      const lucro = sbNaFaixa.reduce((acc, s) => acc + (s.lucro_prejuizo || 0), 0);
      const investido = sbNaFaixa.reduce((acc, s) => acc + s.investimento_total, 0);

      return {
        faixa: faixa.label,
        total: sbNaFaixa.length,
        lucro,
        investido,
        roiMedio: investido > 0 ? (lucro / investido) * 100 : 0,
      };
    });
  }, [surebetsFiltradas]);

  // Dispersão Odds vs ROI
  const dispersaoOddsRoi = useMemo(() => {
    return apostasFiltradas.filter(a => a.odd && a.lucro_prejuizo !== null).map(a => ({
      odd: a.odd,
      roi: a.stake > 0 ? (a.lucro_prejuizo! / a.stake) * 100 : 0,
      green: a.resultado === 'green',
    }));
  }, [apostasFiltradas]);

  // Green/Red Streak (Apostas Normais)
  const streaksNormais = useMemo(() => {
    const resultados = apostasFiltradas.filter(a => a.resultado === 'green' || a.resultado === 'red')
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    let maxGreenStreak = 0, maxRedStreak = 0;
    let currentGreenStreak = 0, currentRedStreak = 0;

    resultados.forEach(a => {
      if (a.resultado === 'green') {
        currentGreenStreak++;
        currentRedStreak = 0;
        maxGreenStreak = Math.max(maxGreenStreak, currentGreenStreak);
      } else {
        currentRedStreak++;
        currentGreenStreak = 0;
        maxRedStreak = Math.max(maxRedStreak, currentRedStreak);
      }
    });

    return { maxGreenStreak, maxRedStreak, currentGreenStreak, currentRedStreak };
  }, [apostasFiltradas]);

  // Estatísticas gerais (Apostas Normais)
  const statsNormais = useMemo(() => {
    const totalApostas = apostasFiltradas.length;
    const greens = apostasFiltradas.filter(a => a.resultado === 'green').length;
    const reds = apostasFiltradas.filter(a => a.resultado === 'red').length;
    const taxaAcerto = (greens + reds) > 0 ? (greens / (greens + reds)) * 100 : 0;
    const lucroTotal = apostasFiltradas.reduce((acc, a) => acc + (a.lucro_prejuizo || 0), 0);
    const stakeTotal = apostasFiltradas.reduce((acc, a) => acc + a.stake, 0);
    const roiGeral = stakeTotal > 0 ? (lucroTotal / stakeTotal) * 100 : 0;
    const ticketMedio = totalApostas > 0 ? stakeTotal / totalApostas : 0;
    const oddMedia = apostasFiltradas.filter(a => a.odd).reduce((acc, a, _, arr) => acc + (a.odd! / arr.length), 0) || 0;

    return { totalApostas, greens, reds, taxaAcerto, lucroTotal, roiGeral, ticketMedio, oddMedia };
  }, [apostasFiltradas]);

  // Estatísticas gerais (Surebets)
  const statsSurebets = useMemo(() => {
    const totalSurebets = surebetsFiltradas.length;
    const lucroTotal = surebetsFiltradas.reduce((acc, s) => acc + (s.lucro_prejuizo || 0), 0);
    const investidoTotal = surebetsFiltradas.reduce((acc, s) => acc + s.investimento_total, 0);
    const roiGeral = investidoTotal > 0 ? (lucroTotal / investidoTotal) * 100 : 0;
    const ticketMedio = totalSurebets > 0 ? investidoTotal / totalSurebets : 0;
    const percentualMedio = surebetsFiltradas.filter(s => s.percentual_surebet).reduce((acc, s, _, arr) => 
      acc + (s.percentual_surebet! / arr.length), 0) || 0;
    const positivas = surebetsFiltradas.filter(s => (s.lucro_prejuizo || 0) > 0).length;
    const negativas = surebetsFiltradas.filter(s => (s.lucro_prejuizo || 0) < 0).length;

    return { totalSurebets, lucroTotal, investidoTotal, roiGeral, ticketMedio, percentualMedio, positivas, negativas };
  }, [surebetsFiltradas]);

  const COLORS = ['hsl(142, 70%, 45%)', 'hsl(0, 84%, 60%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(280, 70%, 50%)'];

  return (
    <AppLayout title="Análise de Estratégias" subtitle="Performance por mercado, odds e casas">
      <div className="space-y-6">
        {/* Filtros e Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClear={clearFilter}
            />
          </div>
          <Tabs value={tipoAposta} onValueChange={(v) => setTipoAposta(v as "normais" | "surebets")}>
            <TabsList>
              <TabsTrigger value="normais">Apostas Normais</TabsTrigger>
              <TabsTrigger value="surebets">Surebets</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Cards de Resumo - Apostas Normais */}
        {tipoAposta === "normais" && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsNormais.taxaAcerto.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {statsNormais.greens} greens / {statsNormais.greens + statsNormais.reds} finalizadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ROI Geral</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${statsNormais.roiGeral >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercent(statsNormais.roiGeral)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lucro: {formatCurrency(statsNormais.lucroTotal)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(statsNormais.ticketMedio)}</div>
                  <p className="text-xs text-muted-foreground">
                    Odd média: {statsNormais.oddMedia.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Melhor Sequência</CardTitle>
                  <Flame className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{streaksNormais.maxGreenStreak} 🟢</div>
                  <p className="text-xs text-muted-foreground">
                    Atual: {streaksNormais.currentGreenStreak} greens
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pior Sequência</CardTitle>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{streaksNormais.maxRedStreak} 🔴</div>
                  <p className="text-xs text-muted-foreground">
                    Atual: {streaksNormais.currentRedStreak} reds
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos - Apostas Normais */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 ROI por Mercado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {roiPorMercado.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={roiPorMercado.slice(0, 8)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                          <YAxis type="category" dataKey="mercado" width={120} className="text-xs" />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              name === 'roi' ? `${value.toFixed(2)}%` : formatCurrency(value),
                              name === 'roi' ? 'ROI' : 'Lucro'
                            ]}
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Bar dataKey="roi" name="roi" radius={[0, 4, 4, 0]}>
                            {roiPorMercado.slice(0, 8).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.roi >= 0 ? 'hsl(142, 70%, 45%)' : 'hsl(0, 84%, 60%)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Sem dados para exibir
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🏠 ROI por Casa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {roiPorCasa.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={roiPorCasa.slice(0, 8)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                          <YAxis type="category" dataKey="casa" width={100} className="text-xs" />
                          <Tooltip 
                            formatter={(value: number) => `${value.toFixed(2)}%`}
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Bar dataKey="roi" name="ROI" radius={[0, 4, 4, 0]}>
                            {roiPorCasa.slice(0, 8).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.roi >= 0 ? 'hsl(142, 70%, 45%)' : 'hsl(0, 84%, 60%)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Sem dados para exibir
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🎯 Taxa de Acerto por Faixa de Odd</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hitRatePorOdd}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="faixa" />
                        <YAxis tickFormatter={(v) => `${v}%`} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            name === 'taxaAcerto' ? `${value.toFixed(1)}%` : value,
                            name === 'taxaAcerto' ? 'Taxa de Acerto' : name
                          ]}
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Bar dataKey="taxaAcerto" name="taxaAcerto" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {hitRatePorOdd.map((faixa) => (
                      <div key={faixa.faixa} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{faixa.faixa}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">{faixa.greens}/{faixa.total} apostas</span>
                          <Badge variant={faixa.lucro >= 0 ? "default" : "destructive"}>
                            {formatCurrency(faixa.lucro)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📈 Dispersão: Odds vs ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {dispersaoOddsRoi.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" dataKey="odd" name="Odd" domain={['auto', 'auto']} />
                          <YAxis type="number" dataKey="roi" name="ROI" tickFormatter={(v) => `${v}%`} />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              name === 'ROI' ? `${value.toFixed(1)}%` : value.toFixed(2),
                              name
                            ]}
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Scatter name="Apostas" data={dispersaoOddsRoi}>
                            {dispersaoOddsRoi.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.green ? 'hsl(142, 70%, 45%)' : 'hsl(0, 84%, 60%)'} 
                              />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Sem dados para exibir
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ background: 'hsl(142, 70%, 45%)' }} />
                      <span>Green</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ background: 'hsl(0, 84%, 60%)' }} />
                      <span>Red</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Cards de Resumo - Surebets */}
        {tipoAposta === "surebets" && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Surebets</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsSurebets.totalSurebets}</div>
                  <p className="text-xs text-muted-foreground">
                    {statsSurebets.positivas} positivas / {statsSurebets.negativas} negativas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ROI Geral</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${statsSurebets.roiGeral >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercent(statsSurebets.roiGeral)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lucro: {formatCurrency(statsSurebets.lucroTotal)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">% Médio Surebet</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {formatPercent(statsSurebets.percentualMedio)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Margem média de lucro
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(statsSurebets.ticketMedio)}</div>
                  <p className="text-xs text-muted-foreground">
                    Investido: {formatCurrency(statsSurebets.investidoTotal)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
                  <Flame className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${statsSurebets.lucroTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(statsSurebets.lucroTotal)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No período selecionado
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos - Surebets */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🏠 ROI por Casa (Surebets)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {roiPorCasaSurebet.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={roiPorCasaSurebet.slice(0, 8)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                          <YAxis type="category" dataKey="casa" width={100} className="text-xs" />
                          <Tooltip 
                            formatter={(value: number) => `${value.toFixed(2)}%`}
                            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                          <Bar dataKey="roi" name="ROI" radius={[0, 4, 4, 0]}>
                            {roiPorCasaSurebet.slice(0, 8).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.roi >= 0 ? 'hsl(142, 70%, 45%)' : 'hsl(0, 84%, 60%)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Sem dados para exibir
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Distribuição por % Surebet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={surebetPorFaixa}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="faixa" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Bar dataKey="total" name="Quantidade" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {surebetPorFaixa.map((faixa) => (
                      <div key={faixa.faixa} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{faixa.faixa}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">{faixa.total} surebets</span>
                          <Badge variant={faixa.lucro >= 0 ? "default" : "destructive"}>
                            {formatCurrency(faixa.lucro)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
