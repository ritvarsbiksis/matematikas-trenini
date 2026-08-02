import { describe, expect, it } from 'vitest'
import {
  buildOptions,
  generateQuestion,
  generateQuestions,
  MAX_FACTOR,
  MIN_FACTOR,
  OPTION_COUNT,
} from './multiplication'
import type { Rng } from './multiplication'

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

describe('generateQuestions', () => {
  it('returns the requested number of questions', () => {
    expect(generateQuestions(10)).toHaveLength(10)
  })

  it('never repeats the same pair twice in a row', () => {
    const questions = generateQuestions(50)

    for (let i = 1; i < questions.length; i++) {
      const previous = questions[i - 1]
      const current = questions[i]

      expect(previous.left === current.left && previous.right === current.right).toBe(false)
    }
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
