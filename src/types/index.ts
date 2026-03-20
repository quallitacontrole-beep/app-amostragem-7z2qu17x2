export type StatusFicha =
  | 'Em Triagem'
  | 'Aguardando Secretaria'
  | 'Respondida pela Secretaria'
  | 'Aguardando Amostragem'
  | 'Aguardando Validação'
  | 'Validação Secretaria'
  | 'Finalizada'
  | 'Finalizada (Impressa)'

export interface Ocorrencia {
  id: string
  descricao: string
  resolvida: boolean
  respostaSecretaria?: string
  responsavelAmostragem?: string
  responsavelSecretaria?: string
  isNonBlocking?: boolean
  historico?: { id: string; data: string; nota: string; usuario: string }[]
}

export interface AmostraItem {
  id: string
  tipo: string
  descricao: string
  embalagem: string
  quantidade: string
  unidade: string
  setorDestino: string
  analiseSolicitada?: string
  dosagem?: string
  unidadeDosagem?: string
  enviou1gExcipiente?: 'sim' | 'nao'
  enviou1gAtivo?: 'sim' | 'nao'
  fatorDiluicao?: string
  protocoloWeb?: string
  ordemServico?: string
  trocaEtiquetaSolicitada?: boolean
  trocaEtiquetaConfirmada?: boolean
  ordemServicoAnterior?: string
  fotos?: string[]
}

export interface Ficha {
  id: string
  uuid?: string
  dataRecebimento: string
  createdAt?: string
  responsavel: string
  formaRecebimento: string
  clienteNome: string
  cpfCnpj: string
  cidadeUf: string
  codigoContrato: string
  observacoes?: string
  itens: AmostraItem[]
  status: StatusFicha
  ocorrencias: Ocorrencia[]
  isDraft?: boolean
  vistoSecretaria?: boolean
}

export interface Configuracoes {
  nomeFicha: string
  formularioPadrao?: string
  revisaoFicha?: string
  formasRecebimento: string[]
  tiposAmostra: string[]
  setores: string[]
  setoresAnalise: string[]
  embalagens: string[]
  unidadesQtd: string[]
  unidadesDosagem: string[]
  cidadesEstados: string[]
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: 'Criou' | 'Atualizou' | 'Deletou'
  fichaId: string
  timestamp: string
  details?: string
}

export interface AppNotification {
  id: string
  userId: string
  message: string
  fichaId: string
  read: boolean
  createdAt: string
  type?: 'info' | 'tag_change'
}
