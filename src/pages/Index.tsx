import { Link } from 'react-router-dom'
import { ClipboardList, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { StatusBadge } from '@/components/StatusBadge'
import { format } from 'date-fns'

export default function Index() {
  const { fichas } = useAppStore()
  const { user } = useAuthStore()

  const counts = {
    triagem: fichas.filter((f) => f.status === 'Em Triagem').length,
    secretaria: fichas.filter((f) => f.status === 'Aguardando Secretaria').length,
    concluida: fichas.filter((f) => f.status === 'Concluída').length,
  }

  const recentFichas = [...fichas]
    .sort((a, b) => new Date(b.dataRecebimento).getTime() - new Date(a.dataRecebimento).getTime())
    .slice(0, 5)

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
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentFichas.map((ficha) => (
              <div
                key={ficha.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    Ficha {ficha.id} - {ficha.clienteNome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Recebido em {format(new Date(ficha.dataRecebimento), "dd/MM/yyyy 'às' HH:mm")}{' '}
                    por {ficha.responsavel}
                  </p>
                </div>
                <StatusBadge status={ficha.status} />
              </div>
            ))}
            {recentFichas.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade recente.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
