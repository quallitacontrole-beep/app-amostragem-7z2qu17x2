import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, ShieldAlert, Save } from 'lucide-react'
import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { UserManagement } from '@/components/UserManagement'

function ListManager({
  title,
  description,
  items,
  onChange,
  lockedItems = [],
}: {
  title: string
  description: string
  items: string[]
  onChange: (i: string[]) => void
  lockedItems?: string[]
}) {
  const [newItem, setNewItem] = useState('')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')

  const handleAdd = () => {
    if (!newItem.trim()) return
    if (items.some((i) => i.toLowerCase() === newItem.trim().toLowerCase())) {
      toast.error('Este item já existe na lista.')
      return
    }
    onChange([...items, newItem.trim()])
    setNewItem('')
  }

  const handleSaveEdit = (idx: number) => {
    const trimmed = editVal.trim()
    if (!trimmed) return
    if (items.some((i, index) => idx !== index && i.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Este item já existe na lista.')
      return
    }
    const newItems = [...items]
    newItems[idx] = trimmed
    onChange(newItems)
    setEditIdx(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar novo item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => {
            const isLocked = lockedItems.some((l) => l.toLowerCase() === item.toLowerCase())
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2 border rounded-md bg-muted/20"
              >
                {editIdx === idx ? (
                  <Input
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    className="h-8 mr-2"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(idx)}
                    autoFocus
                  />
                ) : (
                  <span className="text-[13px] font-medium">{item}</span>
                )}

                <div className="flex items-center gap-1">
                  {editIdx === idx ? (
                    <Button size="sm" onClick={() => handleSaveEdit(idx)}>
                      Salvar
                    </Button>
                  ) : (
                    <>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn('inline-block', isLocked && 'cursor-not-allowed')}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  'h-8 w-8',
                                  isLocked && 'pointer-events-none opacity-50',
                                )}
                                onClick={() => {
                                  setEditIdx(idx)
                                  setEditVal(item)
                                }}
                                disabled={isLocked}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {isLocked && (
                            <TooltipContent>
                              <p className="flex items-center gap-2 text-orange-500">
                                <ShieldAlert className="w-4 h-4" /> Item protegido pelo sistema
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn('inline-block', isLocked && 'cursor-not-allowed')}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  'h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10',
                                  isLocked && 'pointer-events-none opacity-50',
                                )}
                                onClick={() => onChange(items.filter((_, i) => i !== idx))}
                                disabled={isLocked}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {isLocked && (
                            <TooltipContent>
                              <p className="flex items-center gap-2 text-orange-500">
                                <ShieldAlert className="w-4 h-4" /> Item protegido e não pode ser
                                excluído
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Config() {
  const { configuracoes, updateConfiguracoes } = useAppStore()
  const { user } = useAuthStore()
  const [config, setConfig] = useState(configuracoes)

  useEffect(() => {
    setConfig(configuracoes)
  }, [configuracoes])

  if (user?.role !== 'Administrador') {
    return (
      <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[50vh]">
        <ShieldAlert className="h-10 w-10 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
        <p>Apenas Administradores podem acessar as configurações.</p>
      </div>
    )
  }

  const handleUpdateList = (key: keyof typeof config, newItems: string[]) => {
    const updatedConfig = { ...config, [key]: newItems }
    setConfig(updatedConfig)
    updateConfiguracoes(updatedConfig)
  }

  const handleSave = () => {
    updateConfiguracoes(config)
    toast.success('Configurações salvas com sucesso!')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-fade-in print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os parâmetros e listas de apoio do sistema.
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" /> Salvar Alterações
        </Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Geral</CardTitle>
            <CardDescription>Configurações gerais do sistema e documentos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Formulário de Ficha (Apresentação na Tela)</Label>
              <Input
                value={config.nomeFicha}
                onChange={(e) => setConfig({ ...config, nomeFicha: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Formulário Padrão (Impressão PDF)</Label>
                <Input
                  value={config.formularioPadrao || ''}
                  onChange={(e) => setConfig({ ...config, formularioPadrao: e.target.value })}
                  placeholder="Ex: FPGQ012-B"
                />
              </div>
              <div className="space-y-2">
                <Label>Nº da Revisão da Ficha (Impressão PDF)</Label>
                <Input
                  value={config.revisaoFicha || ''}
                  onChange={(e) => setConfig({ ...config, revisaoFicha: e.target.value })}
                  placeholder="Ex: 01"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="amostras">
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 w-full h-auto">
            <TabsTrigger value="amostras" className="py-2">
              Tipos de Amostra
            </TabsTrigger>
            <TabsTrigger value="recebimento" className="py-2">
              Recebimento
            </TabsTrigger>
            <TabsTrigger value="setores" className="py-2">
              Setores
            </TabsTrigger>
            <TabsTrigger value="unidades" className="py-2">
              Unidades
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="py-2">
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="amostras" className="space-y-4 mt-4">
            <ListManager
              title="Tipos de Amostra"
              description="Cadastre os tipos de amostra disponíveis no sistema."
              items={config.tiposAmostra}
              onChange={(items) => handleUpdateList('tiposAmostra', items)}
              lockedItems={['Produto Acabado Farmacêutico']}
            />
            <ListManager
              title="Embalagens"
              description="Tipos de embalagens primárias."
              items={config.embalagens}
              onChange={(items) => handleUpdateList('embalagens', items)}
            />
          </TabsContent>

          <TabsContent value="recebimento" className="space-y-4 mt-4">
            <ListManager
              title="Formas de Recebimento"
              description="Meios pelos quais as amostras chegam ao laboratório."
              items={config.formasRecebimento}
              onChange={(items) => handleUpdateList('formasRecebimento', items)}
            />
          </TabsContent>

          <TabsContent value="setores" className="space-y-4 mt-4">
            <ListManager
              title="Setores da Empresa"
              description="Setores para cadastro de usuários."
              items={config.setores}
              onChange={(items) => handleUpdateList('setores', items)}
              lockedItems={['Secretaria', 'Amostragem']}
            />
            <ListManager
              title="Setores de Análise"
              description="Laboratórios de destino."
              items={config.setoresAnalise}
              onChange={(items) => handleUpdateList('setoresAnalise', items)}
              lockedItems={['Físico-Químico', 'Microbiologia', 'UDU']}
            />
          </TabsContent>

          <TabsContent value="unidades" className="space-y-4 mt-4">
            <ListManager
              title="Unidades de Quantidade"
              description="Unidades de medida amostral."
              items={config.unidadesQtd}
              onChange={(items) => handleUpdateList('unidadesQtd', items)}
            />
            <ListManager
              title="Unidades de Dosagem"
              description="Unidades de concentração/dosagem."
              items={config.unidadesDosagem}
              onChange={(items) => handleUpdateList('unidadesDosagem', items)}
            />
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-4 mt-4">
            <UserManagement setoresList={config.setores} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
