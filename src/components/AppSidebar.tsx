import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus2,
  ListTodo,
  BarChart3,
  Settings,
  FlaskConical,
  History,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navItems = [
  {
    title: 'Início',
    url: '/',
    icon: LayoutDashboard,
    roles: ['Administrador', 'Amostrador', 'Secretaria'],
  },
  {
    title: 'Nova Ficha',
    url: '/registro',
    icon: FilePlus2,
    roles: ['Administrador', 'Amostrador'],
  },
  {
    title: 'Pendências',
    url: '/pendencias',
    icon: ListTodo,
    roles: ['Administrador', 'Secretaria'],
  },
  {
    title: 'Relatórios',
    url: '/relatorios',
    icon: BarChart3,
    roles: ['Administrador', 'Secretaria'],
  },
  { title: 'Configurações', url: '/config', icon: Settings, roles: ['Administrador'] },
  { title: 'Auditoria', url: '/auditoria', icon: History, roles: ['Administrador'] },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuthStore()

  const allowedNavItems = navItems.filter((item) => user && item.roles.includes(user.role))

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <FlaskConical className="h-6 w-6" />
          <span className="text-lg">AmostragemApp</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allowedNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
