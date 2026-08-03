import type { TrainingAnswer, TrainingSession } from '@/lib/supabase/database.types'
import type { AnswerRecord, SessionStatus } from './sessionState'

/**
 * Pure helpers behind the statistics screens.
 *
 * Everything here takes plain rows and returns plain values, so the aggregation and the
 * formatting can be unit tested without a database or a rendered page.
 */

/** Columns the session list needs from a `training_sessions` row. */
export type SessionRow = Pick<
  TrainingSession,
  'id' | 'started_at' | 'ended_at' | 'total_questions' | 'status'
>

/** Columns the per-session tally needs from a `training_answers` row. */
export type AnswerFlagRow = Pick<TrainingAnswer, 'session_id' | 'is_correct'>

/** One row of the statistics list. */
export type SessionSummary = {
  id: string
  startedAt: string
  totalQuestions: number
  /** Questions actually answered — lower than `totalQuestions` for an abandoned run. */
  answered: number
  correct: number
  /** Correct answers as a percentage of `totalQuestions`. */
  accuracy: number
  status: SessionStatus
}

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  in_progress: 'Nepabeigts',
  completed: 'Pabeigts',
  aborted: 'Pārtraukts',
}

/** The app is Latvian, so timestamps are shown in Latvian time whatever the server runs on. */
const TIME_ZONE = 'Europe/Riga'

const startFormatter = new Intl.DateTimeFormat('lv-LV', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
})

/** `status` is a plain `text` column, so a row from an older schema is not trusted blindly. */
function isSessionStatus(value: string): value is SessionStatus {
  return value === 'in_progress' || value === 'completed' || value === 'aborted'
}

export function formatSessionStart(startedAt: string): string {
  return startFormatter.format(new Date(startedAt))
}

export function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(1)} s`
}

/** Whole percent, so the list stays readable. `0` when the session asked nothing. */
export function accuracyPercent(correct: number, total: number): number {
  if (total <= 0) {
    return 0
  }

  return Math.round((correct / total) * 100)
}

export function totalDurationMs(answers: AnswerRecord[]): number {
  return answers.reduce((sum, answer) => sum + answer.durationMs, 0)
}

/**
 * Folds the answers of every listed session into one summary row each.
 *
 * The tally is done here rather than in SQL because PostgREST cannot group without a
 * database view, and the list is capped at a page's worth of sessions anyway.
 */
export function summariseSessions(
  sessions: SessionRow[],
  answers: AnswerFlagRow[],
): SessionSummary[] {
  const tallies = new Map<string, { answered: number; correct: number }>()

  for (const answer of answers) {
    const tally = tallies.get(answer.session_id) ?? { answered: 0, correct: 0 }

    tally.answered += 1

    if (answer.is_correct) {
      tally.correct += 1
    }

    tallies.set(answer.session_id, tally)
  }

  return sessions.map(session => {
    const tally = tallies.get(session.id) ?? { answered: 0, correct: 0 }

    return {
      id: session.id,
      startedAt: session.started_at,
      totalQuestions: session.total_questions,
      answered: tally.answered,
      correct: tally.correct,
      accuracy: accuracyPercent(tally.correct, session.total_questions),
      status: isSessionStatus(session.status) ? session.status : 'in_progress',
    }
  })
}

/** Reshapes a stored answer into the record the end-of-drill screen already renders. */
export function toAnswerRecord(row: TrainingAnswer): AnswerRecord {
  return {
    questionIndex: row.question_index,
    question: { left: row.left_operand, right: row.right_operand, answer: row.correct_answer },
    givenAnswer: row.given_answer,
    isCorrect: row.is_correct,
    durationMs: row.duration_ms,
  }
}
