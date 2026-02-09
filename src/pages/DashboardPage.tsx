import { KPICards } from "@/components/dashboard/KPICards";
import { RiskAlerts } from "@/components/dashboard/RiskAlerts";
import { RiskSemaphore } from "@/components/dashboard/RiskSemaphore";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDiarioOperacoes, useCasas, useApostas } from "@/hooks/useSupabaseData";
import { formatCurrency } from "@/components/dashboard/StatCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { DateRangeFilter, useDateRangeFilter, SelectFilter } from "@/components/filters/DateRangeFilter";
import { useMemo, useState, useCallback } from "react";
import { X, Filter, Activity, TrendingUp, BarChart3, LayoutDashboard, Calendar, PieChart as PieIcon, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const { data: diario } = useDiarioOperacoes();
  const { data: casas } = useCasas();
  const { data: apostas } = useApostas();
  
  // Filtros
  const { startDate, endDate, setStartDate, setEndDate, clearFilter: clearDateFilter } = useDateRangeFilter();
  const [casaFilter, setCasaFilter] = useState("all");

  // Filtros consolidados para o hook useKPIs
  const kpiFilters = useMemo(() => ({
    startDate,
    endDate,
    casaId: casaFilter !== "all" ? casaFilter : undefined
  }), [startDate, endDate, casaFilter]);

  // Dados filtrados para os gráficos
  const diarioFiltrado = useMemo(() => {
    if (!diario) return [];
    return diario.filter(item => {
      if (startDate && item.data < startDate) return false;
      if (endDate && item.data > endDate) return false;
      return true;
    });
  }, [diario, startDate, endDate]);

  const apostasFiltradas = useMemo(() => {
    if (!apostas) return [];
    return apostas.filter(item => {
      if (startDate && item.data < startDate) return false;
      if (endDate && item.data > endDate) return false;
      if (casaFilter !== "all" && item.casa_id !== casaFilter) return false;
      return true;
    });
  }, [apostas, startDate, endDate, casaFilter]);

  // Gráfico 1: Evolução Patrimonial
  const chartData = useMemo(() => {
    if (!diarioFiltrado || diarioFiltrado.length === 0) return [];
    const sorted = [...diarioFiltrado].sort((a, b) => a.data.localeCompare(b.data));
    let acumulado = 0;
    return sorted.map(item => {
      acumulado += item.valor_resultado;
      return {
        data: new Date(item.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        resultado: item.valor_resultado,
        acumulado: acumulado,
      };
    });
  }, [diarioFiltrado]);

  // Gráfico 2: Performance por Casa (Bar)
  const casasData = useMemo(() => {
    let result = casas?.filter(c => c.usando) || [];
    if (casaFilter !== "all") {
      result = result.filter(c => c.id === casaFilter);
    }
    return result
      .map(c => ({
        nome: c.nome,
        lucro: c.lucro_prejuizo,
      }))
      .sort((a, b) => b.lucro - a.lucro)
      .slice(0, 8);
  }, [casas, casaFilter]);

  // Gráfico 3: Distribuição de Resultados (Pie)
  const pieData = useMemo(() => {
    const greens = apostasFiltradas.filter(a => a.resultado === 'green').length;
    const reds = apostasFiltradas.filter(a => a.resultado === 'red').length;
    const voids = apostasFiltradas.filter(a => a.resultado === 'void').length;
    
    return [
      { name: 'Greens', value: greens, fill: 'hsl(var(--success))' },
      { name: 'Reds', value: reds, fill: 'hsl(var(--destructive))' },
      { name: 'Voids', value: voids, fill: 'hsl(var(--muted-foreground))' },
    ].filter(d => d.value > 0);
  }, [apostasFiltradas]);

  const clearAllFilters = useCallback(() => {
    clearDateFilter();
    setCasaFilter("all");
  }, [clearDateFilter]);

  const hasActiveFilters = !!(startDate || endDate || casaFilter !== "all");

  return (
    <AppLayout title="Dashboard Executivo" subtitle="Análise de performance e gestão de risco em tempo real">
      <div className="space-y-6">
        {/* Header de Filtros Compacto */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50">
                <Calendar className="h-4 w-4 text-primary" />
                <DateRangeFilter
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onClear={clearDateFilter}
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50">
                <Activity className="h-4 w-4 text-primary" />
                <SelectFilter
                  label=""
                  value={casaFilter}
                  options={casas?.map(c => ({ value: c.id, label: c.nome })) || []}
                  onValueChange={setCasaFilter}
                  placeholder="Todas as Casas"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-destructive hover:bg-destructive/10">
                <X className="h-4 w-4 mr-2" /> Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        {/* Seção de Risco */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 xl:col-span-3">
            <RiskSemaphore />
          </div>
          <div className="lg:col-span-8 xl:col-span-9">
            <RiskAlerts />
          </div>
        </div>

        {/* Cards de KPI */}
        <KPICards filters={kpiFilters} />

        {/* Gráficos Principais */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Evolução Patrimonial */}
          <Card className="lg:col-span-8 shadow-md border-border/40">
            <CardHeader className="p-5 border-b border-border/40 bg-muted/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Evolução Patrimonial
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                      <XAxis dataKey="data" className="text-[10px]" tickLine={false} axisLine={false} />
                      <YAxis className="text-[10px]" tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip 
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(v: any) => [formatCurrency(v), 'Acumulado']}
                      />
                      <Area type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorAcumulado)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Nenhum dado no período</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribuição de Resultados */}
          <Card className="lg:col-span-4 shadow-md border-border/40">
            <CardHeader className="p-5 border-b border-border/40 bg-muted/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-primary" /> Assertividade
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="h-[220px] w-full">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Sem dados de apostas</div>
                )}
              </div>
              <div className="flex gap-4 mt-4">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-[10px] font-medium">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance por Casa */}
          <Card className="lg:col-span-12 shadow-md border-border/40">
            <CardHeader className="p-5 border-b border-border/40 bg-muted/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Performance por Casa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[250px] w-full">
                {casasData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={casasData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                      <XAxis dataKey="nome" className="text-[10px]" tickLine={false} axisLine={false} />
                      <YAxis className="text-[10px]" tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        formatter={(v: any) => [formatCurrency(v), 'Lucro/Prejuízo']}
                      />
                      <Bar dataKey="lucro" radius={[4, 4, 0, 0]}>
                        {casasData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.lucro >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Sem dados de casas</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
