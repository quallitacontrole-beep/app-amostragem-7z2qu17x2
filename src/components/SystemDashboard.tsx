import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMetrics } from '@/stores/metrics'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { Activity, Database, ServerCrash, Clock } from 'lucide-react'

export function SystemDashboard() {
  const { requests, errors } = useMetrics()

  const stats = useMemo(() => {
    const total = requests.length
    const dbCount = requests.filter((r) => r.source === 'DB').length
    const mockCount = requests.filter((r) => r.source === 'MOCK').length
    const dbPercent = total > 0 ? Math.round((dbCount / total) * 100) : 0
    const mockPercent = total > 0 ? Math.round((mockCount / total) * 100) : 0
    const avgLatency =
      total > 0 ? Math.round(requests.reduce((acc, r) => acc + r.latency, 0) / total) : 0
    const errorCount = requests.filter((r) => r.error).length

    const opLatency: Record<string, { total: number; count: number }> = {}
    requests.forEach((r) => {
      if (!opLatency[r.operation]) opLatency[r.operation] = { total: 0, count: 0 }
      opLatency[r.operation].total += r.latency
      opLatency[r.operation].count += 1
    })

    const chartData = Object.entries(opLatency).map(([op, data]) => ({
      operation: op,
      latency: Math.round(data.total / data.count),
    }))

    return { total, dbPercent, mockPercent, avgLatency, errorCount, chartData }
  }, [requests])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requisições (DB)</CardTitle>
            <Database className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dbPercent}%</div>
            <p className="text-xs text-muted-foreground">Taxa de sucesso via Supabase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallback (MOCK)</CardTitle>
            <ServerCrash className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mockPercent}%</div>
            <p className="text-xs text-muted-foreground">Uso da rede de segurança local</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgLatency}ms</div>
            <p className="text-xs text-muted-foreground">Tempo médio de resposta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros (Retries)</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errorCount}</div>
            <p className="text-xs text-muted-foreground">Falhas interceptadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Latência por Operação</CardTitle>
            <CardDescription>Tempo de resposta médio em (ms)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.chartData.length > 0 ? (
              <ChartContainer
                config={{ latency: { label: 'Latência (ms)', color: 'hsl(var(--primary))' } }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData}>
                    <XAxis
                      dataKey="operation"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}ms`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="latency" fill="var(--color-latency)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Sem dados suficientes
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Log de Erros e Fallbacks</CardTitle>
            <CardDescription>Últimos registros da resiliência (Adapter)</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full pr-4">
              {errors.length > 0 ? (
                <div className="space-y-4">
                  {errors.map((err, i) => (
                    <div key={i} className="flex flex-col gap-1 border-b pb-2 last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">ERRO</Badge>
                        <span className="text-xs font-medium text-muted-foreground">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{err}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Sistema estável. Nenhum erro registrado.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
