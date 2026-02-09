-- Migration para corrigir o problema do lucro_prejuizo em apostas
-- O problema era que o trigger estava sendo acionado mesmo quando não necessário

-- 1. Remove os triggers antigos
DROP TRIGGER IF EXISTS trigger_calc_aposta ON public.apostas;
DROP TRIGGER IF EXISTS trigger_calc_aposta_lucro ON public.apostas;

-- 2. Recria a função de cálculo do lucro de forma mais robusta
CREATE OR REPLACE FUNCTION public.calc_aposta_lucro()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcula o lucro_prejuizo baseado no resultado
  IF NEW.resultado = 'green' AND NEW.odd IS NOT NULL AND NEW.stake IS NOT NULL THEN
    NEW.lucro_prejuizo := (NEW.odd - 1) * NEW.stake;
  ELSIF NEW.resultado = 'red' AND NEW.stake IS NOT NULL THEN
    NEW.lucro_prejuizo := -NEW.stake;
  ELSIF NEW.resultado = 'void' THEN
    NEW.lucro_prejuizo := 0;
  ELSIF NEW.resultado = 'cashout' THEN
    -- Para cashout, mantém o valor informado manualmente ou zero
    IF NEW.lucro_prejuizo IS NULL THEN
      NEW.lucro_prejuizo := 0;
    END IF;
  ELSIF NEW.resultado = 'pendente' THEN
    -- Para pendente, define como NULL
    NEW.lucro_prejuizo := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recria o trigger especificando exatamente as colunas que devem acioná-lo
CREATE TRIGGER trigger_calc_aposta_lucro
  BEFORE INSERT OR UPDATE OF resultado, odd, stake
  ON public.apostas
  FOR EACH ROW
  EXECUTE FUNCTION public.calc_aposta_lucro();

-- 4. Atualiza os registros existentes para garantir consistência
UPDATE public.apostas
SET lucro_prejuizo = CASE
  WHEN resultado = 'green' AND odd IS NOT NULL AND stake IS NOT NULL THEN (odd - 1) * stake
  WHEN resultado = 'red' AND stake IS NOT NULL THEN -stake
  WHEN resultado = 'void' THEN 0
  WHEN resultado = 'cashout' THEN COALESCE(lucro_prejuizo, 0)
  WHEN resultado = 'pendente' THEN NULL
  ELSE lucro_prejuizo
END
WHERE resultado IS NOT NULL;
