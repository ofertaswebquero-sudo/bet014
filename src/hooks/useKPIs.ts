import { useMemo } from 'react';
import { useCaixaGeral, useSaquesAportes, useDiarioOperacoes, useCasas, useApostas, useApostasSurebet } from './useSupabaseData';
import type { KPIs, OKRs } from '@/types/database';

export interface KPIFilters {
  startDate?: string;
  endDate?: string;
  casaId?: string;
  tipo?: string;
}

// Interface estendida para incluir métricas de apostas
export interface ExtendedKPIs extends KPIs {
  totalApostas: number;
  totalStake: number;
  winRate: number;
  greens: number;
  reds: number;
}

export function useKPIs(filters: KPIFilters = {}) {
  const { data: caixaGeral } = useCaixaGeral();
  const { data: saquesAportes } = useSaquesAportes();
  const { data: diario } = useDiarioOperacoes();
  const { data: casas } = useCasas();
  const { data: apostas } = useApostas();
  const { data: surebets } = useApostasSurebet();

  // Memoize strings de filtro para evitar que o objeto literal {} cause re-renderizações infinitas
  const filterKey = `${filters.startDate}-${filters.endDate}-${filters.casaId}-${filters.tipo}`;

  const kpis = useMemo<ExtendedKPIs>(() => {
    const filterByDate = <T extends { data: string }>(items: T[] | undefined) => {
      if (!items) return [];
      return items.filter(item => {
        if (filters.startDate && item.data < filters.startDate) return false;
        if (filters.endDate && item.data > filters.endDate) return false;
        return true;
      });
    };

    const caixaFiltrado = filterByDate(caixaGeral);
    const saquesFiltrados = filterByDate(saquesAportes);
    const diarioFiltrado = filterByDate(diario);
    const apostasFiltradas = filterByDate(apostas);
    const surebetsFiltradas = filterByDate(surebets);

    const saquesPorCasa = filters.casaId 
      ? saquesFiltrados.filter(s => s.casa_id === filters.casaId)
      : saquesFiltrados;
    
    const apostasPorCasa = filters.casaId
      ? apostasFiltradas.filter(a => a.casa_id === filters.casaId)
      : apostasFiltradas;

    const totalAportes = caixaFiltrado.reduce((acc, item) => acc + (item.valor_aporte || 0), 0);
    const totalSaques = caixaFiltrado.reduce((acc, item) => acc + (item.valor_saque || 0), 0);
    const totalCustos = caixaFiltrado.reduce((acc, item) => acc + (item.valor_custo || 0), 0);

    const totalDepositadoCasas = saquesPorCasa.reduce((acc, item) => acc + (item.valor_deposito || 0), 0);
    const totalSacadoCasas = saquesPorCasa.reduce((acc, item) => acc + (item.valor_saque || 0), 0);

    const resultadoDiario = diarioFiltrado.reduce((acc, item) => acc + (item.valor_resultado || 0), 0);
    const diasPositivos = diarioFiltrado.filter(d => d.tipo === 'lucro').length;
    const diasNegativos = diarioFiltrado.filter(d => d.tipo === 'prejuizo').length;

    const resultados = diarioFiltrado.map(d => d.valor_resultado);
    const melhorDia = resultados.length > 0 ? Math.max(...resultados) : 0;
    const piorDia = resultados.length > 0 ? Math.min(...resultados) : 0;

    const casasAtivas = casas?.filter(c => c.usando).length || 0;
    const exposicaoRisco = casas?.reduce((acc, c) => acc + (c.depositos - c.saques), 0) || 0;

    const lucroLiquidoTotal = resultadoDiario - totalCustos;
    const bancaAtual = totalAportes - totalSaques + lucroLiquidoTotal;
    const roiGeral = totalDepositadoCasas > 0 ? (lucroLiquidoTotal / totalDepositadoCasas) * 100 : 0;
    const giroTotal = totalDepositadoCasas + totalSacadoCasas;

    const totalDias = diarioFiltrado.length || 1;
    const velocidadeCruzeiro = lucroLiquidoTotal / totalDias;

    const totalApostas = apostasPorCasa.length;
    const totalStake = apostasPorCasa.reduce((acc, a) => acc + (a.stake || 0), 0);
    const greens = apostasPorCasa.filter(a => a.resultado === 'green').length;
    const reds = apostasPorCasa.filter(a => a.resultado === 'red').length;
    const winRate = (greens + reds) > 0 ? (greens / (greens + reds)) * 100 : 0;

    return {
      lucroLiquidoTotal,
      roiGeral,
      totalDepositado: totalDepositadoCasas,
      totalSacado: totalSacadoCasas,
      giroTotal,
      bancaAtual,
      custosMensais: totalCustos,
      velocidadeCruzeiro,
      diasPositivos,
      diasNegativos,
      melhorDia,
      piorDia,
      casasAtivas,
      exposicaoRisco,
      totalApostas,
      totalStake,
      winRate,
      greens,
      reds
    };
  }, [caixaGeral, saquesAportes, diario, casas, apostas, surebets, filterKey]);

  const okrs = useMemo<OKRs>(() => {
    const projecaoSemanal = kpis.velocidadeCruzeiro * 7;
    const projecaoMensal = kpis.velocidadeCruzeiro * 30;
    const projecaoAnual = kpis.velocidadeCruzeiro * 365;

    const prejuizoMedio = kpis.piorDia < 0 ? Math.abs(kpis.piorDia) : 100;
    const runway = kpis.bancaAtual > 0 ? Math.floor(kpis.bancaAtual / (prejuizoMedio || 1)) : 0;

    return {
      metaLucroSemanal: projecaoSemanal * 1.2,
      metaLucroMensal: projecaoMensal * 1.2,
      metaROI: 10,
      metaCasasAtivas: 5,
      projecaoAnual,
      runway,
    };
  }, [kpis]);

  const apostasStats = useMemo(() => {
    const totalApostas = kpis.totalApostas + (surebets?.length || 0);
    const totalGanhos = kpis.greens + (surebets?.filter(s => (s.lucro_prejuizo || 0) > 0).length || 0);
    const taxaAcerto = totalApostas > 0 ? (totalGanhos / totalApostas) * 100 : 0;
    const stakeTotal = kpis.totalStake + (surebets?.reduce((acc, s) => acc + s.investimento_total, 0) || 0);
    const ticketMedio = totalApostas > 0 ? stakeTotal / totalApostas : 0;

    return {
      totalApostas,
      taxaAcerto,
      ticketMedio,
    };
  }, [kpis, surebets]);

  return { kpis, okrs, apostasStats };
}
