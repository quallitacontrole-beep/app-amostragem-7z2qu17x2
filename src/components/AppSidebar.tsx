import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus2,
  ListTodo,
  BarChart3,
  Settings,
  FlaskConical,
} from 'lucide-react'
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
  { title: 'Início', url: '/', icon: LayoutDashboard },
  { title: 'Nova Ficha', url: '/registro', icon: FilePlus2 },
  { title: 'Pendências', url: '/pendencias', icon: ListTodo },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Configurações', url: '/config', icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()

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
              {navItems.map((item) => (
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
