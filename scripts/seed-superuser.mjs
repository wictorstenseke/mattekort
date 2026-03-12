import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const eqIdx = line.indexOf('=')
  if (eqIdx > 0) {
    const key = line.slice(0, eqIdx).trim()
    const val = line.slice(eqIdx + 1).trim()
    if (key.startsWith('VITE_')) process.env[key] = val
  }
}

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
})

const auth = getAuth(app)
const db = getFirestore(app)

const uid = 'jyIi04e9LqMF9xMet0HCHX46dsF2'
const username = 'wictor'
const pin = '4224'

console.log('Signing in as', username)
await signInWithEmailAndPassword(auth, `${username}@matte.kort`, pin + pin)
console.log('Signed in, writing profile...')

await setDoc(doc(db, 'profiles', uid), {
  uid,
  username,
  role: 'superuser',
  spaceId: '',
  pin,
  createdAt: new Date(),
  createdBy: 'self',
})

await setDoc(doc(db, 'usernames', username), { uid })

console.log('Done! Superuser profile created.')
process.exit(0)
