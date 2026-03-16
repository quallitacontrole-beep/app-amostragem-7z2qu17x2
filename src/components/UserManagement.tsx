import { useState, useEffect } from 'react'
import { useAuthStore, Role } from '@/stores/auth'
import { useAppStore } from '@/stores/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, UserPlus, Eye, EyeOff } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export function UserManagement({ setoresList }: { setoresList?: string[] }) {
  const { user, getAllUsers, createUser, updateUser, deleteUser } = useAuthStore()
  const { configuracoes } = useAppStore()
  const isAdmin = user?.role === 'Administrador'

  const currentSetores = setoresList || configuracoes.setores || []

  const [users, setUsers] = useState<any[]>([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    pass: '',
    role: 'Usuário' as Role,
    sector: '',
  })
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  const refreshUsers = () => {
    const all = getAllUsers()
    setUsers(isAdmin ? all : all.filter((u: any) => u.id === user?.id))
  }

  useEffect(() => {
    refreshUsers()
  }, [user, isAdmin])

  const handleOpenModal = (u?: any) => {
    setShowPassword(false)
    if (u) {
      setEditingUser(u)
      setForm({
        name: u.name,
        email: u.email,
        pass: u.pass || '',
        role: u.role || 'Usuário',
        sector: currentSetores.includes(u.sector) ? u.sector : '',
      })
    } else {
      setEditingUser(null)
      setForm({ name: '', email: '', pass: '', role: 'Usuário', sector: '' })
    }
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.name || !form.email) return toast.error('Nome e login são obrigatórios.')
    if (!form.pass) return toast.error('Senha é obrigatória.')

    if (form.sector && !currentSetores.includes(form.sector)) {
      return toast.error(
        'O setor selecionado é inválido ou não existe mais. Selecione um válido da lista.',
      )
    }

    if (editingUser) {
      if (updateUser(editingUser.id, form)) {
        toast.success('Usuário atualizado com sucesso.')
        setModalOpen(false)
        refreshUsers()
      } else {
        toast.error('O Login pode já estar em uso.')
      }
    } else {
      if (createUser(form)) {
        toast.success('Usuário criado com sucesso.')
        setModalOpen(false)
        refreshUsers()
      } else {
        toast.error('O Login já está cadastrado.')
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardDescription>
            {isAdmin
              ? 'Controle de acesso e cadastro de todos os usuários.'
              : 'Gerencie suas credenciais de acesso.'}
          </CardDescription>
        </div>
        {isAdmin && (
          <Button onClick={() => handleOpenModal()}>
            <UserPlus className="mr-2 h-4 w-4" /> Novo Usuário
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'Administrador' ? 'default' : 'secondary'}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{currentSetores.includes(u.sector) ? u.sector : '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(u)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {isAdmin && u.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setUserToDelete(u.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Atualize os dados do usuário abaixo.'
                : 'Preencha os dados para criar um novo acesso. Use um nome de usuário (ex: joao.silva) para facilitar o login.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Login / Usuário</Label>
              <Input
                type="text"
                placeholder="Ex: angelita.brandao"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword && isAdmin ? 'text' : 'password'}
                  value={form.pass}
                  onChange={(e) => setForm({ ...form, pass: e.target.value })}
                  className={isAdmin ? 'pr-10' : ''}
                />
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
            {isAdmin && (
              <>
                <div className="space-y-2">
                  <Label>Perfil de Acesso</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v: Role) => setForm({ ...form, role: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Usuário">Usuário</SelectItem>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Setores da empresa</Label>
                  <Select
                    value={form.sector}
                    onValueChange={(v) => setForm({ ...form, sector: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentSetores.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso excluirá o usuário permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  deleteUser(userToDelete)
                  toast.success('Removido.')
                  setUserToDelete(null)
                  refreshUsers()
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
