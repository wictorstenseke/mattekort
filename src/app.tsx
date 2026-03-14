import { useState, useCallback, useEffect } from 'preact/hooks'
import { lazy, Suspense } from 'preact/compat'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import type { RoundResult } from './hooks/useGame'

function lazyWithReload<T>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload()
      return new Promise<{ default: T }>(() => {})
    })
  )
}

const GamePage = lazyWithReload(() => import('./pages/GamePage'))
const CompletePage = lazyWithReload(() => import('./pages/CompletePage'))
const StatsPage = lazyWithReload(() => import('./pages/StatsPage'))
const ShopPage = lazyWithReload(() => import('./pages/ShopPage'))
const AdminPage = lazyWithReload(() => import('./pages/AdminPage'))

type Screen = 'login' | 'home' | 'game' | 'complete' | 'stats' | 'shop' | 'admin' | 'superuser'

function ScreenFallback() {
  return (
    <div class="screen active auth-loading">
      <div class="font-[Nunito] text-[1.1rem] text-(--text-muted)">Laddar...</div>
    </div>
  )
}

export function App() {
  const { currentUser, authReady, role, login, logout } = useAuth()
  const [screen, setScreen] = useState<Screen>('login')
  const [selectedTable, setSelectedTable] = useState(1)  // stores categoryId

  useEffect(() => {
    if (authReady && currentUser && screen === 'login') {
      if (role === 'admin') setScreen('admin')
      else setScreen('home')
    }
  }, [authReady, currentUser, role, screen])

  const effectiveScreen: Screen = (() => {
    if (!authReady || !currentUser || screen !== 'login') return screen
    if (role === 'admin') return 'admin'
    return 'home'
  })()

  const [gameKey, setGameKey] = useState(0)
  const [completeResult, setCompleteResult] = useState<RoundResult | null>(null)

  const handleLogin = useCallback(() => {
    // role-aware redirect handled by useEffect
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    setScreen('login')
  }, [logout])

  const handleSelectTable = useCallback((table: number) => {
    setSelectedTable(table)
    setGameKey(k => k + 1)
    setScreen('game')
  }, [])

  const handleGameComplete = useCallback((result: RoundResult) => {
    setCompleteResult(result)
    setScreen('complete')
  }, [])

  const goHome = useCallback(() => {
    setScreen('home')
  }, [])

  const handleContinue = useCallback(() => {
    setGameKey(k => k + 1)
    setScreen('game')
  }, [])

  const handleStats = useCallback(() => {
    setScreen('stats')
  }, [])

  const handleShop = useCallback(() => {
    setScreen('shop')
  }, [])

  const handleSuperuser = useCallback(() => {
    setScreen('superuser')
  }, [])

  const handleAdmin = useCallback(() => {
    setScreen('admin')
  }, [])

  if (!authReady) {
    return <ScreenFallback />
  }

  switch (effectiveScreen) {
    case 'login':
      return <LoginPage login={login} onLogin={handleLogin} />
    case 'home':
      return (
        <HomePage
          user={currentUser!}
          onSelectTable={handleSelectTable}
          onLogout={handleLogout}
          onStats={handleStats}
          onShop={handleShop}
          role={role ?? undefined}
          onSuperuser={role === 'superuser' ? handleSuperuser : role === 'admin' ? handleAdmin : undefined}
        />
      )
    case 'game':
      return (
        <Suspense fallback={<ScreenFallback />}>
          <GamePage
            key={gameKey}
            categoryId={selectedTable}
            user={currentUser!}
            onBack={goHome}
            onComplete={handleGameComplete}
          />
        </Suspense>
      )
    case 'complete':
      return completeResult ? (
        <Suspense fallback={<ScreenFallback />}>
          <CompletePage
            result={completeResult}
            user={currentUser!}
            onContinue={handleContinue}
            onBack={goHome}
          />
        </Suspense>
      ) : null
    case 'stats':
      return (
        <Suspense fallback={<ScreenFallback />}>
          <StatsPage
            user={currentUser!}
            onBack={goHome}
            onStats={handleStats}
            onShop={handleShop}
            onLogout={handleLogout}
            onSuperuser={role === 'superuser' ? handleSuperuser : role === 'admin' ? handleAdmin : undefined}
          />
        </Suspense>
      )
    case 'shop':
      return (
        <Suspense fallback={<ScreenFallback />}>
          <ShopPage
            user={currentUser!}
            onBack={goHome}
            onStats={handleStats}
            onLogout={handleLogout}
            onSuperuser={role === 'superuser' ? handleSuperuser : role === 'admin' ? handleAdmin : undefined}
          />
        </Suspense>
      )
    case 'admin':
      return (
        <Suspense fallback={<ScreenFallback />}>
          <AdminPage
            role="admin"
            user={currentUser!}
            onBack={goHome}
            onStats={handleStats}
            onShop={handleShop}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    case 'superuser':
      return (
        <Suspense fallback={<ScreenFallback />}>
          <AdminPage
            role="superuser"
            user={currentUser!}
            onBack={goHome}
            onStats={handleStats}
            onShop={handleShop}
            onLogout={handleLogout}
          />
        </Suspense>
      )
    default:
      return null
  }
}
