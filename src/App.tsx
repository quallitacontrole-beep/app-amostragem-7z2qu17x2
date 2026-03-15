import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/main'
import { AuthProvider } from '@/stores/auth'
import Layout from './components/Layout'
import Index from './pages/Index'
import Registro from './pages/Registro'
import Pendencias from './pages/Pendencias'
import Relatorios from './pages/Relatorios'
import Config from './pages/Config'
import Perfil from './pages/Perfil'
import Auditoria from './pages/Auditoria'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'

const App = () => (
  <AuthProvider>
    <AppProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/registro/:id" element={<Registro />} />
                <Route path="/pendencias" element={<Pendencias />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/config" element={<Config />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/auditoria" element={<Auditoria />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AppProvider>
  </AuthProvider>
)

export default App
