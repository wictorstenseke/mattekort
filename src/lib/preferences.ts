/**
 * Simple UI preferences storage.
 * Uses localStorage directly as these are device-level UI settings,
 * not user game data. When Firebase is added, these could optionally
 * be synced via Firestore user preferences.
 */

const PREFIX = 'mattekort_pref_'

export function getPreference(user: string, key: string): string | null {
  try {
    return localStorage.getItem(`${PREFIX}${user}_${key}`)
  } catch {
    return null
  }
}

export function setPreference(user: string, key: string, value: string): void {
  try {
    localStorage.setItem(`${PREFIX}${user}_${key}`, value)
  } catch {
    // ignore storage errors
  }
}
