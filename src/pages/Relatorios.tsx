import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

export default function Relatorios() {
  const { fichas } = useAppStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  if (user?.role !== 'Secretaria' && user?.role !== 'Administrador') {
    return (
      <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[50vh]">
        <ShieldAlert className="h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
        <p>Apenas Secretaria e Administradores podem visualizar os relatórios.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
          Voltar ao Dashboard
        </Button>
      </div>
    )
  }

  // Aggregate Data for charts
  const itemsBySector: Record<string, number> = {}
  const statusCounts: Record<string, number> = {}
  let totalItems = 0

  fichas.forEach((f) => {
    statusCounts[f.status] = (statusCounts[f.status] || 0) + 1
    f.itens.forEach((it) => {
      totalItems++
      if (it.setorDestino) {
        itemsBySector[it.setorDestino] = (itemsBySector[it.setorDestino] || 0) + 1
      }
    })
  })

  const sectorData = Object.keys(itemsBySector).map((key) => ({
    name: key,
    total: itemsBySector[key],
  }))
  const statusData = Object.keys(statusCounts).map((key) => ({
    name: key,
    value: statusCounts[key],
  }))

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground mt-1">Métricas e inteligência de negócios.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Amostras por Setor Destino</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ total: { label: 'Amostras', color: 'hsl(var(--chart-1))' } }}
              className="h-[300px]"
            >
              <BarChart data={sectorData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status das Fichas</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={{}} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de Qualidade (Ocorrências)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>Total de fichas: {fichas.length}</p>
            <p>Total de amostras: {totalItems}</p>
            <p className="mt-2 text-warning">
              Fichas com ocorrência: {fichas.filter((f) => f.ocorrencias.length > 0).length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
