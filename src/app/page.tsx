import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import styles from './page.module.css'

const FEATURES = [
  {
    title: 'Next.js 16 App Router',
    body: 'Server Components by default, Server Actions for mutations, and proxy.ts for session refresh.',
  },
  {
    title: 'Supabase auth + Postgres',
    body: 'Cookie-based SSR auth via @supabase/ssr, with row level security on every table.',
  },
  {
    title: 'CSS Modules',
    body: 'Every component owns a component-name.module.css file. No global class name collisions.',
  },
  {
    title: 'Vitest + Testing Library',
    body: 'Component unit tests co-located next to the components they cover.',
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Full Stack Starter</h1>
      <p className={styles.subtitle}>
        {user ? `Signed in as ${user.email}.` : 'A template repo for Next.js + Supabase projects.'}
      </p>

      <div className={styles.stack}>
        {FEATURES.map(feature => (
          <section key={feature.title} className={styles.card}>
            <h2 className={styles.cardTitle}>{feature.title}</h2>
            <p className={styles.cardBody}>{feature.body}</p>
          </section>
        ))}
      </div>

      <div className={styles.actions}>
        <Link href="/protected">Go to the protected page</Link>
        {!user && <Link href="/login">Sign in</Link>}
      </div>
    </main>
  )
}
