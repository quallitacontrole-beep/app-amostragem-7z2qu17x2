import { useEffect } from 'react'
import { useAppStore } from '@/stores/main'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'sonner'

export function NotificationWatcher() {
  const { notifications, markNotificationAsRead } = useAppStore()
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return
    const unread = notifications.filter((n) => !n.read && n.userId === user.name)

    unread.forEach((n) => {
      toast.info('Nova Mensagem da Secretaria', {
        description: n.message,
        duration: 10000,
      })
      markNotificationAsRead(n.id)
    })
  }, [notifications, user, markNotificationAsRead])

  return null
}
