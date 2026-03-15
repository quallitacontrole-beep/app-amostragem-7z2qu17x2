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

    // Tag change notifications are persistent and handled in the Dashboard UI directly.
    const unreadInfo = notifications.filter(
      (n) =>
        !n.read &&
        n.type !== 'tag_change' &&
        (n.userId === user.name || n.userId === userNameFormatted),
    )

    unreadInfo.forEach((n) => {
      toast.info('Nova Mensagem da Secretaria', {
        description: n.message,
        duration: 10000,
      })
      markNotificationAsRead(n.id)
    })
  }, [notifications, user, markNotificationAsRead])

  return null
}
