-- Tabela para apostas de cassino
CREATE TABLE public.cassino (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_registro TEXT NOT NULL DEFAULT 'diario', -- 'diario' ou 'sessao'
  
  -- Campos para registro diário (saldo início/fim do dia)
  saldo_inicial NUMERIC DEFAULT 0,
  saldo_final NUMERIC DEFAULT 0,
  
  -- Campos para registro por sessão
  jogo TEXT, -- ex: 'Aviator', 'Mines', 'Roleta'
  plataforma TEXT, -- ex: 'Blaze', 'Betano Casino'
  plataforma_id UUID REFERENCES public.casas(id),
  buy_in NUMERIC, -- valor apostado na sessão
  cash_out NUMERIC, -- valor retirado da sessão
  duracao_minutos INTEGER, -- duração da sessão em minutos
  
  -- Calculados
  valor_resultado NUMERIC, -- lucro ou prejuízo
  tipo TEXT, -- 'lucro', 'prejuizo', 'empate'
  
  obs TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cassino_updated_at
  BEFORE UPDATE ON public.cassino
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para calcular tipo e valor_resultado automaticamente
CREATE OR REPLACE FUNCTION public.cassino_calc_resultado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo_registro = 'diario' THEN
    NEW.valor_resultado := NEW.saldo_final - NEW.saldo_inicial;
  ELSE
    NEW.valor_resultado := COALESCE(NEW.cash_out, 0) - COALESCE(NEW.buy_in, 0);
  END IF;
  
  IF NEW.valor_resultado > 0 THEN
    NEW.tipo := 'lucro';
  ELSIF NEW.valor_resultado < 0 THEN
    NEW.tipo := 'prejuizo';
  ELSE
    NEW.tipo := 'empate';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cassino_calc_resultado_trigger
  BEFORE INSERT OR UPDATE ON public.cassino
  FOR EACH ROW
  EXECUTE FUNCTION public.cassino_calc_resultado();

-- Enable RLS
ALTER TABLE public.cassino ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Allow all for cassino" 
  ON public.cassino 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);