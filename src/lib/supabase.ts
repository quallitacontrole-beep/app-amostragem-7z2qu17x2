export const isMockSupabase = true

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = {
  from: (table: string) => ({
    select: async (query: string = '*') => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${query}`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      })
      if (!res.ok) throw new Error(await res.text())
      return { data: await res.json(), error: null }
    },
    insert: async (data: any) => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(await res.text())
      return { data: await res.json(), error: null }
    },
    update: (data: any) => {
      return {
        eq: async (column: string, value: string) => {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify(data),
          })
          if (!res.ok) throw new Error(await res.text())
          return { data: await res.json(), error: null }
        },
      }
    },
    delete: () => {
      return {
        eq: async (column: string, value: string) => {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'DELETE',
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          })
          if (!res.ok) throw new Error(await res.text())
          return { data: null, error: null }
        },
      }
    },
  }),
}
