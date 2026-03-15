import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore, Role } from '@/stores/auth'
import { toast } from 'sonner'
import { FlaskConical } from 'lucide-react'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<Role>('Amostragem')
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) {
      return toast.error('Todos os campos são obrigatórios.')
    }
    if (password !== confirmPassword) {
      return toast.error('As senhas não coincidem.')
    }
    if (password.length < 6) {
      return toast.error('A senha deve ter pelo menos 6 caracteres.')
    }

    if (register(name, email, password, role)) {
      toast.success('Conta criada com sucesso! Você foi autenticado automaticamente.')
      navigate('/')
    } else {
      toast.error('Este email já está cadastrado.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 py-8">
      <Card className="w-full max-w-md animate-fade-in-up border-primary/10 shadow-lg">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center ring-4 ring-background shadow-inner">
              <FlaskConical className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Criar Conta</CardTitle>
          <CardDescription>Preencha seus dados para criar um novo acesso.</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil de Acesso</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Amostragem">Amostragem</SelectItem>
                  <SelectItem value="Secretaria">Secretaria</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Button type="submit" className="w-full" size="lg">
              Criar Conta
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Já possui uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Faça login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
