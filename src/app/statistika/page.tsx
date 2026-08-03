import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SESSION_STATUS_LABELS, formatSessionStart, summariseSessions } from '@/lib/training/stats'
import type { AnswerFlagRow } from '@/lib/training/stats'
import styles from './page.module.css'

export const metadata = {
  title: 'Statistika',
}

/** Sessions listed on one page. Old runs stay in the database, they are just not shown. */
const SESSION_LIMIT = 50

export default async function StatistikaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // `src/proxy.ts` already guards this route; this is defence in depth for the case
  // where the matcher is changed or the page is rendered outside a matched request.
  if (!user) {
    redirect('/login?redirectTo=/statistika')
  }

  // RLS restricts both queries to the signed-in user's own rows — no `.eq()` filter needed.
  const { data: sessions, error } = await supabase
    .from('training_sessions')
    .select('id, started_at, ended_at, total_questions, status')
    .order('started_at', { ascending: false })
    .limit(SESSION_LIMIT)

  const ids = sessions?.map(session => session.id) ?? []
  let answers: AnswerFlagRow[] = []

  if (ids.length > 0) {
    const { data } = await supabase
      .from('training_answers')
      .select('session_id, is_correct')
      .in('session_id', ids)

    answers = data ?? []
  }

  const summaries = summariseSessions(sessions ?? [], answers)

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Statistika</h1>
        <Link className={styles.navLink} href="/reizinasana">
          Uz treniņu
        </Link>
      </header>

      {error && (
        <p className={styles.error} role="alert">
          Statistiku neizdevās ielādēt.
        </p>
      )}

      {!error && summaries.length === 0 && (
        <p className={styles.empty}>Vēl nav neviena treniņa. Sāc savu pirmo!</p>
      )}

      {summaries.length > 0 && (
        <ul className={styles.list}>
          {summaries.map(summary => (
            <li key={summary.id}>
              <Link className={styles.item} href={`/statistika/${summary.id}`}>
                <span className={styles.itemText}>
                  <span className={styles.itemDate}>{formatSessionStart(summary.startedAt)}</span>
                  <span className={styles.itemMeta}>
                    {summary.correct} no {summary.totalQuestions} pareizi ·{' '}
                    {SESSION_STATUS_LABELS[summary.status]}
                  </span>
                </span>
                <span className={styles.itemAccuracy}>{summary.accuracy}%</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.footer}>
        <Link className={styles.navLink} href="/">
          Uz Sākumu
        </Link>
      </div>
    </main>
  )
}
