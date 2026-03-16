import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Header } from '@/components/Header'

export default function Layout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground print:bg-white print:text-black">
        <div className="print:hidden contents">
          <AppSidebar />
        </div>
        <main className="flex flex-1 flex-col overflow-hidden print:overflow-visible print:h-auto">
          <div className="print:hidden contents">
            <Header />
          </div>
          <div className="flex-1 overflow-y-auto print:overflow-visible p-4 md:p-6 lg:p-8 print:p-0 print:h-auto">
            <div className="mx-auto max-w-7xl print:max-w-none print:w-full print:m-0">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
