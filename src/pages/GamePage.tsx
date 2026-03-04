import { useState, useRef, useEffect, useCallback } from 'preact/hooks'
import { COLORS, COLORS2 } from '../lib/constants'
import { useGame } from '../hooks/useGame'
import { NumericKeypad } from '../components/NumericKeypad'
import type { RoundResult } from '../hooks/useGame'

interface GamePageProps {
  table: number
  user: string
  onBack: () => void
  onComplete: (result: RoundResult) => void
}

export function GamePage({ table, user, onBack, onComplete }: GamePageProps) {
  const { gameState, roundResult, startGame, submitAnswer, peekCard, saveProgress } = useGame(user)
  const [inputValue, setInputValue] = useState('')
  const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [flipped, setFlipped] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [cardKey, setCardKey] = useState(0)
  const startedRef = useRef(false)

  // Start game on mount
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true

      const color = COLORS[table - 1]
      const color2 = COLORS2[table - 1]
      document.documentElement.style.setProperty('--tc', color)
      document.documentElement.style.setProperty('--tc2', color2)

      void startGame(table)
    }
  }, [table, startGame])

  // Handle round completion
  useEffect(() => {
    if (roundResult) {
      onComplete(roundResult)
    }
  }, [roundResult, onComplete])

  // Track card changes to reset input state
  const prevCardRef = useRef<{ n: number; deckLen: number } | null>(null)
  useEffect(() => {
    const curr = gameState.current
    const prev = prevCardRef.current
    if (curr && (!prev || prev.n !== curr.n || prev.deckLen !== gameState.deck.length)) {
      prevCardRef.current = { n: curr.n, deckLen: gameState.deck.length }
      setInputValue('')
      setAnswerState('idle')
      setFlipped(false)
      setShaking(false)
      setCardKey(k => k + 1)
    }
  }, [gameState])

  const handleBack = useCallback(() => {
    void saveProgress().then(() => onBack())
  }, [saveProgress, onBack])

  const floatFeedback = useCallback((text: string, good: boolean) => {
    const el = document.createElement('div')
    el.className = 'float-feedback'
    el.textContent = text
    el.style.color = good ? '#2D9B4A' : '#E06B1F'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 900)
  }, [])

  const handleSubmit = useCallback(() => {
    if (flipped) return

    const val = parseInt(inputValue)
    if (isNaN(val) || inputValue === '') return

    const result = submitAnswer(val)
    if (result === 'correct') {
      setAnswerState('correct')
      floatFeedback('🎉 Rätt!', true)
      setFlipped(true)
    } else if (result === 'wrong') {
      const correct = gameState.table * (gameState.current?.n ?? 0)
      setAnswerState('wrong')
      setShaking(true)
      floatFeedback(`✗ Det är ${correct}`, false)
      setTimeout(() => {
        setShaking(false)
        setAnswerState('idle')
        setInputValue('')
      }, 600)
    }
  }, [inputValue, flipped, submitAnswer, floatFeedback, gameState.table, gameState.current?.n])

  const handlePeek = useCallback(() => {
    if (flipped) return
    setFlipped(true)
    peekCard()
  }, [flipped, peekCard])

  const { deck, clearPile, retryPile, current } = gameState
  const done = clearPile.length + retryPile.length
  const total = deck.length + done

  if (!current) {
    return <div class="screen active game-screen" />
  }

  const question = `${gameState.table} × ${current.n}`
  const answer = gameState.table * current.n
  const displayValue = inputValue || '?'
  const answerDisplayClass = `answer-display${answerState !== 'idle' ? ` ${answerState}` : ''}`

  return (
    <div class="screen active game-screen">
      <div class="game-header">
        <button class="btn-back" onClick={handleBack}>← </button>
        <div class="game-title">Gångertabell {gameState.table}</div>
        <div class="progress-text">{done}/{total}</div>
      </div>

      <div class="game-layout">
        <div class="game-card-col">
          <div class="piles-bar">
            <div class="pile-box deck-pile">
              <div class="pile-count">{deck.length}</div>
              <div class="pile-label">Kort kvar</div>
            </div>
            <div class="pile-box clear-pile">
              <div class="pile-count">{clearPile.length}</div>
              <div class="pile-label">Klara</div>
            </div>
            <div class="pile-box retry-pile">
              <div class="pile-count">{retryPile.length}</div>
              <div class="pile-label">Öva igen</div>
            </div>
          </div>

          <div class="card-area" key={cardKey}>
            <div class={`flashcard${flipped ? ' flipped' : ''}${shaking ? ' wrong' : ''}`}>
              <div class="card-face card-front">
                <div class="card-question">{question}</div>
                <div class="card-hint">Skriv ditt svar ↓</div>
              </div>
              <div class="card-face card-back">
                <div class="card-answer">{answer}</div>
                <div class="card-answer-label">{question} = {answer}</div>
              </div>
            </div>
          </div>

          <div class={answerDisplayClass}>{displayValue}</div>
        </div>

        <div class="game-keypad-col">
          <button type="button" class="btn-peek" onClick={handlePeek}>👀 Titta</button>
          <NumericKeypad
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            disabled={flipped}
            user={user}
          />
        </div>
      </div>
    </div>
  )
}
