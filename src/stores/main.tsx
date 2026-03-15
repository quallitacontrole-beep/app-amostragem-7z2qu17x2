import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { Ficha, Configuracoes, AuditLog } from '@/types'

interface AppContextData {
  fichas: Ficha[]
  configuracoes: Configuracoes
  auditLogs: AuditLog[]
  addFicha: (ficha: Ficha) => void
  updateFicha: (ficha: Ficha) => void
  updateConfiguracoes: (config: Configuracoes) => void
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void
}

const mockFichas: Ficha[] = [
  {
    id: 'FCH-2023-001',
    dataRecebimento: new Date().toISOString(),
    responsavel: 'João Amostrador',
    formaRecebimento: 'Correios',
    clienteNome: 'Farmácia Saúde Vital',
    cpfCnpj: '12.345.678/0001-90',
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
        embalagem: 'Blister',
        quantidade: '10',
        unidade: 'Caixas',
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
    id: 'FCH-2023-002',
    dataRecebimento: new Date(Date.now() - 86400000).toISOString(),
    responsavel: 'Maria Amostradora',
    formaRecebimento: 'Balcão',
    clienteNome: 'Indústria BioMed',
    cpfCnpj: '98.765.432/0001-10',
    cidadeUf: 'Campinas-SP',
    codigoContrato: 'CT-9921',
    status: 'Em Triagem',
    ocorrencias: [],
    itens: [
      {
        id: 'it-2',
        tipo: 'Matéria-prima',
        descricao: 'Ácido Ascórbico Pote',
        embalagem: 'Pote',
        quantidade: '2',
        unidade: 'kg',
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
    fichaId: 'FCH-2023-001',
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
  setores: ['Amostragem', 'Secretaria', 'Físico-Químico', 'Microbiologia', 'Estabilidade'],
  cidadesEstados: [
    'Barbacena-MG',
    'Barcarena-PA',
    'Belo Horizonte-MG',
    'Campinas-SP',
    'Rio de Janeiro-RJ',
    'São Paulo-SP',
  ],
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
            setConfiguracoes({ ...defaultConfig, ...data.configuracoes })
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
