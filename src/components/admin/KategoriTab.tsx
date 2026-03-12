import { useState } from 'preact/hooks'
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

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const allIds = ALL_CATEGORIES.map(c => c.id)
    const isAll = allIds.every(id => selected.has(id))
    await onSave(isAll ? null : Array.from(selected))
    setSaving(false)
  }

  return (
    <div class="flex flex-col gap-6">
      <div>
        <h2 class="text-lg font-bold text-(--text)">Aktiva kategorier</h2>
        <p class="text-sm text-(--text-muted) mt-1">
          Välj vilka kategorier som ska vara tillgängliga för användarna. Endast valda kategorier visas på startsidan.
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
                    ? `border-color: ${cat.color}; background: ${cat.color}22;`
                    : 'border-color: var(--border); background: var(--surface);'
                  }
                >
                  <span class="text-xl">{cat.emoji}</span>
                  <span class="text-sm font-medium text-(--text) leading-tight">{cat.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        class="btn-primary py-3 rounded-2xl"
      >
        {saving ? 'Sparar...' : 'Spara'}
      </button>
    </div>
  )
}
