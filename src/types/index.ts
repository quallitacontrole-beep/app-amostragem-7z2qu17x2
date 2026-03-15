export type StatusFicha = 'Em Triagem' | 'Aguardando Secretaria' | 'Concluída'

export interface Ocorrencia {
  id: string
  descricao: string
  resolvida: boolean
}

export interface AmostraItem {
  id: string
  tipo: string
  descricao: string
  embalagem: string
  quantidade: string
  unidade: string
  setorDestino: string
  analiseSolicitada: string
  dosagem?: string
  unidadeDosagem?: string
  enviou1gExcipiente?: 'sim' | 'nao'
  enviou1gAtivo?: 'sim' | 'nao'
  fatorDiluicao?: string
  protocoloWeb?: string
  ordemServico?: string
}

export interface Ficha {
  id: string
  dataRecebimento: string
  responsavel: string
  formaRecebimento: string
  clienteNome: string
  cpfCnpj: string
  cidade: string
  estado: string
  codigoContrato: string
  itens: AmostraItem[]
  status: StatusFicha
  ocorrencias: Ocorrencia[]
  isDraft?: boolean
}

export interface Configuracoes {
  formasRecebimento: string[]
  tiposAmostra: string[]
  setores: string[]
}
