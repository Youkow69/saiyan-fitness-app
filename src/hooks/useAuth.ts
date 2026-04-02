import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'


interface AuthState {
  user: any
  session: any
  loading: boolean
}

// ── French error translation map ─────────────────────────────────────────────

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect',
  'Email not confirmed': 'V\u00E9rifie ton email pour confirmer ton compte',
  'User already registered': 'Un compte existe d\u00E9j\u00E0 avec cet email',
  'Password should be at least 6 characters': 'Le mot de passe doit faire au moins 6 caract\u00E8res',
  'Unable to validate email address': 'Adresse email invalide',
  'Email rate limit exceeded': 'Trop de tentatives. R\u00E9essaie dans quelques minutes.',
  'Failed to fetch': 'Impossible de se connecter au serveur. V\u00E9rifie ta connexion internet.',
  'NetworkError': 'Pas de connexion internet',
  'TypeError: Failed to fetch': 'Serveur indisponible. Tu peux continuer en mode local.',
}

function translateError(error: any): string {
  const msg = error?.message || String(error)
  for (const [key, translation] of Object.entries(AUTH_ERRORS)) {
    if (msg.includes(key)) return translation
  }
  return 'Une erreur est survenue. R\u00E9essaie ou continue en mode local.'
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ user: null, session: null, loading: true })

  useEffect(() => {
    // Get initial session - wrapped in try/catch for network errors
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth({ user: session?.user ?? null, session, loading: false })
    }).catch(() => {
      // Network error - continue in local mode silently
      setAuth({ user: null, session: null, loading: false })
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
    if (error) throw new Error(translateError(error))
    return data
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(translateError(error))
    return data
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { ...auth, signUp, signIn, signOut }
}
