import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '@/test/utils'
import { initialAuthState } from '@/lib/auth/authState'
import type { AuthState } from '@/lib/auth/authState'
import { OAuthButtons } from './OAuthButtons'

type Action = (state: AuthState, formData: FormData) => Promise<AuthState>

function stubAction(result: AuthState = initialAuthState) {
  return vi.fn<Action>().mockResolvedValue(result)
}

describe('OAuthButtons', () => {
  it('renders one button per configured provider', () => {
    renderWithProviders(<OAuthButtons redirectTo="/protected" action={stubAction()} />)

    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue with Facebook' })).toBeInTheDocument()
  })

  it('hides the brand marks from assistive tech so the label is the accessible name', () => {
    const { container } = renderWithProviders(
      <OAuthButtons redirectTo="/protected" action={stubAction()} />,
    )

    const icons = container.querySelectorAll('svg')
    expect(icons).toHaveLength(3)
    for (const icon of icons) {
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    }
  })

  // The whole single-action design rests on the submitter's name/value reaching
  // the action. If React ever stopped forwarding it, this is what would catch it.
  it('sends the clicked provider and the redirect target to the action', async () => {
    const action = stubAction()
    const { user } = renderWithProviders(<OAuthButtons redirectTo="/dashboard" action={action} />)

    await user.click(screen.getByRole('button', { name: 'Continue with GitHub' }))

    await waitFor(() => {
      expect(action).toHaveBeenCalledOnce()
    })

    const formData = action.mock.calls[0][1]
    expect(formData.get('provider')).toBe('github')
    expect(formData.get('redirectTo')).toBe('/dashboard')
  })

  it('disables every button while a provider round trip is starting', async () => {
    // Assigned synchronously by the Promise executor below.
    let release!: (state: AuthState) => void
    const action = vi.fn<Action>().mockReturnValue(
      new Promise<AuthState>(resolve => {
        release = resolve
      }),
    )

    const { user } = renderWithProviders(<OAuthButtons redirectTo="/protected" action={action} />)

    await user.click(screen.getByRole('button', { name: 'Continue with Google' }))

    // Only the clicked button reports progress; the others merely lock.
    const redirecting = await screen.findByRole('button', { name: 'Redirecting…' })
    expect(redirecting).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Continue with GitHub' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Continue with Facebook' })).toBeDisabled()

    release(initialAuthState)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeEnabled()
    })
  })

  it('surfaces an error returned by the action', async () => {
    const action = stubAction({
      error: 'Unsupported provider: provider is not enabled',
      message: null,
    })
    const { user } = renderWithProviders(<OAuthButtons redirectTo="/protected" action={action} />)

    await user.click(screen.getByRole('button', { name: 'Continue with Facebook' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('provider is not enabled')
  })
})
