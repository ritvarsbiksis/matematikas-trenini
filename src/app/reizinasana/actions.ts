'use server'

import { createClient } from '@/lib/supabase/server'
import { QUESTIONS_PER_SESSION } from '@/lib/training/sessionState'
import type {
  ActionResult,
  RecordAnswerInput,
  SessionStatus,
  StartSessionResult,
} from '@/lib/training/sessionState'

const SIGNED_OUT = 'Lai trenētos, ir jāpieslēdzas.'

/** Opens a session row and returns its id, which the client keeps for the whole run. */
export async function startSession(): Promise<StartSessionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // `src/proxy.ts` guards `/reizinasana`; this is defence in depth for a direct call.
  if (!user) {
    return { sessionId: null, error: SIGNED_OUT }
  }

  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      user_id: user.id,
      kind: 'multiplication',
      total_questions: QUESTIONS_PER_SESSION,
    })
    .select('id')
    .single()

  if (error) {
    return { sessionId: null, error: error.message }
  }

  return { sessionId: data.id, error: null }
}

export async function recordAnswer(input: RecordAnswerInput): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: SIGNED_OUT }
  }

  const { error } = await supabase.from('training_answers').insert({
    session_id: input.sessionId,
    user_id: user.id,
    question_index: input.questionIndex,
    left_operand: input.leftOperand,
    right_operand: input.rightOperand,
    correct_answer: input.correctAnswer,
    given_answer: input.givenAnswer,
    is_correct: input.isCorrect,
    duration_ms: input.durationMs,
  })

  return { error: error?.message ?? null }
}

export async function finishSession(
  sessionId: string,
  status: Exclude<SessionStatus, 'in_progress'>,
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: SIGNED_OUT }
  }

  // RLS already restricts this to the caller's own rows; the `eq` keeps the intent
  // visible and lets a stale session id fail quietly instead of matching nothing odd.
  const { error } = await supabase
    .from('training_sessions')
    .update({ ended_at: new Date().toISOString(), status })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  return { error: error?.message ?? null }
}
