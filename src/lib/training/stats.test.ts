import { describe, expect, it } from 'vitest'
import type { TrainingAnswer } from '@/lib/supabase/database.types'
import type { AnswerRecord } from './sessionState'
import {
  accuracyPercent,
  formatSeconds,
  formatSessionStart,
  summariseSessions,
  toAnswerRecord,
  totalDurationMs,
} from './stats'
import type { AnswerFlagRow, SessionRow } from './stats'

function session(id: string, overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id,
    started_at: '2026-08-03T09:00:00Z',
    ended_at: '2026-08-03T09:03:00Z',
    total_questions: 10,
    status: 'completed',
    ...overrides,
  }
}

function flags(sessionId: string, correct: number, wrong: number): AnswerFlagRow[] {
  return [
    ...Array.from({ length: correct }, () => ({ session_id: sessionId, is_correct: true })),
    ...Array.from({ length: wrong }, () => ({ session_id: sessionId, is_correct: false })),
  ]
}

describe('accuracyPercent', () => {
  it('rounds to a whole percent', () => {
    expect(accuracyPercent(7, 10)).toBe(70)
    expect(accuracyPercent(1, 3)).toBe(33)
    expect(accuracyPercent(10, 10)).toBe(100)
  })

  it('is 0 when nothing was asked, rather than NaN', () => {
    expect(accuracyPercent(0, 0)).toBe(0)
  })
})

describe('formatSeconds', () => {
  it('shows one decimal', () => {
    expect(formatSeconds(2500)).toBe('2.5 s')
    expect(formatSeconds(0)).toBe('0.0 s')
  })
})

describe('formatSessionStart', () => {
  it('formats in Latvian time, whatever the server timezone is', () => {
    // 23:30 UTC is already the next day in Riga (UTC+3 in August).
    const formatted = formatSessionStart('2026-08-03T23:30:00Z')

    expect(formatted).toContain('2026')
    expect(formatted).toContain('4')
    expect(formatted).toContain('02:30')
  })
})

describe('summariseSessions', () => {
  it('tallies each session against its own answers', () => {
    const summaries = summariseSessions(
      [session('a'), session('b', { total_questions: 4 })],
      [...flags('a', 7, 3), ...flags('b', 1, 1)],
    )

    expect(summaries).toHaveLength(2)
    expect(summaries[0]).toMatchObject({ id: 'a', answered: 10, correct: 7, accuracy: 70 })
    expect(summaries[1]).toMatchObject({ id: 'b', answered: 2, correct: 1, accuracy: 25 })
  })

  it('keeps a session with no answers at 0%', () => {
    const [summary] = summariseSessions([session('a', { status: 'aborted' })], [])

    expect(summary).toMatchObject({ answered: 0, correct: 0, accuracy: 0, status: 'aborted' })
  })

  it('measures accuracy against the whole session, not just the answered part', () => {
    const [summary] = summariseSessions([session('a', { status: 'aborted' })], flags('a', 4, 0))

    expect(summary.correct).toBe(4)
    expect(summary.answered).toBe(4)
    expect(summary.accuracy).toBe(40)
  })

  it('falls back to in_progress for an unknown status value', () => {
    const [summary] = summariseSessions([session('a', { status: 'something-else' })], [])

    expect(summary.status).toBe('in_progress')
  })
})

describe('toAnswerRecord', () => {
  it('reshapes a stored row into the record the statistics screens render', () => {
    const row: TrainingAnswer = {
      id: 1,
      session_id: 'a',
      user_id: 'u',
      question_index: 3,
      left_operand: 6,
      right_operand: 7,
      correct_answer: 42,
      given_answer: 48,
      is_correct: false,
      duration_ms: 1200,
      answered_at: '2026-08-03T09:01:00Z',
    }

    expect(toAnswerRecord(row)).toEqual({
      questionIndex: 3,
      question: { left: 6, right: 7, answer: 42 },
      givenAnswer: 48,
      isCorrect: false,
      durationMs: 1200,
    })
  })
})

describe('totalDurationMs', () => {
  it('adds up the answer durations', () => {
    const answers: AnswerRecord[] = [
      {
        questionIndex: 0,
        question: { left: 2, right: 3, answer: 6 },
        givenAnswer: 6,
        isCorrect: true,
        durationMs: 1000,
      },
      {
        questionIndex: 1,
        question: { left: 4, right: 5, answer: 20 },
        givenAnswer: 21,
        isCorrect: false,
        durationMs: 500,
      },
    ]

    expect(totalDurationMs(answers)).toBe(1500)
    expect(totalDurationMs([])).toBe(0)
  })
})
