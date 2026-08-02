import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import styles from './page.module.css'

/** Training worlds. Only multiplication is built so far; the rest are placeholders. */
const WORLDS = [
  {
    title: 'Reizināšana',
    subtitle: '1 × 1 līdz 10 × 10',
    emoji: '✖️',
    href: '/reizinasana',
    tone: styles.tonePink,
  },
  {
    title: 'Saskaitīšana',
    subtitle: 'Drīzumā',
    emoji: '➕',
    href: null,
    tone: styles.toneBlue,
  },
  {
    title: 'Atņemšana',
    subtitle: 'Drīzumā',
    emoji: '➖',
    href: null,
    tone: styles.toneGreen,
  },
  {
    title: 'Dalīšana',
    subtitle: 'Drīzumā',
    emoji: '➗',
    href: null,
    tone: styles.toneYellow,
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p className={styles.greeting}>Sveiks!</p>
        <h1 className={styles.title}>Matemātikas treniņi 🚀</h1>
        <p className={styles.subtitle}>
          {user ? 'Gatavs šodienas treniņam?' : 'Pieslēdzies, lai sāktu trenēties.'}
        </p>
      </header>

      <h2 className={styles.sectionTitle}>Izvēlies pasauli</h2>

      <div className={styles.grid}>
        {WORLDS.map(world =>
          world.href ? (
            <Link key={world.title} href={world.href} className={`${styles.tile} ${world.tone}`}>
              <span className={styles.tileEmoji}>{world.emoji}</span>
              <span className={styles.tileTitle}>{world.title}</span>
              <span className={styles.tileSubtitle}>{world.subtitle}</span>
            </Link>
          ) : (
            <div
              key={world.title}
              className={`${styles.tile} ${world.tone} ${styles.tileDisabled}`}
              aria-disabled="true"
            >
              <span className={styles.tileEmoji}>{world.emoji}</span>
              <span className={styles.tileTitle}>{world.title}</span>
              <span className={styles.tileSubtitle}>{world.subtitle}</span>
            </div>
          ),
        )}
      </div>

      <div className={styles.actions}>
        {user ? <Link href="/profile">Mans profils</Link> : <Link href="/login">Pieslēgties</Link>}
      </div>
    </main>
  )
}
