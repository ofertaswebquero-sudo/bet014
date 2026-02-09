import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDiarioOperacoes, useApostas } from "@/hooks/useSupabaseData";
import { TrendingUp, TrendingDown, Flame, Snowflake, BarChart2 } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface Sequence {
  type: 'win' | 'loss';
  count: number;
  startDate: string;
  endDate: string;
  totalValue: number;
}

export function SequenceAnalysis() {
  const { data: diario } = useDiarioOperacoes();
  const { data: apostas } = useApostas();

  const analysis = useMemo(() => {
    if (!diario?.length) return null;

    // Ordenar por data
    const sorted = [...diario].sort((a, b) => 
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    // Encontrar sequências
    const sequences: Sequence[] = [];
    let currentSequence: Sequence | null = null;

    sorted.forEach((day) => {
      const isWin = day.valor_resultado > 0;
      const type = isWin ? 'win' : 'loss';

      if (!currentSequence || currentSequence.type !== type) {
        if (currentSequence) sequences.push(currentSequence);
        currentSequence = {
          type,
          count: 1,
          startDate: day.data,
          endDate: day.data,
          totalValue: day.valor_resultado,
        };
      } else {
        currentSequence.count++;
        currentSequence.endDate = day.data;
        currentSequence.totalValue += day.valor_resultado;
      }
    });
    if (currentSequence) sequences.push(currentSequence);

    // Estatísticas
    const winStreaks = sequences.filter(s => s.type === 'win');
    const lossStreaks = sequences.filter(s => s.type === 'loss');

    const maxWinStreak = winStreaks.reduce((max, s) => s.count > max.count ? s : max, { count: 0 } as Sequence);
    const maxLossStreak = lossStreaks.reduce((max, s) => s.count > max.count ? s : max, { count: 0 } as Sequence);
    
    const avgWinStreak = winStreaks.length > 0 
      ? winStreaks.reduce((acc, s) => acc + s.count, 0) / winStreaks.length 
      : 0;
    const avgLossStreak = lossStreaks.length > 0 
      ? lossStreaks.reduce((acc, s) => acc + s.count, 0) / lossStreaks.length 
      : 0;

    // Sequência atual
    const currentStreak = sequences[sequences.length - 1];

    // Últimos 7 dias pattern
    const last7 = sorted.slice(-7);
    const last7Pattern = last7.map(d => d.valor_resultado > 0 ? 'W' : 'L').join('');

    // Análise de apostas individuais (se disponível)
    let apostaStats = null;
    if (apostas?.length) {
      const sortedApostas = [...apostas].sort((a, b) => 
        new Date(a.data).getTime() - new Date(b.data).getTime()
      );
      
      const apostaSequences: { type: 'win' | 'loss'; count: number }[] = [];
      let currentApostaSeq: { type: 'win' | 'loss'; count: number } | null = null;

      sortedApostas.forEach((aposta) => {
        const isWin = aposta.resultado === 'green';
        const type = isWin ? 'win' : 'loss';

        if (!currentApostaSeq || currentApostaSeq.type !== type) {
          if (currentApostaSeq) apostaSequences.push(currentApostaSeq);
          currentApostaSeq = { type, count: 1 };
        } else {
          currentApostaSeq.count++;
        }
      });
      if (currentApostaSeq) apostaSequences.push(currentApostaSeq);

      const winApostaStreaks = apostaSequences.filter(s => s.type === 'win');
      const lossApostaStreaks = apostaSequences.filter(s => s.type === 'loss');

      apostaStats = {
        maxWin: winApostaStreaks.reduce((max, s) => Math.max(max, s.count), 0),
        maxLoss: lossApostaStreaks.reduce((max, s) => Math.max(max, s.count), 0),
        current: apostaSequences[apostaSequences.length - 1],
      };
    }

    return {
      maxWinStreak,
      maxLossStreak,
      avgWinStreak,
      avgLossStreak,
      currentStreak,
      last7Pattern,
      totalDays: sorted.length,
      apostaStats,
    };
  }, [diario, apostas]);

  if (!analysis) {
    return (
      <Card className="border-none bg-card/50 backdrop-blur-sm">
        <CardHeader className="p-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-primary" />
            Sequências
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <p className="text-muted-foreground text-[10px] italic">Sem dados</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Card className="border-none bg-card/50 backdrop-blur-sm shadow-lg">
      <CardHeader className="p-2 border-b border-border/50">
        <CardTitle className="text-sm font-bold flex items-center gap-1.5">
          <BarChart2 className="h-4 w-4 text-primary" />
          Sequências
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-1.5">
        {/* Sequência Atual */}
        <div className={cn(
          "relative overflow-hidden p-2 rounded-xl border transition-all duration-300",
          analysis.currentStreak.type === 'win' 
            ? 'bg-emerald-500/10 border-emerald-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        )}>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-lg",
                analysis.currentStreak.type === 'win' ? 'bg-emerald-500/20' : 'bg-red-500/20'
              )}>
                {analysis.currentStreak.type === 'win' ? (
                  <Flame className="h-4 w-4 text-emerald-500 animate-pulse" />
                ) : (
                  <Snowflake className="h-4 w-4 text-red-500 animate-pulse" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Status</p>
                <p className="text-[11px] font-bold">
                  {analysis.currentStreak.type === 'win' ? 'Em Alta' : 'Em Baixa'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-lg font-black tracking-tighter",
                analysis.currentStreak.type === 'win' ? 'text-emerald-500' : 'text-red-500'
              )}>
                {analysis.currentStreak.count}d
              </p>
            </div>
          </div>
        </div>

        {/* Últimos 7 dias */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">Últimos 7 dias</p>
          </div>
          <div className="flex justify-between gap-1">
            {analysis.last7Pattern.split('').map((result, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all hover:scale-105",
                  result === 'W' 
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20'
                )}
              >
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* Estatísticas de Sequências - Diário */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">Melhor</span>
            </div>
            <p className="text-sm font-black text-emerald-500 tracking-tighter">{analysis.maxWinStreak.count} dias</p>
          </div>

          <div className="p-2 rounded-xl bg-red-500/5 border border-red-500/10 group hover:border-red-500/30 transition-all">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">Pior</span>
            </div>
            <p className="text-sm font-black text-red-500 tracking-tighter">{analysis.maxLossStreak.count} dias</p>
          </div>
        </div>

        {/* Médias e Apostas */}
        <div className="pt-1.5 border-t border-border/50 space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Média Win</span>
              <span className="text-[11px] font-bold text-emerald-500">{analysis.avgWinStreak.toFixed(1)}d</span>
            </div>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">Média Loss</span>
              <span className="text-[11px] font-bold text-red-500">{analysis.avgLossStreak.toFixed(1)}d</span>
            </div>
          </div>

          {analysis.apostaStats && (
            <div className="bg-secondary/30 rounded-lg p-1.5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">Apostas</p>
                <Badge variant="outline" className="text-[7px] h-3 px-1 uppercase font-black">Live</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[8px] font-medium text-muted-foreground/60">Max W</span>
                  <span className="text-[10px] font-black text-emerald-500">{analysis.apostaStats.maxWin}</span>
                </div>
                <div className="flex flex-col text-center">
                  <span className="text-[8px] font-medium text-muted-foreground/60">Max L</span>
                  <span className="text-[10px] font-black text-red-500">{analysis.apostaStats.maxLoss}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[8px] font-medium text-muted-foreground/60">Atual</span>
                  <span className={cn(
                    "text-[10px] font-black",
                    analysis.apostaStats.current.type === 'win' ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {analysis.apostaStats.current.count}{analysis.apostaStats.current.type === 'win' ? 'W' : 'L'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
