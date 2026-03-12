import { useState } from 'preact/hooks'
import { ALL_CATEGORIES } from '../../lib/constants'

export function VideoTab({
  videos,
  onAdd,
  onRemove,
}: {
  videos: Record<string, string[]>
  onAdd: (catId: string, url: string) => Promise<void>
  onRemove: (catId: string, url: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>({})

  return (
    <div class="flex flex-col gap-2">
      <h2 class="text-lg font-bold text-(--text)">Videos per kategori</h2>
      {ALL_CATEGORIES.map(cat => {
        const catId = String(cat.id)
        const catVideos = videos[catId] ?? []
        const isOpen = expanded === catId
        return (
          <div key={catId} class="bg-(--surface) rounded-2xl border border-(--border) overflow-hidden">
            <button
              type="button"
              class="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setExpanded(isOpen ? null : catId)}
            >
              <span class="flex items-center gap-2">
                <span>{cat.emoji}</span>
                <span class="font-medium text-(--text)">{cat.label}</span>
                {catVideos.length > 0 && (
                  <span class="text-xs bg-(--border) px-2 py-0.5 rounded-full text-(--text-muted)">
                    {catVideos.length}
                  </span>
                )}
              </span>
              <span class="text-(--text-muted)">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div class="px-4 pb-4 flex flex-col gap-2 border-t border-(--border)">
                {catVideos.map(url => (
                  <div key={url} class="flex items-center gap-2 pt-2">
                    <span class="flex-1 text-xs text-(--text) break-all truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => onRemove(catId, url)}
                      class="text-red-400 text-sm px-2 py-1 rounded border border-red-300 shrink-0"
                    >
                      Ta bort
                    </button>
                  </div>
                ))}
                <div class="flex gap-2 pt-2">
                  <input
                    type="url"
                    placeholder="YouTube-URL"
                    value={inputs[catId] ?? ''}
                    onInput={e => setInputs(prev => ({ ...prev, [catId]: (e.target as HTMLInputElement).value }))}
                    class="flex-1 border border-(--border) rounded-xl px-3 py-2 bg-(--bg) text-(--text) text-sm"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const url = (inputs[catId] ?? '').trim()
                      if (!url) return
                      await onAdd(catId, url)
                      setInputs(prev => ({ ...prev, [catId]: '' }))
                    }}
                    class="btn-primary text-sm px-3 py-2 shrink-0"
                  >
                    Lägg till
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
