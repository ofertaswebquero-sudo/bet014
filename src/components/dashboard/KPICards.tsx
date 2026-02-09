import { useKPIs, KPIFilters, ExtendedKPIs } from "@/hooks/useKPIs";
import { StatCard, formatCurrency, formatPercent } from "./StatCard";
import { DataSourceInfo, KPI_EXPLANATIONS } from "@/components/shared/DataSourceInfo";
import {
  Wallet,
  PiggyBank,
  Target,
  Building2,
  AlertTriangle,
  Calendar,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Trophy
} from "lucide-react";

interface KPICardsProps {
  filters?: KPIFilters;
}

export function KPICards({ filters }: KPICardsProps) {
  const { kpis, okrs } = useKPIs(filters);
  const extendedKpis = kpis as ExtendedKPIs;

  return (
    <div className="space-y-2">
      {/* Principais KPIs - Destaque Maior */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          isHero
          title={
            <span className="flex items-center gap-1">
              Lucro Líquido
              <DataSourceInfo {...KPI_EXPLANATIONS.lucroLiquido} />
            </span>
          }
          value={formatCurrency(extendedKpis.lucroLiquidoTotal)}
          icon={<Wallet />}
          variant={extendedKpis.lucroLiquidoTotal >= 0 ? 'success' : 'danger'}
          trend={extendedKpis.lucroLiquidoTotal >= 0 ? 'up' : 'down'}
          trendValue={formatPercent(extendedKpis.roiGeral)}
          className="sm:col-span-2 lg:col-span-1"
        />
        <StatCard
          isHero
          title={
            <span className="flex items-center gap-1">
              Banca Atual
              <DataSourceInfo {...KPI_EXPLANATIONS.bancaAtual} />
            </span>
          }
          value={formatCurrency(extendedKpis.bancaAtual)}
          icon={<PiggyBank />}
          variant="primary"
          subtitle={`Exposição: ${formatCurrency(extendedKpis.exposicaoRisco)}`}
          className="sm:col-span-2 lg:col-span-1"
        />
        <StatCard
          isHero
          title={
            <span className="flex items-center gap-1">
              ROI Período
              <DataSourceInfo {...KPI_EXPLANATIONS.roiGeral} />
            </span>
          }
          value={formatPercent(extendedKpis.roiGeral)}
          icon={<Target />}
          variant={extendedKpis.roiGeral >= 0 ? 'success' : 'danger'}
          subtitle={`Meta: ${formatPercent(okrs.metaROI)}`}
        />
        <StatCard
          isHero
          title="Win Rate"
          value={`${extendedKpis.winRate.toFixed(1)}%`}
          icon={<Trophy />}
          variant="info"
          subtitle={`Greens: ${extendedKpis.greens} | Reds: ${extendedKpis.reds}`}
        />
      </div>

      {/* Performance e Movimentação - Grid Secundário */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Depositado"
          value={formatCurrency(extendedKpis.totalDepositado)}
          icon={<ArrowDownRight />}
          variant="danger"
        />
        <StatCard
          title="Total Sacado"
          value={formatCurrency(extendedKpis.totalSacado)}
          icon={<ArrowUpRight />}
          variant="success"
        />
        <StatCard
          title="Giro Total"
          value={formatCurrency(extendedKpis.giroTotal)}
          icon={<BarChart3 />}
          subtitle="Depositos + Saques"
        />
        <StatCard
          title="Custos Mensais"
          value={formatCurrency(extendedKpis.custosMensais)}
          icon={<AlertTriangle />}
          variant="warning"
        />
      </div>

      {/* Métricas de Operação */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={
            <span className="flex items-center gap-1">
              Velocidade Cruzeiro
              <DataSourceInfo {...KPI_EXPLANATIONS.velocidadeCruzeiro} />
            </span>
          }
          value={formatCurrency(extendedKpis.velocidadeCruzeiro)}
          subtitle="Lucro médio por dia"
          icon={<Zap />}
          variant="warning"
        />
        <StatCard
          title="Dias Positivos"
          value={extendedKpis.diasPositivos}
          icon={<Calendar />}
          variant="success"
          subtitle={`Negativos: ${extendedKpis.diasNegativos}`}
        />
        <StatCard
          title="Casas Ativas"
          value={extendedKpis.casasAtivas}
          icon={<Building2 />}
          variant="info"
          subtitle={`Meta: ${okrs.metaCasasAtivas}`}
        />
        <StatCard
          title={
            <span className="flex items-center gap-1">
              Runway
              <DataSourceInfo {...KPI_EXPLANATIONS.runway} />
            </span>
          }
          value={`${okrs.runway} dias`}
          subtitle="Até a banca zerar"
          variant={okrs.runway > 30 ? 'success' : okrs.runway > 7 ? 'warning' : 'danger'}
        />
      </div>
    </div>
  );
}
