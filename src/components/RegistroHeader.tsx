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
import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { formatCpfCnpj, isValidCpf, isValidCnpj } from '@/lib/utils'

function CityUfAutocomplete({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(value)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSearch(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase())).sort()

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Ex: São Paulo-SP"
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-auto rounded-md border bg-popover shadow-md">
          {filtered.map((opt) => (
            <div
              key={opt}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setSearch(opt)
                onChange(opt)
                setOpen(false)
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
        cidadeUf: 'São Paulo-SP',
      })
      setIsSimulating(false)
    }, 800)
  }

  const updateField = (field: keyof Ficha, value: string) => {
    setFicha({ ...ficha, [field]: value })
  }

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpfCnpj(e.target.value)
    updateField('cpfCnpj', formatted)
  }

  const digits = ficha.cpfCnpj.replace(/\D/g, '')
  const isCpfCnpjInvalid =
    ficha.cpfCnpj.length > 0 &&
    ((digits.length <= 11 && !isValidCpf(digits)) || (digits.length > 11 && !isValidCnpj(digits)))

  return (
    <Card className="animate-slide-down">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          {configuracoes.nomeFicha || 'Ficha de Recebimento de Amostras'}
        </CardTitle>
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
          <div className="flex gap-2 items-start">
            <Input
              placeholder="Nome do Cliente"
              value={ficha.clienteNome}
              onChange={(e) => updateField('clienteNome', e.target.value)}
              className="flex-1"
            />
            <div className="w-1/3 space-y-1 relative">
              <Input
                placeholder="CPF/CNPJ"
                value={ficha.cpfCnpj}
                onChange={handleCpfCnpjChange}
                className={
                  isCpfCnpjInvalid ? 'border-destructive focus-visible:ring-destructive' : ''
                }
              />
              {isCpfCnpjInvalid && (
                <p className="text-[10px] text-destructive absolute -bottom-4 left-0">
                  CPF/CNPJ inválido
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Cidade-UF</Label>
          <CityUfAutocomplete
            value={ficha.cidadeUf}
            onChange={(v) => updateField('cidadeUf', v)}
            options={configuracoes.cidadesEstados}
          />
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
