-- =====================================================
-- TABELA 1: dados_referencia (Tabela mestre de listas)
-- =====================================================
CREATE TABLE public.dados_referencia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL, -- 'banco', 'casa', 'status', 'tipo', 'motivo', 'emoji'
  valor TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELA 2: casas (Cadastro de casas de apostas)
-- =====================================================
CREATE TABLE public.casas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  depositos NUMERIC(12,2) NOT NULL DEFAULT 0,
  saques NUMERIC(12,2) NOT NULL DEFAULT 0,
  lucro_prejuizo NUMERIC(12,2) GENERATED ALWAYS AS (saques - depositos) STORED,
  percentual_retorno NUMERIC(6,2) GENERATED ALWAYS AS (
    CASE WHEN depositos > 0 THEN ((saques - depositos) / depositos) * 100 ELSE 0 END
  ) STORED,
  ultimo_deposito NUMERIC(12,2),
  data_ultimo_deposito DATE,
  quantidade_depositos INTEGER NOT NULL DEFAULT 0,
  quantidade_saques INTEGER NOT NULL DEFAULT 0,
  deposito_minimo NUMERIC(12,2),
  saque_minimo NUMERIC(12,2),
  usando BOOLEAN NOT NULL DEFAULT true,
  situacao TEXT DEFAULT 'ativa', -- ativa, pausada, encerrada
  login TEXT,
  senha TEXT,
  email TEXT,
  link TEXT,
  data_criacao DATE DEFAULT CURRENT_DATE,
  usuario TEXT,
  id_conta TEXT,
  verificada BOOLEAN DEFAULT false,
  data_verificacao DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELA 3: caixa_geral (Custos e aportes na estrutura)
-- =====================================================
CREATE TABLE public.caixa_geral (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL, -- 'aporte', 'saque', 'custo'
  valor NUMERIC(12,2) NOT NULL,
  descricao TEXT,
  origem_obs TEXT,
  banco TEXT,
  print_url TEXT,
  valor_aporte NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE WHEN tipo = 'aporte' THEN valor ELSE 0 END
  ) STORED,
  valor_saque NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE WHEN tipo = 'saque' THEN valor ELSE 0 END
  ) STORED,
  valor_custo NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE WHEN tipo = 'custo' THEN valor ELSE 0 END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELA 4: saques_aportes (Movimentações nas casas)
-- =====================================================
CREATE TABLE public.saques_aportes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  casa_id UUID REFERENCES public.casas(id) ON DELETE SET NULL,
  casa_nome TEXT,
  tipo TEXT NOT NULL, -- 'deposito', 'saque'
  valor NUMERIC(12,2) NOT NULL,
  obs TEXT,
  motivo TEXT,
  print_url TEXT,
  banco TEXT,
  status TEXT DEFAULT 'concluido', -- pendente, concluido, cancelado
  valor_deposito NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE WHEN tipo = 'deposito' THEN valor ELSE 0 END
  ) STORED,
  valor_saque NUMERIC(12,2) GENERATED ALWAYS AS (
    CASE WHEN tipo = 'saque' THEN valor ELSE 0 END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELA 5: diario_operacoes (Lucro/Prejuízo diário)
-- =====================================================
CREATE TABLE public.diario_operacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  saldo_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_final NUMERIC(12,2) NOT NULL DEFAULT 0,
  tipo TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN saldo_final > saldo_inicial THEN 'lucro'
      WHEN saldo_final < saldo_inicial THEN 'prejuizo'
      ELSE 'empate'
    END
  ) STORED,
  valor_resultado NUMERIC(12,2) GENERATED ALWAYS AS (saldo_final - saldo_inicial) STORED,
  obs TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELA 6: apostas (Apostas esportivas normais)
-- =====================================================
CREATE TABLE public.apostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  casa_id UUID REFERENCES public.casas(id) ON DELETE SET NULL,
  casa_nome TEXT,
  evento TEXT,
  mercado TEXT,
  selecao TEXT,
  odd NUMERIC(8,2),
  stake NUMERIC(12,2) NOT NULL,
  resultado TEXT, -- 'green', 'red', 'void', 'cashout', 'pendente'
  lucro_prejuizo NUMERIC(12,2),
  obs TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELA 7: apostas_surebet (Apostas do tipo Surebet)
-- =====================================================
CREATE TABLE public.apostas_surebet (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  evento TEXT,
  -- Casa 1
  casa1_id UUID REFERENCES public.casas(id) ON DELETE SET NULL,
  casa1_nome TEXT,
  selecao1 TEXT,
  odd1 NUMERIC(8,2),
  stake1 NUMERIC(12,2),
  resultado1 TEXT, -- 'green', 'red', 'void', 'pendente'
  -- Casa 2
  casa2_id UUID REFERENCES public.casas(id) ON DELETE SET NULL,
  casa2_nome TEXT,
  selecao2 TEXT,
  odd2 NUMERIC(8,2),
  stake2 NUMERIC(12,2),
  resultado2 TEXT,
  -- Casa 3 (opcional)
  casa3_id UUID REFERENCES public.casas(id) ON DELETE SET NULL,
  casa3_nome TEXT,
  selecao3 TEXT,
  odd3 NUMERIC(8,2),
  stake3 NUMERIC(12,2),
  resultado3 TEXT,
  -- Totais
  investimento_total NUMERIC(12,2) GENERATED ALWAYS AS (
    COALESCE(stake1, 0) + COALESCE(stake2, 0) + COALESCE(stake3, 0)
  ) STORED,
  lucro_prejuizo NUMERIC(12,2),
  percentual_surebet NUMERIC(6,2),
  obs TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TABELA 8: fechamento (Resumo semanal/período)
-- =====================================================
CREATE TABLE public.fechamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  saldo_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  aportes_externos NUMERIC(12,2) NOT NULL DEFAULT 0,
  resumo_jogos NUMERIC(12,2) NOT NULL DEFAULT 0,
  saques_pessoais NUMERIC(12,2) NOT NULL DEFAULT 0,
  custos NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_teorico NUMERIC(12,2) GENERATED ALWAYS AS (
    saldo_inicial + aportes_externos + resumo_jogos - saques_pessoais - custos
  ) STORED,
  saldo_real NUMERIC(12,2),
  divergencia NUMERIC(12,2) GENERATED ALWAYS AS (
    saldo_real - (saldo_inicial + aportes_externos + resumo_jogos - saques_pessoais - custos)
  ) STORED,
  -- KPIs
  roi_periodo NUMERIC(8,2),
  lucro_liquido NUMERIC(12,2),
  total_apostas INTEGER,
  taxa_acerto NUMERIC(6,2),
  ticket_medio NUMERIC(12,2),
  dias_positivos INTEGER,
  dias_negativos INTEGER,
  melhor_dia NUMERIC(12,2),
  pior_dia NUMERIC(12,2),
  -- OKRs
  meta_lucro NUMERIC(12,2),
  meta_atingida BOOLEAN,
  obs TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- VIEW: resultados_apostas_esportivas (Junção de apostas)
-- =====================================================
CREATE VIEW public.resultados_apostas_esportivas AS
SELECT 
  casa_nome,
  SUM(stake) as investimento_total,
  SUM(CASE WHEN lucro_prejuizo > 0 THEN lucro_prejuizo ELSE 0 END) as ganhos_total,
  COUNT(*) as total_movimentacoes,
  SUM(COALESCE(lucro_prejuizo, 0)) as resultado_total,
  'normal' as tipo_aposta
FROM public.apostas
WHERE casa_nome IS NOT NULL
GROUP BY casa_nome

UNION ALL

SELECT 
  casa1_nome as casa_nome,
  SUM(stake1) as investimento_total,
  SUM(CASE WHEN lucro_prejuizo > 0 THEN lucro_prejuizo ELSE 0 END) as ganhos_total,
  COUNT(*) as total_movimentacoes,
  SUM(COALESCE(lucro_prejuizo, 0)) as resultado_total,
  'surebet' as tipo_aposta
FROM public.apostas_surebet
WHERE casa1_nome IS NOT NULL
GROUP BY casa1_nome

UNION ALL

SELECT 
  casa2_nome as casa_nome,
  SUM(stake2) as investimento_total,
  SUM(CASE WHEN lucro_prejuizo > 0 THEN lucro_prejuizo ELSE 0 END) as ganhos_total,
  COUNT(*) as total_movimentacoes,
  SUM(COALESCE(lucro_prejuizo, 0)) as resultado_total,
  'surebet' as tipo_aposta
FROM public.apostas_surebet
WHERE casa2_nome IS NOT NULL
GROUP BY casa2_nome;

-- =====================================================
-- Função para atualizar updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_dados_referencia_updated_at BEFORE UPDATE ON public.dados_referencia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_casas_updated_at BEFORE UPDATE ON public.casas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_caixa_geral_updated_at BEFORE UPDATE ON public.caixa_geral FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_saques_aportes_updated_at BEFORE UPDATE ON public.saques_aportes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_diario_operacoes_updated_at BEFORE UPDATE ON public.diario_operacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_apostas_updated_at BEFORE UPDATE ON public.apostas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_apostas_surebet_updated_at BEFORE UPDATE ON public.apostas_surebet FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fechamento_updated_at BEFORE UPDATE ON public.fechamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Dados iniciais de referência
-- =====================================================
INSERT INTO public.dados_referencia (categoria, valor, descricao, ordem) VALUES
-- Bancos
('banco', 'Nubank', 'Conta Nubank', 1),
('banco', 'Inter', 'Conta Inter', 2),
('banco', 'Bradesco', 'Conta Bradesco', 3),
('banco', 'Itaú', 'Conta Itaú', 4),
('banco', 'Caixa', 'Conta Caixa', 5),
('banco', 'Santander', 'Conta Santander', 6),
('banco', 'PicPay', 'Conta PicPay', 7),
('banco', 'Mercado Pago', 'Conta Mercado Pago', 8),
-- Status
('status', 'pendente', 'Aguardando processamento', 1),
('status', 'concluido', 'Finalizado com sucesso', 2),
('status', 'cancelado', 'Cancelado', 3),
-- Tipos de movimentação
('tipo_caixa', 'aporte', 'Entrada de capital', 1),
('tipo_caixa', 'saque', 'Retirada de capital', 2),
('tipo_caixa', 'custo', 'Despesa operacional', 3),
-- Motivos
('motivo', 'inicio_operacao', 'Início de operação', 1),
('motivo', 'reforco', 'Reforço de banca', 2),
('motivo', 'lucro', 'Retirada de lucro', 3),
('motivo', 'emergencia', 'Necessidade pessoal', 4),
-- Situação das casas
('situacao', 'ativa', 'Casa ativa em uso', 1),
('situacao', 'pausada', 'Casa temporariamente pausada', 2),
('situacao', 'encerrada', 'Casa encerrada', 3),
('situacao', 'limitada', 'Casa com limites', 4),
-- Resultados de apostas
('resultado', 'green', 'Aposta ganha', 1),
('resultado', 'red', 'Aposta perdida', 2),
('resultado', 'void', 'Aposta cancelada/devolvida', 3),
('resultado', 'cashout', 'Encerrada com cashout', 4),
('resultado', 'pendente', 'Aguardando resultado', 5),
-- Emojis
('emoji', '💰', 'Dinheiro/Lucro', 1),
('emoji', '📈', 'Crescimento', 2),
('emoji', '📉', 'Queda', 3),
('emoji', '✅', 'Sucesso/Green', 4),
('emoji', '❌', 'Erro/Red', 5),
('emoji', '⚽', 'Futebol', 6),
('emoji', '🏀', 'Basquete', 7),
('emoji', '🎰', 'Cassino', 8);

-- Enable RLS (sem autenticação por enquanto - V1)
ALTER TABLE public.dados_referencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.casas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_geral ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saques_aportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_operacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apostas_surebet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechamento ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (V1 sem auth)
CREATE POLICY "Allow all for dados_referencia" ON public.dados_referencia FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for casas" ON public.casas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for caixa_geral" ON public.caixa_geral FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for saques_aportes" ON public.saques_aportes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for diario_operacoes" ON public.diario_operacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for apostas" ON public.apostas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for apostas_surebet" ON public.apostas_surebet FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for fechamento" ON public.fechamento FOR ALL USING (true) WITH CHECK (true);