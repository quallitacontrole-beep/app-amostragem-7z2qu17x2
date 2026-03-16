import { useState, useEffect } from 'react'
import { Ficha, AmostraItem, StatusFicha } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/main'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RegistroHeader } from '@/components/RegistroHeader'
import { RegistroItens } from '@/components/RegistroItens'
import { StatusBadge } from '@/components/StatusBadge'

interface Props {
  ficha: Ficha | null
  isOpen: boolean
  onClose: () => void
  onSave: (f: Ficha) => void
}

export function PendenciaModal({ ficha, isOpen, onClose, onSave }: Props) {
  const { user } = useAuthStore()
  const { addNotification } = useAppStore()
  const [localFicha, setLocalFicha] = useState<Ficha | null>(null)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [localTagConfirm, setLocalTagConfirm] = useState(false)

  useEffect(() => {
    if (ficha && isOpen) {
      setLocalFicha(JSON.parse(JSON.stringify(ficha)))
      setRespostas({})
      setLocalTagConfirm(false)
    }
  }, [ficha, isOpen])

  const isSecretaria = user?.sector === 'Secretaria' || user?.role === 'Administrador'

  const calculateStatusAfterItemsChange = (newItens: AmostraItem[], currentStatus: string) => {
    let hasOSChanged = false
    newItens.forEach((newItem) => {
      const oldItem = ficha?.itens.find((i) => i.id === newItem.id)
      if (
        oldItem &&
        oldItem.ordemServico &&
        newItem.ordemServico &&
        oldItem.ordemServico !== newItem.ordemServico
      ) {
        hasOSChanged = true
      }
    })
    if (hasOSChanged) {
      if (ficha?.status === 'Finalizada') {
        return 'Validação Secretaria'
      } else {
        return 'Aguardando Secretaria'
      }
    }
    return currentStatus
  }

  const updateItem = (id: string, field: keyof AmostraItem, val: string) => {
    setLocalFicha((prev) => {
      if (!prev) return null
      const newItens = prev.itens.map((it) => (it.id === id ? { ...it, [field]: val } : it))
      const nextStatus = calculateStatusAfterItemsChange(newItens, prev.status)
      return { ...prev, itens: newItens, status: nextStatus as StatusFicha }
    })
  }

  const toggleOcc = (id: string, resolvida: boolean, resposta?: string) => {
    setLocalFicha((prev) => {
      if (!prev) return null
      return {
        ...prev,
        status: resolvida ? 'Respondida pela Secretaria' : prev.status,
        ocorrencias: prev.ocorrencias.map((o) => {
          if (o.id === id) {
            const updated = { ...o, resolvida }
            if (resposta) updated.respostaSecretaria = resposta
            return updated
          }
          return o
        }),
      }
    })
    if (resolvida && resposta && localFicha) {
      addNotification({
        userId: localFicha.responsavel,
        message: `A pendência na ficha ${localFicha.id} foi respondida pela Secretaria.`,
        fichaId: localFicha.id,
        type: 'info',
      })
    }
  }

  const handleResolve = (occId: string) => {
    const resp = respostas[occId]
    if (!resp || resp.trim() === '') {
      toast.error('A Resposta da Secretaria é obrigatória para resolver a ocorrência.')
      return
    }
    toggleOcc(occId, true, resp)
  }

  const handleUpdateContrato = (newCod: string) => {
    if (!localFicha) return
    const newItens = localFicha.itens.map((item) => {
      const updatedItem = { ...item }
      if (updatedItem.protocoloWeb) {
        const match = updatedItem.protocoloWeb.match(/^P(\d+)/)
        if (match) {
          updatedItem.protocoloWeb = newCod ? `P${match[1]}-${newCod}` : ''
        }
      }
      if (updatedItem.ordemServico) {
        const match = updatedItem.ordemServico.match(/-(\d{1,2})$/)
        if (match) {
          updatedItem.ordemServico = newCod ? `${newCod}-${match[1]}` : ''
        }
      }
      return updatedItem
    })
    const nextStatus = calculateStatusAfterItemsChange(newItens, localFicha.status)
    setLocalFicha({
      ...localFicha,
      codigoContrato: newCod,
      itens: newItens,
      status: nextStatus as StatusFicha,
    })
  }

  const hasUnconfirmedTagChange = localFicha?.itens.some((it) => {
    const oit = ficha?.itens.find((i) => i.id === it.id)
    const isChangedNow =
      oit && oit.ordemServico && it.ordemServico && oit.ordemServico !== it.ordemServico
    const wasChangedBefore = it.trocaEtiquetaSolicitada && !it.trocaEtiquetaConfirmada
    if (isChangedNow) return true
    return wasChangedBefore
  })

  const needsTagConfirmation = hasUnconfirmedTagChange && !localTagConfirm

  const isContratoValidado = Boolean(
    localFicha?.codigoContrato?.includes('/') &&
    localFicha.codigoContrato.split('/')[1]?.length === 4,
  )
  const isOsVinculado =
    localFicha && localFicha.itens.length > 0
      ? localFicha.itens.every((it) => it.ordemServico?.includes('-'))
      : false
  const isOcorrenciasZeradas = localFicha?.ocorrencias.every((o) => o.resolvida) ?? true
  const isVistoSecretaria = !!localFicha?.vistoSecretaria

  const canConcluir =
    isContratoValidado &&
    isOsVinculado &&
    isOcorrenciasZeradas &&
    isVistoSecretaria &&
    !needsTagConfirmation

  useEffect(() => {
    if (!localFicha) return
    if (canConcluir && localFicha.status !== 'Finalizada') {
      setLocalFicha((prev) => (prev ? { ...prev, status: 'Finalizada' } : null))
      toast.success('Checklist 100% concluído. A ficha agora está Finalizada.')
    } else if (!canConcluir && localFicha.status === 'Finalizada') {
      setLocalFicha((prev) => (prev ? { ...prev, status: 'Validação Secretaria' } : null))
    }
  }, [canConcluir, localFicha?.status])

  if (!localFicha) return null

  const prepareFichaForSave = (targetStatus?: Ficha['status']) => {
    if (!ficha) return localFicha

    let hasOSChanged = false

    const updatedItems = localFicha.itens.map((lit) => {
      const oit = ficha.itens.find((i) => i.id === lit.id)
      let isChangedNow = false

      if (oit && oit.ordemServico && lit.ordemServico && oit.ordemServico !== lit.ordemServico) {
        isChangedNow = true
        hasOSChanged = true
        addNotification({
          userId: localFicha.responsavel,
          message: `Ordem de Troca de Etiqueta: A OS da amostra "${lit.descricao}" foi alterada de ${oit.ordemServico} para ${lit.ordemServico}.`,
          fichaId: localFicha.id,
          type: 'tag_change',
        })
      }

      const wasRequested = lit.trocaEtiquetaSolicitada

      return {
        ...lit,
        trocaEtiquetaSolicitada: isChangedNow || wasRequested ? true : lit.trocaEtiquetaSolicitada,
        trocaEtiquetaConfirmada: isChangedNow
          ? false
          : localTagConfirm
            ? true
            : lit.trocaEtiquetaConfirmada,
        ordemServicoAnterior: isChangedNow ? oit?.ordemServico : lit.ordemServicoAnterior,
      }
    })

    let finalStatus = targetStatus || localFicha.status
    if (hasOSChanged && !targetStatus) {
      if (ficha.status === 'Finalizada') {
        finalStatus = 'Validação Secretaria'
      } else {
        finalStatus = 'Aguardando Secretaria'
      }
    }

    if (canConcluir && targetStatus === 'Finalizada') {
      finalStatus = 'Finalizada'
    }

    return {
      ...localFicha,
      itens: updatedItems,
      status: finalStatus,
    }
  }

  const handleFinalizar = () => {
    if (!canConcluir) return toast.error('Conclua todos os itens do checklist antes de finalizar.')
    onSave(prepareFichaForSave('Finalizada') as Ficha)
    onClose()
    toast.success('Ficha Finalizada com sucesso!')
  }

  const handleSaveParcial = () => {
    onSave(prepareFichaForSave() as Ficha)
    onClose()
    toast.info('Alterações salvas parcialmente.')
  }

  const CheckItem = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
      )}
      <span className="text-sm font-medium leading-tight">{label}</span>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90dvh] flex flex-col p-0 overflow-hidden gap-0 sm:rounded-lg bg-background">
        <div className="px-4 sm:px-6 py-4 border-b shrink-0 bg-background z-10">
          <DialogHeader>
            <DialogTitle className="text-xl pr-8 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span>Tratar Pendências - {localFicha.id}</span>
              <StatusBadge status={localFicha.status} className="w-fit" />
            </DialogTitle>
            <DialogDescription>Cliente: {localFicha.clienteNome}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain bg-background">
          <Tabs defaultValue="acoes" className="w-full">
            <div className="px-4 sm:px-6 border-b bg-muted/20">
              <TabsList className="w-full justify-start rounded-none border-0 bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="acoes"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm font-medium"
                >
                  Ações e Ocorrências
                </TabsTrigger>
                <TabsTrigger
                  value="edicao"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm font-medium"
                >
                  Edição Completa da Ficha
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="acoes"
              className="m-0 p-4 sm:p-6 space-y-6 bg-background outline-none"
            >
              <div className="space-y-2 w-full sm:max-w-[50%]">
                <Label>Código do Contrato</Label>
                <Input
                  value={localFicha.codigoContrato || ''}
                  onChange={(e) => handleUpdateContrato(e.target.value)}
                  placeholder="Insira o contrato..."
                />
              </div>

              {hasUnconfirmedTagChange && !isSecretaria && (
                <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-md space-y-3 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-destructive text-sm">
                        Atenção: Troca de Etiqueta Necessária
                      </h4>
                      <p className="text-xs text-destructive/80 mt-1">
                        Foram detectadas alterações na Ordem de Serviço de uma ou mais amostras. É
                        obrigatório confirmar a atualização física das etiquetas.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center space-x-3 bg-background p-3 rounded border">
                    <Checkbox
                      id="confirm-tags"
                      checked={localTagConfirm}
                      onCheckedChange={(checked) => setLocalTagConfirm(!!checked)}
                      className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                    />
                    <Label htmlFor="confirm-tags" className="font-medium cursor-pointer text-sm">
                      Confirmo que as etiquetas físicas foram ou serão atualizadas.
                    </Label>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  'p-4 rounded-md border shadow-sm transition-all duration-300',
                  canConcluir ? 'bg-success/5 border-success/40' : 'bg-card',
                )}
              >
                <Label className="text-base font-semibold block mb-4">Checklist de Validação</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CheckItem label="Contrato Validado" ok={isContratoValidado} />
                  <CheckItem label="Vínculo de OS" ok={isOsVinculado} />
                  <CheckItem label="Ocorrências Zeradas" ok={isOcorrenciasZeradas} />
                  <CheckItem label="Visto da Secretaria" ok={isVistoSecretaria} />
                  <CheckItem label="Etiquetas Atualizadas" ok={!needsTagConfirmation} />
                </div>
                {isSecretaria && (
                  <div className="mt-5 pt-4 border-t flex flex-col sm:flex-row justify-end">
                    <Button
                      size="sm"
                      variant={isVistoSecretaria ? 'secondary' : 'outline'}
                      disabled={isVistoSecretaria}
                      onClick={() => setLocalFicha({ ...localFicha, vistoSecretaria: true })}
                      className="w-full sm:w-auto"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2 shrink-0" />
                      <span className="truncate">
                        {isVistoSecretaria ? 'Informações Validadas' : 'Validar as informações'}
                      </span>
                    </Button>
                  </div>
                )}
              </div>

              {localFicha.ocorrencias.length > 0 && (
                <div
                  className={cn(
                    'space-y-3 p-4 rounded-md border',
                    isOcorrenciasZeradas
                      ? 'bg-success/5 border-success/20'
                      : 'bg-destructive/5 border-destructive/20',
                  )}
                >
                  <Label
                    className={cn(
                      'font-bold text-base',
                      isOcorrenciasZeradas ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {isOcorrenciasZeradas ? 'Ocorrências Resolvidas' : 'Pendências em Aberto'}
                  </Label>
                  {localFicha.ocorrencias.map((occ) => (
                    <div
                      key={occ.id}
                      className={cn(
                        'flex flex-col gap-3 bg-background p-4 rounded border shadow-sm transition-colors',
                        occ.resolvida ? 'border-success/40' : 'border-warning/60 shadow-warning/10',
                      )}
                    >
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                          Descrição Original
                        </Label>
                        <div className="bg-muted/40 p-3 rounded border text-sm whitespace-pre-wrap text-foreground break-words">
                          {occ.descricao}
                        </div>
                      </div>

                      {occ.resolvida && occ.respostaSecretaria && (
                        <div className="space-y-2 mt-2">
                          <Label className="text-xs font-semibold text-success uppercase tracking-wider block">
                            Sua Resposta
                          </Label>
                          <div className="bg-success/10 border-success/20 p-3 rounded border text-sm whitespace-pre-wrap text-foreground break-words">
                            {occ.respostaSecretaria}
                          </div>
                        </div>
                      )}

                      {!occ.resolvida && (
                        <div className="space-y-2 mt-3">
                          <Label className="text-xs font-semibold text-primary uppercase tracking-wider block">
                            Resposta da Secretaria <span className="text-destructive">*</span>
                          </Label>
                          <Textarea
                            placeholder="Digite a resposta para o amostrador..."
                            value={respostas[occ.id] || ''}
                            onChange={(e) =>
                              setRespostas({ ...respostas, [occ.id]: e.target.value })
                            }
                            className={cn(
                              !respostas[occ.id]
                                ? 'border-warning/50 focus-visible:ring-warning'
                                : '',
                            )}
                          />
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row justify-end border-t pt-3 mt-2">
                        {occ.resolvida ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => toggleOcc(occ.id, false)}
                          >
                            Reabrir Ocorrência
                          </Button>
                        ) : (
                          <Button
                            className="bg-success hover:bg-success/90 text-success-foreground font-semibold shadow-sm w-full sm:w-auto"
                            size="sm"
                            onClick={() => handleResolve(occ.id)}
                          >
                            Resolver ocorrência
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-base font-semibold">Acesso Rápido: Itens e OS</Label>
                <div className="border rounded-md overflow-x-auto">
                  <Table className="min-w-[500px]">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Amostra</TableHead>
                        <TableHead>Protocolo Web</TableHead>
                        <TableHead>Ordem de Serviço (OS)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {localFicha.itens.map((it, i) => (
                        <TableRow key={it.id}>
                          <TableCell className="font-medium">
                            {it.descricao || `Item ${i + 1}`}
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8 text-sm min-w-[120px]"
                              value={it.protocoloWeb || ''}
                              onChange={(e) => updateItem(it.id, 'protocoloWeb', e.target.value)}
                              placeholder="Opcional"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className={cn(
                                'h-8 text-sm min-w-[150px]',
                                !it.ordemServico?.includes('-')
                                  ? 'border-warning focus-visible:ring-warning'
                                  : '',
                              )}
                              value={it.ordemServico || ''}
                              onChange={(e) => updateItem(it.id, 'ordemServico', e.target.value)}
                              placeholder="Obrigatório"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="edicao"
              className="m-0 p-4 sm:p-6 space-y-6 bg-muted/10 min-h-[50vh] outline-none"
            >
              <RegistroHeader
                ficha={localFicha}
                setFicha={(updatedFicha) => {
                  const nextStatus = calculateStatusAfterItemsChange(
                    updatedFicha.itens,
                    updatedFicha.status,
                  )
                  setLocalFicha({ ...updatedFicha, status: nextStatus as StatusFicha })
                }}
              />
              <RegistroItens
                itens={localFicha.itens}
                setItens={(newItens) => {
                  const nextStatus = calculateStatusAfterItemsChange(newItens, localFicha.status)
                  setLocalFicha({
                    ...localFicha,
                    itens: newItens,
                    status: nextStatus as StatusFicha,
                  })
                }}
                codigoContrato={localFicha.codigoContrato}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t bg-muted/20 shrink-0 z-10">
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleSaveParcial}>
              {canConcluir ? 'Salvar Alterações' : 'Salvar Parcial'}
            </Button>
            <Button
              onClick={handleFinalizar}
              disabled={!canConcluir}
              className={cn(
                'w-full sm:w-auto',
                canConcluir
                  ? 'bg-success hover:bg-success/90 text-success-foreground shadow-md'
                  : '',
              )}
            >
              Finalizar ficha
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
