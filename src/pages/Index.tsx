import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Search,
  ChevronRight,
  FileEdit,
  ShieldCheck,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
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
import { PendenciaModal } from '@/components/PendenciaModal'
import { Ficha } from '@/types'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'

export default function Index() {
  const { fichas, updateFicha, addAuditLog } = useAppStore()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null)

  const getInitialDateRange = (): DateRange => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let startOffset = 1
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    if (yesterday.getDay() === 0) {
      startOffset = 3
    } else if (yesterday.getDay() === 6) {
      startOffset = 2
    }

    const start = new Date(today)
    start.setDate(today.getDate() - startOffset)

    return { from: start, to: today }
  }

  const [dateRange, setDateRange] = useState<DateRange | undefined>(getInitialDateRange())
  const PAGE_SIZE = 20

  useEffect(() => setCurrentPage(1), [searchQuery, dateRange])

  const dateFilteredFichas = fichas.filter((f) => {
    if (!dateRange?.from) return true

    const dateStr = f.createdAt || f.dataRecebimento
    if (!dateStr) return false

    const d = new Date(dateStr)
    d.setHours(0, 0, 0, 0)

    const fTime = dateRange.from.getTime()
    const tTime = dateRange.to ? dateRange.to.getTime() : fTime

    return d.getTime() >= fTime && d.getTime() <= tTime
  })

  const counts = {
    triagem: dateFilteredFichas.filter((f) => f.status === 'Em Triagem').length,
    secretaria: dateFilteredFichas.filter((f) => f.status === 'Aguardando Secretaria').length,
    validacao: dateFilteredFichas.filter(
      (f) => f.status === 'Validação Secretaria' || f.status === 'Aguardando Validação',
    ).length,
    resolvida: dateFilteredFichas.filter((f) => f.status === 'Finalizada').length,
  }

  const filteredFichas = dateFilteredFichas.filter((f) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()

    const timestampToSearch = f.createdAt || f.dataRecebimento
    const dateStr = timestampToSearch
      ? format(new Date(timestampToSearch), "dd/MM/yyyy 'às' HH:mm").toLowerCase()
      : ''
    const shortDate = f.dataRecebimento
      ? format(new Date(f.dataRecebimento), 'dd/MM/yyyy').toLowerCase()
      : ''

    return (
      f.id.toLowerCase().includes(q) ||
      f.clienteNome.toLowerCase().includes(q) ||
      (f.codigoContrato && f.codigoContrato.toLowerCase().includes(q)) ||
      (f.responsavel && f.responsavel.toLowerCase().includes(q)) ||
      dateStr.includes(q) ||
      shortDate.includes(q)
    )
  })

  const sortedFichas = [...filteredFichas].sort(
    (a, b) =>
      new Date(b.createdAt || b.dataRecebimento).getTime() -
      new Date(a.createdAt || a.dataRecebimento).getTime(),
  )
  const totalPages = Math.ceil(sortedFichas.length / PAGE_SIZE) || 1
  const paginatedFichas = sortedFichas.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const canRegister = user?.sector === 'Amostragem' || user?.role === 'Administrador'
  const canViewPending = user?.sector === 'Secretaria' || user?.role === 'Administrador'

  const handleUpdateAndLog = (ficha: Ficha) => {
    updateFicha(ficha)
    if (user) {
      addAuditLog({ userId: user.id, userName: user.name, action: 'Atualizou', fichaId: ficha.id })
    }
  }

  const pendingFichasForSecretaria = fichas.filter(
    (f) =>
      f.status === 'Aguardando Secretaria' ||
      f.status === 'Validação Secretaria' ||
      f.status === 'Aguardando Validação',
  )

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do recebimento de amostras.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full sm:w-[260px] justify-start text-left font-normal shadow-sm bg-card',
                  !dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <span className="truncate">
                      {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                    </span>
                  ) : (
                    <span>{format(dateRange.from, 'dd/MM/yyyy')}</span>
                  )
                ) : (
                  <span>Selecione o período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <div className="flex w-full sm:w-auto items-center gap-2">
            {canRegister && (
              <Button asChild size="default" className="shadow-md flex-1 sm:flex-initial">
                <Link to="/registro">
                  Nova Ficha <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            {canViewPending && (
              <Button
                asChild
                size="default"
                className="shadow-md flex-1 sm:flex-initial"
                variant="secondary"
              >
                <Link to="/pendencias">
                  Pendências <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Em Triagem</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{counts.triagem}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Amostras em processo inicial</p>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-warning-foreground truncate pr-2">
              Aguardando Sec.
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-warning-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-foreground">{counts.secretaria}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Esperando por resposta da Secretaria
            </p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-600 truncate pr-2">
              Validação Secretaria
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{counts.validacao}</div>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
              Amostragem finalizada e enviadas à Secretaria
            </p>
          </CardContent>
        </Card>
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-success">Finalizadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{counts.resolvida}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Prontas para análise</p>
          </CardContent>
        </Card>
      </div>

      {user?.sector === 'Secretaria' && (
        <Card className="border-warning/40 shadow-sm">
          <CardHeader className="bg-warning/5 border-b border-warning/10 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Pendências da Secretaria
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {pendingFichasForSecretaria.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma pendência encontrada para o seu setor.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingFichasForSecretaria.map((ficha) => {
                  const dataReceb = ficha.dataRecebimento
                    ? format(new Date(ficha.dataRecebimento), 'dd/MM/yyyy')
                    : ''
                  return (
                    <div
                      key={ficha.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {ficha.id} - {ficha.clienteNome}
                            {ficha.codigoContrato ? ` - ${ficha.codigoContrato}` : ''}
                          </span>
                          <StatusBadge status={ficha.status} className="scale-90 origin-left" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Recebida em {dataReceb} por {ficha.responsavel}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setSelectedFicha(ficha)}>
                        <FileEdit className="h-4 w-4 mr-2" />
                        Tratar Pendência
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Atividade no Período</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, Cliente ou Usuário..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedFichas.map((ficha) => {
              const dataReceb = ficha.dataRecebimento
                ? format(new Date(ficha.dataRecebimento), 'dd/MM/yyyy')
                : ''

              return (
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
                      Recebida em {dataReceb} por {ficha.responsavel}
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
              )
            })}
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

      <PendenciaModal
        isOpen={!!selectedFicha}
        ficha={selectedFicha}
        onClose={() => setSelectedFicha(null)}
        onSave={handleUpdateAndLog}
      />
    </div>
  )
}
