import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '@/test/utils'
import { initialProfileState } from '@/lib/profile/profileState'
import type { ProfileState } from '@/lib/profile/profileState'
import { ProfileCard } from './ProfileCard'

function renderCard(username: string | null = 'demo', result: ProfileState = initialProfileState) {
  const action = vi.fn().mockResolvedValue(result)

  return {
    action,
    ...renderWithProviders(
      <ProfileCard email="demo@example.com" username={username} action={action} />,
    ),
  }
}

describe('ProfileCard', () => {
  it('shows the current username in read mode', () => {
    renderCard()

    expect(screen.getByText('demo@example.com')).toBeInTheDocument()
    expect(screen.getByText('demo')).toBeInTheDocument()
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
  })

  it('falls back to a dash when no username is set', () => {
    renderCard(null)

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('reveals the input seeded with the current username when editing', async () => {
    const { user } = renderCard()

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByLabelText('Username')).toHaveValue('demo')
  })

  it('returns to read mode when cancelled', async () => {
    const { user } = renderCard()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('runs the server action on submit', async () => {
    const { action, user } = renderCard()

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Username'))
    await user.type(screen.getByLabelText('Username'), 'newname')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(action).toHaveBeenCalledOnce()
    })

    const formData = action.mock.calls[0]?.[1] as FormData
    expect(formData.get('username')).toBe('newname')
  })

  it('collapses to read mode and confirms after a successful save', async () => {
    const { user } = renderCard('demo', { error: null, message: 'Username updated.' })

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Username updated.')
    })
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
  })

  it('does not resurface a stale success message on a later edit', async () => {
    const { user } = renderCard('demo', { error: null, message: 'Username updated.' })

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('surfaces an error returned by the action without leaving edit mode', async () => {
    const { user } = renderCard('demo', {
      error: 'That username is already taken.',
      message: null,
    })

    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('That username is already taken.')
    })
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
  })
})
