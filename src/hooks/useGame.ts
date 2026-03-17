import { useState, useCallback, useRef } from 'preact/hooks'
import { storage } from '../lib/storageContext'
import type { TableData } from '../lib/storage'
import { buildDeck, isCorrectAnswer, isCorrectTenFriendsAnswer, computeEndRound } from '../lib/game-logic'
import type { GameCard } from '../lib/game-logic'
import { getCategoryDef, TEN_FRIENDS_CATEGORY_ID, BLANDA_TABLE_ID, generateBlandaDeck, ALL_CATEGORIES } from '../lib/constants'
import type { Operation } from '../lib/constants'
import { opSymbol } from '../lib/hint-utils'

interface GameState {
  table: number
  categoryId: number
  operation: Operation
  equations: Map<number, { a: number; b: number }>
  deck: GameCard[]
  clearPile: number[]
  retryPile: number[]
  current: GameCard | null
  question: string
  answer: number
  backLabel: string
  peeked: boolean
  peekUsedSaver: boolean
  busy: boolean
  /** Per-card operation + categoryId for Blanda mode. Null for regular rounds. */
  blandaMeta: Record<number, { operation: Operation; categoryId: number }> | null
}

export interface RoundResult {
  clearCount: number
  retryCount: number
  allClear: boolean
  table: number
  categoryId: number
  wins: number
}

const initialState: GameState = {
  table: 1,
  categoryId: 1,
  operation: 'multiply',
  equations: new Map(),
  deck: [],
  clearPile: [],
  retryPile: [],
  current: null,
  question: '',
  answer: 0,
  backLabel: '',
  peeked: false,
  peekUsedSaver: false,
  busy: false,
  blandaMeta: null,
}

function computeCardDisplay(state: GameState, card: GameCard): { question: string; answer: number; backLabel: string } {
  const op = card.operation ?? state.operation
  const catId = card.categoryId ?? state.categoryId
  const a = op === 'multiply' ? (card.a ?? state.table) : (card.a ?? 0)
  const b = op === 'multiply' ? (card.b ?? card.n) : (card.b ?? 0)
  const isTenFriends = catId === TEN_FRIENDS_CATEGORY_ID && op === 'add'
  const sym = opSymbol(op)
  const question = isTenFriends ? `${a} + ?` : `${a} ${sym} ${b}`
  const answer = isTenFriends ? b : op === 'multiply' ? a * b : op === 'add' ? a + b : op === 'divide' ? a / b : a - b
  const backLabel = isTenFriends ? `${a} + ${b} = 10` : `${question} = ${answer}`
  return { question, answer, backLabel }
}

function pickRandom(deck: GameCard[]): GameCard {
  return deck[Math.floor(Math.random() * deck.length)]
}

function nextCard(state: GameState): GameState {
  if (state.deck.length === 0) {
    return state
  }
  const current = pickRandom(state.deck)
  const display = computeCardDisplay(state, current)
  return { ...state, current, ...display, peeked: false, peekUsedSaver: false, busy: false }
}

export function useGame(username: string) {
  const [gameState, setGameState] = useState<GameState>(initialState)
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const gsRef = useRef<GameState>(initialState)
  const savedTdRef = useRef<TableData>({ wins: 0, clear: [], retry: [] })

  // Keep ref in sync for use inside timeouts
  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState(prev => {
      const next = updater(prev)
      gsRef.current = next
      return next
    })
  }, [])

  const startGame = useCallback(async (categoryId: number) => {
    setRoundResult(null)

    // --- Blanda (mix) mode ---
    if (categoryId === BLANDA_TABLE_ID) {
      const userData = await storage.getUser(username)
      const tables = userData?.tables ?? {}
      const td: TableData = tables[BLANDA_TABLE_ID] ?? { wins: 0, clear: [], retry: [] }

      const activeCatIds = userData?.activeCategories ?? null
      const availableCats = ALL_CATEGORIES.filter(cat => activeCatIds === null || activeCatIds.includes(cat.id))

      let deckCards = buildDeck(td)
      let blandaMeta: Record<number, { operation: Operation; categoryId: number }> = {}
      let equations = new Map<number, { a: number; b: number }>()

      const hasCardMeta = td.cardOperations && Object.keys(td.cardOperations).length > 0
      if (!hasCardMeta) {
        // Fresh start or post-allClear reset — generate a new random deck
        deckCards = Array.from({ length: 10 }, (_, i) => ({ n: i + 1, fromRetry: false }))
        const newEqs = generateBlandaDeck(availableCats)
        newEqs.forEach((eq, i) => {
          const n = i + 1
          equations.set(n, { a: eq.a, b: eq.b })
          blandaMeta[n] = { operation: eq.operation, categoryId: eq.categoryId }
        })
        const cardOperations: Record<number, string> = {}
        const cardCategoryIds: Record<number, number> = {}
        Object.entries(blandaMeta).forEach(([k, v]) => {
          cardOperations[Number(k)] = v.operation
          cardCategoryIds[Number(k)] = v.categoryId
        })
        await storage.saveTableData(username, BLANDA_TABLE_ID, {
          wins: td.wins, clear: [], retry: [],
          cardEquations: Object.fromEntries(equations),
          cardOperations,
          cardCategoryIds,
        })
      } else {
        // Resume — restore from saved data
        const ops = td.cardOperations ?? {}
        const cats = td.cardCategoryIds ?? {}
        const eqs = td.cardEquations ?? {}
        for (let n = 1; n <= 10; n++) {
          const op = ops[n] as Operation | undefined
          if (op) blandaMeta[n] = { operation: op, categoryId: cats[n] ?? 0 }
          const eq = eqs[n]
          if (eq) equations.set(n, eq)
        }
      }

      const deck: GameCard[] = deckCards.map(card => {
        const eq = equations.get(card.n)
        const meta = blandaMeta[card.n]
        return { ...card, a: eq?.a, b: eq?.b, operation: meta?.operation, categoryId: meta?.categoryId }
      })

      savedTdRef.current = td
      const current = pickRandom(deck)
      const partialState: GameState = {
        table: BLANDA_TABLE_ID,
        categoryId: BLANDA_TABLE_ID,
        operation: 'multiply',
        equations,
        deck,
        clearPile: [],
        retryPile: [],
        current,
        question: '',
        answer: 0,
        backLabel: '',
        peeked: false,
        peekUsedSaver: false,
        busy: false,
        blandaMeta,
      }
      const display = computeCardDisplay(partialState, current)
      const newState: GameState = { ...partialState, ...display }
      gsRef.current = newState
      setGameState(newState)
      return
    }

    // --- Regular category ---
    const catDef = getCategoryDef(categoryId)
    const operation: Operation = catDef?.operation ?? 'multiply'
    const table = categoryId

    const userData = await storage.getUser(username)
    const tables = userData?.tables ?? {}
    const td: TableData = tables[table] ?? { wins: 0, clear: [], retry: [] }

    let deck: GameCard[] = buildDeck(td)

    // Build equation map for plus/minus categories
    let equations = new Map<number, { a: number; b: number }>()
    if (operation !== 'multiply' && catDef?.generateEquations) {
      const eqs = catDef.generateEquations()
      eqs.forEach((eq, i) => equations.set(i + 1, eq))
    }

    // If all done, reset
    if (deck.length === 0) {
      deck = Array.from({ length: 10 }, (_, i) => ({ n: i + 1, fromRetry: false }))
      const resetTd: TableData = { wins: td.wins, clear: [], retry: [] }
      await storage.saveTableData(username, table, resetTd)
      // Regenerate equations for the fresh deck
      if (operation !== 'multiply' && catDef?.generateEquations) {
        const eqs = catDef.generateEquations()
        equations = new Map()
        eqs.forEach((eq, i) => equations.set(i + 1, eq))
      }
    }

    // Attach a/b to each card for plus/minus
    if (operation !== 'multiply') {
      deck = deck.map(card => {
        const eq = equations.get(card.n)
        return eq ? { ...card, a: eq.a, b: eq.b } : card
      })
    }

    savedTdRef.current = td

    const current = pickRandom(deck)
    const partialState: GameState = {
      table,
      categoryId,
      operation,
      equations,
      deck,
      clearPile: [],
      retryPile: [],
      current,
      question: '',
      answer: 0,
      backLabel: '',
      peeked: false,
      peekUsedSaver: false,
      busy: false,
      blandaMeta: null,
    }
    const display = computeCardDisplay(partialState, current)
    const newState: GameState = { ...partialState, ...display }
    gsRef.current = newState
    setGameState(newState)
  }, [username])

  const endRound = useCallback((state: GameState) => {
    const { table, clearPile, retryPile, categoryId, blandaMeta } = state
    const td = savedTdRef.current

    const { newClear, newRetry, allClear, wins } = computeEndRound(td, clearPile, retryPile)

    setRoundResult({
      clearCount: clearPile.length,
      retryCount: retryPile.length,
      allClear,
      table,
      categoryId,
      wins,
    })

    // Spara i bakgrunden – blockerar inte UI
    const cardEquations = state.equations.size > 0 ? Object.fromEntries(state.equations) : undefined
    const cardOperations = blandaMeta ? Object.fromEntries(Object.entries(blandaMeta).map(([k, v]) => [k, v.operation])) : undefined
    const cardCategoryIds = blandaMeta ? Object.fromEntries(Object.entries(blandaMeta).map(([k, v]) => [k, v.categoryId])) : undefined
    const savePromise = allClear
      ? storage.saveCompletedRound(username, table, { wins, clear: [], retry: [] })
      : storage.saveTableData(username, table, { wins, clear: newClear, retry: newRetry, cardEquations, cardOperations, cardCategoryIds })
    savePromise.catch(err => console.error('Failed to save round result:', err))
  }, [username])

  const bgSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backgroundSave = useCallback((clearPile: number[], retryPile: number[]) => {
    if (bgSaveTimerRef.current) clearTimeout(bgSaveTimerRef.current)
    bgSaveTimerRef.current = setTimeout(() => {
      const { newClear, newRetry, wins } = computeEndRound(savedTdRef.current, clearPile, retryPile)
      const gs = gsRef.current
      const cardEquations = gs.equations.size > 0 ? Object.fromEntries(gs.equations) : undefined
      const cardOperations = gs.blandaMeta ? Object.fromEntries(Object.entries(gs.blandaMeta).map(([k, v]) => [k, v.operation])) : undefined
      const cardCategoryIds = gs.blandaMeta ? Object.fromEntries(Object.entries(gs.blandaMeta).map(([k, v]) => [k, v.categoryId])) : undefined
      storage.saveTableData(username, gs.table, { wins, clear: newClear, retry: newRetry, cardEquations, cardOperations, cardCategoryIds })
        .catch(err => console.error('Background save failed:', err))
    }, 2000)
  }, [username])

  const moveCard = useCallback((correct: boolean): void => {
    const gs = gsRef.current
    if (!gs.current) return

    const idx = gs.deck.indexOf(gs.current)
    const newDeck = [...gs.deck]
    if (idx > -1) newDeck.splice(idx, 1)

    const newClear = [...gs.clearPile]
    const newRetry = [...gs.retryPile]

    if ((correct && !gs.peeked) || gs.peekUsedSaver) {
      newClear.push(gs.current.n)
    } else {
      newRetry.push(gs.current.n)
    }

    const updated: GameState = {
      ...gs,
      deck: newDeck,
      clearPile: newClear,
      retryPile: newRetry,
    }

    if (newDeck.length === 0) {
      gsRef.current = updated
      setGameState(updated)
      endRound(updated)
      return
    }

    backgroundSave(newClear, newRetry)
    const withNext = nextCard(updated)
    gsRef.current = withNext
    setGameState(withNext)
  }, [endRound, backgroundSave])

  const submitAnswer = useCallback((value: number): 'correct' | 'wrong' | 'invalid' => {
    const gs = gsRef.current
    if (gs.busy || !gs.current) return 'invalid'
    if (isNaN(value)) return 'invalid'

    const cardOp = gs.current.operation ?? gs.operation
    const cardCatId = gs.current.categoryId ?? gs.categoryId
    const a = cardOp === 'multiply' ? (gs.current.a ?? gs.table) : (gs.current.a ?? 0)
    const b = cardOp === 'multiply' ? (gs.current.b ?? gs.current.n) : (gs.current.b ?? 0)
    const isTenFriends = cardCatId === TEN_FRIENDS_CATEGORY_ID && cardOp === 'add'
    const isCorrect = isTenFriends
      ? isCorrectTenFriendsAnswer(a, value)
      : isCorrectAnswer(cardOp, a, b, value)

    if (isCorrect) {
      updateState(prev => ({ ...prev, busy: true }))
      const isLastCard = gs.deck.length === 1
      setTimeout(() => {
        moveCard(true)
      }, isLastCard ? 900 : 1400)
      return 'correct'
    } else {
      return 'wrong'
    }
  }, [moveCard, updateState])

  const peekCard = useCallback((useSaver: boolean) => {
    const gs = gsRef.current
    if (gs.busy) return
    updateState(prev => ({ ...prev, peeked: true, peekUsedSaver: useSaver, busy: true }))
    setTimeout(() => {
      moveCard(false)
    }, 2400)
  }, [moveCard, updateState])

  const moveToRetry = useCallback(() => {
    moveCard(false)
  }, [moveCard])

  /** Save progress mid-round so exiting the game screen doesn't lose answered cards. */
  const saveProgress = useCallback(async () => {
    const gs = gsRef.current
    if (gs.clearPile.length === 0 && gs.retryPile.length === 0) return

    const { newClear, newRetry, wins } = computeEndRound(savedTdRef.current, gs.clearPile, gs.retryPile)
    const cardEquations = gs.equations.size > 0 ? Object.fromEntries(gs.equations) : undefined
    const cardOperations = gs.blandaMeta ? Object.fromEntries(Object.entries(gs.blandaMeta).map(([k, v]) => [k, v.operation])) : undefined
    const cardCategoryIds = gs.blandaMeta ? Object.fromEntries(Object.entries(gs.blandaMeta).map(([k, v]) => [k, v.categoryId])) : undefined
    await storage.saveTableData(username, gs.table, { wins, clear: newClear, retry: newRetry, cardEquations, cardOperations, cardCategoryIds })
  }, [username])

  return {
    gameState,
    roundResult,
    startGame,
    submitAnswer,
    peekCard,
    moveToRetry,
    saveProgress,
  }
}
