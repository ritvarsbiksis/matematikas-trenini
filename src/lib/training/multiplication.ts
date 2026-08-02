/**
 * Question generation for the multiplication drill. Everything here is pure and takes
 * an injectable `rng`, so the tests can pin the randomness down.
 */

/** Smallest and largest factor a question may use. */
export const MIN_FACTOR = 1
export const MAX_FACTOR = 10

/** How many answer buttons a question is shown with. */
export const OPTION_COUNT = 3

export type Question = {
  left: number
  right: number
  answer: number
}

/** Returns a float in `[0, 1)`, like `Math.random`. */
export type Rng = () => number

function randomInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1))
}

export function generateQuestion(rng: Rng = Math.random): Question {
  const left = randomInt(MIN_FACTOR, MAX_FACTOR, rng)
  const right = randomInt(MIN_FACTOR, MAX_FACTOR, rng)

  return { left, right, answer: left * right }
}

/**
 * A run of questions. Consecutive repeats are avoided so the same pair never appears
 * twice in a row; with only 100 pairs available, repeats across a longer run are fine.
 */
export function generateQuestions(count: number, rng: Rng = Math.random): Question[] {
  const questions: Question[] = []

  while (questions.length < count) {
    const question = generateQuestion(rng)
    const previous = questions.at(-1)

    if (previous && previous.left === question.left && previous.right === question.right) {
      continue
    }

    questions.push(question)
  }

  return questions
}

/**
 * Plausible wrong answers, in the order we would like to use them: a neighbouring row or
 * column of the times table first, then an off-by-one slip. Ordering matters because the
 * list is truncated, and a distractor next to the real product is harder — and more
 * useful — than an arbitrary number.
 */
function candidateDistractors({ left, right, answer }: Question): number[] {
  return [
    (left + 1) * right,
    (left - 1) * right,
    left * (right + 1),
    left * (right - 1),
    answer + 1,
    answer - 1,
    answer + 10,
    answer - 10,
  ]
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

/**
 * `OPTION_COUNT` shuffled options, always including the correct answer and never a
 * duplicate or a non-positive number.
 */
export function buildOptions(question: Question, rng: Rng = Math.random): number[] {
  const options = new Set<number>([question.answer])

  for (const candidate of shuffle(candidateDistractors(question), rng)) {
    if (options.size === OPTION_COUNT) {
      break
    }

    if (candidate > 0) {
      options.add(candidate)
    }
  }

  // Only reachable for tiny products (1 × 1), where the near-misses collide. Top up with
  // whatever positive numbers are still free around the answer.
  for (let offset = 2; options.size < OPTION_COUNT; offset++) {
    options.add(question.answer + offset)
  }

  return shuffle([...options], rng)
}
