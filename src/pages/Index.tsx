import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Search,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { StatusBadge } from '@/components/StatusBadge'
import { format } from 'date-fns'

export default function Index() {
  const { fichas } = useAppStore()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => setCurrentPage(1), [searchQuery])

  const counts = {
    triagem: fichas.filter((f) => f.status === 'Em Triagem').length,
    secretaria: fichas.filter((f) => f.status === 'Aguardando Secretaria').length,
    concluida: fichas.filter((f) => f.status === 'Concluída').length,
  }

  const filteredFichas = fichas.filter((f) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const dateStr = format(new Date(f.dataRecebimento), "dd/MM/yyyy 'às' HH:mm").toLowerCase()
    const shortDate = format(new Date(f.dataRecebimento), 'dd/MM/yyyy').toLowerCase()
    const veryShortDate = format(new Date(f.dataRecebimento), 'dd/MM').toLowerCase()

    return (
      f.id.toLowerCase().includes(q) ||
      f.clienteNome.toLowerCase().includes(q) ||
      (f.codigoContrato && f.codigoContrato.toLowerCase().includes(q)) ||
      dateStr.includes(q) ||
      shortDate.includes(q) ||
      veryShortDate.includes(q)
    )
  })

  const sortedFichas = [...filteredFichas].sort(
    (a, b) => new Date(b.dataRecebimento).getTime() - new Date(a.dataRecebimento).getTime(),
  )
  const totalPages = Math.ceil(sortedFichas.length / PAGE_SIZE) || 1
  const paginatedFichas = sortedFichas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const canRegister = user?.role === 'Amostrador' || user?.role === 'Administrador'
  const canViewPending = user?.role === 'Secretaria' || user?.role === 'Administrador'

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do recebimento de amostras.</p>
        </div>
        <div className="flex items-center gap-3">
          {canRegister && (
            <Button asChild size="lg" className="shadow-md">
              <Link to="/registro">
                Registrar Amostra <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          {canViewPending && (
            <Button asChild size="lg" className="shadow-md" variant="secondary">
              <Link to="/pendencias">
                Ver Pendências <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Em Triagem</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{counts.triagem}</div>
            <p className="text-xs text-muted-foreground mt-1">Amostras em processo inicial</p>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-warning-foreground">
              Aguardando Secretaria
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-warning-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning-foreground">{counts.secretaria}</div>
            <p className="text-xs text-muted-foreground mt-1">Requerem atenção ou OS</p>
          </CardContent>
        </Card>
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-success">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{counts.concluida}</div>
            <p className="text-xs text-muted-foreground mt-1">Prontas para análise</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Atividade Recente</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, Cliente, Data ou Código..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedFichas.map((ficha) => (
              <div
                key={ficha.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 group"
              >
                <div className="space-y-1">
                  <Link
                    to={`/registro/${ficha.id}`}
                    className="font-medium text-sm text-foreground hover:text-primary transition-colors"
                  >
                    {ficha.id} - {ficha.clienteNome}
                    {ficha.codigoContrato ? ` - ${ficha.codigoContrato}` : ''}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Amostra recebida em{' '}
                    {format(new Date(ficha.dataRecebimento), "dd/MM/yyyy 'às' HH:mm")} por{' '}
                    {ficha.responsavel}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={ficha.status} />
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link to={`/registro/${ficha.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            {paginatedFichas.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {searchQuery ? 'Nenhum registro encontrado.' : 'Nenhuma atividade recente.'}
              </p>
            )}

            {totalPages > 1 && (
              <div className="pt-4 border-t mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }}
                        className={
                          currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                    <span className="text-sm text-muted-foreground mx-4">
                      Página {currentPage} de {totalPages}
                    </span>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }}
                        className={
                          currentPage === totalPages
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
