import { isMockSupabase } from './supabase'
import { logger } from './logger'
import { useMetricsStore } from '@/stores/metrics'

const MAX_RETRIES = 3
const TIMEOUT_MS = 5000

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export const DataAdapter = {
  async fetchWithRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
    fallbackOperation: () => T | Promise<T>,
    retries = MAX_RETRIES,
  ): Promise<T> {
    const startTime = performance.now()
    const metrics = useMetricsStore.getState()

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (isMockSupabase) {
          throw new Error('Modo Mock forçado nas configurações.')
        }

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Tempo limite da requisição esgotado (Timeout)')),
            TIMEOUT_MS,
          ),
        )

        const result = await Promise.race([operation(), timeoutPromise])

        const latency = performance.now() - startTime
        logger.db(`Operação '${operationName}' concluída`, {
          tentativa: attempt,
          latencia: `${latency.toFixed(2)}ms`,
        })
        metrics.addRequest({ source: 'DB', latency, operation: operationName, error: false })

        return result
      } catch (error: any) {
        logger.error(`Tentativa ${attempt} falhou para '${operationName}'`, error.message || error)

        if (attempt === retries) {
          metrics.addError(`[${operationName}] ${error.message || 'Erro desconhecido'}`)
          logger.mock(`Aplicando fallback para dados locais em '${operationName}'`)

          const latency = performance.now() - startTime
          metrics.addRequest({ source: 'MOCK', latency, operation: operationName, error: true })

          return fallbackOperation()
        }

        // Exponential backoff
        await delay(Math.pow(2, attempt) * 100)
      }
    }

    return fallbackOperation()
  },
}
