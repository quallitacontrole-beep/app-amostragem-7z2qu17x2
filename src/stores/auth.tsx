import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

export type Role = 'Administrador' | 'Usuário'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  sector?: string
}

interface UpdateProfileResult {
  success: boolean
  error?: string
}

interface AuthContextData {
  user: User | null
  usersList: any[]
  isAuthenticated: boolean
  login: (email: string, pass: string) => boolean
  register: (name: string, email: string, pass: string, role: Role, sector?: string) => boolean
  logout: () => void
  updateProfile: (name: string, oldPass: string, newPass: string) => UpdateProfileResult
  getAllUsers: () => any[]
  createUser: (data: any) => boolean
  updateUser: (id: string, data: any) => boolean
  deleteUser: (id: string) => boolean
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user')
    return stored ? JSON.parse(stored) : null
  })

  const [usersList, setUsersList] = useState<any[]>(() => {
    const adminDefault = {
      id: 'admin-andre.vale',
      name: 'andre.vale',
      email: 'andre.vale',
      pass: 'abc321',
      role: 'Administrador',
      sector: 'Diretoria',
    }

    try {
      const stored = localStorage.getItem('app_users')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasAdmin = parsed.some((u: any) => u.email === 'andre.vale')
          if (!hasAdmin) return [...parsed, adminDefault]
          return parsed
        }
      }
    } catch (e) {
      console.warn('Failed to parse app_users from storage', e)
    }
    return [adminDefault]
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_user')
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem('app_users', JSON.stringify(usersList))
  }, [usersList])

  const login = (email: string, pass: string) => {
    const found = usersList.find(
      (u: any) => (u.email === email || u.name === email) && u.pass === pass,
    )
    if (found) {
      setUser({
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        sector: found.sector,
      })
      return true
    }
    return false
  }

  const register = (name: string, email: string, pass: string, role: Role, sector?: string) => {
    if (usersList.some((u: any) => u.email === email)) return false
    const newUser = { id: Date.now().toString(), name, email, pass, role, sector }
    setUsersList((prev) => [...prev, newUser])
    setUser({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      sector: newUser.sector,
    })
    return true
  }

  const updateProfile = (name: string, oldPass: string, newPass: string): UpdateProfileResult => {
    if (!user) return { success: false, error: 'Usuário não autenticado.' }
    const userIndex = usersList.findIndex((u: any) => u.id === user.id)
    if (userIndex === -1) return { success: false, error: 'Usuário não encontrado na base.' }

    const target = usersList[userIndex]
    let updatedPass = target.pass

    if (newPass) {
      if (target.pass !== oldPass) return { success: false, error: 'Senha atual incorreta.' }
      updatedPass = newPass
    }

    const updatedUsers = [...usersList]
    updatedUsers[userIndex] = { ...target, name, pass: updatedPass }
    setUsersList(updatedUsers)
    setUser({ ...user, name })
    return { success: true }
  }

  const getAllUsers = () => usersList

  const createUser = (data: any) => {
    if (usersList.some((u: any) => u.email === data.email)) return false
    setUsersList((prev) => [...prev, { id: Date.now().toString(), ...data }])
    return true
  }

  const updateUser = (id: string, data: any) => {
    const index = usersList.findIndex((u: any) => u.id === id)
    if (index === -1) return false
    if (data.email !== usersList[index].email && usersList.some((u: any) => u.email === data.email))
      return false

    const target = usersList[index]
    const updatedUsers = [...usersList]

    updatedUsers[index] = {
      ...target,
      name: data.name,
      email: data.email,
      role: data.role || target.role,
      sector: data.sector !== undefined ? data.sector : target.sector,
      pass: data.pass !== undefined ? data.pass : target.pass,
    }

    setUsersList(updatedUsers)

    if (user?.id === id) {
      setUser({
        id: updatedUsers[index].id,
        name: updatedUsers[index].name,
        email: updatedUsers[index].email,
        role: updatedUsers[index].role,
        sector: updatedUsers[index].sector,
      })
    }
    return true
  }

  const deleteUser = (id: string) => {
    setUsersList((prev) => prev.filter((u: any) => u.id !== id))
    return true
  }

  const logout = () => {
    setUser(null)
    toast.info('Sessão encerrada com sucesso.')
  }

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        usersList,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        getAllUsers,
        createUser,
        updateUser,
        deleteUser,
      },
    },
    children,
  )
}

export const useAuthStore = () => useContext(AuthContext)
