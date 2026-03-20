import { useState, useEffect, useCallback } from 'react'
import { supabase, isMockSupabase } from '@/lib/supabase'
import { Ficha, StatusFicha } from '@/types'

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

const getLocalDetails = () => {
  try {
    const str = localStorage.getItem('app_fichas_details')
    return str ? JSON.parse(str) : {}
  } catch {
    return {}
  }
}

const saveLocalDetails = (id: string, ficha: Partial<Ficha>) => {
  const details = getLocalDetails()
  details[id] = {
    formaRecebimento: ficha.formaRecebimento,
    clienteNome: ficha.clienteNome,
    cpfCnpj: ficha.cpfCnpj,
    cidadeUf: ficha.cidadeUf,
    codigoContrato: ficha.codigoContrato,
    observacoes: ficha.observacoes,
    itens: ficha.itens,
    ocorrencias: ficha.ocorrencias,
    isDraft: ficha.isDraft,
  }
  localStorage.setItem('app_fichas_details', JSON.stringify(details))
}

export function useFichasRecebimento() {
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFichas = useCallback(async () => {
    setLoading(true)
    if (isMockSupabase) {
      const stored = localStorage.getItem('app_fichas_mock_store')
      if (stored) {
        setFichas(JSON.parse(stored))
      } else {
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
        setFichas(mockData)
      }
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.from('fichas_recebimento').select('*')
      if (error) throw error

      const localDetails = getLocalDetails()
      const mapped = data.map((row: any) => {
        const details = localDetails[row.numero_ficha] || {}
        return {
          id: row.numero_ficha,
          uuid: row.id,
          dataRecebimento: row.data_criacao,
          createdAt: row.data_criacao,
          responsavel: row.criado_por || '',
          status: mapStatusToApp(row.status),
          vistoSecretaria: row.visto_secretaria,
          ...details,
          itens: details.itens || [],
          ocorrencias: details.ocorrencias || [],
        }
      })

      mapped.sort(
        (a: any, b: any) =>
          new Date(b.dataRecebimento).getTime() - new Date(a.dataRecebimento).getTime(),
      )
      setFichas(mapped)
    } catch (err) {
      console.error('Error fetching fichas:', err)
      const stored = localStorage.getItem('app_fichas_mock_store')
      if (stored) setFichas(JSON.parse(stored))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFichas()
  }, [fetchFichas])

  const createFicha = async (ficha: Ficha) => {
    if (isMockSupabase) {
      const stored = JSON.parse(localStorage.getItem('app_fichas_mock_store') || '[]')
      const newStore = [ficha, ...stored]
      localStorage.setItem('app_fichas_mock_store', JSON.stringify(newStore))
      setFichas(newStore)
      return
    }

    try {
      const row = {
        numero_ficha: ficha.id,
        data_criacao: ficha.dataRecebimento || new Date().toISOString(),
        status: mapStatusToDb(ficha.status),
        visto_secretaria: ficha.vistoSecretaria || false,
        criado_por: ficha.responsavel,
        atualizado_em: new Date().toISOString(),
      }

      const { error } = await supabase.from('fichas_recebimento').insert(row)
      if (error) throw error

      saveLocalDetails(ficha.id, ficha)
      await fetchFichas()
    } catch (err) {
      console.error('Error creating ficha:', err)
    }
  }

  const updateFicha = async (ficha: Ficha) => {
    if (isMockSupabase) {
      const stored = JSON.parse(localStorage.getItem('app_fichas_mock_store') || '[]')
      const newStore = stored.map((f: Ficha) => (f.id === ficha.id ? ficha : f))
      localStorage.setItem('app_fichas_mock_store', JSON.stringify(newStore))
      setFichas(newStore)
      return
    }

    try {
      const row = {
        status: mapStatusToDb(ficha.status),
        visto_secretaria: ficha.vistoSecretaria || false,
        atualizado_em: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('fichas_recebimento')
        .update(row)
        .eq('numero_ficha', ficha.id)
      if (error) throw error

      saveLocalDetails(ficha.id, ficha)
      await fetchFichas()
    } catch (err) {
      console.error('Error updating ficha:', err)
    }
  }

  const deleteFicha = async (uuid: string, id: string) => {
    if (isMockSupabase) {
      const stored = JSON.parse(localStorage.getItem('app_fichas_mock_store') || '[]')
      const newStore = stored.filter((f: Ficha) => f.id !== id)
      localStorage.setItem('app_fichas_mock_store', JSON.stringify(newStore))
      setFichas(newStore)
      return
    }

    try {
      const { error } = await supabase.from('fichas_recebimento').delete().eq('id', uuid)
      if (error) throw error

      const details = getLocalDetails()
      delete details[id]
      localStorage.setItem('app_fichas_details', JSON.stringify(details))

      await fetchFichas()
    } catch (err) {
      console.error('Error deleting ficha:', err)
    }
  }

  return { fichas, loading, fetchFichas, createFicha, updateFicha, deleteFicha }
}
