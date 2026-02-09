export type PageExplanationSection = {
  title: string;
  items: string[];
};

export type PageExplanationContent = {
  title: string;
  description: string;
  sections: PageExplanationSection[];
};

// Mapa por rota. Mantemos isso centralizado para garantir que TODAS as páginas
// tenham explicação de tabelas e lógicas sem precisar repetir código em cada tela.
export const PAGE_EXPLANATIONS_BY_ROUTE: Record<string, PageExplanationContent> = {
  "/": {
    title: "Dashboard",
    description: "Visão geral com KPIs e alertas para decisão rápida.",
    sections: [
      {
        title: "Tabelas usadas",
        items: [
          "diario_operacoes (resultado diário)",
          "casas (saldo e lucro por casa)",
          "saques_aportes (fluxo de depósitos/saques)",
          "apostas / apostas_surebet (performance esportiva)",
          "cassino (resultado de cassino)",
        ],
      },
      {
        title: "Lógicas",
        items: [
          "KPIs somam resultados e custos para chegar em lucro líquido",
          "Alertas de risco olham exposição (float) e concentração por casas",
        ],
      },
    ],
  },

  "/casas": {
    title: "Casas de Apostas",
    description: "Cadastro e acompanhamento de saldo, limites e performance por casa.",
    sections: [
      { title: "Tabelas usadas", items: ["casas", "casas_tags (vínculo casa↔tags)", "tags"] },
      {
        title: "Lógicas",
        items: [
          "Saldo Real é o valor na casa (depósitos - saques + resultados)",
          "% banca ajuda a limitar concentração em uma única casa",
          "Situação (ativa/limitada/encerrada) é usada nos filtros e KPIs",
        ],
      },
    ],
  },

  "/diario": {
    title: "Diário de Operações",
    description: "Registra o resultado do dia comparando saldo inicial vs saldo final.",
    sections: [
      { title: "Tabelas usadas", items: ["diario_operacoes"] },
      {
        title: "Lógicas",
        items: [
          "valor_resultado = saldo_final - saldo_inicial",
          "KPIs contam dias positivos/negativos e calculam média diária",
        ],
      },
    ],
  },

  "/caixa": {
    title: "Caixa Geral",
    description: "Controle de aportes, saques pessoais e custos (auditoria do caixa).",
    sections: [
      { title: "Tabelas usadas", items: ["caixa_geral", "dados_referencia (banco)"] },
      {
        title: "Lógicas",
        items: [
          "Aportes, Saques e Custos ficam em colunas separadas para facilitar o cálculo",
          "Saldo Líquido do período = aportes - saques - custos",
        ],
      },
    ],
  },

  "/saques-aportes": {
    title: "Saques & Aportes",
    description: "Movimentações de depósitos e saques dentro das casas.",
    sections: [
      { title: "Tabelas usadas", items: ["saques_aportes", "casas", "dados_referencia (banco/motivo)"] },
      {
        title: "Lógicas",
        items: [
          "Float (na rua) = depósitos - saques",
          "Casas movimentadas = quantidade distinta de casas no período",
        ],
      },
    ],
  },

  "/apostas": {
    title: "Apostas Esportivas",
    description: "Registro de apostas normais (stake, odd, resultado e lucro/prejuízo).",
    sections: [
      { title: "Tabelas usadas", items: ["apostas", "casas", "dados_referencia (resultado)"] },
      {
        title: "Lógicas",
        items: [
          "Green: (odd × stake) - stake",
          "Red: -stake | Void: 0",
          "KPIs somam stake (investido), contam greens/reds e somam lucro_prejuizo",
        ],
      },
      {
        title: "Checklist de consistência",
        items: ["Data obrigatória", "Stake > 0", "Odd > 1 para cálculo automático de green"],
      },
    ],
  },

  "/surebets": {
    title: "Surebets",
    description: "Registro de arbitragem (duas ou três casas) com lucro esperado.",
    sections: [
      { title: "Tabelas usadas", items: ["apostas_surebet", "casas"] },
      {
        title: "Lógicas",
        items: [
          "% surebet (aprox.) é derivado de 1/odd1 + 1/odd2 (+ 1/odd3)",
          "Total investido soma investimento_total (ou stakes quando preenchidos)",
        ],
      },
    ],
  },

  "/cassino": {
    title: "Cassino",
    description: "Registros em modo Diário (saldo) ou Sessão (buy-in/cash-out).",
    sections: [
      { title: "Tabelas usadas", items: ["cassino", "casas"] },
      {
        title: "Lógicas",
        items: [
          "Diário: valor_resultado = saldo_final - saldo_inicial",
          "Sessão: valor_resultado = cash_out - buy_in",
          "ROI = (lucro total / total buy-in) × 100",
        ],
      },
    ],
  },

  "/fechamento": {
    title: "Fechamento",
    description: "Auditoria por período: compara saldo teórico vs saldo real e aponta divergência.",
    sections: [
      { title: "Tabelas usadas", items: ["fechamento", "diario_operacoes", "apostas", "apostas_surebet", "saques_aportes", "caixa_geral"] },
      {
        title: "Lógicas",
        items: [
          "Saldo Teórico = saldo_inicial + aportes_externos + resumo_jogos - saques_pessoais - custos",
          "Divergência = saldo_real - saldo_teorico",
        ],
      },
    ],
  },

  "/dados": {
    title: "Dados de Referência",
    description: "Listas auxiliares (bancos, motivos, resultados, categorias) usadas em selects e validações.",
    sections: [{ title: "Tabelas usadas", items: ["dados_referencia"] }],
  },

  "/resultados": {
    title: "Resultados",
    description: "Consolidações e visões para análise (ex.: por casa/tipo).",
    sections: [{ title: "Views/Tabelas usadas", items: ["resultados_apostas_esportivas (view)"] }],
  },

  "/configuracoes": {
    title: "Configurações",
    description: "Ajustes gerais do sistema (preferências e parâmetros).",
    sections: [{ title: "Observação", items: ["Sem tabela fixa: depende dos recursos habilitados."] }],
  },

  "/gestao": {
    title: "Gestão Estratégica",
    description: "Planejamento/gestão (OKRs e acompanhamento).",
    sections: [{ title: "Tabelas usadas", items: ["okrs"] }],
  },

  "/analise": {
    title: "Análise de Estratégias",
    description: "Área para comparar abordagens e resultados ao longo do tempo.",
    sections: [{ title: "Tabelas usadas", items: ["apostas", "apostas_surebet", "diario_operacoes"] }],
  },

  "/banca": {
    title: "Banca",
    description: "Acompanhamento da banca e métricas relacionadas ao capital.",
    sections: [{ title: "Tabelas usadas", items: ["caixa_geral", "saques_aportes", "diario_operacoes"] }],
  },

  "/planilha": {
    title: "Planilha",
    description: "Importação/Exportação e apoio para conciliação manual.",
    sections: [{ title: "Observação", items: ["Pode ler/gravar múltiplas tabelas dependendo da ação."] }],
  },

  "*": {
    title: "Ajuda",
    description: "Explicação desta tela.",
    sections: [
      {
        title: "Como ler os números",
        items: ["Procure o ícone de ajuda (i) nos KPIs para ver fórmula e origem dos dados."],
      },
    ],
  },
};
