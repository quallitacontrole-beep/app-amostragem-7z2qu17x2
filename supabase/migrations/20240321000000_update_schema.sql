-- Adiciona uma coluna JSONB para persistência completa do payload da Ficha,
-- garantindo que dados que não possuem mapeamento estrito nas tabelas originais
-- (como detalhes completos dos itens, clientes, etc) sejam salvos de forma segura.
ALTER TABLE public.fichas_recebimento ADD COLUMN IF NOT EXISTS dados jsonb;
