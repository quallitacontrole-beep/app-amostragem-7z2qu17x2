import { useState, useEffect } from 'react'
import { Ficha, AmostraItem } from '@/types'
import { useAuthStore } from '@/stores/auth'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  ficha: Ficha | null
  isOpen: boolean
  onClose: () => void
  onSave: (f: Ficha) => void
}

export function PendenciaModal({ ficha, isOpen, onClose, onSave }: Props) {
  const { user } = useAuthStore()
  const [localFicha, setLocalFicha] = useState<Ficha | null>(null)

  useEffect(() => {
    if (ficha && isOpen) setLocalFicha(JSON.parse(JSON.stringify(ficha)))
  }, [ficha, isOpen])

  if (!localFicha) return null

  const isSecretaria = user?.sector === 'Secretaria' || user?.role === 'Administrador'

  const updateItem = (id: string, field: keyof AmostraItem, val: string) => {
    setLocalFicha((prev) =>
      prev
        ? { ...prev, itens: prev.itens.map((it) => (it.id === id ? { ...it, [field]: val } : it)) }
        : null,
    )
  }

  const toggleOcc = (id: string, resolvida: boolean) => {
    setLocalFicha((prev) =>
      prev
        ? {
            ...prev,
            ocorrencias: prev.ocorrencias.map((o) => (o.id === id ? { ...o, resolvida } : o)),
          }
        : null,
    )
  }

  const isContratoValidado = Boolean(
    localFicha.codigoContrato?.includes('/') &&
    localFicha.codigoContrato.split('/')[1]?.length === 4,
  )
  const isOsVinculado =
    localFicha.itens.length > 0 && localFicha.itens.every((it) => it.ordemServico?.includes('-'))
  const isOcorrenciasZeradas = localFicha.ocorrencias.every((o) => o.resolvida)
  const isVistoSecretaria = !!localFicha.vistoSecretaria

  const canConcluir =
    isContratoValidado && isOsVinculado && isOcorrenciasZeradas && isVistoSecretaria

  const handleFinalizar = () => {
    if (!canConcluir) return toast.error('Conclua todos os itens do checklist antes de finalizar.')
    onSave({ ...localFicha, status: 'Finalizada' })
    onClose()
    toast.success('Ficha Finalizada com sucesso!')
  }

  const handleSaveParcial = () => {
    let up = { ...localFicha }
    onSave(up)
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
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95dvh] flex flex-col p-0 overflow-hidden gap-0">
        <div className="px-6 py-4 border-b shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl pr-8">Tratar Pendências - {localFicha.id}</DialogTitle>
            <DialogDescription>Cliente: {localFicha.clienteNome}</DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            <div className="space-y-2 w-full sm:max-w-[50%]">
              <Label>Código do Contrato</Label>
              <Input
                value={localFicha.codigoContrato || ''}
                onChange={(e) => setLocalFicha({ ...localFicha, codigoContrato: e.target.value })}
                placeholder="Insira o contrato..."
              />
            </div>

            <div className="bg-card p-4 rounded-md border shadow-sm">
              <Label className="text-base font-semibold block mb-4">Checklist de Validação</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CheckItem label="Contrato Validado" ok={isContratoValidado} />
                <CheckItem label="Vínculo de OS" ok={isOsVinculado} />
                <CheckItem label="Ocorrências Zeradas" ok={isOcorrenciasZeradas} />
                <CheckItem label="Visto da Secretaria" ok={isVistoSecretaria} />
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
                      {isVistoSecretaria ? 'Informações Validadas' : 'Validar Informações'}
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
                        Descrição da Pendência
                      </Label>
                      <div className="bg-muted/40 p-3 rounded border text-sm whitespace-pre-wrap text-foreground break-words">
                        {occ.descricao}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end border-t pt-3 mt-1">
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
                          onClick={() => toggleOcc(occ.id, true)}
                        >
                          Resolver Ocorrência
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-base font-semibold">Itens e Ordens de Serviço</Label>
              <div className="border rounded-md">
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
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-muted/20 shrink-0">
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleSaveParcial}>
              Salvar Parcial
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
              Finalizar Ficha
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
