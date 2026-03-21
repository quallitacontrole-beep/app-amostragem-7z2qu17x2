export const isMockSupabase = false

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const getErrorMsg = async (res: Response) => {
  try {
    const text = await res.text()
    try {
      const json = JSON.parse(text)
      return json.message || json.error || json.details || text
    } catch {
      return text
    }
  } catch {
    return `HTTP Error ${res.status}`
  }
}

const checkCredentials = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase credentials missing')
  }
}

export const supabase = {
  from: (table: string) => ({
    select: async (query: string = '*') => {
      checkCredentials()
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${query}`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      })
      if (!res.ok) throw new Error(await getErrorMsg(res))
      return { data: await res.json(), error: null }
    },
    insert: async (data: any) => {
      checkCredentials()
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
      if (!res.ok) throw new Error(await getErrorMsg(res))
      return { data: await res.json(), error: null }
    },
    update: (data: any) => {
      return {
        eq: async (column: string, value: string) => {
          checkCredentials()
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
          if (!res.ok) throw new Error(await getErrorMsg(res))
          return { data: await res.json(), error: null }
        },
      }
    },
    delete: () => {
      return {
        eq: async (column: string, value: string) => {
          checkCredentials()
          const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
            method: 'DELETE',
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          })
          if (!res.ok) throw new Error(await getErrorMsg(res))
          return { data: null, error: null }
        },
      }
    },
  }),
}
