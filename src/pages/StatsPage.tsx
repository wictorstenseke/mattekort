import { useState, useEffect } from 'preact/hooks'
import { COLORS, EMOJIS } from '../lib/constants'
import { storage } from '../lib/storageContext'
import type { UserData } from '../lib/storage'

interface StatsPageProps {
  user: string
  onBack: () => void
}

interface Stats {
  mostPlayedTable: number | null
  hardestNumber: { table: number; n: number } | null
  easiestNumber: { table: number; n: number } | null
  totalWins: number
  totalClears: number
  totalRetries: number
}

function computeStats(userData: UserData): Stats {
  const tables = userData.tables
  let mostPlayedTable: number | null = null
  let mostPlayedCount = 0
  let totalWins = 0
  let totalClears = 0
  let totalRetries = 0

  // Track per-table plays (wins = completed rounds, so we use wins + current progress as proxy)
  // Most played = table with most total wins
  const retryCountMap: Record<string, number> = {} // "table-n" -> count of retries
  const clearCountMap: Record<string, number> = {} // "table-n" -> count of clears

  for (const [tableStr, td] of Object.entries(tables)) {
    const t = parseInt(tableStr)
    const plays = td.wins + (td.clear.length > 0 || td.retry.length > 0 ? 1 : 0)
    totalWins += td.wins
    totalClears += td.clear.length
    totalRetries += td.retry.length

    if (plays > mostPlayedCount) {
      mostPlayedCount = plays
      mostPlayedTable = t
    }

    for (const n of td.retry) {
      const key = `${t}-${n}`
      retryCountMap[key] = (retryCountMap[key] || 0) + 1
    }
    for (const n of td.clear) {
      const key = `${t}-${n}`
      clearCountMap[key] = (clearCountMap[key] || 0) + 1
    }
  }

  // Hardest number = in retry pile most
  let hardestNumber: { table: number; n: number } | null = null
  let maxRetries = 0
  for (const [key, count] of Object.entries(retryCountMap)) {
    if (count > maxRetries) {
      maxRetries = count
      const [t, n] = key.split('-').map(Number)
      hardestNumber = { table: t, n }
    }
  }

  // Easiest number = in clear pile most (across most tables)
  let easiestNumber: { table: number; n: number } | null = null
  let maxClears = 0
  for (const [key, count] of Object.entries(clearCountMap)) {
    if (count > maxClears) {
      maxClears = count
      const [t, n] = key.split('-').map(Number)
      easiestNumber = { table: t, n }
    }
  }

  return { mostPlayedTable, hardestNumber, easiestNumber, totalWins, totalClears, totalRetries }
}

export function StatsPage({ user, onBack }: StatsPageProps) {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const load = async () => {
      const userData = await storage.getUser(user)
      if (userData) {
        setStats(computeStats(userData))
      } else {
        setStats({ mostPlayedTable: null, hardestNumber: null, easiestNumber: null, totalWins: 0, totalClears: 0, totalRetries: 0 })
      }
    }
    void load()
  }, [user])

  if (!stats) {
    return <div class="screen active stats-screen" />
  }

  const hasData = stats.totalWins > 0 || stats.totalClears > 0 || stats.totalRetries > 0

  return (
    <div class="screen active stats-screen">
      <div class="stats-box">
        <button class="btn-back stats-back" onClick={onBack}>← </button>
        <span class="stats-emoji">📊</span>
        <h2>Statistik</h2>

        {!hasData ? (
          <p class="stats-empty">Ingen data ännu! Spela lite först 🎮</p>
        ) : (
          <>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-value">{stats.totalWins}</div>
                <div class="stat-desc">Totala vinster</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-value">{stats.totalClears}</div>
                <div class="stat-desc">Klara kort</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">🔄</div>
                <div class="stat-value">{stats.totalRetries}</div>
                <div class="stat-desc">Öva igen</div>
              </div>
            </div>

            <div class="stats-highlights">
              {stats.mostPlayedTable !== null && (
                <div class="highlight-row">
                  <span class="highlight-icon" style={`color:${COLORS[stats.mostPlayedTable - 1]}`}>
                    {EMOJIS[stats.mostPlayedTable - 1]}
                  </span>
                  <div>
                    <div class="highlight-title">Mest spelade tabell</div>
                    <div class="highlight-value">{stats.mostPlayedTable}:ans gångertabell</div>
                  </div>
                </div>
              )}

              {stats.hardestNumber !== null && (
                <div class="highlight-row">
                  <span class="highlight-icon">🔥</span>
                  <div>
                    <div class="highlight-title">Svårast tal</div>
                    <div class="highlight-value">
                      {stats.hardestNumber.table} × {stats.hardestNumber.n} = {stats.hardestNumber.table * stats.hardestNumber.n}
                    </div>
                  </div>
                </div>
              )}

              {stats.easiestNumber !== null && (
                <div class="highlight-row">
                  <span class="highlight-icon">⚡</span>
                  <div>
                    <div class="highlight-title">Lättaste tal</div>
                    <div class="highlight-value">
                      {stats.easiestNumber.table} × {stats.easiestNumber.n} = {stats.easiestNumber.table * stats.easiestNumber.n}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <button class="btn-secondary" onClick={onBack}>← Tillbaka</button>
      </div>
    </div>
  )
}
