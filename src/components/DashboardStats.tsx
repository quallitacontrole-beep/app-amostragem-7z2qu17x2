import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ficha } from '@/types'
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'

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

  const statusCount = filteredFichas.reduce(
    (acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const chartData = Object.keys(statusCount).map((status) => ({
    status,
    quantidade: statusCount[status],
  }))

  return (
    <div className="space-y-4 print:hidden">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emAndamento}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{concluidas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Ocorrências</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comOcorrencia}</div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registros por Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ChartContainer
              config={{ quantidade: { label: 'Quantidade', color: 'hsl(var(--primary))' } }}
            >
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="status" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="quantidade" fill="var(--color-quantidade)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
