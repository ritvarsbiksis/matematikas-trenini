import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils'
import { AnswerCard } from './AnswerCard'
import styles from './AnswerCard.module.css'

describe('AnswerCard', () => {
  it('renders its value as a button', () => {
    renderWithProviders(<AnswerCard value={42} />)

    expect(screen.getByRole('button', { name: '42' })).toBeInTheDocument()
  })

  it('is neutral by default', () => {
    renderWithProviders(<AnswerCard value={12} />)

    expect(screen.getByRole('button', { name: '12' })).toHaveClass(styles.neutral)
  })

  it('applies the state class it was given', () => {
    renderWithProviders(<AnswerCard value={12} state="wrong" />)

    const card = screen.getByRole('button', { name: '12' })
    expect(card).toHaveClass(styles.wrong)
    expect(card).not.toHaveClass(styles.neutral)
  })

  it('calls onClick when tapped', async () => {
    const onClick = vi.fn()
    const { user } = renderWithProviders(<AnswerCard value={7} onClick={onClick} />)

    await user.click(screen.getByRole('button', { name: '7' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick while disabled', async () => {
    const onClick = vi.fn()
    const { user } = renderWithProviders(<AnswerCard value={7} onClick={onClick} disabled />)

    await user.click(screen.getByRole('button', { name: '7' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})
