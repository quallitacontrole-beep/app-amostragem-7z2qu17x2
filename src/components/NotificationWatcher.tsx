import { useEffect } from 'react'
import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'

const formatName = (name: string) => {
  if (!name) return ''
  return name
    .split(/[.\-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function NotificationWatcher() {
  const { notifications, markNotificationAsRead } = useAppStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return
    const userNameFormatted = formatName(user.name)

    const unread = notifications.filter(
      (n) => !n.read && (n.userId === user.name || n.userId === userNameFormatted),
    )

    unread.forEach((n) => {
      if (n.type === 'tag_change') {
        toast.warning('Ação Necessária: Troca de Etiqueta', {
          description: n.message,
          duration: 15000,
        })
      } else {
        toast.info('Nova Mensagem da Secretaria', {
          description: n.message,
          duration: 10000,
        })
      }
      markNotificationAsRead(n.id)
    })
  }, [notifications, user, markNotificationAsRead])

  return null
}
