import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState, useMemo } from 'react'
import { Plus, X, ChevronLeft, ChevronRight, Search, Lock } from 'lucide-react'
import { UserManagement } from '@/components/UserManagement'
import { removeAccents, cn } from '@/lib/utils'

function ConfigList({
  title,
  description,
  items,
  onAdd,
  onRemove,
  placeholder = 'Novo item...',
  searchable = false,
  lockedItems = [],
}: {
  title: string
  description: string
  items: string[]
  onAdd: (v: string) => void
  onRemove: (v: string) => void
  placeholder?: string
  searchable?: boolean
  lockedItems?: string[]
}) {
  const [newVal, setNewVal] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 50

  const handleAdd = () => {
    if (!newVal.trim()) return
    if (items.includes(newVal.trim())) return
    onAdd(newVal.trim())
    setNewVal('')
  }

  const filteredItems = useMemo(() => {
    let res = items
    if (searchable && searchTerm) {
      const searchLower = removeAccents(searchTerm.toLowerCase())
      res = items.filter((i) => removeAccents(i.toLowerCase()).includes(searchLower))
    }
    return [...res].sort((a, b) => a.localeCompare(b))
  }, [items, searchTerm, searchable])

  const paginatedItems = useMemo(() => {
    if (!searchable) return filteredItems
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredItems.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredItems, page, searchable])

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const showPagination = searchable && filteredItems.length > ITEMS_PER_PAGE

  return (
    <Card className="flex flex-col h-full max-h-[600px]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex gap-2 shrink-0">
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

        {searchable && (
          <div className="shrink-0 pt-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar itens na lista..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="bg-muted/50 pl-9"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4 overflow-y-auto flex-1 content-start pb-2 pr-2">
          {paginatedItems.map((item) => {
            const isLocked = lockedItems.includes(item)
            return (
              <Badge
                key={item}
                variant="secondary"
                className={cn(
                  'px-3 py-1 text-sm flex items-center gap-1',
                  isLocked && 'opacity-80 pr-2 pointer-events-none',
                )}
              >
                {item}
                {isLocked ? (
                  <Lock className="h-3 w-3 text-muted-foreground/70 ml-1" />
                ) : (
                  <button
                    onClick={() => onRemove(item)}
                    className="text-muted-foreground hover:text-destructive ml-1 transition-colors"
                    title="Remover item"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            )
          })}
          {paginatedItems.length === 0 && (
            <p className="text-sm text-muted-foreground w-full text-center py-4">
              Nenhum item encontrado.
            </p>
          )}
        </div>

        {showPagination && (
          <div className="flex items-center justify-between shrink-0 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <span className="text-xs text-muted-foreground font-medium">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
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

  type ConfigKeys =
    | 'tiposAmostra'
    | 'formasRecebimento'
    | 'setores'
    | 'setoresAnalise'
    | 'embalagens'
    | 'unidadesQtd'
    | 'unidadesDosagem'
    | 'cidadesEstados'

  const addToList = (key: ConfigKeys, val: string) => {
    handleUpdate(key, [...(configuracoes[key] || []), val])
  }

  const removeFromList = (key: ConfigKeys, val: string) => {
    handleUpdate(
      key,
      (configuracoes[key] || []).filter((i) => i !== val),
    )
  }

  return (
    <div className="space-y-10 animate-fade-in max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie os parâmetros e acessos do sistema.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary border-b pb-2">
          Administração de usuários
        </h2>
        <UserManagement />
      </div>

      {isAdmin && (
        <>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary border-b pb-2">Nome da ficha</h2>
            <Card>
              <CardHeader>
                <CardDescription>
                  Defina o título exibido no cabeçalho da ficha de registro.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={configuracoes.nomeFicha || ''}
                  onChange={(e) => handleUpdate('nomeFicha', e.target.value)}
                  placeholder="Ex: Ficha de Recebimento de Amostras - FPGQ012-B"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-primary border-b pb-2">Cadastros Gerais</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <ConfigList
                title="Tipos de Amostra"
                description="Gerencie os tipos disponíveis no registro de itens."
                items={configuracoes.tiposAmostra || []}
                onAdd={(v) => addToList('tiposAmostra', v)}
                onRemove={(v) => removeFromList('tiposAmostra', v)}
              />

              <ConfigList
                title="Formas de Recebimento"
                description="Maneiras pelas quais as amostras chegam ao local."
                items={configuracoes.formasRecebimento || []}
                onAdd={(v) => addToList('formasRecebimento', v)}
                onRemove={(v) => removeFromList('formasRecebimento', v)}
              />

              <ConfigList
                title="Setor de usuários"
                description="Setores disponíveis para associação aos perfis de usuários."
                items={configuracoes.setores || []}
                onAdd={(v) => addToList('setores', v)}
                onRemove={(v) => removeFromList('setores', v)}
                lockedItems={['Secretaria', 'Amostragem']}
              />

              <ConfigList
                title="Setor de análise"
                description="Setores de destino para as amostras."
                items={configuracoes.setoresAnalise || []}
                onAdd={(v) => addToList('setoresAnalise', v)}
                onRemove={(v) => removeFromList('setoresAnalise', v)}
              />

              <ConfigList
                title="Embalagens"
                description="Tipos de embalagens disponíveis para as amostras."
                items={configuracoes.embalagens || []}
                onAdd={(v) => addToList('embalagens', v)}
                onRemove={(v) => removeFromList('embalagens', v)}
              />

              <ConfigList
                title="Unidade de medida (qtd amostral)"
                description="Unidades de quantidade para amostras."
                items={configuracoes.unidadesQtd || []}
                onAdd={(v) => addToList('unidadesQtd', v)}
                onRemove={(v) => removeFromList('unidadesQtd', v)}
              />

              <ConfigList
                title="Unidade de medida (dosagem)"
                description="Unidades de dosagem para amostras acabadas."
                items={configuracoes.unidadesDosagem || []}
                onAdd={(v) => addToList('unidadesDosagem', v)}
                onRemove={(v) => removeFromList('unidadesDosagem', v)}
              />

              <ConfigList
                title="Cidades e Estados"
                description="Cidades pré-cadastradas para o preenchimento automático (Cidade-UF)."
                items={configuracoes.cidadesEstados || []}
                onAdd={(v) => addToList('cidadesEstados', v)}
                onRemove={(v) => removeFromList('cidadesEstados', v)}
                placeholder="Ex: São Paulo-SP"
                searchable
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
