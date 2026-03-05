import { useState, useCallback } from 'preact/hooks'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { storage } from '../lib/storageContext'

interface AuthState {
  currentUser: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ currentUser: null })

  const login = useCallback(async (username: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = username.trim().toLowerCase()
    if (!trimmed) {
      return { success: false, error: 'Skriv ett användarnamn!' }
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
        if (!valid) return { success: false, error: 'Fel kod! Försök igen 🔒' }
      } else if (code === 'auth/network-request-failed') {
        return { success: false, error: 'Ingen nätverksanslutning. Försök igen!' }
      } else if (code === 'auth/too-many-requests') {
        return { success: false, error: 'För många försök. Vänta lite!' }
      } else {
        return { success: false, error: 'Något gick fel. Försök igen!' }
      }
    }

    setState({ currentUser: trimmed })
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    void signOut(auth)
    setState({ currentUser: null })
  }, [])

  return {
    currentUser: state.currentUser,
    login,
    logout,
  }
}
