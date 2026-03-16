import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ficha } from '@/types'
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export function DashboardStats({
  fichas,
  dateRange,
}: {
  fichas: Ficha[]
  dateRange: { from?: Date; to?: Date } | undefined
}) {
  const filteredFichas = useMemo(() => {
    if (!dateRange?.from) return fichas
    return fichas.filter((f) => {
      if (!f.dataRecebimento) return false
      const d = new Date(f.dataRecebimento)
      const start = startOfDay(dateRange.from!)
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!)
      return isWithinInterval(d, { start, end })
    })
  }, [fichas, dateRange])

  const total = filteredFichas.length
  const concluidas = filteredFichas.filter((f) => f.status === 'Finalizada').length
  const emAndamento = filteredFichas.filter((f) => f.status !== 'Finalizada').length
  const comOcorrencia = filteredFichas.filter((f) =>
    f.ocorrencias?.some((o) => !o.resolvida),
  ).length

  return (
    <div className="space-y-4 print:hidden">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Total de Registros
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{total}</div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
              Em Andamento
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {emAndamento}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Finalizadas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {concluidas}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
              Com Ocorrências
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">{comOcorrencia}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
