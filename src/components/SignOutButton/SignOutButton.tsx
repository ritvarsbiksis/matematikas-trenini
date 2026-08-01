'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/Button/Button'
import styles from './SignOutButton.module.css'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="danger" disabled={pending}>
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}

export type SignOutButtonProps = {
  /** Server Action that ends the session. */
  action: () => Promise<void>
}

export function SignOutButton({ action }: Readonly<SignOutButtonProps>) {
  return (
    <form action={action} className={styles.form}>
      <SubmitButton />
    </form>
  )
}
