import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Send, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Ficha, Ocorrencia } from '@/types'
import { useAppStore } from '@/stores/main'
import { RegistroHeader } from '@/components/RegistroHeader'
import { RegistroItens } from '@/components/RegistroItens'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function Registro() {
  const navigate = useNavigate()
  const { addFicha, currentUser } = useAppStore()
  const [isOccModalOpen, setOccModalOpen] = useState(false)
  const [occText, setOccText] = useState('')

  const [ficha, setFicha] = useState<Ficha>({
    id: `FCH-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`,
    dataRecebimento: new Date().toISOString(),
    responsavel: 'Amostrador Atual',
    formaRecebimento: '',
    clienteNome: '',
    cpfCnpj: '',
    cidade: '',
    estado: '',
    codigoContrato: '',
    status: 'Em Triagem',
    ocorrencias: [],
    itens: [],
    isDraft: true,
  })

  if (currentUser !== 'Amostragem') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Acesso restrito ao perfil Amostragem.
      </div>
    )
  }

  const handleSaveDraft = () => {
    addFicha({ ...ficha, status: 'Em Triagem' })
    toast.success('Rascunho salvo com sucesso!')
    navigate('/')
  }

  const handleSubmit = () => {
    if (ficha.itens.length === 0) return toast.error('Adicione pelo menos um item.')
    if (!ficha.clienteNome) return toast.error('Nome do cliente é obrigatório.')

    addFicha({ ...ficha, status: 'Aguardando Secretaria', isDraft: false })
    toast.success('Ficha enviada para a Secretaria!')
    navigate('/')
  }

  const handleOcorrenciaSubmit = () => {
    if (!ficha.clienteNome) return toast.error('Preencha o Nome do Cliente primeiro.')
    if (!occText) return toast.error('Descreva o caso.')

    const newOcc: Ocorrencia = { id: `occ-${Date.now()}`, descricao: occText, resolvida: false }
    addFicha({ ...ficha, status: 'Aguardando Secretaria', ocorrencias: [newOcc], isDraft: false })
    toast.success('Ocorrência gerada e ficha enviada para Secretaria.')
    setOccModalOpen(false)
    navigate('/')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registro de Ficha</h1>
        <p className="text-muted-foreground mt-1">Preencha os dados da amostra recebida.</p>
      </div>

      <RegistroHeader ficha={ficha} setFicha={setFicha} />
      <RegistroItens itens={ficha.itens} setItens={(itens) => setFicha({ ...ficha, itens })} />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex justify-end gap-3 z-40 sm:left-[16rem]">
        <Button variant="destructive" className="mr-auto" onClick={() => setOccModalOpen(true)}>
          <AlertTriangle className="mr-2 h-4 w-4" /> Contrato Indefinido
        </Button>
        <Button variant="outline" onClick={handleSaveDraft}>
          <Save className="mr-2 h-4 w-4" /> Salvar Rascunho
        </Button>
        <Button onClick={handleSubmit}>
          <Send className="mr-2 h-4 w-4" /> Enviar Secretaria
        </Button>
      </div>

      <Dialog open={isOccModalOpen} onOpenChange={setOccModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar Contrato Indefinido</DialogTitle>
            <DialogDescription>
              A ficha será enviada para a Secretaria com status de pendência.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <Input value={ficha.clienteNome} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Descrição do Caso</Label>
              <Textarea
                placeholder="Explique o motivo da ocorrência..."
                value={occText}
                onChange={(e) => setOccText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOccModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleOcorrenciaSubmit}>
              Gerar Ocorrência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
