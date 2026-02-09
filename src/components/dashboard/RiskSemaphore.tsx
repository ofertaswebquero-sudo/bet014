import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKPIs } from "@/hooks/useKPIs";
import { useSaquesAportes, useCasas } from "@/hooks/useSupabaseData";
import { AlertTriangle, CheckCircle, XCircle, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RiskIndicator {
  id: string;
  label: string;
  value: number;
  status: 'green' | 'yellow' | 'red';
  description: string;
  threshold: { green: string; yellow: string; red: string };
}

export function RiskSemaphore() {
  const { kpis, okrs } = useKPIs();
  const { data: saquesAportes } = useSaquesAportes();
  const { data: casas } = useCasas();

  // Cálculos de risco
  const totalDepositadoCasas = saquesAportes?.reduce((acc, item) => acc + (item.valor_deposito || 0), 0) || 0;
  const totalSacadoCasas = saquesAportes?.reduce((acc, item) => acc + (item.valor_saque || 0), 0) || 0;
  const float = totalDepositadoCasas - totalSacadoCasas;
  const floatPercentual = kpis.bancaAtual > 0 ? (float / kpis.bancaAtual) * 100 : 0;

  // MDD (Maximum Drawdown)
  const mddPercentual = kpis.bancaAtual > 0 ? (Math.abs(kpis.piorDia) / kpis.bancaAtual) * 100 : 0;

  // Concentração máxima em uma casa
  const casasAtivas = casas?.filter(c => c.usando) || [];
  const totalVolume = casasAtivas.reduce((acc, c) => acc + c.depositos + c.saques, 0);
  const maxVolumeCasa = casasAtivas.reduce((max, c) => Math.max(max, c.depositos + c.saques), 0);
  const maxConcentration = totalVolume > 0 ? (maxVolumeCasa / totalVolume) * 100 : 0;

  // Win Rate
  const winRate = kpis.diasPositivos + kpis.diasNegativos > 0 
    ? (kpis.diasPositivos / (kpis.diasPositivos + kpis.diasNegativos)) * 100 
    : 0;

  const getStatus = (value: number, thresholds: { green: number; yellow: number }): 'green' | 'yellow' | 'red' => {
    if (value <= thresholds.green) return 'green';
    if (value <= thresholds.yellow) return 'yellow';
    return 'red';
  };

  const getStatusInverse = (value: number, thresholds: { green: number; yellow: number }): 'green' | 'yellow' | 'red' => {
    if (value >= thresholds.green) return 'green';
    if (value >= thresholds.yellow) return 'yellow';
    return 'red';
  };

  const indicators: RiskIndicator[] = [
    {
      id: 'float',
      label: 'Float',
      value: floatPercentual,
      status: getStatus(floatPercentual, { green: 40, yellow: 60 }),
      description: `${floatPercentual.toFixed(0)}% da banca está nas casas`,
      threshold: { green: '< 40%', yellow: '40-60%', red: '> 60%' },
    },
    {
      id: 'runway',
      label: 'Runway',
      value: okrs.runway,
      status: getStatusInverse(okrs.runway, { green: 30, yellow: 15 }),
      description: `${okrs.runway} dias de operação`,
      threshold: { green: '> 30 dias', yellow: '15-30 dias', red: '< 15 dias' },
    },
    {
      id: 'mdd',
      label: 'Drawdown',
      value: mddPercentual,
      status: getStatus(mddPercentual, { green: 10, yellow: 20 }),
      description: `${mddPercentual.toFixed(1)}% da banca em pior dia`,
      threshold: { green: '< 10%', yellow: '10-20%', red: '> 20%' },
    },
    {
      id: 'concentration',
      label: 'Concentração',
      value: maxConcentration,
      status: getStatus(maxConcentration, { green: 40, yellow: 60 }),
      description: `${maxConcentration.toFixed(0)}% em uma única casa`,
      threshold: { green: '< 40%', yellow: '40-60%', red: '> 60%' },
    },
    {
      id: 'winrate',
      label: 'Win Rate',
      value: winRate,
      status: getStatusInverse(winRate, { green: 55, yellow: 45 }),
      description: `${winRate.toFixed(0)}% dias positivos`,
      threshold: { green: '> 55%', yellow: '45-55%', red: '< 45%' },
    },
  ];

  const overallStatus = (): 'green' | 'yellow' | 'red' => {
    const redCount = indicators.filter(i => i.status === 'red').length;
    const yellowCount = indicators.filter(i => i.status === 'yellow').length;
    if (redCount >= 2) return 'red';
    if (redCount >= 1 || yellowCount >= 3) return 'yellow';
    return 'green';
  };

  const StatusIcon = ({ status, className }: { status: 'green' | 'yellow' | 'red', className?: string }) => {
    switch (status) {
      case 'green':
        return <CheckCircle className={cn("h-4 w-4 text-emerald-500", className)} />;
      case 'yellow':
        return <AlertTriangle className={cn("h-4 w-4 text-yellow-500", className)} />;
      case 'red':
        return <XCircle className={cn("h-4 w-4 text-red-500", className)} />;
    }
  };

  const overall = overallStatus();

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-card to-background shadow-xl">
      <CardHeader className="p-2.5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              overall === 'green' ? "bg-emerald-500/10" : overall === 'yellow' ? "bg-yellow-500/10" : "bg-red-500/10"
            )}>
              {overall === 'green' ? <ShieldCheck className="h-5 w-5 text-emerald-500" /> : 
               overall === 'yellow' ? <ShieldAlert className="h-5 w-5 text-yellow-500" /> : 
               <ShieldX className="h-5 w-5 text-red-500" />}
            </div>
            <div>
              <CardTitle className="text-sm font-bold tracking-tight">Risco</CardTitle>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-xl border transition-all duration-500",
            overall === 'green' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : 
            overall === 'yellow' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" : 
            "bg-red-500/10 border-red-500/20 text-red-500"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              overall === 'green' ? "bg-emerald-500" : overall === 'yellow' ? "bg-yellow-500" : "bg-red-500"
            )} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {overall === 'green' ? 'Saudável' : overall === 'yellow' ? 'Atenção' : 'Crítico'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2.5">
        <div className="grid grid-cols-5 gap-2">
          <TooltipProvider>
            {indicators.map((indicator) => (
              <Tooltip key={indicator.id}>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "flex flex-col items-center p-2 rounded-xl border transition-all duration-300 cursor-help group hover:-translate-y-0.5",
                      indicator.status === 'green' ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30" : 
                      indicator.status === 'yellow' ? "bg-yellow-500/5 border-yellow-500/10 hover:border-yellow-500/30" : 
                      "bg-red-500/5 border-red-500/10 hover:border-red-500/30"
                    )}
                  >
                    <div className="mb-1.5 transition-transform duration-300 group-hover:scale-110">
                      <StatusIcon status={indicator.status} />
                    </div>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter text-center mb-0.5">{indicator.label}</span>
                    <span className={cn(
                      "text-xs font-black tracking-tight",
                      indicator.status === 'green' ? "text-emerald-600 dark:text-emerald-400" : 
                      indicator.status === 'yellow' ? "text-yellow-600 dark:text-yellow-400" : 
                      "text-red-600 dark:text-red-400"
                    )}>
                      {indicator.id === 'runway' ? `${indicator.value}d` : `${indicator.value.toFixed(0)}%`}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="p-3 max-w-xs bg-popover/95 backdrop-blur-sm border-border shadow-2xl rounded-xl">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 border-b border-border/50 pb-1.5">
                      <StatusIcon status={indicator.status} />
                      <p className="font-bold text-xs uppercase tracking-tight">{indicator.label}</p>
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">{indicator.description}</p>
                    <div className="grid grid-cols-1 gap-1 pt-1">
                      <div className="flex items-center justify-between text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                        <span>IDEAL</span>
                        <span>{indicator.threshold.green}</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500">
                        <span>ALERTA</span>
                        <span>{indicator.threshold.yellow}</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                        <span>PERIGO</span>
                        <span>{indicator.threshold.red}</span>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
