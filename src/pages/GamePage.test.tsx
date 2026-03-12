import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/preact'
import { act } from 'preact/test-utils'
import { GamePage } from './GamePage'

// jsdom does not implement window.matchMedia — required by ThemeToggle → useTheme
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

const { mockUseGame } = vi.hoisted(() => ({
  mockUseGame: vi.fn(),
}))

vi.mock('../hooks/useGame', () => ({
  useGame: mockUseGame,
}))

vi.mock('../lib/storageContext', () => ({
  storage: {
    getUser: vi.fn().mockResolvedValue({ peekSavers: 0 }),
    consumePeekSaver: vi.fn().mockResolvedValue(undefined),
  },
}))

const mockStartGame = vi.fn().mockResolvedValue(undefined)
const mockSubmitAnswer = vi.fn()
const mockSaveProgress = vi.fn().mockResolvedValue(undefined)
const mockPeekCard = vi.fn()
const mockMoveToRetry = vi.fn()

function makeGameState(overrides: Record<string, unknown> = {}) {
  return {
    table: 3,
    categoryId: 3,
    operation: 'multiply' as const,
    equations: new Map(),
    deck: [
      { n: 5, fromRetry: false },
      { n: 6, fromRetry: false },
      { n: 7, fromRetry: false },
    ],
    clearPile: [],
    retryPile: [],
    current: { n: 5, fromRetry: false },
    question: '3 \u00d7 5',
    answer: 15,
    backLabel: '3 \u00d7 5 = 15',
    peeked: false,
    peekUsedSaver: false,
    busy: false,
    ...overrides,
  }
}

function makeHookReturn(overrides: Record<string, unknown> = {}) {
  return {
    gameState: makeGameState(),
    roundResult: null,
    startGame: mockStartGame,
    submitAnswer: mockSubmitAnswer,
    peekCard: mockPeekCard,
    moveToRetry: mockMoveToRetry,
    saveProgress: mockSaveProgress,
    ...overrides,
  }
}

describe('GamePage', () => {
  beforeEach(() => {
    cleanup()
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockUseGame.mockReturnValue(makeHookReturn())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the category label and the current card question', () => {
    const { container } = render(
      <GamePage categoryId={3} user="alice" onBack={vi.fn()} onComplete={vi.fn()} />,
    )
    expect(container.querySelector('.page-title')?.textContent).toBe('3:ans tabell')
    expect(container.querySelector('.card-question')?.textContent).toBe('3 \u00d7 5')
  })

  it('shows pile counters for deck, clear, and retry cards', () => {
    const { container } = render(
      <GamePage categoryId={3} user="alice" onBack={vi.fn()} onComplete={vi.fn()} />,
    )
    const pileCounts = container.querySelectorAll('.pile-count')
    expect(pileCounts).toHaveLength(3)
    // deck has 3 cards, piles start empty
    expect(pileCounts[0].textContent).toBe('3')
    expect(pileCounts[1].textContent).toBe('0')
    expect(pileCounts[2].textContent).toBe('0')
  })

  it('wrong answer adds the shaking (wrong) class to the flashcard', async () => {
    mockSubmitAnswer.mockReturnValue('wrong')
    const { container } = render(
      <GamePage categoryId={3} user="alice" onBack={vi.fn()} onComplete={vi.fn()} />,
    )

    // Digit click and submit must be in separate act() calls so the component
    // re-renders between them and handleSubmit captures the updated inputValue.
    await act(async () => {
      fireEvent.click(container.querySelector('[data-key="9"]')!)
    })
    await act(async () => {
      fireEvent.click(container.querySelector('[data-key="✓"]')!)
    })

    const flashcard = container.querySelector('.flashcard')
    expect(flashcard?.classList.contains('wrong')).toBe(true)
  })

  it('flips the card and shows the dismissal button after 2 wrong submissions', async () => {
    mockSubmitAnswer.mockReturnValue('wrong')
    const { container } = render(
      <GamePage categoryId={3} user="alice" onBack={vi.fn()} onComplete={vi.fn()} />,
    )

    // First wrong submission (digit then submit in separate acts to avoid stale closure)
    await act(async () => { fireEvent.click(container.querySelector('[data-key="9"]')!) })
    await act(async () => { fireEvent.click(container.querySelector('[data-key="✓"]')!) })
    // Wait for the 600ms setTimeout in handleSubmit to clear shaking and reset state
    await act(async () => { vi.advanceTimersByTime(700) })

    // Second wrong submission (inputValue was cleared by wrong handler; type digit again)
    await act(async () => { fireEvent.click(container.querySelector('[data-key="9"]')!) })
    await act(async () => { fireEvent.click(container.querySelector('[data-key="✓"]')!) })
    await act(async () => { vi.advanceTimersByTime(700) })

    // After 2 wrong answers, card area becomes a dismissal button
    const cardArea = container.querySelector('[aria-label="Klicka för att fortsätta"]')
    expect(cardArea).not.toBeNull()
    // The flashcard should be flipped so the answer is visible
    const flashcard = container.querySelector('.flashcard')
    expect(flashcard?.classList.contains('flipped')).toBe(true)
  })

  it('pressing the back button calls saveProgress then onBack', async () => {
    const onBack = vi.fn()
    render(<GamePage categoryId={3} user="alice" onBack={onBack} onComplete={vi.fn()} />)

    const backBtn = screen.getByRole('button', { name: 'Hem' })
    await act(async () => {
      fireEvent.click(backBtn)
    })

    expect(mockSaveProgress).toHaveBeenCalled()
    // Flush the promise chain (saveProgress.then(() => onBack()))
    await act(async () => {})
    expect(onBack).toHaveBeenCalled()
  })

  it('calls onComplete when roundResult becomes available', async () => {
    const onComplete = vi.fn()
    const roundResult = {
      clearCount: 10,
      retryCount: 0,
      allClear: true,
      table: 3,
      categoryId: 3,
      wins: 1,
    }

    mockUseGame.mockReturnValue(makeHookReturn({ roundResult }))

    await act(async () => {
      render(<GamePage categoryId={3} user="alice" onBack={vi.fn()} onComplete={onComplete} />)
    })

    expect(onComplete).toHaveBeenCalledWith(roundResult)
  })
})
