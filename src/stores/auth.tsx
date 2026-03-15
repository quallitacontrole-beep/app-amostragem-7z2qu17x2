import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

export type Role = 'Amostragem' | 'Secretaria'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

interface AuthContextData {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, pass: string) => boolean
  register: (name: string, email: string, pass: string, role: Role) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_user')
    }
  }, [user])

  const login = (email: string, pass: string) => {
    const users = JSON.parse(localStorage.getItem('app_users') || '[]')
    const found = users.find((u: any) => u.email === email && u.pass === pass)
    if (found) {
      setUser({ id: found.id, name: found.name, email: found.email, role: found.role })
      return true
    }
    return false
  }

  const register = (name: string, email: string, pass: string, role: Role) => {
    const users = JSON.parse(localStorage.getItem('app_users') || '[]')
    if (users.find((u: any) => u.email === email)) {
      return false // Email already in use
    }
    const newUser = { id: Date.now().toString(), name, email, pass, role }
    users.push(newUser)
    localStorage.setItem('app_users', JSON.stringify(users))
    setUser({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role })
    return true
  }

  const logout = () => {
    setUser(null)
    toast.info('Sessão encerrada com sucesso.')
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isAuthenticated: !!user, login, register, logout } },
    children,
  )
}

export const useAuthStore = () => useContext(AuthContext)
