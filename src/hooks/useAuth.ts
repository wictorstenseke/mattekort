import { useState, useCallback, useEffect } from 'preact/hooks'
import { getFirebaseAuth } from '../lib/firebase'
import { storage } from '../lib/storageContext'
import { adminStorage } from '../lib/storageContext'
import { emailToUsername } from '../lib/constants'
import { saveUser } from '../lib/savedUsers'
import type { UserRole } from '../lib/storage'

interface AuthState {
  currentUser: string | null
  authReady: boolean
  role: UserRole | null
  spaceId: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ currentUser: null, authReady: false, role: null, spaceId: null })

  useEffect(() => {
    let unsub: (() => void) | null = null
    let cancelled = false

    async function init() {
      const auth = await getFirebaseAuth()
      const { onAuthStateChanged } = await import('firebase/auth')
      if (cancelled) return
      unsub = onAuthStateChanged(auth, async (user) => {
        const username = user ? emailToUsername(user.email) : null
        if (user && username) {
          try {
            const profile = await adminStorage.getMyProfile()
            setState({ currentUser: username, authReady: true, role: profile?.role ?? 'user', spaceId: profile?.spaceId ?? null })
          } catch {
            setState({ currentUser: username, authReady: true, role: 'user', spaceId: null })
          }
        } else {
          setState({ currentUser: null, authReady: true, role: null, spaceId: null })
        }
      })
    }

    void init()
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [])

  const login = useCallback(async (username: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed) {
      return { success: false, error: 'Skriv ett användarnamn!' }
    }
    if (/\s/.test(trimmed)) {
      return { success: false, error: 'Användarnamnet får inte innehålla mellanslag' }
    }
    if (!/^\d{4}$/.test(pin)) {
      return { success: false, error: 'Koden måste vara 4 siffror!' }
    }

    try {
      await storage.createUser(trimmed, pin)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        const valid = await storage.validatePin(trimmed, pin)
        if (!valid) return { success: false, error: 'Användarnamnet är upptaget. Skriv din kod om det är ditt konto, annars välj ett annat namn.' }
      } else if (code === 'auth/network-request-failed') {
        return { success: false, error: 'Ingen nätverksanslutning. Försök igen!' }
      } else if (code === 'auth/too-many-requests') {
        return { success: false, error: 'För många försök. Vänta lite!' }
      } else {
        return { success: false, error: 'Något gick fel. Försök igen!' }
      }
    }

    saveUser(trimmed, pin)
    return { success: true }
  }, [])

  const logout = useCallback(async () => {
    const auth = await getFirebaseAuth()
    const { signOut } = await import('firebase/auth')
    await signOut(auth)
    setState({ currentUser: null, authReady: true, role: null, spaceId: null })
  }, [])

  return {
    currentUser: state.currentUser,
    authReady: state.authReady,
    role: state.role,
    spaceId: state.spaceId,
    login,
    logout,
  }
}
