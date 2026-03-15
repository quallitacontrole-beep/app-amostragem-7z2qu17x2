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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'

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

  const updateItem = (id: string, field: keyof AmostraItem, value: string) => {
    setLocalFicha({
      ...localFicha,
      itens: localFicha.itens.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    })
  }

  const toggleOcorrencia = (id: string, resolvida: boolean) => {
    setLocalFicha({
      ...localFicha,
      ocorrencias: localFicha.ocorrencias.map((o) => (o.id === id ? { ...o, resolvida } : o)),
    })
  }

  const isContratoValidado = Boolean(
    localFicha.codigoContrato &&
    localFicha.codigoContrato.includes('/') &&
    localFicha.codigoContrato.split('/')[0] &&
    localFicha.codigoContrato.split('/')[1]?.length === 4,
  )
  const isOsVinculado =
    localFicha.itens.length > 0 &&
    localFicha.itens.every((it) => it.ordemServico && it.ordemServico.includes('-'))
  const isOcorrenciasZeradas = localFicha.ocorrencias.every((o) => o.resolvida)
  const isVistoSecretaria = !!localFicha.vistoSecretaria

  const canConcluir = () =>
    isContratoValidado && isOsVinculado && isOcorrenciasZeradas && isVistoSecretaria

  const handleFinalizar = () => {
    if (!canConcluir())
      return toast.error('Conclua todos os itens do checklist antes de finalizar.')
    onSave({ ...localFicha, status: 'Finalizada' })
    onClose()
    toast.success('Ficha Finalizada!')
  }

  const handleSaveParcial = () => {
    let updatedFicha = { ...localFicha }
    const hasOcorrencias = localFicha.ocorrencias && localFicha.ocorrencias.length > 0
    const allOccsResolved = hasOcorrencias && localFicha.ocorrencias.every((o) => o.resolvida)

    if (allOccsResolved && localFicha.status === 'Aguardando Secretaria') {
      updatedFicha.status = 'Em Triagem'
    }

    onSave(updatedFicha)
    onClose()

    if (updatedFicha.status === 'Em Triagem') {
      toast.success('Ocorrências resolvidas! Ficha retornou para Triagem.')
    } else {
      toast.info('Alterações salvas.')
    }
  }

  const ChecklistItem = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="w-5 h-5 text-success" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-warning" />
      )}
      <span className="text-sm font-medium">{label}</span>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tratar Pendências - {localFicha.id}</DialogTitle>
          <DialogDescription>Cliente: {localFicha.clienteNome}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código do Contrato</Label>
                <Input
                  value={localFicha.codigoContrato || ''}
                  onChange={(e) => setLocalFicha({ ...localFicha, codigoContrato: e.target.value })}
                  placeholder="Insira o contrato..."
                />
              </div>
            </div>

            <div className="bg-card p-4 rounded-md border shadow-sm mt-2">
              <Label className="text-base font-semibold block mb-4">Checklist de Validação</Label>
              <div className="grid sm:grid-cols-2 gap-4">
                <ChecklistItem label="Contrato Validado" ok={isContratoValidado} />
                <ChecklistItem label="Vínculo de OS" ok={isOsVinculado} />
                <ChecklistItem label="Ocorrências Zeradas" ok={isOcorrenciasZeradas} />
                <ChecklistItem label="Visto da Secretaria" ok={isVistoSecretaria} />
              </div>
              <div className="mt-5 pt-4 border-t flex justify-end">
                <Button
                  size="sm"
                  variant={isVistoSecretaria ? 'secondary' : 'outline'}
                  disabled={!isSecretaria || isVistoSecretaria}
                  onClick={() => setLocalFicha({ ...localFicha, vistoSecretaria: true })}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  {isVistoSecretaria ? 'Informações Validadas' : 'Validar Informações'}
                </Button>
              </div>
            </div>

            {localFicha.ocorrencias.length > 0 && (
              <div className="space-y-3 bg-destructive/5 p-4 rounded-md border border-destructive/20">
                <Label className="text-destructive font-bold text-base">Ocorrências</Label>
                {localFicha.ocorrencias.map((occ) => (
                  <div
                    key={occ.id}
                    className="flex items-center justify-between bg-background p-3 rounded border"
                  >
                    <span className="text-sm">{occ.descricao}</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Resolvida?</Label>
                      <Switch
                        checked={occ.resolvida}
                        onCheckedChange={(v) => toggleOcorrencia(occ.id, v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-base font-semibold">Itens e Ordens de Serviço</Label>
              <div className="border rounded-md">
                <Table>
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
                            className="h-8 text-sm"
                            value={it.protocoloWeb || ''}
                            onChange={(e) => updateItem(it.id, 'protocoloWeb', e.target.value)}
                            placeholder="Opcional"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-sm border-warning focus-visible:ring-warning"
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

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={handleSaveParcial}>
            Salvar Parcial
          </Button>
          <Button
            onClick={handleFinalizar}
            disabled={!canConcluir()}
            className={
              canConcluir() ? 'bg-success hover:bg-success/90 text-success-foreground' : ''
            }
          >
            Finalizar Ficha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
