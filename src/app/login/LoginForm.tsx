'use client'

import { useActionState } from 'react'
import { Button } from '@/components/Button/Button'
import { signIn, signInWithMagicLink, signUp } from './actions'
import { initialAuthState } from '@/lib/auth/authState'
import styles from './page.module.css'

export type LoginFormProps = {
  redirectTo: string
}

export function LoginForm({ redirectTo }: Readonly<LoginFormProps>) {
  const [signInState, signInAction, signInPending] = useActionState(signIn, initialAuthState)
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialAuthState)
  const [magicState, magicAction, magicPending] = useActionState(
    signInWithMagicLink,
    initialAuthState,
  )

  const pending = signInPending || signUpPending || magicPending
  const error = signInState.error ?? signUpState.error ?? magicState.error
  const message = signInState.message ?? signUpState.message ?? magicState.message

  return (
    <form className={styles.form}>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          className={styles.input}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          className={styles.input}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={6}
        />
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className={styles.message} role="status">
          {message}
        </p>
      )}

      <div className={styles.buttons}>
        <Button type="submit" formAction={signInAction} disabled={pending} fullWidth>
          {signInPending ? 'Signing in…' : 'Sign in'}
        </Button>
        <Button
          type="submit"
          variant="secondary"
          formAction={signUpAction}
          disabled={pending}
          fullWidth
        >
          {signUpPending ? 'Creating account…' : 'Create account'}
        </Button>
        <Button
          type="submit"
          variant="secondary"
          formAction={magicAction}
          disabled={pending}
          fullWidth
        >
          {magicPending ? 'Sending…' : 'Email me a magic link'}
        </Button>
      </div>
    </form>
  )
}
