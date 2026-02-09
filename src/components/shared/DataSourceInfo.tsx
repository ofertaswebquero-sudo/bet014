import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface DataSourceInfoProps {
  title: string;
  formula: string;
  sources: string[];
  example?: string;
}

export function DataSourceInfo({ title, formula, sources, example }: DataSourceInfoProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">{title}</h4>
          
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">📐 Fórmula:</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block">
              {formula}
            </code>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">📊 Origem dos dados:</p>
            <ul className="text-xs space-y-1">
              {sources.map((source, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-primary">•</span>
                  <span>{source}</span>
                </li>
              ))}
            </ul>
          </div>

          {example && (
            <div className="space-y-1 pt-1 border-t">
              <p className="text-xs font-medium text-muted-foreground">💡 Exemplo:</p>
              <p className="text-xs text-muted-foreground">{example}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Tooltip simples para explicações rápidas
export function QuickInfo({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help inline ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Configurações pré-definidas para os KPIs
export const KPI_EXPLANATIONS = {
  lucroLiquido: {
    title: "Lucro Líquido Total",
    formula: "Soma(Diário.valor_resultado) - Soma(Caixa.custos)",
    sources: [
      "Diário de Operações → campo 'valor_resultado'",
      "Caixa Geral → registros do tipo 'custo'"
    ],
    example: "Se você teve R$1.000 de lucro no diário e R$100 de custos, lucro líquido = R$900"
  },
  roiGeral: {
    title: "ROI Geral",
    formula: "(Lucro Líquido / Total Depositado) × 100",
    sources: [
      "Lucro Líquido (calculado acima)",
      "Saques & Aportes → soma dos depósitos"
    ],
    example: "Lucro de R$500 com R$5.000 depositados = 10% ROI"
  },
  bancaAtual: {
    title: "Banca Atual",
    formula: "Aportes Externos - Saques Pessoais + Lucro Líquido",
    sources: [
      "Caixa Geral → aportes e saques pessoais",
      "Lucro Líquido (calculado)"
    ],
    example: "Aportou R$10k, sacou R$2k, lucrou R$1k = Banca de R$9k"
  },
  exposicaoRisco: {
    title: "Exposição ao Risco (Float)",
    formula: "Soma(Casas.saldo_real)",
    sources: [
      "Casas de Apostas → saldo_real (atualizado automaticamente)",
      "Inclui: depósitos - saques + lucro apostas + lucro cassino"
    ],
    example: "Dinheiro 'na rua' em casas de apostas. Alerta se > 50% da banca"
  },
  taxaAcerto: {
    title: "Taxa de Acerto",
    formula: "(Apostas ganhas / Total apostas) × 100",
    sources: [
      "Apostas → resultado = 'green'",
      "Surebets → lucro_prejuizo > 0"
    ],
    example: "10 apostas, 6 green = 60% taxa de acerto"
  },
  lucroApostas: {
    title: "Lucro das Apostas",
    formula: "Soma(Apostas.lucro_prejuizo)",
    sources: [
      "Apostas → lucro calculado automaticamente pelo banco",
      "Green: (odd - 1) × stake | Red: -stake | Void: 0"
    ],
    example: "Odd 2.00, Stake R$100, Green = Lucro R$100"
  },
  lucroSurebets: {
    title: "Lucro das Surebets",
    formula: "Soma(Surebets.lucro_prejuizo)",
    sources: [
      "Apostas Surebet → campo 'lucro_prejuizo'"
    ],
    example: "Surebet de 3% em R$1.000 investido = R$30 lucro garantido"
  },
  velocidadeCruzeiro: {
    title: "Velocidade de Cruzeiro",
    formula: "Lucro Líquido / Total de Dias",
    sources: [
      "Lucro Líquido Total",
      "Quantidade de registros no Diário"
    ],
    example: "R$3.000 de lucro em 30 dias = R$100/dia de velocidade"
  },
  runway: {
    title: "Runway (Dias de Sobrevivência)",
    formula: "Banca Atual / |Pior Dia|",
    sources: [
      "Banca Atual (calculado)",
      "Diário → menor valor_resultado"
    ],
    example: "Banca de R$10k, pior dia foi -R$500 = 20 dias de runway"
  },
  // Cassino
  lucroCassino: {
    title: "Lucro/Prejuízo Cassino",
    formula: "Soma(Cassino.valor_resultado)",
    sources: [
      "Cassino → Diário: saldo_final - saldo_inicial",
      "Cassino → Sessão: cash_out - buy_in"
    ],
    example: "Saldo inicial R$500, saldo final R$650 = Lucro R$150"
  },
  roiCassino: {
    title: "ROI Cassino",
    formula: "(Lucro Total / Total Buy-in) × 100",
    sources: [
      "Cassino → soma de valor_resultado",
      "Cassino → soma de buy_in (sessões)"
    ],
    example: "Lucro de R$300 com R$1.000 de buy-in = 30% ROI"
  },
  // Apostas
  totalInvestido: {
    title: "Total Investido",
    formula: "Soma(Apostas.stake)",
    sources: [
      "Apostas → campo 'stake' de cada aposta"
    ],
    example: "10 apostas de R$100 cada = R$1.000 investido"
  },
  greensReds: {
    title: "Greens / Reds",
    formula: "Contagem por resultado",
    sources: [
      "Apostas → contagem onde resultado = 'green'",
      "Apostas → contagem onde resultado = 'red'"
    ],
    example: "6 greens e 4 reds = 60% de acerto"
  },
  // Casas
  saldoReal: {
    title: "Saldo Real na Casa",
    formula: "Depósitos - Saques + Lucro Apostas + Lucro Cassino",
    sources: [
      "Saques/Aportes → depósitos e saques da casa",
      "Apostas → lucro/prejuízo vinculado à casa",
      "Cassino → valor_resultado vinculado à plataforma"
    ],
    example: "Depositou R$1.000, sacou R$200, ganhou R$300 = Saldo R$1.100"
  },
  // Saques e Aportes
  depositos: {
    title: "Total Depositado",
    formula: "Soma(SaquesAportes.valor) onde tipo = 'deposito'",
    sources: [
      "Saques & Aportes → registros do tipo 'deposito'"
    ],
    example: "3 depósitos: R$500 + R$300 + R$200 = R$1.000"
  },
  saques: {
    title: "Total Sacado",
    formula: "Soma(SaquesAportes.valor) onde tipo = 'saque'",
    sources: [
      "Saques & Aportes → registros do tipo 'saque'"
    ],
    example: "2 saques: R$400 + R$100 = R$500"
  },

  // Casas
  casasAtivas: {
    title: "Casas Ativas",
    formula: "Contagem(Casas) onde usando = true e situacao = 'ativa'",
    sources: [
      "Casas → campos 'usando' e 'situacao'"
    ],
    example: "Se você tem 10 casas e 6 estão usando + ativas, então Casas Ativas = 6"
  },
  casasLimitadas: {
    title: "Casas Limitadas",
    formula: "Contagem(Casas) onde situacao = 'limitada'",
    sources: [
      "Casas → campo 'situacao'"
    ],
    example: "Se 2 casas estão com situacao=limitada, então Casas Limitadas = 2"
  },
  roiMedioCasas: {
    title: "ROI Médio (Casas)",
    formula: "Média(Casas.percentual_retorno)",
    sources: [
      "Casas → campo 'percentual_retorno'"
    ],
    example: "Se as casas têm 10%, 20% e 0%, a média é 10%"
  },

  // Caixa Geral
  caixaTotalAportes: {
    title: "Total Aportes (Caixa)",
    formula: "Soma(CaixaGeral.valor_aporte)",
    sources: [
      "Caixa Geral → registros do tipo 'aporte' (valor_aporte)"
    ],
    example: "Aporte R$500 + R$300 = R$800"
  },
  caixaTotalSaques: {
    title: "Total Saques (Caixa)",
    formula: "Soma(CaixaGeral.valor_saque)",
    sources: [
      "Caixa Geral → registros do tipo 'saque' (valor_saque)"
    ],
    example: "Saque R$200 + R$150 = R$350"
  },
  caixaTotalCustos: {
    title: "Total Custos (Caixa)",
    formula: "Soma(CaixaGeral.valor_custo)",
    sources: [
      "Caixa Geral → registros do tipo 'custo' (valor_custo)"
    ],
    example: "3 custos: R$50 + R$20 + R$30 = R$100"
  },
  caixaSaldoLiquido: {
    title: "Saldo Líquido (Caixa)",
    formula: "Aportes - Saques - Custos",
    sources: [
      "Totais calculados no topo do Caixa Geral"
    ],
    example: "Aportes R$1.000, Saques R$200, Custos R$100 => Saldo = R$700"
  },
  caixaTotalRegistros: {
    title: "Total de Registros (Caixa)",
    formula: "Contagem(CaixaGeral)",
    sources: [
      "Caixa Geral → quantidade de linhas no período filtrado"
    ],
    example: "Se há 25 lançamentos no mês, Total Registros = 25"
  },

  // Diário
  diarioLucroTotal: {
    title: "Lucro Total (Diário)",
    formula: "Soma(Diário.valor_resultado)",
    sources: [
      "Diário de Operações → campo 'valor_resultado'"
    ],
    example: "R$100 + (-R$50) + R$30 = R$80"
  },
  diarioDiasPositivos: {
    title: "Dias Positivos (Diário)",
    formula: "Contagem(Diário) onde valor_resultado > 0",
    sources: [
      "Diário de Operações → valor_resultado"
    ],
    example: "Se 18 dias fecharam positivo, Dias Positivos = 18"
  },
  diarioDiasNegativos: {
    title: "Dias Negativos (Diário)",
    formula: "Contagem(Diário) onde valor_resultado < 0",
    sources: [
      "Diário de Operações → valor_resultado"
    ],
    example: "Se 7 dias fecharam negativo, Dias Negativos = 7"
  },
  diarioMelhorDia: {
    title: "Melhor Dia (Diário)",
    formula: "Máx(Diário.valor_resultado)",
    sources: [
      "Diário de Operações → valor_resultado"
    ],
    example: "Se o maior resultado foi R$350, Melhor Dia = R$350"
  },
  diarioMediaDiaria: {
    title: "Média Diária",
    formula: "Lucro Total / Total de Dias",
    sources: [
      "Lucro Total do período",
      "Quantidade de registros do Diário no período"
    ],
    example: "R$900 em 30 dias = R$30/dia"
  },

  // Apostas
  apostasReds: {
    title: "Reds",
    formula: "Contagem(Apostas) onde resultado = 'red'",
    sources: [
      "Apostas → campo 'resultado'"
    ],
    example: "Se 4 apostas deram red no período, Reds = 4"
  },

  // Saques & Aportes
  saquesAportesCasasMovimentadas: {
    title: "Casas Movimentadas",
    formula: "Contagem Distinta(saques_aportes.casa_nome)",
    sources: [
      "Saques & Aportes → campo 'casa_nome'"
    ],
    example: "Se você movimentou 6 casas diferentes no mês, Casas Movimentadas = 6"
  },
  saquesAportesTotalMovimentacoes: {
    title: "Total de Movimentações",
    formula: "Contagem(saques_aportes)",
    sources: [
      "Saques & Aportes → quantidade de linhas no período filtrado"
    ],
    example: "Se há 40 lançamentos, Total Movimentações = 40"
  },

  // Cassino
  cassinoDiasPositivos: {
    title: "Dias Positivos (Cassino)",
    formula: "Contagem(Cassino) onde valor_resultado > 0",
    sources: [
      "Cassino → valor_resultado"
    ],
    example: "Se 12 sessões/dias fecharam positivo, Dias Positivos = 12"
  },
  cassinoDiasNegativos: {
    title: "Dias Negativos (Cassino)",
    formula: "Contagem(Cassino) onde valor_resultado < 0",
    sources: [
      "Cassino → valor_resultado"
    ],
    example: "Se 5 sessões/dias fecharam negativo, Dias Negativos = 5"
  },
  cassinoTotalSessoes: {
    title: "Total Sessões (Cassino)",
    formula: "Contagem(Cassino) onde tipo_registro = 'sessao'",
    sources: [
      "Cassino → campo 'tipo_registro'"
    ],
    example: "Se você registrou 20 sessões, Total Sessões = 20"
  },

  // Surebets
  surebetsTotal: {
    title: "Total de Surebets",
    formula: "Contagem(ApostasSurebet)",
    sources: [
      "Surebets → quantidade de linhas no período filtrado"
    ],
    example: "Se há 15 surebets registradas, Total Surebets = 15"
  },
  surebetsTotalInvestido: {
    title: "Total Investido (Surebets)",
    formula: "Soma(ApostasSurebet.investimento_total)",
    sources: [
      "Apostas Surebet → campo 'investimento_total'"
    ],
    example: "R$500 + R$700 + R$300 = R$1.500 investido"
  },
};
