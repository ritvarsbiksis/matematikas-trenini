import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeRedirect } from '@/lib/auth/redirects'
import { OAuthButtons } from '@/components/OAuthButtons/OAuthButtons'
import { LoginForm } from './LoginForm'
import { signInWithOAuth } from './actions'
import styles from './page.module.css'

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo, error } = await searchParams
  const target = safeRedirect(redirectTo ?? '')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect(target)
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Sign in</h1>

      {/* Errors bounced back from `/auth/callback` belong above both forms,
          since either one could have produced them. */}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <OAuthButtons redirectTo={target} action={signInWithOAuth} />
      <p className={styles.hint}>New here? Signing in with a provider creates your account.</p>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <LoginForm redirectTo={target} />
    </main>
  )
}
