-- Adicionar campos para gestão de risco e saldo real nas casas
ALTER TABLE public.casas
ADD COLUMN saldo_real numeric DEFAULT 0,
ADD COLUMN percentual_maximo_banca numeric DEFAULT 20,
ADD COLUMN limite_saque_diario numeric DEFAULT NULL,
ADD COLUMN limite_saque_mensal numeric DEFAULT NULL;

-- Criar tabela para OKRs
CREATE TABLE public.okrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL,
  objetivo text NOT NULL,
  key_result text NOT NULL,
  meta_valor numeric,
  valor_atual numeric DEFAULT 0,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  status text DEFAULT 'em_andamento',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for OKRs
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for okrs"
ON public.okrs
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_okrs_updated_at
BEFORE UPDATE ON public.okrs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();