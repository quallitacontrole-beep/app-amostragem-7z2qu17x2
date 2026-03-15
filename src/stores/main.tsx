import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Ficha, Configuracoes, AuditLog, AppNotification } from '@/types'
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
    status: 'Aguardando Secretaria',
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
  formasRecebimento: ['Correios', 'Motoboy', 'Balcão', 'Cliente', 'Coleta Quallità'],
  tiposAmostra: [
    'Produto Acabado Farmacêutico',
    'Matéria-prima',
    'Matéria-prima Diluída',
    'Cosmético',
    'Alimento',
  ],
  setores: [
    'Amostragem',
    'Secretaria',
    'Físico-Químico',
    'Microbiologia',
    'Estabilidade',
    'Diretoria',
  ],
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

const AppContext = createContext<AppContextData>({} as AppContextData)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [fichas, setFichas] = useState<Ficha[]>(() => {
    try {
      const stored = localStorage.getItem('app_fichas')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((f: any) => {
            let safeStatus =
              f.status === 'Concluída' || f.status === 'Resolvida' ? 'Finalizada' : f.status

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

            if (safeStatus === 'Finalizada') {
              if (
                !hasFullContract ||
                !allOccsResolved ||
                !allItemsHaveValidOS ||
                !f.vistoSecretaria
              ) {
                safeStatus = 'Aguardando Secretaria'
              }
            } else if (safeStatus === 'Aguardando Secretaria') {
              if (hasFullContract && allOccsResolved && allItemsHaveValidOS && f.vistoSecretaria) {
                safeStatus = 'Finalizada'
              }
            }

            return { ...f, status: safeStatus }
          })
        }
      }
    } catch (error) {
      console.warn('Failed to load fichas from storage', error)
    }
    return mockFichas.map((f) => {
      let safeStatus =
        f.status === ('Concluída' as any) || f.status === ('Resolvida' as any)
          ? 'Finalizada'
          : f.status

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

      if (safeStatus === 'Finalizada') {
        if (!hasFullContract || !allOccsResolved || !allItemsHaveValidOS || !f.vistoSecretaria) {
          safeStatus = 'Aguardando Secretaria'
        }
      } else if (safeStatus === 'Aguardando Secretaria') {
        if (hasFullContract && allOccsResolved && allItemsHaveValidOS && f.vistoSecretaria) {
          safeStatus = 'Finalizada'
        }
      }

      return { ...f, status: safeStatus }
    }) as Ficha[]
  })

  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(defaultConfig)

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

  const addFicha = (ficha: Ficha) => setFichas((prev) => [ficha, ...prev])

  const updateFicha = (ficha: Ficha) =>
    setFichas((prev) => prev.map((f) => (f.id === ficha.id ? ficha : f)))

  const updateConfiguracoes = (config: Configuracoes) => setConfiguracoes(config)

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
            safeConfig.setoresAnalise = safeConfig.setoresAnalise || defaultConfig.setoresAnalise
            safeConfig.embalagens = safeConfig.embalagens || defaultConfig.embalagens
            safeConfig.unidadesQtd = safeConfig.unidadesQtd || defaultConfig.unidadesQtd
            safeConfig.unidadesDosagem = safeConfig.unidadesDosagem || defaultConfig.unidadesDosagem

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
