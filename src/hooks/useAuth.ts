import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'


interface AuthState {
  user: any
  session: any
  loading: boolean
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ user: null, session: null, loading: true })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth({ user: session?.user ?? null, session, loading: false })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth({ user: session?.user ?? null, session, loading: false })
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } }
    })
    if (error) throw error
    return data
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { ...auth, signUp, signIn, signOut }
}
