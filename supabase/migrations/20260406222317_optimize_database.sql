-- OTIMIZAÇÃO DE PERFORMANCE E ESTRUTURA (Fase 3)

-- 1. Função genérica para atualização automática da coluna updated_at (Auditoria)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Aplicação de otimizações estruturais de forma dinâmica e não-destrutiva
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['fichas_recebimento', 'amostras', 'pendencias', 'fotos_nao_conformidade', 'workflow_os', 'clientes', 'produtos'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- Verifica se a tabela existe no schema public
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      
      -- A. Automação de Auditoria: Adiciona coluna updated_at se não existir
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'updated_at') THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW()', t);
      END IF;

      -- Cria/Recria o gatilho (trigger) de updated_at para atualizar automaticamente em cada UPDATE
      EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
      EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t);

      -- B. Segurança e Isolamento (RLS): Habilita RLS e cria política base segura
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      
      EXECUTE format('DROP POLICY IF EXISTS "Permitir acesso total para usuarios autenticados" ON public.%I', t);
      EXECUTE format('CREATE POLICY "Permitir acesso total para usuarios autenticados" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);

      -- C. Otimização de Performance (Índices B-Tree): Criação de índices para Foreign Keys (FKs) comuns
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'ficha_id') THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_ficha_id ON public.%I (ficha_id)', t, t);
      END IF;
      
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'amostra_id') THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_amostra_id ON public.%I (amostra_id)', t, t);
      END IF;
      
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'os') THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_os ON public.%I (os)', t, t);
      END IF;

    END IF;
  END LOOP;
END;
$;
