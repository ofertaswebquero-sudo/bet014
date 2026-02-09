import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApostas, useApostasSurebet, useCasas } from "@/hooks/useSupabaseData";
import { formatCurrency, formatPercent } from "@/components/dashboard/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function ResultadosPage() {
  const { data: apostas } = useApostas();
  const { data: surebets } = useApostasSurebet();
  const { data: casas } = useCasas();

  // Calcular resultados por casa (combinando apostas normais e surebets)
  const resultadosPorCasa = casas?.map(casa => {
    // Apostas normais
    const apostasNormais = apostas?.filter(a => a.casa_id === casa.id) || [];
    const investidoNormal = apostasNormais.reduce((acc, a) => acc + a.stake, 0);
    const lucroNormal = apostasNormais.reduce((acc, a) => acc + (a.lucro_prejuizo || 0), 0);
    const greensNormal = apostasNormais.filter(a => a.resultado === 'green').length;
    const redsNormal = apostasNormais.filter(a => a.resultado === 'red').length;

    // Surebets (casa 1 e 2)
    const surebetsCasa = surebets?.filter(s => s.casa1_id === casa.id || s.casa2_id === casa.id) || [];
    const investidoSurebet = surebetsCasa.reduce((acc, s) => {
      if (s.casa1_id === casa.id) return acc + (s.stake1 || 0);
      if (s.casa2_id === casa.id) return acc + (s.stake2 || 0);
      return acc;
    }, 0);
    // Lucro proporcional
    const lucroSurebet = surebetsCasa.reduce((acc, s) => acc + ((s.lucro_prejuizo || 0) / 2), 0);

    return {
      casa: casa.nome,
      apostasNormais: apostasNormais.length,
      surebets: surebetsCasa.length,
      totalApostas: apostasNormais.length + surebetsCasa.length,
      investidoNormal,
      investidoSurebet,
      investidoTotal: investidoNormal + investidoSurebet,
      lucroNormal,
      lucroSurebet,
      lucroTotal: lucroNormal + lucroSurebet,
      greens: greensNormal,
      reds: redsNormal,
      roi: (investidoNormal + investidoSurebet) > 0 
        ? ((lucroNormal + lucroSurebet) / (investidoNormal + investidoSurebet)) * 100 
        : 0,
    };
  }).filter(r => r.totalApostas > 0).sort((a, b) => b.lucroTotal - a.lucroTotal) || [];

  // Totais gerais
  const totais = {
    apostasNormais: apostas?.length || 0,
    surebets: surebets?.length || 0,
    investidoNormal: apostas?.reduce((acc, a) => acc + a.stake, 0) || 0,
    investidoSurebet: surebets?.reduce((acc, s) => acc + s.investimento_total, 0) || 0,
    lucroNormal: apostas?.reduce((acc, a) => acc + (a.lucro_prejuizo || 0), 0) || 0,
    lucroSurebet: surebets?.reduce((acc, s) => acc + (s.lucro_prejuizo || 0), 0) || 0,
    greens: apostas?.filter(a => a.resultado === 'green').length || 0,
    reds: apostas?.filter(a => a.resultado === 'red').length || 0,
  };

  // Dados para gráfico de pizza
  const pieData = [
    { name: 'Apostas Normais', value: totais.lucroNormal, color: 'hsl(142, 70%, 45%)' },
    { name: 'Surebets', value: totais.lucroSurebet, color: 'hsl(217, 91%, 60%)' },
  ];

  // Dados para gráfico de barras (top 5 casas)
  const barData = resultadosPorCasa.slice(0, 5);

  return (
    <AppLayout title="Resultados Esportivos" subtitle="Análise consolidada de apostas normais e surebets">
      <div className="space-y-6">
        {/* Cards de resumo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                🎯 Total Apostas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totais.apostasNormais + totais.surebets}</div>
              <p className="text-xs text-muted-foreground">
                {totais.apostasNormais} normais + {totais.surebets} surebets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                💰 Total Investido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totais.investidoNormal + totais.investidoSurebet)}</div>
            </CardContent>
          </Card>

          <Card className={totais.lucroNormal + totais.lucroSurebet >= 0 ? 'bg-success/10' : 'bg-destructive/10'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                📈 Lucro Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totais.lucroNormal + totais.lucroSurebet >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(totais.lucroNormal + totais.lucroSurebet)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ✅ Taxa de Acerto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totais.apostasNormais > 0 
                  ? `${((totais.greens / totais.apostasNormais) * 100).toFixed(1)}%`
                  : '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                {totais.greens} greens / {totais.reds} reds
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Lucro por Tipo de Aposta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {pieData.some(d => d.value !== 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Sem dados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🏆 Top 5 Casas por Lucro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tickFormatter={(v) => `R$${v}`} />
                      <YAxis type="category" dataKey="casa" width={100} className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="lucroTotal" fill="hsl(142, 70%, 45%)" radius={[0, 4, 4, 0]} name="Lucro" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Sem dados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela detalhada */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Resultados por Casa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Casa</TableHead>
                    <TableHead className="text-center">Apostas</TableHead>
                    <TableHead className="text-center">Surebets</TableHead>
                    <TableHead className="text-right">Investido</TableHead>
                    <TableHead className="text-right">Lucro Normal</TableHead>
                    <TableHead className="text-right">Lucro Surebet</TableHead>
                    <TableHead className="text-right">Lucro Total</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultadosPorCasa.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum resultado
                      </TableCell>
                    </TableRow>
                  ) : (
                    resultadosPorCasa.map((r) => (
                      <TableRow key={r.casa}>
                        <TableCell className="font-medium">{r.casa}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{r.apostasNormais}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{r.surebets}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(r.investidoTotal)}</TableCell>
                        <TableCell className={`text-right ${r.lucroNormal >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(r.lucroNormal)}
                        </TableCell>
                        <TableCell className={`text-right ${r.lucroSurebet >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(r.lucroSurebet)}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${r.lucroTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(r.lucroTotal)}
                        </TableCell>
                        <TableCell className={`text-right ${r.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatPercent(r.roi)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
