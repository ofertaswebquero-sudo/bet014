import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, CheckCircle2, XCircle, ArrowRight, ArrowUp, ArrowDown, Info } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/StatCard";
import { cn } from "@/lib/utils";

interface ReconciliacaoData {
  saldoInicial: number;
  aportesExternos: number;
  lucroJogos: number;
  saquesPessoais: number;
  custos: number;
  saldoTeorico: number;
  saldoReal: number | null;
  divergencia: number;
  // Detalhamento
  lucroApostas: number;
  lucroSurebets: number;
  lucroCassino: number;
  depositosCasas: number;
  saquesCasas: number;
}

interface ReconciliacaoVisualProps {
  data: ReconciliacaoData;
  periodoLabel: string;
}

export function ReconciliacaoVisual({ data, periodoLabel }: ReconciliacaoVisualProps) {
  const {
    saldoInicial,
    aportesExternos,
    lucroJogos,
    saquesPessoais,
    custos,
    saldoTeorico,
    saldoReal,
    divergencia,
    lucroApostas,
    lucroSurebets,
    lucroCassino,
    depositosCasas,
    saquesCasas,
  } = data;

  const statusReconciliacao = useMemo(() => {
    if (saldoReal === null) return { status: "pendente", color: "text-muted-foreground", icon: Info };
    const percentDivergencia = Math.abs(divergencia) / Math.max(saldoTeorico, 1) * 100;
    if (percentDivergencia < 1) return { status: "ok", color: "text-success", icon: CheckCircle2 };
    if (percentDivergencia < 5) return { status: "alerta", color: "text-warning", icon: AlertTriangle };
    return { status: "erro", color: "text-destructive", icon: XCircle };
  }, [saldoReal, divergencia, saldoTeorico]);

  const fluxoItems = [
    { label: "Saldo Inicial", value: saldoInicial, type: "neutral" as const },
    { label: "Aportes (Caixa Geral)", value: aportesExternos, type: "positive" as const },
    { label: "Resultado Jogos", value: lucroJogos, type: lucroJogos >= 0 ? "positive" as const : "negative" as const },
    { label: "Saques Pessoais", value: -saquesPessoais, type: "negative" as const },
    { label: "Custos Operacionais", value: -custos, type: "negative" as const },
  ];

  const detalhamentoJogos = [
    { label: "Apostas Esportivas", value: lucroApostas },
    { label: "Surebets", value: lucroSurebets },
    { label: "Cassino", value: lucroCassino },
  ];

  const movimentacaoCasas = [
    { label: "Depósitos nas Casas", value: depositosCasas, icon: ArrowDown },
    { label: "Saques das Casas", value: saquesCasas, icon: ArrowUp },
    { label: "Float (nas casas)", value: depositosCasas - saquesCasas, icon: ArrowRight },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Título com Status */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            📊 Reconciliação - {periodoLabel}
          </h3>
          <Badge 
            variant={statusReconciliacao.status === "ok" ? "default" : statusReconciliacao.status === "alerta" ? "secondary" : "destructive"}
            className="flex items-center gap-1"
          >
            <statusReconciliacao.icon className="h-3 w-3" />
            {statusReconciliacao.status === "ok" && "Reconciliado"}
            {statusReconciliacao.status === "alerta" && "Divergência Leve"}
            {statusReconciliacao.status === "erro" && "Divergência Alta"}
            {statusReconciliacao.status === "pendente" && "Aguardando Saldo Real"}
          </Badge>
        </div>

        {/* Visualização Principal - Waterfall */}
        <Card className="bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Fluxo de Caixa (Teórico)
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Saldo Teórico = Inicial + Aportes + Lucros - Saques - Custos</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fluxoItems.map((item, index) => (
                <div key={item.label} className="relative">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={cn(
                      "font-mono font-medium",
                      item.type === "positive" && item.value > 0 && "text-success",
                      item.type === "negative" && item.value < 0 && "text-destructive",
                    )}>
                      {item.value >= 0 ? "+" : ""}{formatCurrency(item.value)}
                    </span>
                  </div>
                  {index < fluxoItems.length - 1 && (
                    <div className="absolute left-4 -bottom-2 h-3 w-0.5 bg-border" />
                  )}
                </div>
              ))}
              
              {/* Linha divisória */}
              <div className="border-t border-dashed my-3" />
              
              {/* Resultado Teórico */}
              <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
                <span className="font-semibold">= Saldo Teórico</span>
                <span className="text-xl font-bold">{formatCurrency(saldoTeorico)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid: Detalhamento + Comparação */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Detalhamento dos Jogos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">🎮 Composição: Resultado dos Jogos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {detalhamentoJogos.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={cn(
                    "font-mono font-medium",
                    item.value >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex items-center justify-between">
                <span className="font-medium">Total Jogos</span>
                <span className={cn(
                  "font-bold",
                  lucroJogos >= 0 ? "text-success" : "text-destructive"
                )}>
                  {formatCurrency(lucroJogos)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Movimentação nas Casas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">🏦 Movimentação nas Casas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {movimentacaoCasas.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                  <span className={cn(
                    "font-mono font-medium",
                    item.label.includes("Float") && (item.value > 0 ? "text-warning" : "text-success")
                  )}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Comparação Teórico vs Real */}
        <Card className={cn(
          "border-2",
          statusReconciliacao.status === "ok" && "border-success/50",
          statusReconciliacao.status === "alerta" && "border-warning/50",
          statusReconciliacao.status === "erro" && "border-destructive/50",
          statusReconciliacao.status === "pendente" && "border-muted"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              ⚖️ Conferência: Teórico vs Real
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Divergência = Saldo Real - Saldo Teórico</p>
                  <p className="text-xs mt-1">Divergência positiva: há mais dinheiro do que o calculado (faltou registrar ganho ou saque)</p>
                  <p className="text-xs">Divergência negativa: há menos dinheiro (faltou registrar perda ou depósito)</p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Teórico */}
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Saldo Teórico</p>
                <p className="text-2xl font-bold">{formatCurrency(saldoTeorico)}</p>
                <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
              </div>

              {/* VS */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground mt-1">comparado com</p>
                </div>
              </div>

              {/* Real */}
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Saldo Real</p>
                {saldoReal !== null ? (
                  <p className="text-2xl font-bold">{formatCurrency(saldoReal)}</p>
                ) : (
                  <p className="text-xl text-muted-foreground italic">Não informado</p>
                )}
                <p className="text-xs text-muted-foreground">Conferido manualmente</p>
              </div>
            </div>

            {/* Barra de Divergência */}
            {saldoReal !== null && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Divergência</span>
                  <span className={cn(
                    "font-bold",
                    divergencia >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {divergencia >= 0 ? "+" : ""}{formatCurrency(divergencia)}
                  </span>
                </div>
                
                {/* Indicador Visual */}
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "absolute h-full transition-all",
                      statusReconciliacao.status === "ok" && "bg-success",
                      statusReconciliacao.status === "alerta" && "bg-warning",
                      statusReconciliacao.status === "erro" && "bg-destructive",
                    )}
                    style={{ 
                      width: `${Math.min(Math.abs(divergencia) / Math.max(saldoTeorico, 1) * 100 * 10, 100)}%`
                    }}
                  />
                </div>

                {/* Dica */}
                {statusReconciliacao.status !== "ok" && (
                  <div className={cn(
                    "text-xs p-2 rounded-lg",
                    statusReconciliacao.status === "alerta" && "bg-warning/10 text-warning",
                    statusReconciliacao.status === "erro" && "bg-destructive/10 text-destructive"
                  )}>
                    💡 {divergencia > 0 
                      ? "Saldo real maior que teórico: verifique se há ganhos ou saques não registrados."
                      : "Saldo real menor que teórico: verifique se há perdas ou depósitos não registrados."
                    }
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
