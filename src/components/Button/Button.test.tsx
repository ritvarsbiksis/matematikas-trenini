import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils'
import { Button } from './Button'
import styles from './Button.module.css'

describe('Button', () => {
  it('renders its children', () => {
    renderWithProviders(<Button>Save changes</Button>)

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  it('defaults to type="button" so it never submits a form by accident', () => {
    renderWithProviders(<Button>Cancel</Button>)

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('type', 'button')
  })

  it('applies the primary variant class by default', () => {
    renderWithProviders(<Button>Continue</Button>)

    expect(screen.getByRole('button', { name: 'Continue' })).toHaveClass(styles.primary)
  })

  it('applies the requested variant and full width classes', () => {
    renderWithProviders(
      <Button variant="danger" fullWidth>
        Delete
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toHaveClass(styles.danger)
    expect(button).toHaveClass(styles.fullWidth)
    expect(button).not.toHaveClass(styles.primary)
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    const { user } = renderWithProviders(<Button onClick={onClick}>Click me</Button>)

    await user.click(screen.getByRole('button', { name: 'Click me' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick while disabled', async () => {
    const onClick = vi.fn()
    const { user } = renderWithProviders(
      <Button onClick={onClick} disabled>
        Click me
      </Button>,
    )

    await user.click(screen.getByRole('button', { name: 'Click me' }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('merges a caller-supplied className with its own', () => {
    renderWithProviders(<Button className="custom">Styled</Button>)

    const button = screen.getByRole('button', { name: 'Styled' })
    expect(button).toHaveClass('custom')
    expect(button).toHaveClass(styles.button)
  })
})
