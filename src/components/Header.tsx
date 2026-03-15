import { useState, useEffect, useRef } from 'react'
import { Bell, Search, UserCircle, LogOut, Settings2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

export function Header() {
  const { fichas } = useAppStore()
  const { user, logout } = useAuthStore()

  const isSecretaria = user?.sector === 'Secretaria' || user?.role === 'Administrador'

  const pendingFichas = fichas
    .filter((f) => f.status === 'Aguardando Secretaria')
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.dataRecebimento).getTime() -
        new Date(a.createdAt || a.dataRecebimento).getTime(),
    )

  const relevantNotifications = isSecretaria ? pendingFichas : []
  const pendingCount = relevantNotifications.length

  const [hasUnread, setHasUnread] = useState(false)
  const prevCountRef = useRef(pendingCount)

  useEffect(() => {
    if (pendingCount > prevCountRef.current) {
      setHasUnread(true)
    }
    prevCountRef.current = pendingCount
  }, [pendingCount])

  useEffect(() => {
    if (pendingCount > 0) {
      setHasUnread(true)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="relative hidden w-64 md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar ID_Ficha..."
            className="w-full bg-muted pl-9 shadow-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Popover
          onOpenChange={(open) => {
            if (open) setHasUnread(false)
          }}
        >
          <PopoverTrigger asChild>
            <div className="relative flex cursor-pointer items-center justify-center h-10 w-10 rounded-full hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {hasUnread && pendingCount > 0 && (
                <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-destructive ring-2 ring-background"></span>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm">Notificações</span>
              {pendingCount > 0 && <Badge variant="secondary">{pendingCount}</Badge>}
            </div>
            <ScrollArea className="h-[320px]">
              {pendingCount === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhuma notificação encontrada
                </div>
              ) : (
                <div className="flex flex-col">
                  {relevantNotifications.map((f) => (
                    <Link
                      key={f.id}
                      to={`/registro/${f.id}`}
                      className="flex flex-col gap-1 p-4 border-b hover:bg-muted/50 transition-colors last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-sm leading-tight">
                            Nova pendência: {f.id}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            Aguardando Secretaria - Cliente: {f.clienteNome}
                          </span>
                          <span className="text-[10px] text-muted-foreground/70 mt-1">
                            {format(
                              new Date(f.createdAt || f.dataRecebimento),
                              "dd/MM/yyyy 'às' HH:mm",
                            )}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-auto flex items-center gap-2 pl-2 pr-4 rounded-full bg-muted/30 hover:bg-muted"
            >
              <UserCircle className="h-6 w-6 text-primary" />
              <div className="flex flex-col items-start text-left hidden sm:flex">
                <span className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</span>
                <span className="text-[10px] text-muted-foreground leading-none mt-1">
                  {user?.role}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <Badge variant="outline" className="w-fit mt-1">
                  {user?.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/perfil">
                <Settings2 className="mr-2 h-4 w-4" />
                <span>Configurações de Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer mt-1"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair do sistema</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
