import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Trash2, Plus, Camera, Upload, X, Info, Download, Image as ImageIcon } from 'lucide-react'
import { AmostraItem } from '@/types'
import { useAppStore } from '@/stores/main'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { removeAccents, cn } from '@/lib/utils'

const getProtocoloNumber = (pw?: string) => {
  if (!pw) return ''
  const match = pw.match(/^P(\d+)/)
  return match ? match[1] : pw.replace(/\D/g, '').slice(0, 4)
}

const getOsNumber = (os?: string) => {
  if (!os) return ''
  const match = os.match(/-(\d{1,3})$/)
  return match ? match[1] : os.replace(/\D/g, '').slice(-3)
}

export function RegistroItens({
  itens,
  setItens,
  codigoContrato,
}: {
  itens: AmostraItem[]
  setItens: (i: AmostraItem[]) => void
  codigoContrato?: string
}) {
  const { configuracoes } = useAppStore()

  const addItem = () =>
    setItens([
      ...itens,
      {
        id: `it-${Date.now()}`,
        tipo: '',
        descricao: '',
        embalagem: '',
        quantidade: '',
        unidade: '',
        setorDestino: '',
      },
    ])

  const handleUpdateItem = (id: string, field: keyof AmostraItem, value: any) => {
    setItens(
      itens.map((it) => {
        if (it.id !== id) return it
        const newItem = { ...it, [field]: value }

        const tipoNorm = removeAccents(newItem.tipo || '').toLowerCase()
        const setorNorm = removeAccents(newItem.setorDestino || '').toLowerCase()

        const isProd = tipoNorm.includes('produto acabado')
        const isMp = tipoNorm.includes('materia-prima diluida')
        const isUDU = setorNorm === 'udu'
        const isFQ = setorNorm.includes('fisico-quimico')

        const isRule1 = isProd && (isUDU || isFQ)
        const isRule2 = isMp && isFQ

        if (!isRule1) {
          delete newItem.dosagem
          delete newItem.unidadeDosagem
          delete newItem.enviou1gExcipiente
          delete newItem.enviou1gAtivo
        }
        if (!isRule2) {
          delete newItem.fatorDiluicao
        }

        return newItem
      }),
    )
  }

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string
        const item = itens.find((i) => i.id === id)
        if (item) {
          handleUpdateItem(id, 'fotos', [...(item.fotos || []), b64])
        }
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const hasFullContract = Boolean(
    codigoContrato &&
    codigoContrato.includes('/') &&
    codigoContrato.split('/')[0] &&
    codigoContrato.split('/')[1]?.length === 4,
  )

  return (
    <Card className="animate-slide-down">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Tabela B: Itens da Amostra</CardTitle>
        <Button size="sm" onClick={addItem} variant="outline">
          <Plus className="h-4 w-4 mr-2" /> Adicionar Item
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {itens.length === 0 && (
          <p className="text-[13px] text-muted-foreground text-center py-4">
            Nenhum item adicionado.
          </p>
        )}
        {itens.map((item, index) => {
          const tipoNorm = removeAccents(item.tipo || '').toLowerCase()
          const setorNorm = removeAccents(item.setorDestino || '').toLowerCase()

          const isProd = tipoNorm.includes('produto acabado')
          const isMp = tipoNorm.includes('materia-prima diluida')
          const isUDU = setorNorm === 'udu'
          const isFQ = setorNorm.includes('fisico-quimico')

          const isRule1 = isProd && (isUDU || isFQ)
          const isRule2 = isMp && isFQ

          const showDosagem = isRule1
          const show1g = isRule1
          const showFatorDiluicao = isRule2

          return (
            <div
              key={item.id}
              className="relative rounded-md border p-4 bg-muted/20 gap-4 grid md:grid-cols-4"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 text-destructive"
                onClick={() => setItens(itens.filter((it) => it.id !== item.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="col-span-4 font-medium text-[13px] text-primary mb-2">
                Amostra {index + 1}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Tipo de amostra</Label>
                <Select
                  value={item.tipo}
                  onValueChange={(v) => handleUpdateItem(item.id, 'tipo', v)}
                >
                  <SelectTrigger className="text-left">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {configuracoes.tiposAmostra?.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-1">
                <Label>Qt amostral</Label>
                <Input
                  value={item.quantidade}
                  onChange={(e) =>
                    handleUpdateItem(item.id, 'quantidade', e.target.value.replace(/[^0-9.,]/g, ''))
                  }
                  className="text-center"
                  placeholder="Qtd"
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label className="truncate block" title="Unidade de medida da qt amostral">
                  Unidade de medida
                </Label>
                <Select
                  value={item.unidade}
                  onValueChange={(v) => handleUpdateItem(item.id, 'unidade', v)}
                >
                  <SelectTrigger className="w-full text-left">
                    <SelectValue placeholder="Unid." />
                  </SelectTrigger>
                  <SelectContent>
                    {configuracoes.unidadesQtd?.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label>Descrição</Label>
                <Input
                  value={item.descricao}
                  onChange={(e) => handleUpdateItem(item.id, 'descricao', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Embalagem</Label>
                <Select
                  value={item.embalagem}
                  onValueChange={(v) => handleUpdateItem(item.id, 'embalagem', v)}
                >
                  <SelectTrigger className="text-left">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {configuracoes.embalagens?.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Setor de análise</Label>
                <Select
                  value={item.setorDestino}
                  onValueChange={(v) => handleUpdateItem(item.id, 'setorDestino', v)}
                >
                  <SelectTrigger className="text-left">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {configuracoes.setoresAnalise?.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Protocolo Web</Label>
                <div className="flex items-center gap-2">
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1" tabIndex={0}>
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-muted-foreground text-[13px] z-10 pointer-events-none">
                              P
                            </span>
                            <Input
                              className="pl-7 text-[13px]"
                              placeholder="0000"
                              value={getProtocoloNumber(item.protocoloWeb)}
                              onChange={(e) => {
                                const n = e.target.value.replace(/\D/g, '').slice(0, 4)
                                if (!n) {
                                  handleUpdateItem(item.id, 'protocoloWeb', '')
                                } else {
                                  handleUpdateItem(
                                    item.id,
                                    'protocoloWeb',
                                    `P${n}-${codigoContrato}`,
                                  )
                                }
                              }}
                              disabled={!hasFullContract}
                              maxLength={4}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      {!hasFullContract && (
                        <TooltipContent>
                          <p>Preencha o Código do Contrato completo no cabeçalho primeiro.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>

                  <span className="text-muted-foreground font-bold">-</span>

                  <Input
                    className="flex-1 bg-muted text-[13px] text-center px-1"
                    value={codigoContrato || '____/____'}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Ordem de serviço (OS) (Opcional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    className="flex-1 bg-muted text-[13px] text-center px-1"
                    value={codigoContrato || '____/____'}
                    disabled
                  />

                  <span className="text-muted-foreground font-bold">-</span>

                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex-1" tabIndex={0}>
                          <Input
                            className={cn(
                              'text-[13px] text-center',
                              !getOsNumber(item.ordemServico) &&
                                'border-yellow-500 bg-yellow-500/10 focus-visible:ring-yellow-500',
                            )}
                            placeholder="000"
                            value={getOsNumber(item.ordemServico)}
                            onChange={(e) => {
                              const n = e.target.value.replace(/\D/g, '').slice(0, 3)
                              if (!n) {
                                handleUpdateItem(item.id, 'ordemServico', '')
                              } else {
                                handleUpdateItem(item.id, 'ordemServico', `${codigoContrato}-${n}`)
                              }
                            }}
                            disabled={!hasFullContract}
                            maxLength={3}
                          />
                        </div>
                      </TooltipTrigger>
                      {!hasFullContract && (
                        <TooltipContent>
                          <p>Preencha o Código do Contrato completo no cabeçalho primeiro.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {showDosagem && (
                <div className="space-y-2 col-span-4 md:col-span-2 animate-fade-in bg-primary/5 p-3 rounded border border-primary/10">
                  <Label>Dosagem</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Valor"
                      value={item.dosagem || ''}
                      onChange={(e) =>
                        handleUpdateItem(
                          item.id,
                          'dosagem',
                          e.target.value.replace(/[^0-9.,]/g, ''),
                        )
                      }
                      className="flex-1"
                    />
                    <Select
                      value={item.unidadeDosagem || ''}
                      onValueChange={(v) => handleUpdateItem(item.id, 'unidadeDosagem', v)}
                    >
                      <SelectTrigger className="w-[110px] text-left">
                        <SelectValue placeholder="Unid." />
                      </SelectTrigger>
                      <SelectContent>
                        {configuracoes.unidadesDosagem?.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {showFatorDiluicao && (
                <div className="space-y-2 col-span-4 md:col-span-2 animate-fade-in bg-primary/5 p-3 rounded border border-primary/10">
                  <Label>Fator de Diluição</Label>
                  <Input
                    placeholder="Ex: 1:10"
                    value={item.fatorDiluicao || ''}
                    onChange={(e) => handleUpdateItem(item.id, 'fatorDiluicao', e.target.value)}
                  />
                </div>
              )}

              {show1g && (
                <div className="space-y-2 col-span-4 animate-fade-in bg-warning/5 p-3 rounded border border-warning/10">
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-warning-foreground/80 font-medium">
                    <Info className="w-4 h-4" />
                    Ausência de envio gera uma pendência não-bloqueante, permitindo a finalização da
                    ficha.
                  </div>
                  <div className="flex gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs">Enviou 1g Excipiente?</Label>
                      <RadioGroup
                        value={item.enviou1gExcipiente}
                        onValueChange={(v) => handleUpdateItem(item.id, 'enviou1gExcipiente', v)}
                        className="flex gap-2"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="sim" id={`ex-s-${item.id}`} />
                          <Label htmlFor={`ex-s-${item.id}`}>Sim</Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="nao" id={`ex-n-${item.id}`} />
                          <Label htmlFor={`ex-n-${item.id}`}>Não</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Enviou 1g Ativo?</Label>
                      <RadioGroup
                        value={item.enviou1gAtivo}
                        onValueChange={(v) => handleUpdateItem(item.id, 'enviou1gAtivo', v)}
                        className="flex gap-2"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="sim" id={`at-s-${item.id}`} />
                          <Label htmlFor={`at-s-${item.id}`}>Sim</Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="nao" id={`at-n-${item.id}`} />
                          <Label htmlFor={`at-n-${item.id}`}>Não</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 md:col-span-4 pt-2 border-t">
                <Label className="flex items-center gap-2">
                  Fotos de Não Conformidade ({item.fotos?.length || 0}/3)
                  <span className="text-[10px] text-muted-foreground font-normal bg-muted px-1.5 py-0.5 rounded">
                    Gera pendência não-bloqueante
                  </span>
                </Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {item.fotos?.map((foto, fIdx) => (
                    <Dialog key={fIdx}>
                      <DialogTrigger asChild>
                        <div className="relative group cursor-pointer border border-border rounded overflow-hidden">
                          <img
                            src={foto}
                            className="w-20 h-20 object-cover transition-transform group-hover:scale-105"
                            alt="Não conformidade"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ImageIcon className="w-6 h-6 text-white" />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const newFotos = item.fotos?.filter((_, i) => i !== fIdx)
                              handleUpdateItem(item.id, 'fotos', newFotos)
                            }}
                            className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Remover foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl bg-transparent border-none shadow-none p-0 flex flex-col items-center justify-center">
                        <img
                          src={foto}
                          className="max-w-full max-h-[80vh] object-contain rounded-md"
                          alt="Evidência Ampliada"
                        />
                        <div className="flex justify-center mt-4">
                          <Button asChild variant="secondary" className="gap-2">
                            <a href={foto} download={`Evidencia_${item.id}_${fIdx + 1}.jpg`}>
                              <Download className="w-4 h-4" /> Baixar Foto
                            </a>
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                  {(item.fotos?.length || 0) < 3 && (
                    <div className="flex gap-2">
                      <Label
                        className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/40 rounded cursor-pointer hover:bg-muted/50 transition-colors bg-muted/10"
                        title="Tirar Foto (Câmera)"
                      >
                        <Camera className="w-6 h-6 text-muted-foreground/70 mb-1" />
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Câmera
                        </span>
                        <Input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handlePhotoCapture(e, item.id)}
                        />
                      </Label>
                      <Label
                        className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/40 rounded cursor-pointer hover:bg-muted/50 transition-colors bg-muted/10"
                        title="Fazer Upload (Arquivo)"
                      >
                        <Upload className="w-6 h-6 text-muted-foreground/70 mb-1" />
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Arquivo
                        </span>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoCapture(e, item.id)}
                        />
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
