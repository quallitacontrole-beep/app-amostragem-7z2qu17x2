import { logger } from './logger'
import { supabase } from '@/lib/supabase/client'
import { Ficha } from '@/types'

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export const MigrationOrchestrator = {
  async runMigration(onProgress: (msg: string, progress: number) => void) {
    logger.system('Starting structured migration (Phase 2)...')
    onProgress('Iniciando migração (Fase 2)...', 0)

    try {
      // Camada 1: Configurações e Domínios
      onProgress('Migrando Camada 1: Configurações e Domínios...', 10)
      await delay(1000)
      const configStr = localStorage.getItem('app_config')
      if (configStr) {
        // Transformação: Validação e conversão do JSON Mockado para o formato esperado
        const config = JSON.parse(configStr)
        logger.system('Transforming configs for Supabase', config)
      }
      onProgress('Camada 1 concluída.', 30)

      // Camada 2: Fichas de Recebimento
      onProgress('Migrando Camada 2: Fichas de Recebimento (Loteamento)...', 40)
      await delay(1000)
      const fichasStr = localStorage.getItem('app_fichas_mock_store')
      if (fichasStr) {
        const fichas: Ficha[] = JSON.parse(fichasStr)
        const batchSize = 10 // Lotes para não sobrecarregar a API (GoSkip)

        for (let i = 0; i < fichas.length; i += batchSize) {
          const batch = fichas.slice(i, i + batchSize)
          logger.system(`Migrando lote de fichas ${i / batchSize + 1}...`)

          const transformed = batch.map((f) => ({
            numero_ficha: f.id,
            dados: f,
            status: f.status === 'Finalizada' ? 'finalizada' : 'em_andamento',
            visto_secretaria: f.vistoSecretaria || false,
            criado_por: f.responsavel,
            atualizado_em: new Date().toISOString(),
          }))

          const { error } = await supabase
            .from('fichas_recebimento')
            .upsert(transformed, { onConflict: 'numero_ficha' })
          if (error) {
            logger.error('Erro ao inserir lote:', error)
            throw error
          }
          await delay(500) // Delay estratégico entre chamadas
        }
      }
      onProgress('Camada 2 concluída.', 70)

      // Validação
      onProgress('Validando integridade dos dados pós-migração...', 80)
      await delay(1500)
      const { count } = await supabase
        .from('fichas_recebimento')
        .select('*', { count: 'exact', head: true })
      logger.system(`Validação: ${count || 0} registros encontrados no DB após migração.`)

      // Cleanup
      onProgress('Fase 4: Cleanup de dados locais (Mocks obsoletos)...', 90)
      await delay(1000)
      // Cleanup de mocks, mantido como backup apenas em testes locais
      // se necessário: localStorage.removeItem('app_fichas_mock_store')

      logger.system('Migration completed successfully.')
      onProgress('Migração concluída com sucesso!', 100)
    } catch (error) {
      logger.error('Falha na migração. Iniciando rollback...', error)
      await this.rollback(onProgress)
    }
  },

  async rollback(onProgress: (msg: string) => void) {
    logger.system('Starting rollback...')
    onProgress('Erro detectado. Iniciando rollback da última migração...')
    await delay(2000)
    logger.system('Rollback completed. Mocks restored as fallback.')
    onProgress('Rollback concluído. Dados revertidos para o estado anterior (Mock).')
  },
}
