import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Ficha } from '@/types'
import { useAppStore } from '@/stores/main'
import { format } from 'date-fns'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function RegistroHeader({
  ficha,
  setFicha,
}: {
  ficha: Ficha
  setFicha: (f: Ficha) => void
}) {
  const { configuracoes } = useAppStore()
  const [isSimulating, setIsSimulating] = useState(false)

  const simulateLookup = () => {
    setIsSimulating(true)
    setTimeout(() => {
      setFicha({
        ...ficha,
        clienteNome: 'Cliente Simulado LTDA',
        cpfCnpj: '00.000.000/0001-00',
        cidade: 'São Paulo',
        estado: 'SP',
      })
      setIsSimulating(false)
    }, 800)
  }

  const updateField = (field: keyof Ficha, value: string) => {
    setFicha({ ...ficha, [field]: value })
  }

  return (
    <Card className="animate-slide-down">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Tabela A: Cabeçalho da Ficha</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>ID Ficha (Auto)</Label>
          <Input value={ficha.id} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Data/Hora Recebimento</Label>
          <Input
            value={format(new Date(ficha.dataRecebimento), 'dd/MM/yyyy HH:mm')}
            disabled
            className="bg-muted"
          />
        </div>
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Input value={ficha.responsavel} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Forma de Recebimento</Label>
          <Select
            value={ficha.formaRecebimento}
            onValueChange={(v) => updateField('formaRecebimento', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {configuracoes.formasRecebimento.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label className="flex justify-between">
            Cliente / Origem
            <button
              type="button"
              onClick={simulateLookup}
              className="text-xs text-primary hover:underline"
            >
              {isSimulating ? (
                <Loader2 className="h-3 w-3 animate-spin inline" />
              ) : (
                'Simular Busca ERP'
              )}
            </button>
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do Cliente"
              value={ficha.clienteNome}
              onChange={(e) => updateField('clienteNome', e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="CPF/CNPJ"
              value={ficha.cpfCnpj}
              onChange={(e) => updateField('cpfCnpj', e.target.value)}
              className="w-1/3"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input value={ficha.cidade} onChange={(e) => updateField('cidade', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <Input value={ficha.estado} onChange={(e) => updateField('estado', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Cód. Contrato (Opcional)</Label>
          <Input
            value={ficha.codigoContrato}
            onChange={(e) => updateField('codigoContrato', e.target.value)}
            placeholder="Ex: CT-123"
          />
        </div>
      </CardContent>
    </Card>
  )
}
