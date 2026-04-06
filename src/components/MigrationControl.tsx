import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MigrationOrchestrator } from '@/lib/migration-orchestrator'
import { DatabaseZap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function MigrationControl() {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const { toast } = useToast()

  const handleMigration = async () => {
    setRunning(true)
    setProgress(0)
    setStatus('Iniciando...')

    try {
      await MigrationOrchestrator.runMigration((msg, pct) => {
        setStatus(msg)
        setProgress(pct)
      })
      toast({
        title: 'Migração Concluída',
        description: 'Os dados foram migrados com sucesso para o Supabase.',
      })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro na Migração',
        description: 'O processo foi abortado e os dados revertidos para segurança.',
      })
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseZap className="h-5 w-5 text-primary" />
          Fase 2: Migração Estruturada
        </CardTitle>
        <CardDescription>
          Execute o script de transformação, loteamento e validação para migrar dados locais (Mocks)
          para o Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {running && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{status}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        {!running && progress === 100 && (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            Sistema 100% integrado ao Supabase. Cleanup e Fallbacks configurados.
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleMigration} disabled={running || progress === 100}>
          {running ? 'Migrando...' : progress === 100 ? 'Migração Finalizada' : 'Iniciar Migração'}
        </Button>
      </CardFooter>
    </Card>
  )
}
