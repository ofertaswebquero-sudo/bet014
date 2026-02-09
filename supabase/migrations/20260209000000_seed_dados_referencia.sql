-- Inserir exemplos de Mercados
INSERT INTO public.dados_referencia (categoria, valor, descricao, ativo, ordem)
VALUES 
('mercado', 'Over 2.5 Gols', 'Mais de 2.5 gols na partida', true, 1),
('mercado', 'Under 2.5 Gols', 'Menos de 2.5 gols na partida', true, 2),
('mercado', 'Ambas Marcam - Sim', 'As duas equipes marcam gols', true, 3),
('mercado', 'Resultado Final (1X2)', 'Vitória Casa, Empate ou Vitória Fora', true, 4),
('mercado', 'Handicap Asiático', 'Vantagem ou desvantagem para uma equipe', true, 5),
('mercado', 'Total de Pontos', 'Soma de pontos (Basquete/Vôlei)', true, 6),
('mercado', 'Vencedor do Set', 'Quem vence o set específico', true, 7)
ON CONFLICT DO NOTHING;

-- Inserir exemplos de Esportes
INSERT INTO public.dados_referencia (categoria, valor, descricao, ativo, ordem)
VALUES 
('esporte', 'Futebol', 'Futebol profissional', true, 1),
('esporte', 'Basquete', 'NBA, NBB, Euroleague', true, 2),
('esporte', 'Tênis', 'ATP, WTA, Grand Slams', true, 3),
('esporte', 'Vôlei', 'Superliga, Liga das Nações', true, 4),
('esporte', 'eSports', 'CS:GO, LoL, Dota 2', true, 5)
ON CONFLICT DO NOTHING;

-- Inserir exemplos de Ligas
INSERT INTO public.dados_referencia (categoria, valor, descricao, ativo, ordem)
VALUES 
('liga', 'Brasileirão Série A', 'Campeonato Brasileiro', true, 1),
('liga', 'Premier League', 'Campeonato Inglês', true, 2),
('liga', 'Champions League', 'Liga dos Campeões da UEFA', true, 3),
('liga', 'NBA', 'Liga Americana de Basquete', true, 4),
('liga', 'La Liga', 'Campeonato Espanhol', true, 5)
ON CONFLICT DO NOTHING;
