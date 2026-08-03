import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils'
import type { AnswerRecord } from '@/lib/training/sessionState'
import { AnswerList } from './AnswerList'

const answers: AnswerRecord[] = [
  {
    questionIndex: 0,
    question: { left: 3, right: 4, answer: 12 },
    givenAnswer: 12,
    isCorrect: true,
    durationMs: 2500,
  },
  {
    questionIndex: 1,
    question: { left: 6, right: 7, answer: 42 },
    givenAnswer: 48,
    isCorrect: false,
    durationMs: 4000,
  },
  {
    questionIndex: 2,
    question: { left: 2, right: 2, answer: 4 },
    givenAnswer: null,
    isCorrect: false,
    durationMs: 0,
  },
]

describe('AnswerList', () => {
  it('shows every question with its duration', () => {
    renderWithProviders(<AnswerList answers={answers} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByText('3 × 4 = 12')).toBeInTheDocument()
    expect(screen.getByText('2.5 s')).toBeInTheDocument()
  })

  it('marks a correct answer and shows what was tapped for a wrong one', () => {
    renderWithProviders(<AnswerList answers={answers} />)

    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.getByText('✗ 48')).toBeInTheDocument()
  })

  it('does not invent an answer for a row that has none', () => {
    renderWithProviders(<AnswerList answers={answers} />)

    expect(screen.getByText('✗ —')).toBeInTheDocument()
  })

  it('renders an empty list without crashing', () => {
    renderWithProviders(<AnswerList answers={[]} />)

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
