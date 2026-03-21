import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Save,
  Send,
  AlertTriangle,
  ShieldAlert,
  Tag,
  Printer,
  X,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Ficha, Ocorrencia, StatusFicha } from '@/types'
import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { RegistroHeader } from '@/components/RegistroHeader'
import { RegistroItens } from '@/components/RegistroItens'
import { StatusBadge } from '@/components/StatusBadge'
import { PrintFichas } from '@/components/PrintFichas'
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
import { isValidCpf, isValidCnpj, removeAccents, processAutoOccurrences } from '@/lib/utils'

export default function Registro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { fichas, addFicha, updateFicha, deleteFicha, addAuditLog, configuracoes } = useAppStore()
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

  const isContratoValidado = Boolean(
    ficha.codigoContrato?.includes('/') && ficha.codigoContrato.split('/')[1]?.length === 4,
  )
  const isOsVinculado =
    ficha.itens.length > 0 && ficha.itens.every((it) => it.ordemServico?.includes('-'))
  const hasNoBlocking = ficha.ocorrencias.every((o) => o.resolvida || o.isNonBlocking)
  const isAllResolved = ficha.ocorrencias.every((o) => o.resolvida)
  const needsTagConfirmation = ficha.itens.some(
    (i) => i.trocaEtiquetaSolicitada && !i.trocaEtiquetaConfirmada,
  )
  const isVistoSecretaria = !!ficha.vistoSecretaria

  const canConcluir =
    isContratoValidado &&
    isOsVinculado &&
    hasNoBlocking &&
    isVistoSecretaria &&
    !needsTagConfirmation

  useEffect(() => {
    if (!existingFicha) return
    if (canConcluir && ficha.status !== 'Finalizada' && ficha.status !== 'Finalizada (Impressa)') {
      setFicha((prev) => ({ ...prev, status: 'Finalizada' }))
      if (user?.sector === 'Secretaria') {
        toast.success('Checklist completo! Status alterado para Finalizada.')
      }
    } else if (!canConcluir && ficha.status === 'Finalizada') {
      setFicha((prev) => ({ ...prev, status: 'Validação Secretaria' }))
    }
  }, [canConcluir, ficha.status, existingFicha, user?.sector])

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
    const isFinalizing = !isDraftSave
    const errors: string[] = []

    if (!ficha.formaRecebimento) errors.push('Recebimento')
    if (!ficha.clienteNome) errors.push('Cliente')
    if (!ficha.cidadeUf) errors.push('Cidade')

    if (ficha.itens.length === 0) {
      errors.push('Adicione pelo menos um item da amostra.')
    } else {
      ficha.itens.forEach((item, index) => {
        const itemPrefix = `Amostra ${index + 1}:`

        if (!item.tipo) errors.push(`${itemPrefix} Tipo de amostra`)
        if (!item.quantidade) errors.push(`${itemPrefix} Qt amostral`)
        if (!item.unidade) errors.push(`${itemPrefix} Unidade de medida`)
        if (!item.descricao) errors.push(`${itemPrefix} Descrição`)
        if (!item.embalagem) errors.push(`${itemPrefix} Embalagem`)
        if (!item.setorDestino) errors.push(`${itemPrefix} Setor de análise`)
      })
    }

    if (isFinalizing) {
      if (!ficha.codigoContrato) {
        errors.push('Código do contrato obrigatório para finalizar')
      } else {
        const parts = ficha.codigoContrato.split('/')
        if (parts.length < 2 || !parts[0] || parts[1].length !== 4) {
          errors.push('Código do contrato inválido ou incompleto')
        }
      }
    }

    if (ficha.cpfCnpj) {
      const digits = ficha.cpfCnpj.replace(/\D/g, '')
      if (digits.length < 11 || (digits.length > 11 && digits.length < 14)) {
        errors.push('CPF/CNPJ incompleto')
      }
      if (digits.length === 11 && !isValidCpf(digits)) {
        errors.push('CPF inválido')
      }
      if (digits.length === 14 && !isValidCnpj(digits)) {
        errors.push('CNPJ inválido')
      }
    }

    if (errors.length > 0) {
      toast.error('Não foi possível salvar o registro', {
        description: (
          <div className="mt-2 text-[13px] text-foreground/90">
            <span className="font-semibold mb-1 block text-destructive">
              Campos obrigatórios ausentes ou inválidos:
            </span>
            <ul className="list-disc pl-4 space-y-0.5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        ),
        duration: 8000,
      })
      return false
    }

    return true
  }

  const saveFicha = (isIntermediateSave: boolean, ocorrencias?: Ocorrencia[]) => {
    const isExisting = !!id || fichas.some((f) => f.id === ficha.id)
    const action = isExisting ? 'Atualizou' : 'Criou'

    const finalItens = ficha.itens.map((item) => {
      const oldItem = existingFicha?.itens.find((i) => i.id === item.id)
      const oldOs = oldItem?.ordemServico || ''
      const newOs = item.ordemServico || ''
      const isChangedNow = newOs && oldOs !== newOs && user?.sector === 'Secretaria'

      if (isChangedNow && !item.trocaEtiquetaConfirmada) {
        return {
          ...item,
          trocaEtiquetaSolicitada: true,
          ordemServicoAnterior: oldOs,
        }
      }
      return item
    })

    let mergedOccs = processAutoOccurrences(finalItens, ficha.ocorrencias, user?.name)
    if (ocorrencias) {
      mergedOccs = [...mergedOccs, ...ocorrencias]
    }

    let status = ficha.status

    const stillNeedsTagConf = finalItens.some(
      (i) => i.trocaEtiquetaSolicitada && !i.trocaEtiquetaConfirmada,
    )
    if (stillNeedsTagConf && status !== 'Em Triagem') {
      status = 'Aguardando Amostragem'
    }

    const autoOccsPending = mergedOccs.some((o) => !o.resolvida && o.isNonBlocking)
    const blockingPending = mergedOccs.some((o) => !o.resolvida && !o.isNonBlocking)

    if (isIntermediateSave) {
      if (
        status !== 'Finalizada' &&
        status !== 'Finalizada (Impressa)' &&
        status !== 'Validação Secretaria' &&
        status !== 'Aguardando Secretaria' &&
        status !== 'Aguardando Amostragem' &&
        status !== 'Respondida pela Secretaria'
      ) {
        status = 'Em Triagem'
      }
    } else if (blockingPending || ocorrencias?.length) {
      status = 'Aguardando Secretaria'
    } else {
      if (
        (user?.sector === 'Amostragem' || user?.role === 'Administrador') &&
        !stillNeedsTagConf &&
        status !== 'Finalizada' &&
        status !== 'Finalizada (Impressa)'
      ) {
        status = 'Validação Secretaria'
      }
    }

    if (user?.sector === 'Secretaria' && ficha.status) {
      status = ficha.status === 'Resolvida' ? 'Finalizada' : ficha.status
      if (!canConcluir && status === 'Finalizada') {
        status = 'Validação Secretaria'
      }
    }

    const finalFicha = {
      ...ficha,
      itens: finalItens,
      status,
      ocorrencias: mergedOccs,
      isDraft: isIntermediateSave ? ficha.isDraft : false,
    }

    if (isExisting) {
      updateFicha(finalFicha)
    } else {
      addFicha(finalFicha)
    }

    setFicha(finalFicha)

    addAuditLog({ userId: user!.id, userName: user!.name, action, fichaId: ficha.id })
  }

  const handleSaveDraft = () => {
    if (!validateForm(true)) return
    saveFicha(true)
    toast.success('Progresso salvo com sucesso!', {
      description: 'Você pode continuar editando a ficha.',
    })
    if (!id) {
      navigate(`/registro/${ficha.id}`, { replace: true })
    }
  }

  const handleSubmit = () => {
    if (!validateForm(false)) return
    saveFicha(false)
    if (user?.sector === 'Secretaria') {
      toast.success('Alterações salvas com sucesso!')
    } else {
      toast.success('Ficha salva e enviada para a Secretaria!')
    }
    navigate('/')
  }

  const handleOcorrenciaSubmit = () => {
    if (!ficha.clienteNome) {
      toast.error('Preencha o Cliente primeiro.')
      return
    }
    if (!occText) {
      toast.error('Descreva o caso.')
      return
    }
    const newOcc: Ocorrencia = {
      id: `occ-${Date.now()}`,
      descricao: occText,
      resolvida: false,
      responsavelAmostragem: user?.name,
    }
    saveFicha(false, [newOcc])
    toast.success('Ocorrência gerada e ficha enviada para Secretaria.')
    setOccModalOpen(false)
    navigate('/')
  }

  const handleConfirmarTroca = (itemId: string) => {
    const newItens = ficha.itens.map((i) => {
      if (i.id === itemId) {
        const oldItem = existingFicha?.itens.find((old) => old.id === itemId)
        return {
          ...i,
          trocaEtiquetaConfirmada: true,
          trocaEtiquetaSolicitada: true,
          ordemServicoAnterior: oldItem?.ordemServico || i.ordemServicoAnterior,
        }
      }
      return i
    })

    const isNowComplete =
      isContratoValidado &&
      newItens.length > 0 &&
      newItens.every((it) => it.ordemServico?.includes('-')) &&
      hasNoBlocking &&
      isVistoSecretaria &&
      !newItens.some((i) => i.trocaEtiquetaSolicitada && !i.trocaEtiquetaConfirmada)

    const updated = {
      ...ficha,
      itens: newItens,
      status: isNowComplete ? 'Finalizada' : ficha.status,
    } as Ficha

    setFicha(updated)
    updateFicha(updated)

    if (isNowComplete) {
      toast.success('Checklist 100% concluído! A ficha foi Finalizada automaticamente.')
      navigate('/')
    } else {
      toast.success('Confirmação de troca registrada com sucesso!')
    }
  }

  const handlePrint = () => {
    window.print()
    if (ficha.status === 'Finalizada') {
      const updated = { ...ficha, status: 'Finalizada (Impressa)' as StatusFicha }
      setFicha(updated)
      updateFicha(updated)
    }
  }

  const handleDescartar = () => {
    if (!ficha.uuid && !id) {
      toast.error('Ficha não pode ser descartada.')
      return
    }
    if (window.confirm(`Deseja realmente descartar esta ficha? Esta ação é irreversível.`)) {
      if (ficha.uuid) {
        deleteFicha(ficha.uuid, ficha.id)
      }
      toast.success('Ficha descartada com sucesso.')
      navigate('/')
    }
  }

  const handleReabrir = () => {
    if (
      window.confirm(
        "Deseja realmente reabrir esta ficha? Ela voltará para o status 'Aguardando Secretaria' e poderá ser editada novamente.",
      )
    ) {
      const updated = { ...ficha, status: 'Aguardando Secretaria' as StatusFicha }
      setFicha(updated)
      updateFicha(updated)
      toast.success('Ficha reaberta com sucesso.')
    }
  }

  const handleClose = () => {
    const currentStr = JSON.stringify(ficha)
    const existingStr = existingFicha ? JSON.stringify(existingFicha) : null

    if (!existingFicha || currentStr !== existingStr) {
      if (!window.confirm('Existem alterações não salvas. Deseja realmente sair?')) {
        return
      }
    }
    navigate('/')
  }

  const hasResponses = ficha.ocorrencias.some((o) => o.respostaSecretaria && !o.resolvida)
  const itemsNeedingTagChange = ficha.itens.filter((item) => {
    const oldItem = existingFicha?.itens.find((i) => i.id === item.id)
    const oldOs = oldItem?.ordemServico || ''
    const newOs = item.ordemServico || ''
    const isChangedNow = newOs && oldOs !== newOs && user?.sector === 'Secretaria'
    if (isChangedNow && !item.trocaEtiquetaConfirmada) return true
    if (item.trocaEtiquetaSolicitada && !item.trocaEtiquetaConfirmada) return true
    return false
  })

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-fade-in print:hidden">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {id ? 'Editar Ficha' : 'Registro de Ficha'}
              </h1>
              {id && <StatusBadge status={ficha.status} className="w-fit" />}
            </div>
            <p className="text-muted-foreground mt-1">Preencha os dados da amostra recebida.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            title="Fechar e voltar"
            className="text-muted-foreground hover:text-foreground shrink-0 mt-1"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {itemsNeedingTagChange.length > 0 && user?.sector !== 'Secretaria' && (
          <div className="bg-warning/10 border border-warning/30 p-4 rounded-md space-y-3 animate-fade-in">
            <h3 className="font-semibold text-warning-foreground flex items-center gap-2 text-[#ff0000]">
              <Tag className="w-5 h-5" />
              Ação Necessária: Troca de Etiqueta
            </h3>
            <div className="space-y-2">
              {itemsNeedingTagChange.map((item) => {
                const oldItem = existingFicha?.itens.find((i) => i.id === item.id)
                const previousOs = item.ordemServicoAnterior || oldItem?.ordemServico || 'Nenhuma'
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background p-3 rounded border border-warning/20 shadow-sm"
                  >
                    <div className="text-[13px]">
                      <span className="font-semibold text-foreground">{item.descricao}</span>
                      <div className="text-muted-foreground mt-1">
                        Atenção: Troca de Etiqueta Necessária. Etiqueta Anterior (Descartar):{' '}
                        <span className="line-through">{previousOs}</span>. Nova Etiqueta:{' '}
                        <span className="font-bold text-foreground">{item.ordemServico}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleConfirmarTroca(item.id)}>
                      Confirmar troca de etiqueta
                    </Button>
                  </div>
                )
              })}
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
                .filter((o) => o.respostaSecretaria && !o.resolvida)
                .map((o) => (
                  <div
                    key={o.id}
                    className="bg-background border rounded p-3 text-[13px] shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                        Pendência Original: {o.descricao}
                      </div>
                      {o.responsavelSecretaria && (
                        <div className="text-[10px] text-muted-foreground">
                          Resp: {o.responsavelSecretaria}
                        </div>
                      )}
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

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex justify-end gap-3 z-40 sm:left-[16rem] print:hidden">
          <div className="mr-auto flex flex-wrap gap-2">
            {user?.sector === 'Secretaria' && id && (
              <Button variant="outline" onClick={handlePrint} type="button">
                <Printer className="mr-2 h-4 w-4" /> Imprimir
              </Button>
            )}
            {user?.sector === 'Secretaria' &&
              id &&
              (ficha.status === 'Finalizada' || ficha.status === 'Finalizada (Impressa)') && (
                <Button variant="secondary" onClick={handleReabrir} type="button">
                  <RefreshCw className="mr-2 h-4 w-4" /> Reabrir Ficha
                </Button>
              )}
            {(user?.role === 'Administrador' || user?.sector === 'Amostragem') && id && (
              <Button variant="destructive" onClick={handleDescartar} type="button">
                <Trash2 className="mr-2 h-4 w-4" /> Descartar Ficha
              </Button>
            )}
            {user?.sector !== 'Secretaria' && (
              <Button
                variant="destructive"
                onClick={() => setOccModalOpen(true)}
                disabled={ficha.status === 'Finalizada' || ficha.status === 'Finalizada (Impressa)'}
              >
                <AlertTriangle className="mr-2 h-4 w-4" /> Resolução
              </Button>
            )}
          </div>

          {user?.sector !== 'Secretaria' && (
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={
              user?.sector !== 'Secretaria' &&
              (ficha.status === 'Finalizada' || ficha.status === 'Finalizada (Impressa)')
            }
          >
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
                <Label>Cliente</Label>
                <Input value={ficha.clienteNome} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Responsável Amostragem</Label>
                <Input value={user?.name || ''} disabled className="bg-muted" />
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

      {id && <PrintFichas fichas={[ficha]} config={configuracoes} />}
    </>
  )
}
