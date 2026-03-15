import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Ficha, Configuracoes, AuditLog } from '@/types'
import { ALL_CITIES } from '@/lib/cidades'

interface AppContextData {
  fichas: Ficha[]
  configuracoes: Configuracoes
  auditLogs: AuditLog[]
  addFicha: (ficha: Ficha) => void
  updateFicha: (ficha: Ficha) => void
  updateConfiguracoes: (config: Configuracoes) => void
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void
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
    codigoContrato: 'CT-9921',
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
  const [fichas, setFichas] = useState<Ficha[]>(mockFichas)
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(defaultConfig)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs)

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
        addFicha,
        updateFicha,
        updateConfiguracoes,
        addAuditLog,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppStore = () => useContext(AppContext)
