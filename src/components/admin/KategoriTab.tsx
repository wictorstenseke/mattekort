import { useState, useEffect, useCallback, useRef } from 'preact/hooks'
import { useToast } from '../../contexts/ToastContext'
import {
  ALL_CATEGORIES,
  MULTIPLY_CATEGORIES,
  PLUS_CATEGORIES,
  MINUS_CATEGORIES,
  DIVIDE_CATEGORIES,
} from '../../lib/constants'
import type { CategoryDef } from '../../lib/constants'

const SECTIONS: { title: string; categories: CategoryDef[] }[] = [
  { title: 'Multiplikation', categories: MULTIPLY_CATEGORIES },
  { title: 'Addition', categories: PLUS_CATEGORIES },
  { title: 'Subtraktion', categories: MINUS_CATEGORIES },
  { title: 'Division', categories: DIVIDE_CATEGORIES },
]

const SAVE_DEBOUNCE_MS = 2000

export function KategoriTab({
  activeCategories,
  onSave,
}: {
  activeCategories: number[] | null
  onSave: (ids: number[] | null) => Promise<void>
}) {
  const [selected, setSelected] = useState<Set<number>>(
    activeCategories === null ? new Set(ALL_CATEGORIES.map(c => c.id)) : new Set(activeCategories)
  )
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const performSave = useCallback(async (ids: Set<number>) => {
    setSaving(true)
    try {
      const allIds = ALL_CATEGORIES.map(c => c.id)
      const isAll = allIds.every(id => ids.has(id))
      await onSave(isAll ? null : Array.from(ids))
      addToast('Sparat')
    } finally {
      setSaving(false)
    }
  }, [onSave, addToast])

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      performSave(selected)
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [selected, performSave])

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleSaveNow = async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    await performSave(selected)
  }

  return (
    <div class="flex flex-col gap-6">
      <div>
        <h2 class="text-lg font-bold text-(--text)">Aktiva kategorier</h2>
        <p class="text-sm text-(--text-muted) mt-1">
          Välj vilka kategorier som ska vara tillgängliga för användarna. Endast valda kategorier visas på startsidan. Ändringar sparas automatiskt efter 2 sekunder.
        </p>
      </div>
      {SECTIONS.map(({ title, categories }) => (
        <div key={title} class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold text-(--text-muted) uppercase tracking-wider">{title}</h3>
          <div class="grid grid-cols-2 gap-2">
            {categories.map(cat => {
              const on = selected.has(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggle(cat.id)}
                  class="flex items-center gap-2 px-3 py-3 rounded-2xl border-2 text-left transition-all cursor-pointer hover:scale-[1.02]"
                  style={on
                    ? `border-color: ${cat.color}; background: color-mix(in srgb, ${cat.color} 20%, var(--surface));`
                    : 'border-color: var(--border); background: var(--surface);'
                  }
                >
                  <span
                    class="shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold"
                    style={on ? `border-color: ${cat.color}; color: white; background: ${cat.color}` : 'border-color: var(--border); background: var(--surface)'}
                    aria-hidden
                  >
                    {on ? '✓' : ''}
                  </span>
                  <span class="text-xl">{cat.emoji}</span>
                  <span class="text-sm font-medium text-(--text) leading-tight">{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <div class="sticky bottom-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSaveNow}
          disabled={saving}
          class="btn-primary py-3 rounded-2xl w-full"
        >
          {saving ? 'Sparar...' : 'Spara nu'}
        </button>
      </div>
    </div>
  )
}
