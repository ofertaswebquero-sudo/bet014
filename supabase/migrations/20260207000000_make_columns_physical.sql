-- Transformar colunas geradas em colunas físicas na tabela caixa_geral
ALTER TABLE public.caixa_geral DROP COLUMN IF EXISTS valor_aporte;
ALTER TABLE public.caixa_geral DROP COLUMN IF EXISTS valor_saque;
ALTER TABLE public.caixa_geral DROP COLUMN IF EXISTS valor_custo;

ALTER TABLE public.caixa_geral ADD COLUMN valor_aporte NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.caixa_geral ADD COLUMN valor_saque NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.caixa_geral ADD COLUMN valor_custo NUMERIC(12,2) DEFAULT 0;

-- Transformar colunas geradas em colunas físicas na tabela saques_aportes
ALTER TABLE public.saques_aportes DROP COLUMN IF EXISTS valor_deposito;
ALTER TABLE public.saques_aportes DROP COLUMN IF EXISTS valor_saque;

ALTER TABLE public.saques_aportes ADD COLUMN valor_deposito NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.saques_aportes ADD COLUMN valor_saque NUMERIC(12,2) DEFAULT 0;

-- Atualizar dados existentes para caixa_geral
UPDATE public.caixa_geral 
SET 
  valor_aporte = CASE WHEN tipo = 'aporte' THEN valor ELSE 0 END,
  valor_saque = CASE WHEN tipo = 'saque' THEN valor ELSE 0 END,
  valor_custo = CASE WHEN tipo = 'custo' THEN valor ELSE 0 END;

-- Atualizar dados existentes para saques_aportes
UPDATE public.saques_aportes 
SET 
  valor_deposito = CASE WHEN tipo = 'deposito' THEN valor ELSE 0 END,
  valor_saque = CASE WHEN tipo = 'saque' THEN valor ELSE 0 END;
