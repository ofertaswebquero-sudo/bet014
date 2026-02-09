-- =====================================================
-- TRIGGERS PARA SINCRONIZAÇÃO AUTOMÁTICA DE SALDOS
-- =====================================================

-- 1. Função para atualizar saldo_real da casa após apostas
CREATE OR REPLACE FUNCTION public.sync_casa_saldo_from_aposta()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcula saldo_real da casa com base em todas as apostas + saques/aportes + cassino
  IF TG_OP = 'DELETE' THEN
    IF OLD.casa_id IS NOT NULL THEN
      UPDATE public.casas 
      SET 
        saldo_real = COALESCE(depositos, 0) - COALESCE(saques, 0) + COALESCE((
          SELECT SUM(lucro_prejuizo) FROM public.apostas WHERE casa_id = OLD.casa_id AND lucro_prejuizo IS NOT NULL
        ), 0),
        lucro_prejuizo = COALESCE((
          SELECT SUM(lucro_prejuizo) FROM public.apostas WHERE casa_id = OLD.casa_id AND lucro_prejuizo IS NOT NULL
        ), 0),
        updated_at = now()
      WHERE id = OLD.casa_id;
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.casa_id IS NOT NULL THEN
      UPDATE public.casas 
      SET 
        saldo_real = COALESCE(depositos, 0) - COALESCE(saques, 0) + COALESCE((
          SELECT SUM(lucro_prejuizo) FROM public.apostas WHERE casa_id = NEW.casa_id AND lucro_prejuizo IS NOT NULL
        ), 0),
        lucro_prejuizo = COALESCE((
          SELECT SUM(lucro_prejuizo) FROM public.apostas WHERE casa_id = NEW.casa_id AND lucro_prejuizo IS NOT NULL
        ), 0),
        updated_at = now()
      WHERE id = NEW.casa_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Função para atualizar saldo da casa após surebets
CREATE OR REPLACE FUNCTION public.sync_casa_saldo_from_surebet()
RETURNS TRIGGER AS $$
DECLARE
  casa_ids uuid[];
BEGIN
  -- Coleta todos os casa_ids envolvidos
  IF TG_OP = 'DELETE' THEN
    casa_ids := ARRAY[OLD.casa1_id, OLD.casa2_id, OLD.casa3_id];
  ELSE
    casa_ids := ARRAY[NEW.casa1_id, NEW.casa2_id, NEW.casa3_id];
  END IF;
  
  -- Atualiza cada casa envolvida
  UPDATE public.casas c
  SET 
    saldo_real = COALESCE(c.depositos, 0) - COALESCE(c.saques, 0) + COALESCE((
      SELECT SUM(a.lucro_prejuizo) FROM public.apostas a WHERE a.casa_id = c.id AND a.lucro_prejuizo IS NOT NULL
    ), 0) + COALESCE((
      SELECT SUM(
        CASE 
          WHEN s.casa1_id = c.id THEN COALESCE(s.lucro_prejuizo, 0) / NULLIF(
            (CASE WHEN s.casa1_id IS NOT NULL THEN 1 ELSE 0 END + 
             CASE WHEN s.casa2_id IS NOT NULL THEN 1 ELSE 0 END + 
             CASE WHEN s.casa3_id IS NOT NULL THEN 1 ELSE 0 END), 0)
          WHEN s.casa2_id = c.id THEN COALESCE(s.lucro_prejuizo, 0) / NULLIF(
            (CASE WHEN s.casa1_id IS NOT NULL THEN 1 ELSE 0 END + 
             CASE WHEN s.casa2_id IS NOT NULL THEN 1 ELSE 0 END + 
             CASE WHEN s.casa3_id IS NOT NULL THEN 1 ELSE 0 END), 0)
          WHEN s.casa3_id = c.id THEN COALESCE(s.lucro_prejuizo, 0) / NULLIF(
            (CASE WHEN s.casa1_id IS NOT NULL THEN 1 ELSE 0 END + 
             CASE WHEN s.casa2_id IS NOT NULL THEN 1 ELSE 0 END + 
             CASE WHEN s.casa3_id IS NOT NULL THEN 1 ELSE 0 END), 0)
          ELSE 0
        END
      )
      FROM public.apostas_surebet s 
      WHERE c.id IN (s.casa1_id, s.casa2_id, s.casa3_id)
    ), 0),
    updated_at = now()
  WHERE c.id = ANY(casa_ids) AND c.id IS NOT NULL;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. Função para atualizar saldo da casa após cassino
CREATE OR REPLACE FUNCTION public.sync_casa_saldo_from_cassino()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.plataforma_id IS NOT NULL THEN
      UPDATE public.casas 
      SET 
        saldo_real = COALESCE(depositos, 0) - COALESCE(saques, 0) + COALESCE((
          SELECT SUM(lucro_prejuizo) FROM public.apostas WHERE casa_id = OLD.plataforma_id AND lucro_prejuizo IS NOT NULL
        ), 0) + COALESCE((
          SELECT SUM(valor_resultado) FROM public.cassino WHERE plataforma_id = OLD.plataforma_id
        ), 0),
        updated_at = now()
      WHERE id = OLD.plataforma_id;
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.plataforma_id IS NOT NULL THEN
      UPDATE public.casas 
      SET 
        saldo_real = COALESCE(depositos, 0) - COALESCE(saques, 0) + COALESCE((
          SELECT SUM(lucro_prejuizo) FROM public.apostas WHERE casa_id = NEW.plataforma_id AND lucro_prejuizo IS NOT NULL
        ), 0) + COALESCE((
          SELECT SUM(valor_resultado) FROM public.cassino WHERE plataforma_id = NEW.plataforma_id
        ), 0),
        updated_at = now()
      WHERE id = NEW.plataforma_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 4. Função para atualizar saldo da casa após saques/aportes
CREATE OR REPLACE FUNCTION public.sync_casa_saldo_from_movimento()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.casa_id IS NOT NULL THEN
      UPDATE public.casas 
      SET 
        depositos = COALESCE((SELECT SUM(valor) FROM public.saques_aportes WHERE casa_id = OLD.casa_id AND tipo = 'deposito'), 0),
        saques = COALESCE((SELECT SUM(valor) FROM public.saques_aportes WHERE casa_id = OLD.casa_id AND tipo = 'saque'), 0),
        quantidade_depositos = COALESCE((SELECT COUNT(*) FROM public.saques_aportes WHERE casa_id = OLD.casa_id AND tipo = 'deposito'), 0),
        quantidade_saques = COALESCE((SELECT COUNT(*) FROM public.saques_aportes WHERE casa_id = OLD.casa_id AND tipo = 'saque'), 0),
        updated_at = now()
      WHERE id = OLD.casa_id;
      
      -- Recalcula saldo_real
      UPDATE public.casas 
      SET saldo_real = COALESCE(depositos, 0) - COALESCE(saques, 0) + COALESCE((
        SELECT SUM(lucro_prejuizo) FROM public.apostas WHERE casa_id = OLD.casa_id AND lucro_prejuizo IS NOT NULL
      ), 0) + COALESCE((
        SELECT SUM(valor_resultado) FROM public.cassino WHERE plataforma_id = OLD.casa_id
      ), 0)
      WHERE id = OLD.casa_id;
    END IF;
    RETURN OLD;
  ELSE
    IF NEW.casa_id IS NOT NULL THEN
      UPDATE public.casas 
      SET 
        depositos = COALESCE((SELECT SUM(valor) FROM public.saques_aportes WHERE casa_id = NEW.casa_id AND tipo = 'deposito'), 0),
        saques = COALESCE((SELECT SUM(valor) FROM public.saques_aportes WHERE casa_id = NEW.casa_id AND tipo = 'saque'), 0),
        quantidade_depositos = COALESCE((SELECT COUNT(*) FROM public.saques_aportes WHERE casa_id = NEW.casa_id AND tipo = 'deposito'), 0),
        quantidade_saques = COALESCE((SELECT COUNT(*) FROM public.saques_aportes WHERE casa_id = NEW.casa_id AND tipo = 'saque'), 0),
        data_ultimo_deposito = CASE WHEN NEW.tipo = 'deposito' THEN NEW.data ELSE data_ultimo_deposito END,
        ultimo_deposito = CASE WHEN NEW.tipo = 'deposito' THEN NEW.valor ELSE ultimo_deposito END,
        updated_at = now()
      WHERE id = NEW.casa_id;
      
      -- Recalcula saldo_real
      UPDATE public.casas 
      SET saldo_real = COALESCE(depositos, 0) - COALESCE(saques, 0) + COALESCE((
        SELECT SUM(lucro_prejuizo) FROM public.apostas WHERE casa_id = NEW.casa_id AND lucro_prejuizo IS NOT NULL
      ), 0) + COALESCE((
        SELECT SUM(valor_resultado) FROM public.cassino WHERE plataforma_id = NEW.casa_id
      ), 0)
      WHERE id = NEW.casa_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- CRIAR TRIGGERS
-- =====================================================

-- Remove triggers antigos se existirem
DROP TRIGGER IF EXISTS trigger_sync_aposta_casa ON public.apostas;
DROP TRIGGER IF EXISTS trigger_sync_surebet_casa ON public.apostas_surebet;
DROP TRIGGER IF EXISTS trigger_sync_cassino_casa ON public.cassino;
DROP TRIGGER IF EXISTS trigger_sync_movimento_casa ON public.saques_aportes;
DROP TRIGGER IF EXISTS trigger_calc_aposta ON public.apostas;
DROP TRIGGER IF EXISTS trigger_update_casa_from_aposta ON public.apostas;

-- Cria trigger para calcular lucro na aposta automaticamente
CREATE TRIGGER trigger_calc_aposta
BEFORE INSERT OR UPDATE ON public.apostas
FOR EACH ROW
EXECUTE FUNCTION public.calc_aposta_lucro();

-- Cria trigger para sincronizar casa após aposta
CREATE TRIGGER trigger_sync_aposta_casa
AFTER INSERT OR UPDATE OR DELETE ON public.apostas
FOR EACH ROW
EXECUTE FUNCTION public.sync_casa_saldo_from_aposta();

-- Cria trigger para sincronizar casa após surebet
CREATE TRIGGER trigger_sync_surebet_casa
AFTER INSERT OR UPDATE OR DELETE ON public.apostas_surebet
FOR EACH ROW
EXECUTE FUNCTION public.sync_casa_saldo_from_surebet();

-- Cria trigger para sincronizar casa após cassino
CREATE TRIGGER trigger_sync_cassino_casa
AFTER INSERT OR UPDATE OR DELETE ON public.cassino
FOR EACH ROW
EXECUTE FUNCTION public.sync_casa_saldo_from_cassino();

-- Cria trigger para sincronizar casa após movimento (saque/aporte)
CREATE TRIGGER trigger_sync_movimento_casa
AFTER INSERT OR UPDATE OR DELETE ON public.saques_aportes
FOR EACH ROW
EXECUTE FUNCTION public.sync_casa_saldo_from_movimento();

-- Mantém o trigger existente de cálculo de resultado do cassino
DROP TRIGGER IF EXISTS trigger_cassino_calc ON public.cassino;
CREATE TRIGGER trigger_cassino_calc
BEFORE INSERT OR UPDATE ON public.cassino
FOR EACH ROW
EXECUTE FUNCTION public.cassino_calc_resultado();