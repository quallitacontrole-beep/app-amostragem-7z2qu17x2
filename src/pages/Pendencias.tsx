import { useState } from 'react'
import { useAppStore } from '@/stores/main'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { FileEdit } from 'lucide-react'
import { format } from 'date-fns'
import { PendenciaModal } from '@/components/PendenciaModal'
import { Ficha } from '@/types'

export default function Pendencias() {
  const { fichas, updateFicha, currentUser } = useAppStore()
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null)

  if (currentUser !== 'Secretaria') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Acesso restrito ao perfil Secretaria.
      </div>
    )
  }

  const pendentes = fichas.filter((f) => f.status === 'Aguardando Secretaria')

  const filteredData = {
    ocorrencias: pendentes.filter((f) => f.ocorrencias.some((o) => !o.resolvida)),
    semOS: pendentes.filter((f) => f.itens.some((i) => !i.ordemServico)),
    semContrato: pendentes.filter((f) => !f.codigoContrato),
  }

  const renderTable = (data: Ficha[]) => (
    <div className="border rounded-md mt-4 bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID Ficha</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                Nenhuma ficha nesta categoria.
              </TableCell>
            </TableRow>
          ) : (
            data.map((ficha) => (
              <TableRow
                key={ficha.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedFicha(ficha)}
              >
                <TableCell className="font-medium">{ficha.id}</TableCell>
                <TableCell>{format(new Date(ficha.dataRecebimento), 'dd/MM/yyyy')}</TableCell>
                <TableCell>{ficha.clienteNome}</TableCell>
                <TableCell>
                  <StatusBadge status={ficha.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFicha(ficha)
                    }}
                  >
                    <FileEdit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pendências</h1>
        <p className="text-muted-foreground mt-1">
          Gerenciamento de fichas aguardando atuação da secretaria.
        </p>
      </div>

      <Tabs defaultValue="todas" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="todas">Todas ({pendentes.length})</TabsTrigger>
          <TabsTrigger value="ocorrencias">
            Ocorrências ({filteredData.ocorrencias.length})
          </TabsTrigger>
          <TabsTrigger value="os">Aguardando OS ({filteredData.semOS.length})</TabsTrigger>
          <TabsTrigger value="contrato">
            Sem Contrato ({filteredData.semContrato.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="todas" className="mt-6">
          {renderTable(pendentes)}
        </TabsContent>
        <TabsContent value="ocorrencias" className="mt-6">
          {renderTable(filteredData.ocorrencias)}
        </TabsContent>
        <TabsContent value="os" className="mt-6">
          {renderTable(filteredData.semOS)}
        </TabsContent>
        <TabsContent value="contrato" className="mt-6">
          {renderTable(filteredData.semContrato)}
        </TabsContent>
      </Tabs>

      <PendenciaModal
        isOpen={!!selectedFicha}
        ficha={selectedFicha}
        onClose={() => setSelectedFicha(null)}
        onSave={updateFicha}
      />
    </div>
  )
}
