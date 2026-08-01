import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileCard } from './ProfileCard'
import { updateUsername } from './actions'
import styles from './page.module.css'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // `src/proxy.ts` already guards this route; this is defence in depth for the case
  // where the matcher is changed or the page is rendered outside a matched request.
  if (!user) {
    redirect('/login?redirectTo=/profile')
  }

  // RLS restricts this to the signed-in user's own row.
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <Link className={styles.backLink} href="/protected">
          Back
        </Link>
      </header>

      <ProfileCard
        email={user.email ?? '—'}
        username={profile?.username ?? null}
        action={updateUsername}
      />
    </main>
  )
}
