import { Badge } from '@/components/ui/badge'
import { StatusFicha } from '@/types'
import { cn } from '@/lib/utils'

export function StatusBadge({ status, className }: { status: StatusFicha; className?: string }) {
  const variants: Record<StatusFicha, string> = {
    Finalizada: 'bg-success/15 text-success hover:bg-success/25 border-success/20',
    'Aguardando Secretaria':
      'bg-warning/15 text-warning-foreground hover:bg-warning/25 border-warning/20',
    'Em Triagem': 'bg-primary/15 text-primary hover:bg-primary/25 border-primary/20',
  }

  return (
    <Badge variant="outline" className={cn(variants[status], className)}>
      {status}
    </Badge>
  )
}
