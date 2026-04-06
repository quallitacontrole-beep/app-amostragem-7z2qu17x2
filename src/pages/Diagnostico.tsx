import { SystemDashboard } from '@/components/SystemDashboard'
import { MigrationControl } from '@/components/MigrationControl'

export default function Diagnostico() {
  return (
    <div className="container mx-auto py-8 space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diagnóstico do Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Monitoramento em tempo real da resiliência, fallbacks automáticos e migração de dados
          estruturada.
        </p>
      </div>

      <MigrationControl />

      <div className="pt-4">
        <h2 className="text-xl font-semibold mb-4">Métricas de Integração (Data Adapter)</h2>
        <SystemDashboard />
      </div>
    </div>
  )
}
