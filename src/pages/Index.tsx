import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { DashboardStats } from '@/components/DashboardStats'
import { RecentRecords } from '@/components/RecentRecords'
import { DatePickerWithRange } from '@/components/DateRangePicker'

export default function Index() {
  const navigate = useNavigate()
  const { fichas, configuracoes } = useAppStore()
  const { user } = useAuthStore()

  const defaultDateRange = useMemo(() => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - 1) // Yesterday

    // If yesterday is Sunday (0), go back to Friday (-2 days from Sunday)
    if (start.getDay() === 0) {
      start.setDate(start.getDate() - 2)
    }
    // If yesterday is Saturday (6), go back to Friday (-1 day from Saturday)
    else if (start.getDay() === 6) {
      start.setDate(start.getDate() - 1)
    }

    return { from: start, to: today }
  }, [])

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(
    defaultDateRange,
  )

  const canAccessSecretariaFeatures =
    user?.sector === 'Secretaria' || user?.role === 'Administrador'

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Registros</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral e gerenciamento de amostras recebidas.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Button onClick={() => navigate('/registro')}>
            <Plus className="mr-2 h-4 w-4" /> Novo Registro
          </Button>
        </div>
      </div>

      <DashboardStats fichas={fichas || []} dateRange={dateRange} />

      <RecentRecords
        fichas={fichas || []}
        configuracoes={configuracoes}
        canAccessSecretariaFeatures={canAccessSecretariaFeatures}
      />
    </div>
  )
}
