import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, DollarSign, Clock, Lightbulb, AlertCircle } from "lucide-react";
import { useKPIs } from "@/hooks/useKPIs";
import { useCaixaGeral, useSaquesAportes } from "@/hooks/useSupabaseData";
import { formatCurrency } from "@/components/dashboard/StatCard";
import { cn } from "@/lib/utils";

interface Alert {
  tipo: string;
  nivel: 'error' | 'warning';
  titulo: string;
  descricao: string;
  acao: string;
  icon: React.ReactNode;
}

export function RiskAlerts() {
  const { kpis, okrs } = useKPIs();
  const { data: saquesAportes } = useSaquesAportes();

  // Cálculos
  const totalDepositadoCasas = saquesAportes?.reduce((acc, item) => acc + (item.valor_deposito || 0), 0) || 0;
  const totalSacadoCasas = saquesAportes?.reduce((acc, item) => acc + (item.valor_saque || 0), 0) || 0;
  const float = totalDepositadoCasas - totalSacadoCasas;
  const floatPercentual = kpis.bancaAtual > 0 ? (float / kpis.bancaAtual) * 100 : 0;

  const alertas: Alert[] = [];

  // Float elevado
  if (floatPercentual > 50) {
    alertas.push({
      tipo: 'float',
      nivel: floatPercentual > 70 ? 'error' : 'warning',
      titulo: 'Float Elevado',
      descricao: `Dinheiro na Rua: ${formatCurrency(float)} (${floatPercentual.toFixed(0)}% da banca)`,
      acao: `Planeje um saque de ${formatCurrency(float * 0.4)}`,
      icon: <DollarSign className="h-4 w-4" />,
    });
  }

  // Runway baixo
  if (okrs.runway < 30 && okrs.runway > 0) {
    alertas.push({
      tipo: 'runway',
      nivel: okrs.runway < 15 ? 'error' : 'warning',
      titulo: 'Runway Baixo',
      descricao: `Banca aguenta apenas ${okrs.runway} dias no pior cenário`,
      acao: 'Reduza o stake ou faça um aporte',
      icon: <Clock className="h-4 w-4" />,
    });
  }

  // Pior dia recente muito negativo
  if (kpis.piorDia < -500) {
    alertas.push({
      tipo: 'drawdown',
      nivel: 'warning',
      titulo: 'Drawdown Significativo',
      descricao: `Pior dia: ${formatCurrency(kpis.piorDia)}`,
      acao: 'Revise sua estratégia de stake',
      icon: <TrendingDown className="h-4 w-4" />,
    });
  }

  if (alertas.length === 0) return null;

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {alertas.slice(0, 2).map((alerta, index) => (
        <Card 
          key={index} 
          className={cn(
            "relative overflow-hidden border-none shadow-lg transition-all hover:scale-[1.01]",
            alerta.nivel === 'error' 
              ? 'bg-gradient-to-br from-destructive/20 to-destructive/5 border-l-4 border-l-destructive' 
              : 'bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-l-4 border-l-yellow-500'
          )}
        >
          <CardContent className="p-2.5">
            <div className="flex items-start gap-2.5">
              <div className={cn(
                "p-2 rounded-xl shadow-sm",
                alerta.nivel === 'error' ? 'bg-destructive text-destructive-foreground' : 'bg-yellow-500 text-yellow-900'
              )}>
                {alerta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-[11px] uppercase tracking-tight">{alerta.titulo}</p>
                  </div>
                  <AlertCircle className={cn(
                    "h-3.5 w-3.5 animate-pulse",
                    alerta.nivel === 'error' ? 'text-destructive' : 'text-yellow-600'
                  )} />
                </div>
                <p className="text-[10px] font-medium text-muted-foreground leading-tight mb-2">{alerta.descricao}</p>
                
                <div className={cn(
                  "flex items-center gap-1.5 p-1.5 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50",
                  alerta.nivel === 'error' ? 'text-destructive' : 'text-yellow-700 dark:text-yellow-500'
                )}>
                  <Lightbulb className="h-3 w-3 flex-shrink-0" />
                  <p className="text-[9px] font-bold uppercase tracking-tighter">{alerta.acao}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
