import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Save, UserCircle } from 'lucide-react'

export default function Perfil() {
  const { user, updateProfile } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('O nome não pode estar vazio.')
    if (newPass && newPass !== confirmPass) {
      return toast.error('As novas senhas não coincidem.')
    }
    if (newPass && newPass.length < 6) {
      return toast.error('A nova senha deve ter pelo menos 6 caracteres.')
    }
    if (newPass && !oldPass) {
      return toast.error('Informe a senha atual para alterar a senha.')
    }

    const result = updateProfile(name, oldPass, newPass)
    if (result.success) {
      toast.success('Perfil atualizado com sucesso!')
      setOldPass('')
      setNewPass('')
      setConfirmPass('')
    } else {
      toast.error(result.error || 'Erro ao atualizar perfil.')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações de Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações pessoais e credenciais de acesso.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
            <UserCircle className="h-10 w-10 text-primary" />
          </div>
          <div>
            <CardTitle>Dados da Conta</CardTitle>
            <CardDescription>
              {user?.email} • Função:{' '}
              <span className="font-medium text-foreground">{user?.role}</span>
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="pt-4 border-t mt-6">
              <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPass">Senha Atual</Label>
                  <Input
                    id="oldPass"
                    type="password"
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPass">Nova Senha</Label>
                    <Input
                      id="newPass"
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPass">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPass"
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-4 border-t bg-muted/20">
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" /> Salvar Alterações
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
