'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/Button/Button'
import { initialAuthState } from '@/lib/auth/authState'
import type { AuthState } from '@/lib/auth/authState'
import { OAUTH_PROVIDERS } from '@/lib/auth/providers'
import type { OAuthProvider } from '@/lib/auth/providers'
import { FacebookIcon, GitHubIcon, GoogleIcon } from './icons'
import styles from './OAuthButtons.module.css'

type ProviderPresentation = {
  label: string
  Icon: (props: { className?: string }) => React.ReactElement
}

/**
 * Keyed by `OAuthProvider`, so adding an id to `OAUTH_PROVIDERS` without giving
 * it a label and a mark here is a compile error.
 */
const PROVIDERS: Record<OAuthProvider, ProviderPresentation> = {
  google: { label: 'Google', Icon: GoogleIcon },
  github: { label: 'GitHub', Icon: GitHubIcon },
  facebook: { label: 'Facebook', Icon: FacebookIcon },
}

function ProviderButton({ provider }: Readonly<{ provider: OAuthProvider }>) {
  // `useFormStatus` only reports the enclosing form, so `data` is how we tell
  // which of the three buttons was the submitter.
  const { pending, data } = useFormStatus()
  const { label, Icon } = PROVIDERS[provider]
  const isRedirecting = pending && data?.get('provider') === provider

  return (
    <Button
      type="submit"
      variant="secondary"
      name="provider"
      value={provider}
      disabled={pending}
      fullWidth
      className={styles.provider}
    >
      <Icon className={styles.icon} />
      <span>{isRedirecting ? 'Redirecting…' : `Continue with ${label}`}</span>
    </Button>
  )
}

export type OAuthButtonsProps = {
  /** Path to land on once the provider round trip completes. */
  redirectTo: string
  /**
   * Server Action that starts the OAuth flow. Injected rather than imported so
   * this component stays renderable under jsdom — same reason as `SignOutButton`.
   */
  action: (state: AuthState, formData: FormData) => Promise<AuthState>
}

/**
 * One form, one Server Action, three submit buttons. The clicked button's
 * `name`/`value` pair rides along in the FormData, which is what tells the
 * action which provider to start.
 *
 * These buttons register *and* sign in: Supabase creates the user on the first
 * successful OAuth callback, so there is no separate sign-up path.
 */
export function OAuthButtons({ redirectTo, action }: Readonly<OAuthButtonsProps>) {
  const [state, formAction] = useActionState(action, initialAuthState)

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {OAUTH_PROVIDERS.map(provider => (
        <ProviderButton key={provider} provider={provider} />
      ))}

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
    </form>
  )
}
