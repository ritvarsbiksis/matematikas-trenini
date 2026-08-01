import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '@/test/utils'
import { SignOutButton } from './SignOutButton'

describe('SignOutButton', () => {
  it('renders a submit button inside a form', () => {
    renderWithProviders(<SignOutButton action={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Sign out' })).toHaveAttribute('type', 'submit')
  })

  it('runs the server action when submitted', async () => {
    const action = vi.fn().mockResolvedValue(undefined)
    const { user } = renderWithProviders(<SignOutButton action={action} />)

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(action).toHaveBeenCalledOnce()
    })
  })
})
