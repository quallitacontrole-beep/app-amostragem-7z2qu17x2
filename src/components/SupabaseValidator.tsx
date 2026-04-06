import { useEffect } from 'react'
import { validateSupabaseConnection } from '@/lib/supabase-validator'

export function SupabaseValidator() {
  useEffect(() => {
    validateSupabaseConnection()
  }, [])

  return null
}
