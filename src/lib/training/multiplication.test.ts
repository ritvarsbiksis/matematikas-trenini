import { describe, expect, it } from 'vitest'
import {
  BASE_WEIGHT,
  buildOptions,
  generateQuestion,
  generateQuestions,
  MAX_FACTOR,
  MIN_FACTOR,
  MISTAKE_WEIGHT,
  OPTION_COUNT,
  pairKey,
  pairWeight,
  UNSEEN_WEIGHT,
} from './multiplication'
import type { PairStat, PairStats, Question, Rng } from './multiplication'

/** Deterministic `rng` cycling through the given values. */
function sequence(values: number[]): Rng {
  let i = 0

  return () => values[i++ % values.length]
}

describe('generateQuestion', () => {
  it('keeps both factors inside the trainable range', () => {
    for (let i = 0; i < 200; i++) {
      const question = generateQuestion()

      expect(question.left).toBeGreaterThanOrEqual(MIN_FACTOR)
      expect(question.left).toBeLessThanOrEqual(MAX_FACTOR)
      expect(question.right).toBeGreaterThanOrEqual(MIN_FACTOR)
      expect(question.right).toBeLessThanOrEqual(MAX_FACTOR)
      expect(question.answer).toBe(question.left * question.right)
    }
  })

  it('maps the rng bounds onto the smallest and largest factor', () => {
    expect(generateQuestion(sequence([0]))).toEqual({ left: 1, right: 1, answer: 1 })
    expect(generateQuestion(sequence([0.999]))).toEqual({ left: 10, right: 10, answer: 100 })
  })
})

/** History where every listed pair carries the same tally and everything else is unseen. */
function history(entries: [number, number, PairStat][]): PairStats {
  return new Map(entries.map(([left, right, stat]) => [pairKey(left, right), stat]))
}

/** History in which every pair has been asked `asked` times and never got wrong. */
function evenHistory(asked: number): PairStats {
  const entries: [number, number, PairStat][] = []

  for (let left = MIN_FACTOR; left <= MAX_FACTOR; left++) {
    for (let right = MIN_FACTOR; right <= MAX_FACTOR; right++) {
      entries.push([left, right, { asked, wrong: 0 }])
    }
  }

  return history(entries)
}

function countPair(questions: Question[], left: number, right: number): number {
  return questions.filter(question => question.left === left && question.right === right).length
}

describe('pairWeight', () => {
  it('gives an unseen pair the base weight plus the full unseen bonus', () => {
    expect(pairWeight(undefined)).toBe(BASE_WEIGHT + UNSEEN_WEIGHT)
  })

  it('fades the unseen bonus as a pair gets asked', () => {
    const once = pairWeight({ asked: 1, wrong: 0 })
    const often = pairWeight({ asked: 9, wrong: 0 })

    expect(once).toBeLessThan(pairWeight(undefined))
    expect(often).toBeLessThan(once)
    expect(often).toBeGreaterThan(BASE_WEIGHT)
  })

  it('adds a fixed bonus per wrong answer', () => {
    const stat = { asked: 4, wrong: 0 }

    expect(pairWeight({ ...stat, wrong: 1 }) - pairWeight(stat)).toBeCloseTo(MISTAKE_WEIGHT)
    expect(pairWeight({ ...stat, wrong: 2 }) - pairWeight(stat)).toBeCloseTo(2 * MISTAKE_WEIGHT)
  })

  it('ranks a pair got wrong above an unseen one, and both above a mastered one', () => {
    const wrong = pairWeight({ asked: 3, wrong: 2 })
    const mastered = pairWeight({ asked: 20, wrong: 0 })

    expect(wrong).toBeGreaterThan(pairWeight(undefined))
    expect(pairWeight(undefined)).toBeGreaterThan(mastered)
  })
})

describe('generateQuestions', () => {
  it('returns the requested number of questions', () => {
    expect(generateQuestions(10)).toHaveLength(10)
  })

  it('never repeats the same pair twice in a row, even past the pool size', () => {
    const questions = generateQuestions(250)

    for (let i = 1; i < questions.length; i++) {
      const previous = questions[i - 1]
      const current = questions[i]

      expect(previous.left === current.left && previous.right === current.right).toBe(false)
    }
  })

  it('asks a different pair for every question of a session', () => {
    const questions = generateQuestions(10)
    const pairs = new Set(questions.map(question => pairKey(question.left, question.right)))

    expect(pairs.size).toBe(questions.length)
  })

  it('keeps both factors inside the trainable range whatever the history says', () => {
    const questions = generateQuestions(60, {
      history: history([[7, 8, { asked: 3, wrong: 3 }]]),
    })

    for (const question of questions) {
      expect(question.left).toBeGreaterThanOrEqual(MIN_FACTOR)
      expect(question.left).toBeLessThanOrEqual(MAX_FACTOR)
      expect(question.right).toBeGreaterThanOrEqual(MIN_FACTOR)
      expect(question.right).toBeLessThanOrEqual(MAX_FACTOR)
      expect(question.answer).toBe(question.left * question.right)
    }
  })

  it('asks a pair that was answered wrong far more often than the rest', () => {
    // Every pair asked the same number of times, so the only difference is the mistake.
    const stats = new Map(evenHistory(5))
    stats.set(pairKey(7, 8), { asked: 5, wrong: 4 })

    let wrongPairAsked = 0
    let averagePairAsked = 0

    for (let run = 0; run < 200; run++) {
      const questions = generateQuestions(10, { history: stats })

      wrongPairAsked += countPair(questions, 7, 8)
      averagePairAsked += countPair(questions, 2, 3)
    }

    expect(wrongPairAsked).toBeGreaterThan(averagePairAsked * 3)
  })

  it('asks a rarely seen pair more often than a well drilled one', () => {
    const stats = new Map(evenHistory(20))
    stats.set(pairKey(6, 9), { asked: 0, wrong: 0 })

    let rareAsked = 0
    let drilledAsked = 0

    for (let run = 0; run < 200; run++) {
      const questions = generateQuestions(10, { history: stats })

      rareAsked += countPair(questions, 6, 9)
      drilledAsked += countPair(questions, 2, 3)
    }

    expect(rareAsked).toBeGreaterThan(drilledAsked * 2)
  })

  it('still reaches a mastered pair, so nothing drops out of the rotation', () => {
    const stats = new Map(evenHistory(0))
    stats.set(pairKey(4, 5), { asked: 500, wrong: 0 })

    let asked = 0

    for (let run = 0; run < 300; run++) {
      asked += countPair(generateQuestions(10, { history: stats }), 4, 5)
    }

    expect(asked).toBeGreaterThan(0)
  })

  it('spends the whole rng range on the pool, low and high alike', () => {
    expect(generateQuestions(1, { rng: sequence([0]) })[0]).toEqual({
      left: 1,
      right: 1,
      answer: 1,
    })
    expect(generateQuestions(1, { rng: sequence([0.999999]) })[0]).toEqual({
      left: 10,
      right: 10,
      answer: 100,
    })
  })
})

describe('buildOptions', () => {
  it('always offers exactly three distinct positive options', () => {
    for (let left = MIN_FACTOR; left <= MAX_FACTOR; left++) {
      for (let right = MIN_FACTOR; right <= MAX_FACTOR; right++) {
        const options = buildOptions({ left, right, answer: left * right })

        expect(options).toHaveLength(OPTION_COUNT)
        expect(new Set(options).size).toBe(OPTION_COUNT)
        expect(options.every(option => option > 0)).toBe(true)
      }
    }
  })

  it('always includes the correct answer', () => {
    for (let i = 0; i < 200; i++) {
      const question = generateQuestion()

      expect(buildOptions(question)).toContain(question.answer)
    }
  })

  it('copes with 1 × 1, where the near-misses collide', () => {
    const options = buildOptions({ left: 1, right: 1, answer: 1 })

    expect(options).toContain(1)
    expect(new Set(options).size).toBe(OPTION_COUNT)
  })
})
