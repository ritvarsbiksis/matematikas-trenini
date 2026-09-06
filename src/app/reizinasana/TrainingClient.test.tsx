import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, renderWithProviders, screen } from '@/test/utils'
import { FEEDBACK_COOLDOWN_MS, QUESTIONS_PER_SESSION } from '@/lib/training/sessionState'
import type { TrainingActions } from '@/lib/training/sessionState'
import { TrainingClient } from './TrainingClient'

/**
 * The drill runs on timers, so these tests use fake ones — which rules out
 * `user-event` (its internal delays never resolve against Vitest's fake timers) and
 * `findBy*` queries. `fireEvent` is act-wrapped, and `flush()` below settles the
 * promises the Server Action stubs return.
 */
async function flush() {
  await act(async () => {
    await Promise.resolve()
  })
}

function setup() {
  // Typed mocks, so `mock.calls` below carries the real argument types.
  const startSession = vi
    .fn<TrainingActions['startSession']>()
    .mockResolvedValue({ sessionId: 'session-1', error: null })
  const loadPairStats = vi.fn<TrainingActions['loadPairStats']>().mockResolvedValue([])
  const recordAnswer = vi.fn<TrainingActions['recordAnswer']>().mockResolvedValue({ error: null })
  const finishSession = vi.fn<TrainingActions['finishSession']>().mockResolvedValue({ error: null })

  renderWithProviders(
    <TrainingClient
      startSession={startSession}
      loadPairStats={loadPairStats}
      recordAnswer={recordAnswer}
      finishSession={finishSession}
    />,
  )

  return { startSession, loadPairStats, recordAnswer, finishSession }
}

async function startTraining() {
  fireEvent.click(screen.getByRole('button', { name: 'Sākt' }))
  await flush()
}

/** The product asked for by the question currently on screen. */
function currentAnswer(): number {
  const [left, right] = screen
    .getByText(/^\d+ × \d+$/)
    .textContent.split('×')
    .map(part => Number(part.trim()))

  return left * right
}

function answerButtons(): HTMLElement[] {
  return screen.getAllByRole('button', { name: /^\d+$/ })
}

function clickCorrect() {
  fireEvent.click(screen.getByRole('button', { name: String(currentAnswer()) }))
}

function clickWrong() {
  const answer = String(currentAnswer())
  const wrong = answerButtons().find(button => button.textContent !== answer)

  if (!wrong) {
    throw new Error('every option matched the correct answer')
  }

  fireEvent.click(wrong)
}

function clickNext() {
  fireEvent.click(screen.getByRole('button', { name: 'Tālāk' }))
}

describe('TrainingClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens a session and shows the first question when Sākt is tapped', async () => {
    const { startSession } = setup()

    await startTraining()

    expect(startSession).toHaveBeenCalledOnce()
    expect(screen.getByText(`1 / ${QUESTIONS_PER_SESSION}`)).toBeInTheDocument()
    expect(answerButtons()).toHaveLength(3)
  })

  it('offers the home and statistics links under Sākt, and hides them mid-drill', async () => {
    setup()

    expect(screen.getByRole('link', { name: 'Uz Sākumu' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Statistika' })).toHaveAttribute('href', '/statistika')

    await startTraining()

    expect(screen.queryByRole('link', { name: 'Uz Sākumu' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Statistika' })).not.toBeInTheDocument()
  })

  it('does not start when the session cannot be opened', async () => {
    renderWithProviders(
      <TrainingClient
        startSession={vi.fn().mockResolvedValue({ sessionId: null, error: 'Nav pieslēguma.' })}
        loadPairStats={vi.fn().mockResolvedValue([])}
        recordAnswer={vi.fn()}
        finishSession={vi.fn()}
      />,
    )

    await startTraining()

    expect(screen.getByRole('alert')).toHaveTextContent('Nav pieslēguma.')
    expect(screen.queryByText(`1 / ${QUESTIONS_PER_SESSION}`)).not.toBeInTheDocument()
  })

  it('says Pareizi! and records the answer with its duration', async () => {
    const { recordAnswer } = setup()

    await startTraining()

    const answer = currentAnswer()
    clickCorrect()

    expect(screen.getByText('Pareizi!')).toBeInTheDocument()

    const [input] = recordAnswer.mock.calls[0]
    expect(input.sessionId).toBe('session-1')
    expect(input.questionIndex).toBe(0)
    expect(input.leftOperand * input.rightOperand).toBe(answer)
    expect(input.correctAnswer).toBe(answer)
    expect(input.givenAnswer).toBe(answer)
    expect(input.isCorrect).toBe(true)
    expect(input.durationMs).toBeTypeOf('number')
    expect(input.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('says Nav pareizi! for a wrong answer', async () => {
    const { recordAnswer } = setup()

    await startTraining()
    clickWrong()

    expect(screen.getByText('Nav pareizi!')).toBeInTheDocument()

    const [input] = recordAnswer.mock.calls[0]
    expect(input.isCorrect).toBe(false)
    expect(input.givenAnswer).not.toBe(input.correctAnswer)
  })

  it('moves on by itself once the cooldown elapses', async () => {
    setup()

    await startTraining()
    clickCorrect()

    expect(screen.getByText('Pareizi!')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(FEEDBACK_COOLDOWN_MS)
    })

    expect(screen.getByText(`2 / ${QUESTIONS_PER_SESSION}`)).toBeInTheDocument()
    expect(screen.queryByText('Pareizi!')).not.toBeInTheDocument()
  })

  it('skips the cooldown when Tālāk is tapped', async () => {
    setup()

    await startTraining()
    clickCorrect()
    clickNext()

    expect(screen.getByText(`2 / ${QUESTIONS_PER_SESSION}`)).toBeInTheDocument()
  })

  it('ignores taps during the cooldown, so a question is recorded once', async () => {
    const { recordAnswer } = setup()

    await startTraining()

    const [first, second] = answerButtons()
    fireEvent.click(first)
    fireEvent.click(second)

    expect(recordAnswer).toHaveBeenCalledOnce()
  })

  it('shows the statistics and completes the session after the last question', async () => {
    const { finishSession, recordAnswer } = setup()

    await startTraining()

    for (let i = 0; i < QUESTIONS_PER_SESSION; i++) {
      clickCorrect()
      clickNext()
    }

    expect(screen.getByText('Rezultāti')).toBeInTheDocument()
    expect(
      screen.getByText(`${QUESTIONS_PER_SESSION} no ${QUESTIONS_PER_SESSION} pareizi`),
    ).toBeInTheDocument()
    expect(recordAnswer).toHaveBeenCalledTimes(QUESTIONS_PER_SESSION)
    expect(finishSession).toHaveBeenCalledWith('session-1', 'completed')
    expect(screen.getByRole('button', { name: 'Sākt' })).toBeInTheDocument()
  })

  it('ends the session early when × is tapped', async () => {
    const { finishSession } = setup()

    await startTraining()
    clickCorrect()
    clickNext()

    fireEvent.click(screen.getByRole('button', { name: 'Beigt treniņu' }))

    expect(screen.getByText('Rezultāti')).toBeInTheDocument()
    expect(screen.getByText(`1 no ${QUESTIONS_PER_SESSION} pareizi`)).toBeInTheDocument()
    expect(finishSession).toHaveBeenCalledWith('session-1', 'aborted')
  })
})
