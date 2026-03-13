import { useState } from 'preact/hooks'

export function PinCell({ pin }: { pin: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setRevealed(r => !r)}
      class="text-sm px-2 py-1 rounded bg-(--surface) border border-(--border) min-w-[60px] text-left"
      style="touch-action: manipulation;"
    >
      {revealed ? pin : '••••'}
    </button>
  )
}
