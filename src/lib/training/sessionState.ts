import type { Question } from './multiplication'

/**
 * Shared types and constants for the training flow.
 *
 * Like `src/lib/auth/authState.ts`, this deliberately lives outside `actions.ts`: a
 * `'use server'` module may only export async functions, so none of the constants or
 * types below could be declared there.
 */

/** Questions in one training session. */
export const QUESTIONS_PER_SESSION = 10

/** How long the "Pareizi!" / "Nav pareizi!" feedback stays up before the next question. */
export const FEEDBACK_COOLDOWN_MS = 1500

/** How a session ended. `in_progress` is the value the row is inserted with. */
export type SessionStatus = 'in_progress' | 'completed' | 'aborted'

/** One answered question, kept in memory for the statistics screen. */
export type AnswerRecord = {
  questionIndex: number
  question: Question
  givenAnswer: number
  isCorrect: boolean
  durationMs: number
}

export type StartSessionResult =
  { sessionId: string; error: null } | { sessionId: null; error: string }

export type RecordAnswerInput = {
  sessionId: string
  questionIndex: number
  leftOperand: number
  rightOperand: number
  correctAnswer: number
  givenAnswer: number
  isCorrect: boolean
  durationMs: number
}

export type ActionResult = { error: string | null }

/** Server Actions the training client needs, passed in as props so tests can stub them. */
export type TrainingActions = {
  startSession: () => Promise<StartSessionResult>
  recordAnswer: (input: RecordAnswerInput) => Promise<ActionResult>
  finishSession: (
    sessionId: string,
    status: Exclude<SessionStatus, 'in_progress'>,
  ) => Promise<ActionResult>
}
