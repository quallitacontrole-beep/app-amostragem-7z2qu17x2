import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ficha } from '@/types'
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { FileText, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react'

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
  const finalizadas = filteredFichas.filter(
    (f) => f.status === 'Finalizada' || f.status === 'Finalizada (Impressa)',
  ).length
  const enviadoSecretaria = filteredFichas.filter(
    (f) => f.status === 'Validação Secretaria' || f.status === 'Aguardando Validação',
  ).length
  const aguardandoSecretaria = filteredFichas.filter(
    (f) => f.status === 'Aguardando Secretaria',
  ).length
  const aguardandoAmostragem = filteredFichas.filter(
    (f) => f.status === 'Aguardando Amostragem',
  ).length

  return (
    <div className="space-y-4 print:hidden">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Total de registros
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{total}</div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
              No período selecionado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Aguardando Amostragem
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">
              {aguardandoAmostragem}
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
              Secretaria aguardando finalização da amostragem
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
              Aguardando Secretaria
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {aguardandoSecretaria}
            </div>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
              Amostragem aguardando resolução da secretaria
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50/50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Enviado Secretaria
            </CardTitle>
            <Send className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {enviadoSecretaria}
            </div>
            <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">
              Fichas enviadas da amostragem à secretaria
            </p>
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
              {finalizadas}
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
              Fichas finalizadas pela secretaria
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
