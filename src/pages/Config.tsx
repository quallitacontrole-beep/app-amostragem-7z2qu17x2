import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { UserManagement } from '@/components/UserManagement'

function ConfigList({
  title,
  description,
  items,
  onAdd,
  onRemove,
  placeholder = 'Novo item...',
}: {
  title: string
  description: string
  items: string[]
  onAdd: (v: string) => void
  onRemove: (v: string) => void
  placeholder?: string
}) {
  const [newVal, setNewVal] = useState('')
  const handleAdd = () => {
    if (!newVal.trim()) return
    onAdd(newVal.trim())
    setNewVal('')
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} size="icon" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 max-h-[200px] overflow-y-auto">
          {items.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="px-3 py-1 text-sm flex items-center gap-1"
            >
              {item}
              <button
                onClick={() => onRemove(item)}
                className="text-muted-foreground hover:text-destructive ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Config() {
  const { configuracoes, updateConfiguracoes } = useAppStore()
  const { user } = useAuthStore()

  const isAdmin = user?.role === 'Administrador'

  const handleUpdate = (key: keyof typeof configuracoes, value: any) => {
    updateConfiguracoes({ ...configuracoes, [key]: value })
  }

  const addToList = (
    key: 'tiposAmostra' | 'formasRecebimento' | 'setores' | 'cidadesEstados',
    val: string,
  ) => {
    handleUpdate(key, [...configuracoes[key], val])
  }

  const removeFromList = (
    key: 'tiposAmostra' | 'formasRecebimento' | 'setores' | 'cidadesEstados',
    val: string,
  ) => {
    handleUpdate(
      key,
      configuracoes[key].filter((i) => i !== val),
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie os parâmetros e acessos do sistema.</p>
      </div>

      <UserManagement />

      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Nome da Ficha</CardTitle>
              <CardDescription>
                Defina o título exibido no cabeçalho da ficha de registro.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={configuracoes.nomeFicha}
                onChange={(e) => handleUpdate('nomeFicha', e.target.value)}
                placeholder="Ex: Ficha de Recebimento de Amostras - FPGQ012-B"
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <ConfigList
              title="Tipos de Amostra"
              description="Gerencie os tipos disponíveis no registro de itens."
              items={configuracoes.tiposAmostra}
              onAdd={(v) => addToList('tiposAmostra', v)}
              onRemove={(v) => removeFromList('tiposAmostra', v)}
            />

            <ConfigList
              title="Formas de Recebimento"
              description="Maneiras pelas quais as amostras chegam ao local."
              items={configuracoes.formasRecebimento}
              onAdd={(v) => addToList('formasRecebimento', v)}
              onRemove={(v) => removeFromList('formasRecebimento', v)}
            />

            <ConfigList
              title="Setores"
              description="Setores disponíveis para destino e associação de usuários."
              items={configuracoes.setores}
              onAdd={(v) => addToList('setores', v)}
              onRemove={(v) => removeFromList('setores', v)}
            />

            <ConfigList
              title="Cidades e Estados"
              description="Cidades pré-cadastradas para o preenchimento automático (Cidade-UF)."
              items={configuracoes.cidadesEstados}
              onAdd={(v) => addToList('cidadesEstados', v)}
              onRemove={(v) => removeFromList('cidadesEstados', v)}
              placeholder="Ex: São Paulo-SP"
            />
          </div>
        </>
      )}
    </div>
  )
}
