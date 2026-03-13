import { Fragment } from 'preact'
import { useState, useRef, useEffect } from 'preact/hooks'
import { useTheme } from '../hooks/useTheme'
import { getUserEmoji } from '../lib/savedUsers'

interface UserMenuChipProps {
  user: string
  onHome?: () => void
  onStats?: () => void
  onShop?: () => void
  onLogout: () => void
  variant: 'home' | 'shop' | 'stats' | 'superuser' | 'admin'
  onSuperuser?: () => void
}

const ALIGN_LEFT_THRESHOLD = 200

export function UserMenuChip({ user, onHome, onStats, onShop, onLogout, variant, onSuperuser }: UserMenuChipProps) {
  const [open, setOpen] = useState(false)
  const [alignLeft, setAlignLeft] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()

  const emoji = getUserEmoji(user)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [open])

  useEffect(() => {
    if (!open || !containerRef.current) return
    const raf = requestAnimationFrame(() => {
      const rect = containerRef.current!.getBoundingClientRect()
      setAlignLeft(rect.right < ALIGN_LEFT_THRESHOLD)
    })
    return () => cancelAnimationFrame(raf)
  }, [open])

  const closeAnd = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  type MenuItem = { icon: string; label: string; onClick: () => void; active?: boolean }
  const navItems: MenuItem[] = [
    ...(onHome ? [{ icon: '🏠', label: 'Hem', onClick: () => closeAnd(onHome), active: variant === 'home' }] : []),
    ...(onShop ? [{ icon: '🛍️', label: 'Affär', onClick: () => closeAnd(onShop), active: variant === 'shop' }] : []),
    ...(onStats ? [{ icon: '📊', label: 'Statistik', onClick: () => closeAnd(onStats), active: variant === 'stats' }] : []),
  ]
  const settingsItems: MenuItem[] = [
    ...(onSuperuser ? [{ icon: '👷', label: 'Admin', onClick: () => closeAnd(onSuperuser), active: variant === 'superuser' || variant === 'admin' }] : []),
    {
      icon: theme === 'light' ? '🌙' : '☀️',
      label: theme === 'light' ? 'Mörkt läge' : 'Ljust läge',
      onClick: () => closeAnd(toggleTheme),
    },
  ]
  const logoutItem: MenuItem = { icon: '🚪', label: 'Logga ut', onClick: () => closeAnd(onLogout) }
  const groups = [navItems, settingsItems, [logoutItem]].filter((g) => g.length > 0)

  return (
    <div class="user-menu-chip-wrapper" ref={containerRef}>
      <button
        type="button"
        class="user-menu-chip"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Öppna meny"
      >
        <span class="user-menu-chip-icon">{emoji}</span>
        <span class="user-menu-chip-name">{user}</span>
      </button>

      {open && (
        <div
          class={`user-menu-dropdown${alignLeft ? ' user-menu-dropdown--align-left' : ''}`}
          role="menu"
        >
          {groups.map((group, groupIdx) => (
            <Fragment key={groupIdx}>
              {groupIdx > 0 && <div class="user-menu-divider" role="separator" />}
              {group.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  class={`user-menu-item${item.active ? ' user-menu-item-active' : ''}`}
                  role="menuitem"
                  onClick={item.onClick}
                >
                  <span class="user-menu-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
