import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignOutButton } from '@/components/SignOutButton/SignOutButton'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/login/actions'
import styles from './page.module.css'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // `src/proxy.ts` already guards this route; this is defence in depth for the case
  // where the matcher is changed or the page is rendered outside a matched request.
  if (!user) {
    redirect('/login?redirectTo=/protected')
  }

  // RLS restricts this to the signed-in user's own row — no `.eq()` filter needed.
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, updated_at')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Protected</h1>
        <div className={styles.actions}>
          <Link className={styles.profileLink} href="/profile">
            Profile
          </Link>
          <SignOutButton action={signOut} />
        </div>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Your profile</h2>
        <dl className={styles.list}>
          <div className={styles.row}>
            <dt className={styles.term}>Email</dt>
            <dd className={styles.value}>{user.email}</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.term}>User ID</dt>
            <dd className={styles.value}>{user.id}</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.term}>Username</dt>
            <dd className={styles.value}>{profile?.username ?? '—'}</dd>
          </div>
          <div className={styles.row}>
            <dt className={styles.term}>Full name</dt>
            <dd className={styles.value}>{profile?.full_name ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <p className={styles.note}>
        The profile row above was created automatically by the <code>handle_new_user</code> trigger
        when this account signed up.
      </p>
    </main>
  )
}
