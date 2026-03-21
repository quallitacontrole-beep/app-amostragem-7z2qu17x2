import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react'
import { Ficha, Configuracoes, AuditLog, AppNotification, StatusFicha } from '@/types'
import { ALL_CITIES } from '@/lib/cidades'
import { useFichasRecebimento } from '@/hooks/useFichasRecebimento'

interface AppContextData {
  fichas: Ficha[]
  configuracoes: Configuracoes
  auditLogs: AuditLog[]
  notifications: AppNotification[]
  addFicha: (ficha: Ficha) => Promise<void>
  updateFicha: (ficha: Ficha) => Promise<void>
  deleteFicha: (uuid: string, id: string) => Promise<void>
  updateConfiguracoes: (config: Configuracoes) => void
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationAsRead: (id: string) => void
}

const mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'usr-sys',
    userName: 'Sistema',
    action: 'Criou',
    fichaId: `FR-${new Date().getFullYear()}-01`,
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
  setoresAnalise: ['Físico-Químico', 'Microbiologia', 'UDU'],
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
  const updatedF = { ...f }
  let safeStatus =
    updatedF.status === 'Concluída' || updatedF.status === 'Resolvida'
      ? 'Finalizada'
      : updatedF.status

  if (safeStatus === 'Aguardando Validação') {
    safeStatus = 'Validação Secretaria'
  }

  if (safeStatus === 'Finalizada' && updatedF.vistoSecretaria === undefined) {
    updatedF.vistoSecretaria = true
  }

  if (safeStatus === 'Finalizada (Impressa)') return updatedF

  const hasFullContract = Boolean(
    updatedF.codigoContrato &&
    typeof updatedF.codigoContrato === 'string' &&
    updatedF.codigoContrato.includes('/') &&
    updatedF.codigoContrato.split('/')[0] &&
    updatedF.codigoContrato.split('/')[1]?.length === 4,
  )

  const allOccsResolved =
    updatedF.ocorrencias?.every((o: any) => o.resolvida || o.isNonBlocking) ?? true
  const allItemsHaveValidOS =
    updatedF.itens?.length > 0 &&
    updatedF.itens.every(
      (i: any) =>
        i.ordemServico &&
        i.ordemServico.trim() !== '' &&
        typeof i.ordemServico === 'string' &&
        i.ordemServico.includes('-'),
    )

  const needsTagConf = updatedF.itens?.some(
    (i: any) => i.trocaEtiquetaSolicitada && !i.trocaEtiquetaConfirmada,
  )

  const isCompleto =
    hasFullContract &&
    allOccsResolved &&
    allItemsHaveValidOS &&
    updatedF.vistoSecretaria &&
    !needsTagConf

  if (safeStatus === 'Finalizada') {
    if (!isCompleto) {
      safeStatus = 'Validação Secretaria'
    }
  } else if (
    safeStatus !== 'Finalizada' &&
    safeStatus !== 'Aguardando Amostragem' &&
    !updatedF.isDraft &&
    isCompleto
  ) {
    safeStatus = 'Finalizada'
  }

  if (safeStatus === 'Aguardando Amostragem') {
    if (allOccsResolved && !needsTagConf) {
      safeStatus = 'Validação Secretaria'
    }
  }

  if (!updatedF.isDraft && needsTagConf && safeStatus !== 'Em Triagem') {
    safeStatus = 'Aguardando Amostragem'
  }

  return { ...updatedF, status: safeStatus }
}

const sanitizeList = (arr: any): string[] => {
  if (!Array.isArray(arr)) return []
  return Array.from(
    new Set(arr.filter((i) => i && typeof i === 'string' && i.trim() !== '').map((i) => i.trim())),
  )
}

const AppContext = createContext<AppContextData>({} as AppContextData)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const {
    fichas: rawFichas,
    createFicha,
    updateFicha: updateDbFicha,
    deleteFicha: removeDbFicha,
  } = useFichasRecebimento()

  const fichas = useMemo(() => {
    return rawFichas.map((f) => evaluateFichaStatus(f))
  }, [rawFichas])

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
    localStorage.setItem('app_audit_logs', JSON.stringify(auditLogs))
  }, [auditLogs])

  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem('app_config', JSON.stringify(configuracoes))
  }, [configuracoes])

  const addFicha = async (ficha: Ficha) => await createFicha(ficha)
  const updateFicha = async (ficha: Ficha) => await updateDbFicha(ficha)
  const deleteFicha = async (uuid: string, id: string) => await removeDbFicha(uuid, id)

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
        deleteFicha,
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
