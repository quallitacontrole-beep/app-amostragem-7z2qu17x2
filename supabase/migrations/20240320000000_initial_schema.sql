-- Fichas de Recebimento
CREATE TABLE IF NOT EXISTS public.fichas_recebimento (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ficha text UNIQUE NOT NULL,
  data_criacao timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text CHECK (status IN ('em_andamento', 'pendente_amostragem', 'pendente_secretaria', 'finalizada')) NOT NULL,
  visto_secretaria boolean DEFAULT false,
  data_visto timestamp with time zone,
  criado_por text,
  atualizado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Amostras
CREATE TABLE IF NOT EXISTS public.amostras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ficha_id uuid REFERENCES public.fichas_recebimento(id) ON DELETE CASCADE,
  tipo_amostra text CHECK (tipo_amostra IN ('produto_acabado_farmaceutico', 'materia_prima_diluida')),
  setor_analise text CHECK (setor_analise IN ('UDU', 'Fisico-quimico')),
  validacao_1g_excipiente boolean,
  validacao_1g_ativo boolean,
  dosagem text,
  fator_diluicao text,
  atualizado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Pendências
CREATE TABLE IF NOT EXISTS public.pendencias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ficha_id uuid REFERENCES public.fichas_recebimento(id) ON DELETE CASCADE,
  tipo_pendencia text CHECK (tipo_pendencia IN ('1g_ativo', '1g_excipiente', 'foto_nao_conformidade')),
  bloqueante boolean DEFAULT false,
  resolvida boolean DEFAULT false,
  atualizado_em timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fotos de Não Conformidade
CREATE TABLE IF NOT EXISTS public.fotos_nao_conformidade (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ficha_id uuid REFERENCES public.fichas_recebimento(id) ON DELETE CASCADE,
  url_foto text NOT NULL,
  data_upload timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  tipo_captura text CHECK (tipo_captura IN ('arquivo_local', 'camera_dispositivo'))
);

-- Workflow de Ordem de Serviço (OS)
CREATE TABLE IF NOT EXISTS public.workflow_os (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ficha_id uuid REFERENCES public.fichas_recebimento(id) ON DELETE CASCADE,
  os_anterior text,
  os_nova text,
  status_workflow text CHECK (status_workflow IN ('pendente_amostragem', 'confirmada', 'finalizado')),
  data_criacao timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
