import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Ficha, StatusFicha } from '@/types'
import { toast } from 'sonner'
import { DataAdapter } from '@/lib/data-adapter'
import { logger } from '@/lib/logger'

const mapStatusToApp = (dbStatus: string): StatusFicha => {
  switch (dbStatus) {
    case 'em_andamento':
      return 'Em Triagem'
    case 'pendente_amostragem':
      return 'Aguardando Amostragem'
    case 'pendente_secretaria':
      return 'Aguardando Secretaria'
    case 'finalizada':
      return 'Finalizada'
    default:
      return 'Em Triagem'
  }
}

const mapStatusToDb = (appStatus: string): string => {
  switch (appStatus) {
    case 'Em Triagem':
      return 'em_andamento'
    case 'Aguardando Amostragem':
      return 'pendente_amostragem'
    case 'Aguardando Secretaria':
    case 'Validação Secretaria':
    case 'Respondida pela Secretaria':
    case 'Aguardando Validação':
      return 'pendente_secretaria'
    case 'Finalizada':
    case 'Finalizada (Impressa)':
      return 'finalizada'
    default:
      return 'em_andamento'
  }
}

// Fallback logic in case DB is unavailable
const getFallbackMockData = (): Ficha[] => {
  const stored = localStorage.getItem('app_fichas_mock_store')
  if (stored) return JSON.parse(stored)

  const currentYear = new Date().getFullYear()
  const mockData: Ficha[] = [
    {
      id: `FR-${currentYear}-01`,
      uuid: 'mock-uuid-1',
      dataRecebimento: new Date().toISOString(),
      responsavel: 'João Amostrador',
      formaRecebimento: 'Correios',
      clienteNome: 'Farmácia Saúde Vital',
      cpfCnpj: '45.997.418/0001-53',
      cidadeUf: 'São Paulo-SP',
      codigoContrato: '',
      status: 'Validação Secretaria',
      ocorrencias: [],
      itens: [],
    },
  ]
  localStorage.setItem('app_fichas_mock_store', JSON.stringify(mockData))
  return mockData
}

export function useFichasRecebimento() {
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFichas = useCallback(async () => {
    setLoading(true)

    try {
      const data = await DataAdapter.fetchWithRetry(
        'fetchFichas',
        async () => {
          const { data, error } = await supabase.from('fichas_recebimento').select('*')
          if (error) throw error
          return data
        },
        () => getFallbackMockData(),
      )

      // Se for mock/fallback ele pode já vir mapeado
      if (data && data.length > 0 && typeof data[0].numero_ficha === 'undefined' && data[0].id) {
        setFichas(data)
        setLoading(false)
        return
      }

      const mapped = (data || []).map((row: any) => {
        const details = row.dados || {}
        return {
          ...details,
          id: row.numero_ficha,
          uuid: row.id,
          dataRecebimento: row.data_criacao,
          createdAt: row.data_criacao,
          responsavel: row.criado_por || details.responsavel || '',
          status: mapStatusToApp(row.status),
          vistoSecretaria: row.visto_secretaria,
          itens: details.itens || [],
          ocorrencias: details.ocorrencias || [],
        }
      })

      mapped.sort(
        (a: any, b: any) =>
          new Date(b.dataRecebimento).getTime() - new Date(a.dataRecebimento).getTime(),
      )
      setFichas(mapped)
    } catch (err: any) {
      logger.error('Unhandled error in fetchFichas', err)
      setFichas(getFallbackMockData())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFichas()
  }, [fetchFichas])

  const createFicha = async (ficha: Ficha) => {
    try {
      const result = await DataAdapter.fetchWithRetry(
        'createFicha',
        async () => {
          const row = {
            numero_ficha: ficha.id,
            data_criacao: ficha.dataRecebimento || new Date().toISOString(),
            status: mapStatusToDb(ficha.status),
            visto_secretaria: ficha.vistoSecretaria || false,
            criado_por: ficha.responsavel,
            atualizado_em: new Date().toISOString(),
            dados: ficha,
          }

          const { data, error } = await supabase.from('fichas_recebimento').insert(row).select()
          if (error) throw error
          return Array.isArray(data) ? data[0] : data
        },
        () => {
          const stored = getFallbackMockData()
          const newStore = [ficha, ...stored]
          localStorage.setItem('app_fichas_mock_store', JSON.stringify(newStore))
          return { ...ficha, uuid: 'mock-' + Date.now() }
        },
      )

      if (result && result.id && !ficha.uuid) {
        ficha.uuid = result.id
      }

      setFichas((prev) => {
        const newStore = [ficha, ...prev]
        return newStore.sort(
          (a: any, b: any) =>
            new Date(b.dataRecebimento).getTime() - new Date(a.dataRecebimento).getTime(),
        )
      })
    } catch (err: any) {
      toast.error('Erro ao salvar', {
        description: err.message || 'Falha de comunicação com o servidor.',
      })
      throw err
    }
  }

  const updateFicha = async (ficha: Ficha) => {
    try {
      await DataAdapter.fetchWithRetry(
        'updateFicha',
        async () => {
          const row = {
            status: mapStatusToDb(ficha.status),
            visto_secretaria: ficha.vistoSecretaria || false,
            atualizado_em: new Date().toISOString(),
            dados: ficha,
          }

          const { error } = await supabase
            .from('fichas_recebimento')
            .update(row)
            .eq('numero_ficha', ficha.id)
          if (error) throw error
          return true
        },
        () => {
          const stored = getFallbackMockData()
          const newStore = stored.map((f: Ficha) => (f.id === ficha.id ? ficha : f))
          localStorage.setItem('app_fichas_mock_store', JSON.stringify(newStore))
          return true
        },
      )

      setFichas((prev) => prev.map((f) => (f.id === ficha.id ? ficha : f)))
    } catch (err: any) {
      toast.error('Erro ao atualizar', {
        description: err.message || 'Falha de comunicação com o servidor.',
      })
      throw err
    }
  }

  const deleteFicha = async (uuid: string, id: string) => {
    try {
      await DataAdapter.fetchWithRetry(
        'deleteFicha',
        async () => {
          const queryCol = uuid ? 'id' : 'numero_ficha'
          const queryVal = uuid || id
          const { error } = await supabase
            .from('fichas_recebimento')
            .delete()
            .eq(queryCol, queryVal)
          if (error) throw error
          return true
        },
        () => {
          const stored = getFallbackMockData()
          const newStore = stored.filter((f: Ficha) => f.id !== id)
          localStorage.setItem('app_fichas_mock_store', JSON.stringify(newStore))
          return true
        },
      )

      setFichas((prev) => prev.filter((f) => f.id !== id))
    } catch (err: any) {
      toast.error('Erro ao descartar', {
        description: err.message || 'Falha de comunicação com o servidor.',
      })
      throw err
    }
  }

  return { fichas, loading, fetchFichas, createFicha, updateFicha, deleteFicha }
}
