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
import { Trash2, Plus } from 'lucide-react'
import { AmostraItem } from '@/types'
import { useAppStore } from '@/stores/main'

export function RegistroItens({
  itens,
  setItens,
}: {
  itens: AmostraItem[]
  setItens: (i: AmostraItem[]) => void
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
        analiseSolicitada: '',
      },
    ])
  const updateItem = (id: string, field: keyof AmostraItem, value: any) =>
    setItens(itens.map((it) => (it.id === id ? { ...it, [field]: value } : it)))

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
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum item adicionado.</p>
        )}
        {itens.map((item, index) => {
          const isProdAcabado = item.tipo === 'Produto Acabado Farmacêutico'
          const isFQ = item.setorDestino === 'Físico-Químico'
          const show1g = isFQ && (isProdAcabado || item.tipo === 'Matéria-prima Diluída')

          return (
            <div
              key={item.id}
              className="relative rounded-md border p-4 bg-muted/20 gap-4 grid md:grid-cols-4"
            >
              <div className="absolute right-2 top-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => setItens(itens.filter((it) => it.id !== item.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="col-span-4 font-medium text-sm text-primary mb-2">
                Amostra {index + 1}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Tipo de Amostra</Label>
                <Select value={item.tipo} onValueChange={(v) => updateItem(item.id, 'tipo', v)}>
                  <SelectTrigger>
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

              <div className="space-y-2 md:col-span-2">
                <Label>Quantidade amostral</Label>
                <div className="flex gap-2">
                  <Input
                    value={item.quantidade}
                    onChange={(e) =>
                      updateItem(item.id, 'quantidade', e.target.value.replace(/[^0-9.,]/g, ''))
                    }
                    className="w-14 shrink-0 text-center"
                    placeholder="Qtd"
                  />
                  <div className="flex-1">
                    <Select
                      value={item.unidade}
                      onValueChange={(v) => updateItem(item.id, 'unidade', v)}
                    >
                      <SelectTrigger className="w-full">
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
                </div>
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label>Descrição</Label>
                <Input
                  value={item.descricao}
                  onChange={(e) => updateItem(item.id, 'descricao', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Embalagem</Label>
                <Select
                  value={item.embalagem}
                  onValueChange={(v) => updateItem(item.id, 'embalagem', v)}
                >
                  <SelectTrigger>
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
                  onValueChange={(v) => updateItem(item.id, 'setorDestino', v)}
                >
                  <SelectTrigger>
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

              <div className="space-y-2 md:col-span-4">
                <Label>Análise</Label>
                <Input
                  value={item.analiseSolicitada}
                  onChange={(e) => updateItem(item.id, 'analiseSolicitada', e.target.value)}
                />
              </div>

              {isProdAcabado && (
                <div className="space-y-2 col-span-4 md:col-span-2 animate-fade-in bg-primary/5 p-3 rounded border border-primary/10">
                  <Label>Dosagem</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Valor"
                      value={item.dosagem || ''}
                      onChange={(e) =>
                        updateItem(item.id, 'dosagem', e.target.value.replace(/[^0-9.,]/g, ''))
                      }
                      className="w-1/2"
                    />
                    <div className="w-1/2">
                      <Select
                        value={item.unidadeDosagem || ''}
                        onValueChange={(v) => updateItem(item.id, 'unidadeDosagem', v)}
                      >
                        <SelectTrigger className="w-full">
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
                </div>
              )}

              {show1g && (
                <div className="space-y-2 col-span-4 md:col-span-2 animate-fade-in bg-warning/5 p-3 rounded border border-warning/10 flex flex-col justify-center">
                  <div className="flex gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs">Enviou 1g Excipiente?</Label>
                      <RadioGroup
                        value={item.enviou1gExcipiente || 'nao'}
                        onValueChange={(v) => updateItem(item.id, 'enviou1gExcipiente', v)}
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
                        value={item.enviou1gAtivo || 'nao'}
                        onValueChange={(v) => updateItem(item.id, 'enviou1gAtivo', v)}
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
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
