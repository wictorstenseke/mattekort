export const COLORS = ['#FF6B6B', '#FF9A3C', '#FFD93D', '#6BCB77', '#00C9A7', '#4D96FF', '#C77DFF', '#FF6FD8', '#F72585', '#4CC9F0']
export const COLORS2 = ['#FF9A3C', '#FFD93D', '#6BCB77', '#00C9A7', '#4D96FF', '#C77DFF', '#FF6FD8', '#F72585', '#4CC9F0', '#FF6B6B']
export const EMOJIS = ['🦊', '🐸', '🦄', '🐳', '🦋', '🚀', '⭐', '🌈', '🍕', '🎮']

/** Fake email domain used for Firebase Auth (username@matte.kort). */
export const FAKE_EMAIL_DOMAIN = 'matte.kort'

/** Build a fake email from a username for Firebase Auth. */
export function fakeEmail(username: string): string {
  return `${username}@${FAKE_EMAIL_DOMAIN}`
}

/** Extract username from fake email (username@matte.kort). */
export function emailToUsername(email: string | null | undefined): string | null {
  if (!email?.endsWith(`@${FAKE_EMAIL_DOMAIN}`)) return null
  return email.slice(0, -(FAKE_EMAIL_DOMAIN.length + 1))
}
