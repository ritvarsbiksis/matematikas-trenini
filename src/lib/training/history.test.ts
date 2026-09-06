import { describe, expect, it } from 'vitest'
import { summarisePairs, toPairStats } from './history'
import { pairKey } from './multiplication'
import type { PairHistoryRow } from './history'

function row(left: number, right: number, isCorrect: boolean): PairHistoryRow {
  return { left_operand: left, right_operand: right, is_correct: isCorrect }
}

describe('summarisePairs', () => {
  it('returns nothing for a user who has never answered', () => {
    expect(summarisePairs([])).toEqual([])
  })

  it('counts asks and mistakes per pair', () => {
    const stats = summarisePairs([
      row(7, 8, false),
      row(7, 8, true),
      row(7, 8, false),
      row(2, 3, true),
    ])

    expect(stats).toContainEqual({ left: 7, right: 8, asked: 3, wrong: 2 })
    expect(stats).toContainEqual({ left: 2, right: 3, asked: 1, wrong: 0 })
    expect(stats).toHaveLength(2)
  })

  it('keeps the two orderings of a pair apart', () => {
    const stats = summarisePairs([row(3, 4, false), row(4, 3, true)])

    expect(stats).toContainEqual({ left: 3, right: 4, asked: 1, wrong: 1 })
    expect(stats).toContainEqual({ left: 4, right: 3, asked: 1, wrong: 0 })
  })
})

describe('toPairStats', () => {
  it('keys the tallies the way the generator looks them up', () => {
    const stats = toPairStats(summarisePairs([row(7, 8, false), row(7, 8, true)]))

    expect(stats.get(pairKey(7, 8))).toEqual({ asked: 2, wrong: 1 })
    expect(stats.get(pairKey(8, 7))).toBeUndefined()
  })
})
