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

  const addItem = () => {
    const newItem: AmostraItem = {
      id: `it-${Date.now()}`,
      tipo: '',
      descricao: '',
      embalagem: '',
      quantidade: '',
      unidade: '',
      setorDestino: '',
      analiseSolicitada: '',
    }
    setItens([...itens, newItem])
  }

  const updateItem = (id: string, field: keyof AmostraItem, value: any) => {
    setItens(itens.map((it) => (it.id === id ? { ...it, [field]: value } : it)))
  }

  const removeItem = (id: string) => setItens(itens.filter((it) => it.id !== id))

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
          const isDiluida = item.tipo === 'Matéria-prima Diluída'
          const show1g = isFQ && (isProdAcabado || isDiluida)
          const showDiluicao = isDiluida && isFQ

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
                  onClick={() => removeItem(item.id)}
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
                    {configuracoes.tiposAmostra.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição</Label>
                <Input
                  value={item.descricao}
                  onChange={(e) => updateItem(item.id, 'descricao', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Qtd / Unid</Label>
                <div className="flex gap-2">
                  <Input
                    value={item.quantidade}
                    onChange={(e) => updateItem(item.id, 'quantidade', e.target.value)}
                    className="w-1/2"
                  />
                  <Input
                    value={item.unidade}
                    onChange={(e) => updateItem(item.id, 'unidade', e.target.value)}
                    placeholder="Ex: cx"
                    className="w-1/2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Embalagem</Label>
                <Input
                  value={item.embalagem}
                  onChange={(e) => updateItem(item.id, 'embalagem', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Setor Destino</Label>
                <Select
                  value={item.setorDestino}
                  onValueChange={(v) => updateItem(item.id, 'setorDestino', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {configuracoes.setores.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Análise</Label>
                <Input
                  value={item.analiseSolicitada}
                  onChange={(e) => updateItem(item.id, 'analiseSolicitada', e.target.value)}
                />
              </div>

              {/* Lógica Condicional */}
              {isProdAcabado && (
                <div className="space-y-2 col-span-4 md:col-span-2 animate-fade-in bg-primary/5 p-3 rounded border border-primary/10">
                  <Label>Dosagem / Unidade Dosagem</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Dosagem"
                      value={item.dosagem || ''}
                      onChange={(e) => updateItem(item.id, 'dosagem', e.target.value)}
                    />
                    <Input
                      placeholder="Ex: mg"
                      value={item.unidadeDosagem || ''}
                      onChange={(e) => updateItem(item.id, 'unidadeDosagem', e.target.value)}
                    />
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

              {showDiluicao && (
                <div className="space-y-2 col-span-4 md:col-span-2 animate-fade-in bg-accent p-3 rounded border">
                  <Label>Fator de Diluição</Label>
                  <Input
                    value={item.fatorDiluicao || ''}
                    onChange={(e) => updateItem(item.id, 'fatorDiluicao', e.target.value)}
                    placeholder="Ex: 1:10"
                  />
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
