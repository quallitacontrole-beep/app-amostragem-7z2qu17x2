import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMetrics } from '@/hooks/useMetrics'
import { MigrationOrchestrator } from '@/lib/migration-orchestrator'
import {
  Database,
  HardDrive,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
} from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function SystemDashboard() {
  const { requests, errors, clear } = useMetrics()
  const [migrating, setMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [migrationStatus, setMigrationStatus] = useState('')

  const stats = useMemo(() => {
    const total = requests.length || 1 // prevent div by zero
    const dbCount = requests.filter((r) => r.source === 'DB').length
    const mockCount = requests.filter((r) => r.source === 'MOCK').length
    const avgLatency = requests.reduce((acc, r) => acc + r.latency, 0) / total

    // prepare chart data (last 10 requests)
    const chartData = requests
      .slice(0, 10)
      .reverse()
      .map((r, i) => ({
        name: `Req ${i + 1}`,
        latency: Math.round(r.latency),
        source: r.source,
      }))

    return {
      dbPercent: Math.round((dbCount / total) * 100),
      mockPercent: Math.round((mockCount / total) * 100),
      avgLatency: Math.round(avgLatency),
      chartData,
    }
  }, [requests])

  const handleMigration = async () => {
    setMigrating(true)
    try {
      await MigrationOrchestrator.runMigration((msg, prog) => {
        setMigrationStatus(msg)
        setMigrationProgress(prog)
      })
      toast.success('Migração estruturada concluída com sucesso.')
    } catch (err) {
      toast.error('Erro na migração.')
    } finally {
      setTimeout(() => {
        setMigrating(false)
        setMigrationProgress(0)
        setMigrationStatus('')
      }, 3000)
    }
  }

  const handleRollback = async () => {
    setMigrating(true)
    try {
      await MigrationOrchestrator.rollback((msg) => {
        setMigrationStatus(msg)
      })
      toast.info('Rollback concluído.')
    } finally {
      setTimeout(() => {
        setMigrating(false)
        setMigrationStatus('')
      }, 2000)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" /> Uso do Supabase (Real)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.length === 0 ? '0' : stats.dbPercent}%
            </div>
            <Progress value={stats.dbPercent} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-orange-500" /> Fallback Local (Mock)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.length === 0 ? '0' : stats.mockPercent}%
            </div>
            <Progress value={stats.mockPercent} className="mt-2 h-2 [&>div]:bg-orange-500" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Latência Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.length === 0 ? '0' : stats.avgLatency} ms
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimas {requests.length} requisições
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Orquestrador de Migração
              {migrating && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription>
              Execute a Fase 2 (Migração Estruturada) em camadas controladas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleMigration} disabled={migrating} className="flex-1">
                <Play className="w-4 h-4 mr-2" /> Iniciar Migração
              </Button>
              <Button
                onClick={handleRollback}
                disabled={migrating}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Rollback
              </Button>
            </div>

            {migrating && (
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg border animate-fade-in-up">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-primary">{migrationStatus}</span>
                  <span>{migrationProgress}%</span>
                </div>
                <Progress value={migrationProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Logs de Integração</CardTitle>
              <CardDescription>Erros recentes no Data Adapter.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={clear}>
              Limpar
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px] w-full pr-4">
              {errors.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mb-2 text-green-500/50" />
                  <p className="text-sm">Nenhum erro de integração detectado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {errors.map((err: any, idx) => (
                    <div key={idx} className="flex gap-2 text-sm border-b pb-2 last:border-0">
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs text-muted-foreground block">
                          {format(new Date(err.time), 'HH:mm:ss')}
                        </span>
                        <span className="text-destructive font-medium">{err.msg}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Latência por Requisição (ms)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ChartContainer
              config={{
                latency: { label: 'Latência', color: 'hsl(var(--primary))' },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="latency" fill="var(--color-latency)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
