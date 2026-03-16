import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Printer, FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { StatusBadge } from '@/components/StatusBadge'
import { PrintFichas } from '@/components/PrintFichas'
import { format } from 'date-fns'

export default function Index() {
  const navigate = useNavigate()
  const { fichas, configuracoes } = useAppStore()
  const { user } = useAuthStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const listFichas = fichas || []

  const filteredFichas = useMemo(() => {
    return listFichas.filter((f) => {
      const s = searchTerm.toLowerCase()
      return (
        f.id.toLowerCase().includes(s) ||
        f.clienteNome.toLowerCase().includes(s) ||
        f.status.toLowerCase().includes(s)
      )
    })
  }, [listFichas, searchTerm])

  const canAccessSecretariaFeatures =
    user?.sector === 'Secretaria' || user?.role === 'Administrador'

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelected = new Set(filteredFichas.map((f) => f.id))
      setSelectedIds(newSelected)
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const isAllSelected = filteredFichas.length > 0 && selectedIds.size === filteredFichas.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredFichas.length

  const handlePrint = () => {
    if (selectedIds.size === 0) return
    window.print()
  }

  const selectedFichas = listFichas.filter((f) => selectedIds.has(f.id))

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Registros</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os registros de amostragem recebidos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canAccessSecretariaFeatures && selectedIds.size > 0 && (
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Selecionados ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => navigate('/registro')}>
            <Plus className="mr-2 h-4 w-4" /> Novo Registro
          </Button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle>Registros Recentes</CardTitle>
          <CardDescription>Acompanhe e filtre os recebimentos de amostras.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por cliente, ID ou status..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="border rounded-md bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {canAccessSecretariaFeatures && (
                    <TableHead className="w-[50px] text-center">
                      <Checkbox
                        checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos os registros"
                      />
                    </TableHead>
                  )}
                  <TableHead>ID do Registro</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data de Recebimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFichas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canAccessSecretariaFeatures ? 6 : 5}
                      className="text-center h-24 text-muted-foreground"
                    >
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFichas.map((f) => (
                    <TableRow
                      key={f.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/registro/${f.id}`)}
                    >
                      {canAccessSecretariaFeatures && (
                        <TableCell
                          className="w-[50px] text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedIds.has(f.id)}
                            onCheckedChange={(checked) => handleSelectOne(f.id, !!checked)}
                            aria-label={`Selecionar registro ${f.id}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-[13px]">{f.id}</TableCell>
                      <TableCell className="font-semibold text-[13px]">
                        {f.clienteNome || 'Não informado'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[13px]">
                        {f.dataRecebimento
                          ? format(new Date(f.dataRecebimento), 'dd/MM/yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={f.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/registro/${f.id}`)
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" /> Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedFichas.length > 0 && <PrintFichas fichas={selectedFichas} config={configuracoes} />}
    </div>
  )
}
