import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Ficha, Configuracoes, AuditLog, AppNotification, StatusFicha } from '@/types'
import { ALL_CITIES } from '@/lib/cidades'

interface AppContextData {
  fichas: Ficha[]
  configuracoes: Configuracoes
  auditLogs: AuditLog[]
  notifications: AppNotification[]
  addFicha: (ficha: Ficha) => void
  updateFicha: (ficha: Ficha) => void
  updateConfiguracoes: (config: Configuracoes) => void
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationAsRead: (id: string) => void
}

const currentYear = new Date().getFullYear()

const mockFichas: Ficha[] = [
  {
    id: `FR-${currentYear}-01`,
    dataRecebimento: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    responsavel: 'João Amostrador',
    formaRecebimento: 'Correios',
    clienteNome: 'Farmácia Saúde Vital',
    cpfCnpj: '45.997.418/0001-53',
    cidadeUf: 'São Paulo-SP',
    codigoContrato: '',
    status: 'Validação Secretaria',
    ocorrencias: [
      { id: 'occ-1', descricao: 'Contrato Indefinido para o cliente.', resolvida: false },
    ],
    itens: [
      {
        id: 'it-1',
        tipo: 'Produto Acabado Farmacêutico',
        descricao: 'Paracetamol 500mg',
        embalagem: 'Frasco PET',
        quantidade: '10',
        unidade: 'Unidade',
        setorDestino: 'Físico-Químico',
        analiseSolicitada: 'Teor',
        dosagem: '500',
        unidadeDosagem: 'mg',
        enviou1gAtivo: 'sim',
        enviou1gExcipiente: 'sim',
      },
    ],
  },
  {
    id: `FR-${currentYear}-02`,
    dataRecebimento: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    responsavel: 'Maria Amostradora',
    formaRecebimento: 'Balcão',
    clienteNome: 'Indústria BioMed',
    cpfCnpj: '61.585.865/0001-51',
    cidadeUf: 'Campinas-SP',
    codigoContrato: `1234/${currentYear}`,
    status: 'Em Triagem',
    ocorrencias: [],
    itens: [
      {
        id: 'it-2',
        tipo: 'Matéria-prima',
        descricao: 'Ácido Ascórbico Pote',
        embalagem: 'Pote plástico',
        quantidade: '2',
        unidade: 'g',
        setorDestino: 'Microbiologia',
        analiseSolicitada: 'Contagem Total',
      },
    ],
  },
]

const mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'usr-sys',
    userName: 'Sistema',
    action: 'Criou',
    fichaId: `FR-${currentYear}-01`,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
]

const defaultConfig: Configuracoes = {
  nomeFicha: 'Ficha de Recebimento de Amostras - FPGQ012-B',
  formularioPadrao: 'FPGQ012-B',
  revisaoFicha: '01',
  formasRecebimento: ['Correios', 'Motoboy', 'Balcão', 'Cliente', 'Coleta Quallità'],
  tiposAmostra: [
    'Produto Acabado Farmacêutico',
    'Matéria-prima',
    'Matéria-prima Diluída',
    'Cosmético',
    'Alimento',
  ],
  setores: ['Amostragem', 'Secretaria'],
  setoresAnalise: ['Físico-Químico', 'Microbiologia', 'Estabilidade'],
  embalagens: [
    'Frasco PET',
    'Saco estéril',
    'Embalagem própria',
    'Esponja',
    'Frasco estéril',
    'Frasco de vidro',
    'Frasco leitoso',
    'Frasco plástico âmbar',
    'Pote plástico',
    'Sachê',
    'Saco papel',
    'Saco plástico',
    'Swab',
    'Frasco plástico transparente',
  ],
  unidadesQtd: ['Cápsulas', 'g', 'mg', 'mL', 'Sachê', 'Unidade', 'Outr'],
  unidadesDosagem: ['mg', 'g', 'mcg'],
  cidadesEstados: ALL_CITIES,
}

export const evaluateFichaStatus = (f: any): any => {
  let safeStatus = f.status === 'Concluída' || f.status === 'Resolvida' ? 'Finalizada' : f.status

  if (safeStatus === 'Aguardando Validação') {
    safeStatus = 'Validação Secretaria'
  }

  if (safeStatus === 'Finalizada' && f.vistoSecretaria === undefined) {
    f.vistoSecretaria = true
  }

  const hasFullContract = Boolean(
    f.codigoContrato &&
    typeof f.codigoContrato === 'string' &&
    f.codigoContrato.includes('/') &&
    f.codigoContrato.split('/')[0] &&
    f.codigoContrato.split('/')[1]?.length === 4,
  )

  const allOccsResolved = f.ocorrencias?.every((o: any) => o.resolvida) ?? true
  const allItemsHaveValidOS =
    f.itens?.length > 0 &&
    f.itens.every(
      (i: any) =>
        i.ordemServico &&
        i.ordemServico.trim() !== '' &&
        typeof i.ordemServico === 'string' &&
        i.ordemServico.includes('-'),
    )

  const needsTagConf = f.itens?.some(
    (i: any) => i.trocaEtiquetaSolicitada && !i.trocaEtiquetaConfirmada,
  )

  const isCompleto =
    hasFullContract && allOccsResolved && allItemsHaveValidOS && f.vistoSecretaria && !needsTagConf

  if (safeStatus === 'Finalizada') {
    if (!isCompleto) {
      safeStatus = 'Validação Secretaria'
    }
  } else if (safeStatus !== 'Finalizada' && !f.isDraft && isCompleto) {
    safeStatus = 'Finalizada'
  }

  return { ...f, status: safeStatus }
}

const sanitizeList = (arr: any): string[] => {
  if (!Array.isArray(arr)) return []
  return Array.from(
    new Set(arr.filter((i) => i && typeof i === 'string' && i.trim() !== '').map((i) => i.trim())),
  )
}

const AppContext = createContext<AppContextData>({} as AppContextData)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [fichas, setFichas] = useState<Ficha[]>(() => {
    try {
      const stored = localStorage.getItem('app_fichas')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((f: any) => evaluateFichaStatus(f))
        }
      }
    } catch (error) {
      console.warn('Failed to load fichas from storage', error)
    }
    return mockFichas.map((f) => evaluateFichaStatus(f))
  })

  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(() => {
    try {
      const stored = localStorage.getItem('app_config')
      if (stored) {
        const parsed = JSON.parse(stored)
        let parsedSetores = sanitizeList(parsed.setores || defaultConfig.setores)
        if (!parsedSetores.includes('Secretaria')) parsedSetores.unshift('Secretaria')
        if (!parsedSetores.includes('Amostragem')) parsedSetores.unshift('Amostragem')

        return {
          ...defaultConfig,
          ...parsed,
          setores: parsedSetores,
          setoresAnalise: sanitizeList(parsed.setoresAnalise || defaultConfig.setoresAnalise),
          formasRecebimento: sanitizeList(
            parsed.formasRecebimento || defaultConfig.formasRecebimento,
          ),
          tiposAmostra: sanitizeList(parsed.tiposAmostra || defaultConfig.tiposAmostra),
          embalagens: sanitizeList(parsed.embalagens || defaultConfig.embalagens),
          unidadesQtd: sanitizeList(parsed.unidadesQtd || defaultConfig.unidadesQtd),
          unidadesDosagem: sanitizeList(parsed.unidadesDosagem || defaultConfig.unidadesDosagem),
        }
      }
    } catch (e) {
      console.warn('Failed to load config from storage', e)
    }
    return defaultConfig
  })

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const stored = localStorage.getItem('app_audit_logs')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (error) {
      console.warn('Failed to load audit logs from storage', error)
    }
    return mockAuditLogs
  })

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem('app_notifications')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (error) {
      console.warn('Failed to load notifications from storage', error)
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('app_fichas', JSON.stringify(fichas))
  }, [fichas])

  useEffect(() => {
    localStorage.setItem('app_audit_logs', JSON.stringify(auditLogs))
  }, [auditLogs])

  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem('app_config', JSON.stringify(configuracoes))
  }, [configuracoes])

  const addFicha = (ficha: Ficha) => setFichas((prev) => [evaluateFichaStatus(ficha), ...prev])

  const updateFicha = (ficha: Ficha) =>
    setFichas((prev) => prev.map((f) => (f.id === ficha.id ? evaluateFichaStatus(ficha) : f)))

  const updateConfiguracoes = (config: Configuracoes) => {
    const setores = sanitizeList(config.setores)
    if (!setores.includes('Secretaria')) setores.unshift('Secretaria')
    if (!setores.includes('Amostragem')) setores.unshift('Amostragem')

    setConfiguracoes({
      ...config,
      setores,
      setoresAnalise: sanitizeList(config.setoresAnalise),
      formasRecebimento: sanitizeList(config.formasRecebimento),
      tiposAmostra: sanitizeList(config.tiposAmostra),
      embalagens: sanitizeList(config.embalagens),
      unidadesQtd: sanitizeList(config.unidadesQtd),
      unidadesDosagem: sanitizeList(config.unidadesDosagem),
    })
  }

  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
    setAuditLogs((prev) => [newLog, ...prev])
  }

  const addNotification = (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications((prev) => [
      {
        ...n,
        id: `notif-${Date.now()}`,
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ])
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  useEffect(() => {
    const fetchConfig = async () => {
      if (localStorage.getItem('app_config')) return

      try {
        const response = await fetch('https://api.goskip.dev/v1/projects/config/public')
        if (response.ok) {
          const data = await response.json()
          if (data && data.configuracoes) {
            const remoteConfig = data.configuracoes
            if (remoteConfig.cidadesEstados && remoteConfig.cidadesEstados.length < 100) {
              delete remoteConfig.cidadesEstados
            }

            const safeConfig = { ...defaultConfig, ...remoteConfig }

            safeConfig.setoresAnalise = sanitizeList(
              safeConfig.setoresAnalise || defaultConfig.setoresAnalise,
            )
            safeConfig.embalagens = sanitizeList(safeConfig.embalagens || defaultConfig.embalagens)
            safeConfig.unidadesQtd = sanitizeList(
              safeConfig.unidadesQtd || defaultConfig.unidadesQtd,
            )
            safeConfig.unidadesDosagem = sanitizeList(
              safeConfig.unidadesDosagem || defaultConfig.unidadesDosagem,
            )
            safeConfig.formasRecebimento = sanitizeList(
              safeConfig.formasRecebimento || defaultConfig.formasRecebimento,
            )
            safeConfig.tiposAmostra = sanitizeList(
              safeConfig.tiposAmostra || defaultConfig.tiposAmostra,
            )

            let fetchedSetores = sanitizeList(safeConfig.setores || defaultConfig.setores)
            if (!fetchedSetores.includes('Secretaria')) fetchedSetores.unshift('Secretaria')
            if (!fetchedSetores.includes('Amostragem')) fetchedSetores.unshift('Amostragem')

            safeConfig.setores = fetchedSetores

            setConfiguracoes(safeConfig)
          }
        }
      } catch (error) {
        console.warn('Failed to fetch remote config, using default settings.', error)
      }
    }
    fetchConfig()
  }, [])

  return (
    <AppContext.Provider
      value={{
        fichas,
        configuracoes,
        auditLogs,
        notifications,
        addFicha,
        updateFicha,
        updateConfiguracoes,
        addAuditLog,
        addNotification,
        markNotificationAsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppStore = () => useContext(AppContext)
