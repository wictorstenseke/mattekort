import { useState, useCallback, useEffect } from 'preact/hooks'

interface NumericKeypadProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  user: string
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['⌫', '0', '✓'],
]

function getHandednessKey(user: string): string {
  return `mattekort_hand_${user}`
}

export function NumericKeypad({ value, onChange, onSubmit, disabled, user }: NumericKeypadProps) {
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [rightHanded, setRightHanded] = useState(true)

  // Load persisted handedness preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getHandednessKey(user))
      if (saved !== null) {
        setRightHanded(saved === 'right')
      }
    } catch {
      // ignore storage errors
    }
  }, [user])

  const toggleHand = useCallback(() => {
    setRightHanded(prev => {
      const next = !prev
      try {
        localStorage.setItem(getHandednessKey(user), next ? 'right' : 'left')
      } catch {
        // ignore storage errors
      }
      return next
    })
  }, [user])

  const handleKey = useCallback((key: string) => {
    if (disabled) return

    setPressedKey(key)
    setTimeout(() => setPressedKey(null), 150)

    if (key === '⌫') {
      onChange(value.slice(0, -1))
    } else if (key === '✓') {
      onSubmit()
    } else {
      // Limit to 3 digits
      if (value.length < 3) {
        onChange(value + key)
      }
    }
  }, [value, onChange, onSubmit, disabled])

  return (
    <div class={`keypad-wrapper${rightHanded ? ' right-handed' : ' left-handed'}`}>
      <button
        type="button"
        class="hand-toggle"
        onClick={toggleHand}
        aria-label={rightHanded ? 'Flytta till vänster' : 'Flytta till höger'}
      >
        {rightHanded ? '👈' : '👉'}
      </button>
      <div class="keypad-grid">
        {KEYS.map((row, ri) =>
          row.map((key) => {
            const isAction = key === '⌫' || key === '✓'
            return (
              <button
                key={`${ri}-${key}`}
                type="button"
                class={`keypad-key${pressedKey === key ? ' pressed' : ''}${key === '✓' ? ' key-submit' : ''}${key === '⌫' ? ' key-delete' : ''}${isAction ? '' : ' key-digit'}`}
                onClick={() => handleKey(key)}
                disabled={disabled && key !== '⌫'}
              >
                {key}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
