import { supabase } from './supabase/client'
import { logger } from './logger'
import { isMockSupabase } from './supabase'

export const validateSupabaseConnection = async () => {
  logger.system('Iniciando validação da conexão com Supabase...')

  const url = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const key = publishableKey || anonKey

  if (isMockSupabase) {
    logger.mock('Aplicação rodando em modo MOCK. Conexão real ignorada.')
    return true
  }

  if (!url || !key) {
    logger.error('Variáveis de ambiente do Supabase ausentes!', {
      VITE_SUPABASE_URL: !!url,
      VITE_SUPABASE_PUBLISHABLE_KEY: !!publishableKey,
      VITE_SUPABASE_ANON_KEY: !!anonKey,
    })
    return false
  }

  try {
    const { error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      logger.error('Erro de autenticação ou sessão no Supabase.', sessionError)
      return false
    }

    // Testa uma chamada simples para verificar conectividade/CORS
    // Pode falhar com RLS ou 404 caso tabela não exista, o que ainda indica que a conexão em si funcionou.
    const { error: dbError } = await supabase.from('fichas_recebimento').select('id').limit(1)

    if (dbError) {
      if (dbError.message?.includes('CORS') || dbError.message?.includes('Failed to fetch')) {
        logger.error('Erro de conexão ou CORS detectado.', dbError)
      } else if (
        dbError.code === 'PGRST301' ||
        dbError.code === '401' ||
        dbError.message?.includes('JWT')
      ) {
        logger.system(
          'Conexão ativa! (Recebeu erro de permissão RLS, o que é esperado se não estiver logado com acesso)',
          dbError,
        )
        logger.db('Supabase conectado e operante.')
      } else if (dbError.code === '42P01') {
        logger.system(
          'Conexão ativa! A tabela consultada não existe, mas a API respondeu corretamente.',
          dbError,
        )
        logger.db('Supabase conectado e operante.')
      } else {
        logger.error('Erro ao consultar banco de dados Supabase.', dbError)
      }
    } else {
      logger.db('Conexão com Supabase estabelecida e operante com sucesso!')
    }

    return true
  } catch (err) {
    logger.error('Exceção não tratada ao conectar com Supabase.', err)
    return false
  }
}
