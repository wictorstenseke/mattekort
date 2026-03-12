export interface TableData {
  wins: number
  clear: number[]
  retry: number[]
  cardEquations?: Record<number, { a: number; b: number }>
}

export interface CompletionEntry {
  table: number      // category ID
  timestamp: number  // Date.now() in ms
}

export interface UserData {
  tables: Record<number, TableData>
  completionLog?: CompletionEntry[]
  credits?: number
  peekSavers?: number
  /** Maps item key (video ID or "peekSaver") to number of times purchased. */
  purchaseCounts?: Record<string, number>
  activeCategories?: number[] | null
  creditsEnabled?: boolean
  spaceVideos?: Record<string, string[]>
}

export type UserRole = 'superuser' | 'admin' | 'user'

export interface UserProfile {
  uid: string
  username: string
  role: UserRole
  spaceId: string | null
  pin: string
  createdAt: number
  createdBy: string
}

export interface SpaceConfig {
  adminUid: string
  adminUsername: string
  activeCategories: number[] | null
  creditsEnabled: boolean
  videos: Record<string, string[]>
}

export interface SpaceUser {
  uid: string
  username: string
  profile: UserProfile
  gameData: UserData | null
}

export interface AdminStorageAdapter {
  getMyProfile(): Promise<UserProfile | null>
  listSpaceUsers(): Promise<SpaceUser[]>
  createSpaceUser(username: string, pin: string): Promise<void>
  getSpaceConfig(): Promise<SpaceConfig | null>
  updateSpaceConfig(config: Partial<SpaceConfig>): Promise<void>
  propagateSpaceConfig(fields: Pick<UserData, 'activeCategories' | 'creditsEnabled' | 'spaceVideos'>): Promise<void>
  listAdmins(): Promise<UserProfile[]>
  createAdmin(username: string, pin: string): Promise<void>
}

export interface StorageAdapter {
  getUser(username: string): Promise<UserData | null>
  saveTableData(username: string, table: number, data: TableData): Promise<void>
  createUser(username: string, pin: string): Promise<void>
  validatePin(username: string, pin: string): Promise<boolean>
  logCompletion(username: string, table: number): Promise<void>
  /** Save table reset + log completion in a single write (used on allClear). */
  saveCompletedRound(username: string, table: number, data: TableData): Promise<void>
  /** Increment credits by amount. */
  addCredits(username: string, amount: number): Promise<void>
  /** Increment peekSavers by amount. */
  addPeekSavers(username: string, amount: number): Promise<void>
  /** Consume one peek saver. Returns false if balance was already 0. */
  consumePeekSaver(username: string): Promise<boolean>
  /**
   * Atomically spend `cost` credits and record a purchase of `itemId`.
   * Returns false if balance was insufficient.
   */
  spendCreditsAndTrackPurchase(username: string, cost: number, itemId: string): Promise<boolean>
}
