import { Bell, Search, UserCircle, LogOut } from 'lucide-react'
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

export function Header() {
  const { fichas } = useAppStore()
  const { user, logout } = useAuthStore()
  const pendingCount = fichas.filter((f) => f.status === 'Aguardando Secretaria').length

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
        <div className="relative flex cursor-pointer items-center justify-center h-10 w-10 rounded-full hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {pendingCount > 0 && (
            <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-destructive ring-2 ring-background"></span>
          )}
        </div>

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
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
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
