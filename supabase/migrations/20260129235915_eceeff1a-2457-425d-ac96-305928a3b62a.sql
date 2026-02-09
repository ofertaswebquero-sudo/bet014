-- Função para atualizar lucro da casa quando uma aposta é criada/atualizada
CREATE OR REPLACE FUNCTION public.update_casa_lucro_from_aposta()
RETURNS TRIGGER AS $$
BEGIN
  -- Só atualiza se tem casa_id e resultado definido
  IF NEW.casa_id IS NOT NULL AND NEW.lucro_prejuizo IS NOT NULL THEN
    -- Recalcula o lucro total da casa baseado em todas as apostas
    UPDATE public.casas 
    SET lucro_prejuizo = (
      SELECT COALESCE(SUM(lucro_prejuizo), 0) 
      FROM public.apostas 
      WHERE casa_id = NEW.casa_id 
      AND lucro_prejuizo IS NOT NULL
    ),
    updated_at = now()
    WHERE id = NEW.casa_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para apostas normais
DROP TRIGGER IF EXISTS trigger_update_casa_lucro ON public.apostas;
CREATE TRIGGER trigger_update_casa_lucro
  AFTER INSERT OR UPDATE OF lucro_prejuizo ON public.apostas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_casa_lucro_from_aposta();

-- Função para calcular lucro_prejuizo automaticamente na aposta
CREATE OR REPLACE FUNCTION public.calc_aposta_lucro()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resultado = 'green' AND NEW.odd IS NOT NULL AND NEW.stake IS NOT NULL THEN
    NEW.lucro_prejuizo := (NEW.odd - 1) * NEW.stake;
  ELSIF NEW.resultado = 'red' THEN
    NEW.lucro_prejuizo := -NEW.stake;
  ELSIF NEW.resultado = 'void' OR NEW.resultado = 'cashout' THEN
    NEW.lucro_prejuizo := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular lucro antes de insert/update
DROP TRIGGER IF EXISTS trigger_calc_aposta_lucro ON public.apostas;
CREATE TRIGGER trigger_calc_aposta_lucro
  BEFORE INSERT OR UPDATE OF resultado, odd, stake ON public.apostas
  FOR EACH ROW
  EXECUTE FUNCTION public.calc_aposta_lucro();