import { firebaseStorageAdapter } from './storage.firebase'
import type { StorageAdapter } from './storage'

export const storage: StorageAdapter = firebaseStorageAdapter
