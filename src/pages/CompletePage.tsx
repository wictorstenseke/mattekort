import { useEffect, useRef } from 'preact/hooks'
import type { RoundResult } from '../hooks/useGame'

interface CompletePageProps {
  result: RoundResult
  onContinue: () => void
  onBack: () => void
}

const CONFETTI_EMOJIS = ['🎉', '⭐', '🌟', '✨', '🎊', '💫', '🏅', '🥳']
const CONFETTI_COUNT = 30

function spawnConfetti(container: HTMLElement) {
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.textContent = CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)]
    el.style.left = `${Math.random() * 100}%`
    el.style.animationDelay = `${Math.random() * 1.5}s`
    el.style.animationDuration = `${2 + Math.random() * 2}s`
    el.style.fontSize = `${1 + Math.random() * 1.5}rem`
    container.appendChild(el)
    setTimeout(() => el.remove(), 4500)
  }
}

function getReaction(allClear: boolean, clearCount: number, retryCount: number): { emoji: string; heading: string; message: string } {
  if (allClear) {
    const perfects = [
      { emoji: '🏆', heading: 'Alla klara!', message: 'Fantastiskt! Du är en matte-mästare!' },
      { emoji: '🌟', heading: 'Perfekt!', message: 'Wow, du slog alla kort! Strålande!' },
      { emoji: '🥇', heading: 'Guldmedalj!', message: 'Alla rätt – vilken prestation!' },
      { emoji: '🎯', heading: 'Pricksäkert!', message: 'Inte ett enda fel – imponerande!' },
    ]
    return perfects[Math.floor(Math.random() * perfects.length)]
  }

  if (retryCount === 0) {
    return { emoji: '🎉', heading: 'Snyggt jobbat!', message: 'Alla rätt den här rundan! Fortsätt så!' }
  }

  const ratio = clearCount / (clearCount + retryCount)
  if (ratio >= 0.7) {
    const good = [
      { emoji: '💪', heading: 'Bra jobbat!', message: 'Nästan alla rätt – du är på god väg!' },
      { emoji: '🚀', heading: 'Bra fart!', message: 'Du lär dig snabbt, fortsätt öva!' },
    ]
    return good[Math.floor(Math.random() * good.length)]
  }

  const encourage = [
    { emoji: '📚', heading: 'Fortsätt öva!', message: 'Varje övning gör dig bättre!' },
    { emoji: '🌱', heading: 'Du växer!', message: 'Övning ger färdighet – snart kan du alla!' },
    { emoji: '💡', heading: 'Bra försök!', message: 'Lite till så sitter det! Du klarar det!' },
  ]
  return encourage[Math.floor(Math.random() * encourage.length)]
}

export function CompletePage({ result, onContinue, onBack }: CompletePageProps) {
  const { clearCount, retryCount, allClear, table, wins } = result
  const confettiRef = useRef<HTMLDivElement>(null)
  const reaction = getReaction(allClear, clearCount, retryCount)

  useEffect(() => {
    if (confettiRef.current && (allClear || retryCount === 0)) {
      spawnConfetti(confettiRef.current)
    }
  }, [allClear, retryCount])

  return (
    <div class="screen active complete-screen">
      <div class="confetti-container" ref={confettiRef} />
      <div class="complete-box">
        <span class="complete-emoji">{reaction.emoji}</span>
        <h2>{reaction.heading}</h2>
        <p>{reaction.message}</p>

        {allClear && wins > 0 && (
          <div class="streak-badge">
            🔥 {wins} {wins === 1 ? 'vinst' : 'vinster'} på {table}:ans tabell!
          </div>
        )}

        <div class="complete-stats">
          <div class="cstat c">
            <div class="cstat-num">{clearCount}</div>
            <div class="cstat-label">Klara</div>
          </div>
          <div class="cstat r">
            <div class="cstat-num">{retryCount}</div>
            <div class="cstat-label">Öva igen</div>
          </div>
        </div>

        <div class="complete-btns">
          <button class="btn-primary" onClick={onContinue}>
            {allClear ? 'Spela igen! 🎮' : 'Fortsätt öva! 📚'}
          </button>
          <button class="btn-secondary" onClick={onBack}>
            ← Tillbaka till tabellerna
          </button>
        </div>
      </div>
    </div>
  )
}
