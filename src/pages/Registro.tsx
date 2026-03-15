import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, Send, AlertTriangle, ShieldAlert, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Ficha, Ocorrencia } from '@/types'
import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { RegistroHeader } from '@/components/RegistroHeader'
import { RegistroItens } from '@/components/RegistroItens'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { isValidCpf, isValidCnpj } from '@/lib/utils'

export default function Registro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fichas, addFicha, updateFicha, addAuditLog } = useAppStore()
  const { user } = useAuthStore()
  const [isOccModalOpen, setOccModalOpen] = useState(false)
  const [occText, setOccText] = useState('')

  const existingFicha = id ? fichas.find((f) => f.id === id) : undefined

  const [ficha, setFicha] = useState<Ficha>(() => {
    if (existingFicha) return existingFicha

    const currentYear = new Date().getFullYear()
    const yearFichas = fichas.filter((f) => f.id.startsWith(`FR-${currentYear}-`))
    const maxNum = yearFichas.reduce((max, f) => {
      const parts = f.id.split('-')
      const num = parseInt(parts[2] || '0', 10)
      return num > max ? num : max
    }, 0)
    const newSeq = (maxNum + 1).toString().padStart(2, '0')

    return {
      id: `FR-${currentYear}-${newSeq}`,
      dataRecebimento: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      responsavel: user?.name || 'Amostrador',
      formaRecebimento: '',
      clienteNome: '',
      cpfCnpj: '',
      cidadeUf: '',
      codigoContrato: '',
      status: 'Em Triagem',
      ocorrencias: [],
      itens: [],
      isDraft: true,
    }
  })

  useEffect(() => {
    if (existingFicha) setFicha(existingFicha)
  }, [existingFicha])

  const canAccess =
    user?.role === 'Administrador' ||
    user?.sector === 'Amostragem' ||
    (id && user?.sector === 'Secretaria')

  if (!canAccess) {
    return (
      <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[50vh]">
        <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
        <p>Apenas usuários do setor de Amostragem podem registrar novas fichas.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
          Voltar ao Dashboard
        </Button>
      </div>
    )
  }

  const validateForm = (isDraftSave: boolean) => {
    if (ficha.itens.length === 0) {
      toast.error('Adicione pelo menos um item.')
      return false
    }
    if (!ficha.clienteNome) {
      toast.error('Nome do cliente é obrigatório.')
      return false
    }
    if (ficha.cpfCnpj) {
      const digits = ficha.cpfCnpj.replace(/\D/g, '')
      if (!isDraftSave && (digits.length < 11 || (digits.length > 11 && digits.length < 14))) {
        toast.error('CPF/CNPJ incompleto.')
        return false
      }
      if (digits.length === 11 && !isValidCpf(digits)) {
        toast.error('CPF inválido.')
        return false
      }
      if (digits.length === 14 && !isValidCnpj(digits)) {
        toast.error('CNPJ inválido.')
        return false
      }
    }

    if (ficha.codigoContrato) {
      const parts = ficha.codigoContrato.split('/')
      const prefix = parts[0] || ''
      const suffix = parts[1] || ''
      if (prefix && !suffix) {
        toast.error('O Código do Contrato está incompleto. Preencha o sufixo (ano).')
        return false
      }
      if (!prefix && suffix) {
        toast.error('O Código do Contrato está incompleto. Preencha o prefixo (número).')
        return false
      }
      if (suffix && suffix.length !== 4) {
        toast.error('O sufixo do Código do Contrato deve conter exatamente 4 dígitos.')
        return false
      }
    }

    if (!isDraftSave && !ficha.codigoContrato) {
      toast.error('O Código do Contrato é obrigatório para enviar à Secretaria.')
      return false
    }

    for (const item of ficha.itens) {
      if (item.protocoloWeb) {
        const parts = item.protocoloWeb.split('-')
        if (parts.length < 2 || !parts[1]) {
          toast.error(
            'Protocolo Web incompleto. O Código do Contrato deve estar preenchido no cabeçalho.',
          )
          return false
        }
      }

      if (item.ordemServico) {
        const parts = item.ordemServico.split('-')
        if (parts.length < 2 || !parts[parts.length - 1]) {
          toast.error(
            'Ordem de Serviço incompleta. O Código do Contrato deve estar preenchido no cabeçalho.',
          )
          return false
        }
      }

      const isFQ = item.setorDestino === 'Físico-Químico'
      const requires1g =
        isFQ &&
        (item.tipo === 'Produto Acabado Farmacêutico' || item.tipo === 'Matéria-prima Diluída')
      if (requires1g && (!item.enviou1gExcipiente || !item.enviou1gAtivo)) {
        toast.error('Seleção de Excipiente e Ativo (1g) é obrigatória para os itens aplicáveis.')
        return false
      }
    }
    return true
  }

  const saveFicha = (isDraftSave: boolean, ocorrencias?: Ocorrencia[]) => {
    const action = id ? 'Atualizou' : 'Criou'
    let status = ficha.status

    if (isDraftSave) {
      status = 'Em Triagem'
    } else {
      if (user?.sector === 'Amostragem' || user?.role === 'Administrador') {
        if (
          ficha.status === 'Respondida pela Secretaria' ||
          ficha.status === 'Aguardando Validação'
        ) {
          status = 'Aguardando Validação'
        } else {
          status = 'Aguardando Secretaria'
        }
      }
    }

    if (user?.sector === 'Secretaria' && ficha.status) {
      status = (ficha.status as any) === 'Resolvida' ? 'Finalizada' : ficha.status
    }

    const finalFicha = { ...ficha, status, isDraft: isDraftSave }
    if (ocorrencias)
      finalFicha.ocorrencias = id ? [...ficha.ocorrencias, ...ocorrencias] : ocorrencias

    if (id) {
      updateFicha(finalFicha)
    } else {
      addFicha(finalFicha)
    }
    addAuditLog({ userId: user!.id, userName: user!.name, action, fichaId: ficha.id })
  }

  const handleSaveDraft = () => {
    if (!validateForm(true)) return
    saveFicha(true)
    toast.success('Rascunho salvo com sucesso!')
    navigate('/')
  }

  const handleSubmit = () => {
    if (!validateForm(false)) return
    saveFicha(false)
    if (user?.sector === 'Secretaria') {
      toast.success('Alterações salvas com sucesso!')
    } else {
      toast.success('Ficha enviada para a Secretaria!')
    }
    navigate('/')
  }

  const handleOcorrenciaSubmit = () => {
    if (!ficha.clienteNome) {
      toast.error('Preencha o Nome do Cliente primeiro.')
      return
    }
    if (!occText) {
      toast.error('Descreva o caso.')
      return
    }
    const newOcc: Ocorrencia = { id: `occ-${Date.now()}`, descricao: occText, resolvida: false }
    saveFicha(false, [newOcc])
    toast.success('Ocorrência gerada e ficha enviada para Secretaria.')
    setOccModalOpen(false)
    navigate('/')
  }

  const handleConfirmarTroca = (itemId: string) => {
    const newItens = ficha.itens.map((i) =>
      i.id === itemId ? { ...i, trocaEtiquetaConfirmada: true } : i,
    )
    const updated = { ...ficha, itens: newItens }
    setFicha(updated)
    updateFicha(updated)
    toast.success('Confirmação de troca registrada com sucesso!')
  }

  const hasResponses = ficha.ocorrencias.some((o) => o.respostaSecretaria)
  const itemsNeedingTagChange = ficha.itens.filter(
    (i) => i.trocaEtiquetaSolicitada && !i.trocaEtiquetaConfirmada,
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {id ? 'Editar Ficha' : 'Registro de Ficha'}
        </h1>
        <p className="text-muted-foreground mt-1">Preencha os dados da amostra recebida.</p>
      </div>

      {itemsNeedingTagChange.length > 0 && user?.sector !== 'Secretaria' && (
        <div className="bg-warning/10 border border-warning/30 p-4 rounded-md space-y-3 animate-fade-in">
          <h3 className="font-semibold text-warning-foreground flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Ação Necessária: Troca de Etiqueta
          </h3>
          <div className="space-y-2">
            {itemsNeedingTagChange.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background p-3 rounded border border-warning/20 shadow-sm"
              >
                <div className="text-[13px]">
                  <span className="font-semibold text-foreground">{item.descricao}</span>
                  <div className="text-muted-foreground mt-1">
                    Ordem de Serviço alterada de{' '}
                    <span className="line-through">{item.ordemServicoAnterior}</span> para{' '}
                    <span className="font-bold text-foreground">{item.ordemServico}</span>
                  </div>
                </div>
                <Button size="sm" onClick={() => handleConfirmarTroca(item.id)}>
                  Confirmar Troca Físicamente
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasResponses && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-md space-y-3 animate-fade-in">
          <h3 className="font-semibold text-primary flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Mensagens da Secretaria
          </h3>
          <div className="space-y-2">
            {ficha.ocorrencias
              .filter((o) => o.respostaSecretaria)
              .map((o) => (
                <div key={o.id} className="bg-background border rounded p-3 text-[13px] shadow-sm">
                  <div className="font-semibold text-muted-foreground mb-1 uppercase tracking-wider text-[10px]">
                    Pendência Original: {o.descricao}
                  </div>
                  <div className="text-foreground">
                    <span className="font-semibold text-primary">Resposta:</span>{' '}
                    {o.respostaSecretaria}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <RegistroHeader ficha={ficha} setFicha={setFicha} />
      <RegistroItens
        itens={ficha.itens}
        setItens={(itens) => setFicha({ ...ficha, itens })}
        codigoContrato={ficha.codigoContrato}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex justify-end gap-3 z-40 sm:left-[16rem]">
        {user?.sector !== 'Secretaria' && (
          <Button variant="destructive" className="mr-auto" onClick={() => setOccModalOpen(true)}>
            <AlertTriangle className="mr-2 h-4 w-4" /> Resolução Secretaria
          </Button>
        )}
        {user?.sector !== 'Secretaria' && (
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="mr-2 h-4 w-4" /> Salvar Rascunho
          </Button>
        )}
        <Button onClick={handleSubmit}>
          {user?.sector === 'Secretaria' ? (
            <Save className="mr-2 h-4 w-4" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {user?.sector === 'Secretaria' ? 'Salvar Alterações' : 'Enviar Secretaria'}
        </Button>
      </div>

      <Dialog open={isOccModalOpen} onOpenChange={setOccModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar Resolução de Pendência</DialogTitle>
            <DialogDescription>
              A ficha será enviada para a Secretaria com status de pendência.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <Input value={ficha.clienteNome} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Descrição do Caso</Label>
              <Textarea
                placeholder="Explique o motivo da ocorrência..."
                value={occText}
                onChange={(e) => setOccText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOccModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleOcorrenciaSubmit}>
              Gerar ocorrência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
