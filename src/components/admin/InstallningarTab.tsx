import { useState } from 'preact/hooks'

export function InstallningarTab({
  creditsEnabled,
  onToggleCredits,
}: {
  creditsEnabled: boolean
  onToggleCredits: (v: boolean) => Promise<void>
}) {
  const [pendingValue, setPendingValue] = useState<boolean | null>(null)
  const displayValue = pendingValue ?? creditsEnabled
  const isToggling = pendingValue !== null

  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-lg font-bold text-(--text)">Inställningar</h2>
      <div class="bg-(--surface) rounded-2xl border border-(--border) px-4 py-4 flex items-center justify-between">
        <div>
          <p class="font-semibold text-(--text)">Poäng & belöningar</p>
          <p class="text-sm text-(--text-muted)">Visa eller dölj affär och belöningar för tillagda användare.</p>
        </div>
        <button
          type="button"
          disabled={isToggling}
          onClick={async () => {
            const next = !creditsEnabled
            setPendingValue(next)
            try {
              await onToggleCredits(next)
            } catch {
              // Revert on failure
            } finally {
              setPendingValue(null)
            }
          }}
          class="relative p-2 shrink-0 cursor-pointer"
          aria-label={displayValue ? 'Stäng av poäng' : 'Aktivera poäng'}
          onMouseEnter={(e) => {
            if (!isToggling) {
              const div = (e.currentTarget as HTMLElement).querySelector('div')
              if (div) {
                div.style.background = displayValue ? '#5cb36b' : '#b8b8b8'
              }
            }
          }}
          onMouseLeave={(e) => {
            const div = (e.currentTarget as HTMLElement).querySelector('div')
            if (div) {
              div.style.background = displayValue ? '#6BCB77' : '#d0d0d0'
            }
          }}
        >
          <div
            class="relative w-12 h-6 rounded-full transition-all duration-200"
            style={`background: ${displayValue ? '#6BCB77' : '#d0d0d0'}`}
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              style={`transform: translateX(${displayValue ? 24 : 0}px)`}
            />
          </div>
        </button>
      </div>
    </div>
  )
}
