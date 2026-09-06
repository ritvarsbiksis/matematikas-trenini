import { pairKey } from './multiplication'
import type { PairStats } from './multiplication'
import type { TrainingAnswer } from '@/lib/supabase/database.types'

/**
 * Turns stored answers into the per-pair history the question generator weights by.
 *
 * The window is deliberately short: a pair a child got wrong a year ago should not keep
 * dominating today's drill, so only the most recent `HISTORY_LIMIT` answers count, and
 * old mistakes fall out of the window as new answers push them out.
 */

/** How many of the most recent answers shape the next drill. */
export const HISTORY_LIMIT = 300

/** Columns the weighting needs from a `training_answers` row. */
export type PairHistoryRow = Pick<TrainingAnswer, 'left_operand' | 'right_operand' | 'is_correct'>

/**
 * One pair's tally. A flat array rather than a `Map` because this crosses the Server
 * Action boundary; at most 100 entries, one per pair in the times table.
 */
export type PairStatRow = {
  left: number
  right: number
  asked: number
  wrong: number
}

export function summarisePairs(rows: PairHistoryRow[]): PairStatRow[] {
  const tallies = new Map<string, PairStatRow>()

  for (const row of rows) {
    const key = pairKey(row.left_operand, row.right_operand)
    const tally = tallies.get(key) ?? {
      left: row.left_operand,
      right: row.right_operand,
      asked: 0,
      wrong: 0,
    }

    tally.asked += 1

    if (!row.is_correct) {
      tally.wrong += 1
    }

    tallies.set(key, tally)
  }

  return [...tallies.values()]
}

/** Reshapes the wire format back into the lookup `generateQuestions` takes. */
export function toPairStats(rows: PairStatRow[]): PairStats {
  return new Map(
    rows.map(row => [pairKey(row.left, row.right), { asked: row.asked, wrong: row.wrong }]),
  )
}
