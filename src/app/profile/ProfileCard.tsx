'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/Button/Button'
import { initialProfileState } from '@/lib/profile/profileState'
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  USERNAME_RULE_MESSAGE,
} from '@/lib/profile/username'
import type { ProfileState } from '@/lib/profile/profileState'
import styles from './page.module.css'

export type ProfileCardProps = {
  email: string
  username: string | null
  /** Server Action that writes the new username. */
  action: (state: ProfileState, formData: FormData) => Promise<ProfileState>
}

export function ProfileCard({ email, username, action }: Readonly<ProfileCardProps>) {
  const [isEditing, setIsEditing] = useState(false)
  // `useActionState` keeps the last result indefinitely, so track confirmation
  // separately — otherwise a later Edit → Cancel would resurface a stale success.
  const [saved, setSaved] = useState(false)

  function startEditing() {
    setSaved(false)
    setIsEditing(true)
  }

  // A successful save collapses the card; the fresh value arrives with the
  // `revalidatePath` re-render of the surrounding Server Component. Collapsing
  // here rather than in an effect keeps it a single transition, with no
  // intermediate render showing the stale form.
  const [state, formAction, pending] = useActionState(
    async (previous: ProfileState, formData: FormData) => {
      const next = await action(previous, formData)

      if (next.message) {
        setSaved(true)
        setIsEditing(false)
      }

      return next
    },
    initialProfileState,
  )

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Your profile</h2>

      <dl className={styles.list}>
        <div className={styles.row}>
          <dt className={styles.term}>Email</dt>
          <dd className={styles.value}>{email}</dd>
        </div>

        {!isEditing && (
          <div className={styles.row}>
            <dt className={styles.term}>Username</dt>
            <dd className={styles.value}>{username ?? '—'}</dd>
          </div>
        )}
      </dl>

      {isEditing ? (
        <form className={styles.form} action={formAction}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">
              Username
            </label>
            <input
              className={styles.input}
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              defaultValue={username ?? ''}
              minLength={USERNAME_MIN_LENGTH}
              maxLength={USERNAME_MAX_LENGTH}
              pattern={USERNAME_PATTERN}
              title={USERNAME_RULE_MESSAGE}
              required
            />
            <p className={styles.hint}>{USERNAME_RULE_MESSAGE}</p>
          </div>

          {state.error && (
            <p className={styles.error} role="alert">
              {state.error}
            </p>
          )}

          <div className={styles.buttons}>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={pending}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className={styles.buttons}>
          <Button variant="secondary" onClick={startEditing}>
            Edit
          </Button>
        </div>
      )}

      {!isEditing && saved && state.message && (
        <p className={styles.message} role="status">
          {state.message}
        </p>
      )}
    </section>
  )
}
