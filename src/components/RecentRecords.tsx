import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Printer, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { StatusBadge } from '@/components/StatusBadge'
import { PrintFichas } from '@/components/PrintFichas'
import { Ficha, Configuracoes } from '@/types'
import { format } from 'date-fns'

interface RecentRecordsProps {
  fichas: Ficha[]
  configuracoes: Configuracoes
  canAccessSecretariaFeatures: boolean
}

export function RecentRecords({
  fichas,
  configuracoes,
  canAccessSecretariaFeatures,
}: RecentRecordsProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredFichas = useMemo(() => {
    const s = searchTerm.toLowerCase().trim()
    return fichas.filter((f) => {
      const dateStr = f.dataRecebimento ? format(new Date(f.dataRecebimento), 'dd/MM/yyyy') : ''
      return (
        f.id.toLowerCase().includes(s) ||
        (f.clienteNome || '').toLowerCase().includes(s) ||
        f.status.toLowerCase().includes(s) ||
        dateStr.includes(s)
      )
    })
  }, [fichas, searchTerm])

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(filteredFichas.map((f) => f.id)))
    else setSelectedIds(new Set())
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) newSelected.add(id)
    else newSelected.delete(id)
    setSelectedIds(newSelected)
  }

  const isAllSelected = filteredFichas.length > 0 && selectedIds.size === filteredFichas.length
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredFichas.length
  const selectedFichas = fichas.filter((f) => selectedIds.has(f.id))

  return (
    <>
      <Card className="print:hidden">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Registros Recentes</CardTitle>
            <CardDescription>Acompanhe e filtre os recebimentos de amostras.</CardDescription>
          </div>
          {canAccessSecretariaFeatures && selectedIds.size > 0 && (
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir ({selectedIds.size})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por cliente, ID, data (dd/mm/aaaa) ou status..."
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
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(f.id)}
                            onCheckedChange={(c) => handleSelectOne(f.id, !!c)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-[13px]">{f.id}</TableCell>
                      <TableCell className="font-semibold text-[13px]">
                        {f.clienteNome || '-'}
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
    </>
  )
}
