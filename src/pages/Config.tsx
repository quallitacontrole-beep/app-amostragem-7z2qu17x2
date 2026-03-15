import { useAppStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'

export default function Config() {
  const { configuracoes, updateConfiguracoes } = useAppStore()
  const [newTipo, setNewTipo] = useState('')

  const handleAddTipo = () => {
    if (!newTipo.trim()) return
    updateConfiguracoes({
      ...configuracoes,
      tiposAmostra: [...configuracoes.tiposAmostra, newTipo.trim()],
    })
    setNewTipo('')
  }

  const handleRemoveTipo = (tipo: string) => {
    updateConfiguracoes({
      ...configuracoes,
      tiposAmostra: configuracoes.tiposAmostra.filter((t) => t !== tipo),
    })
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie as listas de apoio do sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Amostra</CardTitle>
          <CardDescription>Gerencie os tipos disponíveis no registro de itens.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 max-w-sm">
            <Input
              placeholder="Novo tipo..."
              value={newTipo}
              onChange={(e) => setNewTipo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTipo()}
            />
            <Button onClick={handleAddTipo} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {configuracoes.tiposAmostra.map((tipo) => (
              <Badge
                key={tipo}
                variant="secondary"
                className="px-3 py-1 text-sm flex items-center gap-1"
              >
                {tipo}
                <button
                  onClick={() => handleRemoveTipo(tipo)}
                  className="text-muted-foreground hover:text-destructive ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formas de Recebimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {configuracoes.formasRecebimento.map((f) => (
              <Badge key={f} variant="outline" className="px-3 py-1 bg-muted/50">
                {f}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            Editável em futuras atualizações.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
