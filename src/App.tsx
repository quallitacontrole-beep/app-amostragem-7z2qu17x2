import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/main'
import Layout from './components/Layout'
import Index from './pages/Index'
import Registro from './pages/Registro'
import Pendencias from './pages/Pendencias'
import Relatorios from './pages/Relatorios'
import Config from './pages/Config'
import NotFound from './pages/NotFound'

const App = () => (
  <AppProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/pendencias" element={<Pendencias />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/config" element={<Config />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AppProvider>
)

export default App
