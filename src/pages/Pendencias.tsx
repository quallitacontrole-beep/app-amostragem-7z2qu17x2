import { useState } from 'react'
import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
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
import { FileEdit, ShieldAlert } from 'lucide-react'
import { format } from 'date-fns'
import { PendenciaModal } from '@/components/PendenciaModal'
import { Ficha } from '@/types'
import { useNavigate } from 'react-router-dom'

export default function Pendencias() {
  const { fichas, updateFicha, addAuditLog } = useAppStore()
  const { user } = useAuthStore()
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null)
  const navigate = useNavigate()

  if (user?.sector !== 'Secretaria' && user?.role !== 'Administrador') {
    return (
      <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[50vh]">
        <ShieldAlert className="h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
        <p>Apenas usuários com perfil de Secretaria podem acessar as pendências.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
          Voltar ao Dashboard
        </Button>
      </div>
    )
  }

  const pendentes = fichas.filter(
    (f) =>
      f.status === 'Aguardando Secretaria' ||
      f.status === 'Validação Secretaria' ||
      f.status === 'Aguardando Validação',
  )

  const filteredData = {
    ocorrencias: pendentes.filter((f) => f.ocorrencias.some((o) => !o.resolvida)),
    semOS: pendentes.filter((f) => f.itens.some((i) => !i.ordemServico)),
    semContrato: pendentes.filter((f) => !f.codigoContrato),
  }

  const handleUpdateAndLog = (ficha: Ficha) => {
    updateFicha(ficha)
    if (user) {
      addAuditLog({ userId: user.id, userName: user.name, action: 'Atualizou', fichaId: ficha.id })
    }
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
          Gerenciamento de fichas aguardando atuação da secretaria ou validação final.
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
        onSave={handleUpdateAndLog}
      />
    </div>
  )
}
