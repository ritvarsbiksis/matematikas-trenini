import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AnswerList } from '@/components/AnswerList/AnswerList'
import { createClient } from '@/lib/supabase/server'
import {
  SESSION_STATUS_LABELS,
  formatSeconds,
  formatSessionStart,
  summariseSessions,
  toAnswerRecord,
  totalDurationMs,
} from '@/lib/training/stats'
import styles from './page.module.css'

export const metadata = {
  title: 'Treniņa statistika',
}

type SessionPageProps = {
  params: Promise<{ id: string }>
}

export default async function SessionStatisticsPage({ params }: Readonly<SessionPageProps>) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // `src/proxy.ts` already guards this route; this is defence in depth for the case
  // where the matcher is changed or the page is rendered outside a matched request.
  if (!user) {
    redirect(`/login?redirectTo=/statistika/${id}`)
  }

  // RLS keeps this to the caller's own sessions, so somebody else's id — like a malformed
  // one — simply finds nothing and falls through to the 404 below.
  const { data: session } = await supabase
    .from('training_sessions')
    .select('id, started_at, ended_at, total_questions, status')
    .eq('id', id)
    .maybeSingle()

  if (!session) {
    notFound()
  }

  const { data: rows } = await supabase
    .from('training_answers')
    .select('*')
    .eq('session_id', id)
    .order('question_index', { ascending: true })

  const answerRows = rows ?? []
  const answers = answerRows.map(toAnswerRecord)
  const [summary] = summariseSessions([session], answerRows)

  return (
    <main className={styles.main}>
      <p className={styles.date}>{formatSessionStart(summary.startedAt)}</p>
      <h1 className={styles.accuracy}>{summary.accuracy}%</h1>

      <p className={styles.score}>
        {summary.correct} no {summary.totalQuestions} pareizi
      </p>
      <p className={styles.meta}>
        {SESSION_STATUS_LABELS[summary.status]} · Kopējais laiks:{' '}
        {formatSeconds(totalDurationMs(answers))}
      </p>

      {answers.length === 0 ? (
        <p className={styles.empty}>Šajā treniņā neviens piemērs netika atrisināts.</p>
      ) : (
        <AnswerList answers={answers} />
      )}

      <div className={styles.footer}>
        <Link className={styles.navLink} href="/statistika">
          Atpakaļ
        </Link>
        <Link className={styles.navLink} href="/">
          Uz Sākumu
        </Link>
      </div>
    </main>
  )
}
