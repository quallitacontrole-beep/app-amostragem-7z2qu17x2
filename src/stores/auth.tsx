import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

export type Role = 'Amostrador' | 'Secretaria' | 'Administrador'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

interface UpdateProfileResult {
  success: boolean
  error?: string
}

interface AuthContextData {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, pass: string) => boolean
  register: (name: string, email: string, pass: string, role: Role) => boolean
  logout: () => void
  updateProfile: (name: string, oldPass: string, newPass: string) => UpdateProfileResult
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('app_users') || '[]')
    const hasAdmin = users.find((u: any) => u.email === 'andre.vale')

    if (!hasAdmin) {
      users.push({
        id: 'admin-andre.vale',
        name: 'andre.vale',
        email: 'andre.vale',
        pass: 'abc321',
        role: 'Administrador',
      })
      localStorage.setItem('app_users', JSON.stringify(users))
    }
  }, [])

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

  const updateProfile = (name: string, oldPass: string, newPass: string): UpdateProfileResult => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' }
    const users = JSON.parse(localStorage.getItem('app_users') || '[]')
    const userIndex = users.findIndex((u: any) => u.id === user.id)

    if (userIndex === -1) return { success: false, error: 'Usuário não encontrado na base.' }

    if (newPass) {
      if (users[userIndex].pass !== oldPass) {
        return { success: false, error: 'Senha atual incorreta.' }
      }
      users[userIndex].pass = newPass
    }

    users[userIndex].name = name
    localStorage.setItem('app_users', JSON.stringify(users))
    setUser({ ...user, name })
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    toast.info('Sessão encerrada com sucesso.')
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isAuthenticated: !!user, login, register, logout, updateProfile } },
    children,
  )
}

export const useAuthStore = () => useContext(AuthContext)
