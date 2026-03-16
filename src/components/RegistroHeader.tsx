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
import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { formatCpfCnpj, isValidCpf, isValidCnpj, removeAccents, cn } from '@/lib/utils'

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

  useEffect(() => setSearch(value), [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = options
    .filter((o) => removeAccents(o.toLowerCase()).includes(removeAccents(search.toLowerCase())))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 50)

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
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-md py-1 animate-in fade-in">
          {filtered.map((opt) => (
            <div
              key={opt}
              className="px-3 py-2 text-[13px] cursor-pointer hover:bg-accent"
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
        cpfCnpj: '00.000.000/0001-91',
        cidadeUf: 'São Paulo-SP',
      })
      setIsSimulating(false)
    }, 800)
  }

  const updateField = (field: keyof Ficha, value: string) => setFicha({ ...ficha, [field]: value })

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    updateField('cpfCnpj', formatCpfCnpj(e.target.value))

  const updateContractCode = (newCod: string) => {
    const newItens = ficha.itens.map((item) => {
      const updatedItem = { ...item }
      if (updatedItem.protocoloWeb) {
        const match = updatedItem.protocoloWeb.match(/^P(\d+)/)
        if (match) {
          updatedItem.protocoloWeb = newCod ? `P${match[1]}-${newCod}` : ''
        }
      }
      if (updatedItem.ordemServico) {
        const match = updatedItem.ordemServico.match(/-(\d{1,2})$/)
        if (match) {
          updatedItem.ordemServico = newCod ? `${newCod}-${match[1]}` : ''
        }
      }
      return updatedItem
    })
    setFicha({ ...ficha, codigoContrato: newCod, itens: newItens })
  }

  const getLocalDateString = (isoString: string) => {
    try {
      if (!isoString) return ''
      const d = new Date(isoString)
      if (isNaN(d.getTime())) return ''
      const tzOffset = d.getTimezoneOffset() * 60000
      return new Date(d.getTime() - tzOffset).toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const digits = (ficha.cpfCnpj || '').replace(/\D/g, '')
  const isCpfCnpjInvalid =
    digits.length > 0 &&
    ((digits.length === 11 && !isValidCpf(digits)) ||
      (digits.length === 14 && !isValidCnpj(digits)))

  const codParts = (ficha.codigoContrato || '').split('/')
  const codPrefix = codParts[0] || ''
  const codYear = codParts[1] || ''

  const hasAnyContractInput = codPrefix.length > 0 || codYear.length > 0
  const isCodPrefixInvalid = hasAnyContractInput && codPrefix.length === 0
  const isCodYearInvalid = hasAnyContractInput && codYear.length < 4

  const handlePrefixChange = (val: string) => {
    const p = val.replace(/\D/g, '').slice(0, 4)
    updateContractCode(!p && !codYear ? '' : `${p}/${codYear}`)
  }

  const handleYearChange = (val: string) => {
    const y = val.replace(/\D/g, '').slice(0, 4)
    updateContractCode(!codPrefix && !y ? '' : `${codPrefix}/${y}`)
  }

  return (
    <Card className="animate-slide-down">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          {configuracoes.nomeFicha || 'Ficha de Recebimento de Amostras'}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-12">
        <div className="space-y-2 md:col-span-3">
          <Label>ID</Label>
          <Input value={ficha.id} disabled className="bg-muted" />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label>Data Receb</Label>
          <Input
            type="date"
            value={getLocalDateString(ficha.dataRecebimento)}
            onChange={(e) => {
              if (e.target.value) {
                const newDate = new Date(`${e.target.value}T00:00:00`)
                if (!isNaN(newDate.getTime())) {
                  updateField('dataRecebimento', newDate.toISOString())
                }
              }
            }}
          />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label>Responsável</Label>
          <Input value={ficha.responsavel} disabled className="bg-muted" />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label>Recebimento</Label>
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

        <div className="space-y-2 md:col-span-4">
          <Label className="flex justify-between">
            Nome do cliente
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
          <Input
            placeholder="Nome do cliente"
            value={ficha.clienteNome}
            onChange={(e) => updateField('clienteNome', e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-4 relative">
          <Label>CPF/CNPJ</Label>
          <Input
            placeholder="CPF/CNPJ"
            value={ficha.cpfCnpj ? formatCpfCnpj(ficha.cpfCnpj) : ''}
            onChange={handleCpfCnpjChange}
            className={cn(isCpfCnpjInvalid && 'border-destructive focus-visible:ring-destructive')}
          />
          {isCpfCnpjInvalid && (
            <p className="text-[10px] text-destructive absolute -bottom-4 left-0">
              CPF/CNPJ inválido
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-4">
          <Label>Cidade</Label>
          <CityUfAutocomplete
            value={ficha.cidadeUf}
            onChange={(v) => updateField('cidadeUf', v)}
            options={configuracoes.cidadesEstados}
          />
        </div>

        <div className="space-y-2 md:col-span-4 relative">
          <Label>Código</Label>
          <div className="flex items-center gap-2">
            <Input
              value={codPrefix}
              onChange={(e) => handlePrefixChange(e.target.value)}
              placeholder="0000"
              className={cn(
                'w-16 text-center tracking-widest text-[13px]',
                isCodPrefixInvalid
                  ? 'border-destructive focus-visible:ring-destructive'
                  : !codPrefix &&
                      'border-yellow-500 bg-yellow-500/10 focus-visible:ring-yellow-500',
              )}
              maxLength={4}
            />
            <span className="text-muted-foreground font-bold">/</span>
            <Input
              value={codYear}
              onChange={(e) => handleYearChange(e.target.value)}
              placeholder="AAAA"
              className={cn(
                'w-16 text-center tracking-widest text-[13px]',
                isCodYearInvalid
                  ? 'border-destructive focus-visible:ring-destructive'
                  : !codYear && 'border-yellow-500 bg-yellow-500/10 focus-visible:ring-yellow-500',
              )}
              maxLength={4}
            />
          </div>
          {isCodPrefixInvalid && (
            <p className="text-[10px] text-destructive absolute -bottom-4 left-0">
              Prefixo obrigatório
            </p>
          )}
          {isCodYearInvalid && !isCodPrefixInvalid && (
            <p className="text-[10px] text-destructive absolute -bottom-4 left-0">
              O sufixo deve ter 4 dígitos
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
