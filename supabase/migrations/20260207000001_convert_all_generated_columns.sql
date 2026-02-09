-- 1. Tabela 'casas'
ALTER TABLE public.casas DROP COLUMN IF EXISTS lucro_prejuizo;
ALTER TABLE public.casas DROP COLUMN IF EXISTS percentual_retorno;
ALTER TABLE public.casas ADD COLUMN lucro_prejuizo NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.casas ADD COLUMN percentual_retorno NUMERIC(6,2) DEFAULT 0;

UPDATE public.casas SET 
  lucro_prejuizo = saques - depositos,
  percentual_retorno = CASE WHEN depositos > 0 THEN ((saques - depositos) / depositos) * 100 ELSE 0 END;

-- 2. Tabela 'caixa_geral' (Reforçando caso a anterior não tenha rodado)
ALTER TABLE public.caixa_geral DROP COLUMN IF EXISTS valor_aporte;
ALTER TABLE public.caixa_geral DROP COLUMN IF EXISTS valor_saque;
ALTER TABLE public.caixa_geral DROP COLUMN IF EXISTS valor_custo;
ALTER TABLE public.caixa_geral ADD COLUMN valor_aporte NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.caixa_geral ADD COLUMN valor_saque NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.caixa_geral ADD COLUMN valor_custo NUMERIC(12,2) DEFAULT 0;

UPDATE public.caixa_geral SET 
  valor_aporte = CASE WHEN tipo = 'aporte' THEN valor ELSE 0 END,
  valor_saque = CASE WHEN tipo = 'saque' THEN valor ELSE 0 END,
  valor_custo = CASE WHEN tipo = 'custo' THEN valor ELSE 0 END;

-- 3. Tabela 'saques_aportes' (Reforçando)
ALTER TABLE public.saques_aportes DROP COLUMN IF EXISTS valor_deposito;
ALTER TABLE public.saques_aportes DROP COLUMN IF EXISTS valor_saque;
ALTER TABLE public.saques_aportes ADD COLUMN valor_deposito NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.saques_aportes ADD COLUMN valor_saque NUMERIC(12,2) DEFAULT 0;

UPDATE public.saques_aportes SET 
  valor_deposito = CASE WHEN tipo = 'deposito' THEN valor ELSE 0 END,
  valor_saque = CASE WHEN tipo = 'saque' THEN valor ELSE 0 END;

-- 4. Tabela 'diario_operacoes'
ALTER TABLE public.diario_operacoes DROP COLUMN IF EXISTS tipo;
ALTER TABLE public.diario_operacoes DROP COLUMN IF EXISTS valor_resultado;
ALTER TABLE public.diario_operacoes ADD COLUMN tipo TEXT DEFAULT 'empate';
ALTER TABLE public.diario_operacoes ADD COLUMN valor_resultado NUMERIC(12,2) DEFAULT 0;

UPDATE public.diario_operacoes SET 
  valor_resultado = saldo_final - saldo_inicial,
  tipo = CASE 
    WHEN saldo_final > saldo_inicial THEN 'lucro'
    WHEN saldo_final < saldo_inicial THEN 'prejuizo'
    ELSE 'empate'
  END;

-- 5. Tabela 'apostas_surebet'
ALTER TABLE public.apostas_surebet DROP COLUMN IF EXISTS investimento_total;
ALTER TABLE public.apostas_surebet ADD COLUMN investimento_total NUMERIC(12,2) DEFAULT 0;

UPDATE public.apostas_surebet SET 
  investimento_total = COALESCE(stake1, 0) + COALESCE(stake2, 0) + COALESCE(stake3, 0);

-- 6. Tabela 'fechamento'
ALTER TABLE public.fechamento DROP COLUMN IF EXISTS saldo_teorico;
ALTER TABLE public.fechamento DROP COLUMN IF EXISTS divergencia;
ALTER TABLE public.fechamento ADD COLUMN saldo_teorico NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.fechamento ADD COLUMN divergencia NUMERIC(12,2) DEFAULT 0;

UPDATE public.fechamento SET 
  saldo_teorico = saldo_inicial + aportes_externos + resumo_jogos - saques_pessoais - custos,
  divergencia = saldo_real - (saldo_inicial + aportes_externos + resumo_jogos - saques_pessoais - custos);
