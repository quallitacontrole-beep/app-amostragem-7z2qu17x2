import { isMockSupabase } from './supabase'
import { logger } from './logger'
import { metricsStore } from '@/stores/metrics'

const MAX_RETRIES = 3
const TIMEOUT_MS = 5000

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<any>>()

export const DataAdapter = {
  async fetchWithRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
    fallbackOperation: () => T | Promise<T>,
    retries = MAX_RETRIES,
    cacheTtlMs = 0,
  ): Promise<T> {
    const startTime = performance.now()

    if (cacheTtlMs > 0) {
      const cached = cache.get(operationName)
      if (cached && Date.now() - cached.timestamp < cacheTtlMs) {
        logger.system(`Cache hit para '${operationName}'`)
        return cached.data
      }
    }

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
        metricsStore.addRequest({ source: 'DB', latency, operation: operationName, error: false })

        if (cacheTtlMs > 0) {
          cache.set(operationName, { data: result, timestamp: Date.now() })
        }

        return result
      } catch (error: any) {
        logger.error(`Tentativa ${attempt} falhou para '${operationName}'`, error.message || error)

        if (attempt === retries) {
          metricsStore.addError(`[${operationName}] ${error.message || 'Erro desconhecido'}`)
          logger.mock(`Aplicando fallback para dados locais em '${operationName}'`)

          const latency = performance.now() - startTime
          metricsStore.addRequest({
            source: 'MOCK',
            latency,
            operation: operationName,
            error: true,
          })

          return fallbackOperation()
        }

        // Exponential backoff
        await delay(Math.pow(2, attempt) * 100)
      }
    }

    return fallbackOperation()
  },

  clearCache(operationName?: string) {
    if (operationName) {
      cache.delete(operationName)
    } else {
      cache.clear()
    }
  },
}
