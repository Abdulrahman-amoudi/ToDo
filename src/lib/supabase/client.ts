import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client
  client = createBrowserClient(
    'https://gbdwswfrscjccaaeciiu.supabase.co',
    'sb_publishable_WCo_qddtShwOHZQGhsPwdg_nwgydoqr',
    {
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 400, // 400 days persistence
        path: '/',
        sameSite: 'lax',
      },
      isSingleton: true,
    }
  )
  return client
}
