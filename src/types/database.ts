// Tipos das tabelas do banco de dados

export interface DadosReferencia {
  id: string;
  categoria: string;
  valor: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface Casa {
  id: string;
  nome: string;
  depositos: number;
  saques: number;
  lucro_prejuizo: number;
  percentual_retorno: number;
  ultimo_deposito: number | null;
  data_ultimo_deposito: string | null;
  quantidade_depositos: number;
  quantidade_saques: number;
  deposito_minimo: number | null;
  saque_minimo: number | null;
  usando: boolean;
  situacao: string;
  login: string | null;
  senha: string | null;
  email: string | null;
  link: string | null;
  data_criacao: string | null;
  usuario: string | null;
  id_conta: string | null;
  verificada: boolean;
  data_verificacao: string | null;
  observacoes: string | null;
  saldo_real: number;
  percentual_maximo_banca: number;
  limite_saque_diario: number | null;
  limite_saque_mensal: number | null;
  created_at: string;
  updated_at: string;
}

export interface CaixaGeral {
  id: string;
  data: string;
  tipo: 'aporte' | 'saque' | 'custo';
  valor: number;
  descricao: string | null;
  origem_obs: string | null;
  banco: string | null;
  print_url: string | null;
  valor_aporte: number;
  valor_saque: number;
  valor_custo: number;
  created_at: string;
  updated_at: string;
}

export interface SaquesAportes {
  id: string;
  data: string;
  casa_id: string | null;
  casa_nome: string | null;
  tipo: 'deposito' | 'saque';
  valor: number;
  obs: string | null;
  motivo: string | null;
  print_url: string | null;
  banco: string | null;
  status: string;
  valor_deposito: number;
  valor_saque: number;
  created_at: string;
  updated_at: string;
}

export interface DiarioOperacoes {
  id: string;
  data: string;
  saldo_inicial: number;
  saldo_final: number;
  tipo: 'lucro' | 'prejuizo' | 'empate';
  valor_resultado: number;
  obs: string | null;
  created_at: string;
  updated_at: string;
}

export interface Aposta {
  id: string;
  data: string;
  casa_id: string | null;
  casa_nome: string | null;
  evento: string | null;
  mercado: string | null;
  selecao: string | null;
  odd: number | null;
  stake: number;
  resultado: 'green' | 'red' | 'void' | 'cashout' | 'pendente' | null;
  lucro_prejuizo: number | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApostaSurebet {
  id: string;
  data: string;
  evento: string | null;
  casa1_id: string | null;
  casa1_nome: string | null;
  selecao1: string | null;
  odd1: number | null;
  stake1: number | null;
  resultado1: string | null;
  casa2_id: string | null;
  casa2_nome: string | null;
  selecao2: string | null;
  odd2: number | null;
  stake2: number | null;
  resultado2: string | null;
  casa3_id: string | null;
  casa3_nome: string | null;
  selecao3: string | null;
  odd3: number | null;
  stake3: number | null;
  resultado3: string | null;
  investimento_total: number;
  lucro_prejuizo: number | null;
  percentual_surebet: number | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
}

export interface Fechamento {
  id: string;
  data_inicio: string;
  data_fim: string;
  saldo_inicial: number;
  aportes_externos: number;
  resumo_jogos: number;
  saques_pessoais: number;
  custos: number;
  saldo_teorico: number;
  saldo_real: number | null;
  divergencia: number;
  roi_periodo: number | null;
  lucro_liquido: number | null;
  total_apostas: number | null;
  taxa_acerto: number | null;
  ticket_medio: number | null;
  dias_positivos: number | null;
  dias_negativos: number | null;
  melhor_dia: number | null;
  pior_dia: number | null;
  meta_lucro: number | null;
  meta_atingida: boolean | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cassino {
  id: string;
  data: string;
  tipo_registro: 'diario' | 'sessao';
  saldo_inicial: number;
  saldo_final: number;
  jogo: string | null;
  plataforma: string | null;
  plataforma_id: string | null;
  buy_in: number | null;
  cash_out: number | null;
  duracao_minutos: number | null;
  valor_resultado: number;
  tipo: 'lucro' | 'prejuizo' | 'empate';
  obs: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResultadoApostasEsportivas {
  casa_nome: string;
  investimento_total: number;
  ganhos_total: number;
  total_movimentacoes: number;
  resultado_total: number;
  tipo_aposta: 'normal' | 'surebet';
}

// KPIs e métricas
export interface KPIs {
  lucroLiquidoTotal: number;
  roiGeral: number;
  totalDepositado: number;
  totalSacado: number;
  giroTotal: number;
  bancaAtual: number;
  custosMensais: number;
  velocidadeCruzeiro: number; // lucro/dia
  diasPositivos: number;
  diasNegativos: number;
  melhorDia: number;
  piorDia: number;
  casasAtivas: number;
  exposicaoRisco: number; // float nas casas
}

export interface OKRs {
  metaLucroSemanal: number;
  metaLucroMensal: number;
  metaROI: number;
  metaCasasAtivas: number;
  projecaoAnual: number;
  runway: number; // dias que a banca aguenta
}
