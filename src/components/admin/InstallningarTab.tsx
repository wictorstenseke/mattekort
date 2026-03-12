import { useState } from 'preact/hooks'

export function InstallningarTab({
  creditsEnabled,
  onToggleCredits,
}: {
  creditsEnabled: boolean
  onToggleCredits: (v: boolean) => Promise<void>
}) {
  const [toggling, setToggling] = useState(false)
  return (
    <div class="flex flex-col gap-4">
      <h2 class="text-lg font-bold text-(--text)">Inställningar</h2>
      <div class="bg-(--surface) rounded-2xl border border-(--border) px-4 py-4 flex items-center justify-between">
        <div>
          <p class="font-semibold text-(--text)">Poäng (credits)</p>
          <p class="text-sm text-(--text-muted)">Användare tjänar poäng när de spelar</p>
        </div>
        <button
          type="button"
          disabled={toggling}
          onClick={async () => {
            setToggling(true)
            await onToggleCredits(!creditsEnabled)
            setToggling(false)
          }}
          class="relative w-12 h-6 rounded-full transition-colors shrink-0"
          style={`background: ${creditsEnabled ? '#6BCB77' : 'var(--border)'}`}
          aria-label={creditsEnabled ? 'Stäng av poäng' : 'Aktivera poäng'}
        >
          <span
            class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
            style={`transform: translateX(${creditsEnabled ? 24 : 0}px)`}
          />
        </button>
      </div>
    </div>
  )
}
