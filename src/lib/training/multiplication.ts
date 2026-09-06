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

/** How often a pair was asked in the recent history, and how often it was got wrong. */
export type PairStat = {
  asked: number
  wrong: number
}

/** Recent history keyed by `pairKey`. A pair missing from the map counts as unseen. */
export type PairStats = ReadonlyMap<string, PairStat>

/**
 * Key for one ordered pair. `3 × 4` and `4 × 3` are kept apart on purpose: they are shown
 * as different questions, and a child who knows one does not necessarily know the other.
 */
export function pairKey(left: number, right: number): string {
  return `${left}x${right}`
}

/**
 * Weight of a pair when a drill is put together. The three terms, in the order they
 * matter: every pair stays in the rotation, a pair the history has barely seen is
 * favoured, and a pair that was answered wrong is favoured most.
 */
export const BASE_WEIGHT = 1
/** Full bonus for a pair never asked, halved after one ask, thirded after two, and so on. */
export const UNSEEN_WEIGHT = 4
/** Added per wrong answer in the history window. */
export const MISTAKE_WEIGHT = 3

export function pairWeight(stat: PairStat | undefined): number {
  const { asked, wrong } = stat ?? { asked: 0, wrong: 0 }

  return BASE_WEIGHT + UNSEEN_WEIGHT / (1 + asked) + MISTAKE_WEIGHT * wrong
}

function randomInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/**
 * A single uniformly drawn question. The drill itself uses `generateQuestions`, which
 * weights the draw by history; this is the plain version behind it.
 */
export function generateQuestion(rng: Rng = Math.random): Question {
  const left = randomInt(MIN_FACTOR, MAX_FACTOR, rng)
  const right = randomInt(MIN_FACTOR, MAX_FACTOR, rng)

  return { left, right, answer: left * right }
}

type PoolEntry = {
  question: Question
  weight: number
}

/** Every pair in the trainable range, each with the weight its history earns it. */
function weightedPool(history: PairStats | undefined): PoolEntry[] {
  const pool: PoolEntry[] = []

  for (let left = MIN_FACTOR; left <= MAX_FACTOR; left++) {
    for (let right = MIN_FACTOR; right <= MAX_FACTOR; right++) {
      pool.push({
        question: { left, right, answer: left * right },
        weight: pairWeight(history?.get(pairKey(left, right))),
      })
    }
  }

  return pool
}

function isSamePair(a: Question, b: Question): boolean {
  return a.left === b.left && a.right === b.right
}

/**
 * Index of one entry, drawn with probability proportional to its weight. `exclude` is
 * skipped unless it is the only thing left, which keeps the same pair off two questions
 * in a row.
 */
function pickIndex(pool: PoolEntry[], exclude: Question | undefined, rng: Rng): number {
  const eligible = (entry: PoolEntry) => !exclude || !isSamePair(entry.question, exclude)

  let total = 0

  for (const entry of pool) {
    if (eligible(entry)) {
      total += entry.weight
    }
  }

  // Only when the pool holds nothing but the excluded pair; then it has to be reused.
  if (total <= 0) {
    return pool.length - 1
  }

  let ticket = rng() * total
  let last = 0

  for (let i = 0; i < pool.length; i++) {
    if (!eligible(pool[i])) {
      continue
    }

    ticket -= pool[i].weight
    last = i

    if (ticket < 0) {
      return i
    }
  }

  // Floating point can leave a sliver of the ticket unspent; the last eligible entry owns it.
  return last
}

export type GenerateOptions = {
  /**
   * Recent per-pair history. Pairs that were answered wrong, and pairs that have come up
   * least often, are drawn more frequently. Omitted, every pair is equally likely.
   */
  history?: PairStats
  rng?: Rng
}

/**
 * A run of questions, drawn without replacement so a session of ten asks ten different
 * pairs — weighted, but never the same weak pair over and over. A run longer than the
 * 100 available pairs starts the pool over, and the same pair still never appears twice
 * in a row.
 */
export function generateQuestions(
  count: number,
  { history, rng = Math.random }: GenerateOptions = {},
): Question[] {
  const questions: Question[] = []
  let pool = weightedPool(history)

  while (questions.length < count) {
    if (pool.length === 0) {
      pool = weightedPool(history)
    }

    const index = pickIndex(pool, questions.at(-1), rng)
    const [entry] = pool.splice(index, 1)

    questions.push(entry.question)
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
