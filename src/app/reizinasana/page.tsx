import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrainingClient } from './TrainingClient'
import { finishSession, loadPairStats, recordAnswer, startSession } from './actions'
import styles from './page.module.css'

export const metadata = {
  title: 'Reizināšana',
}

export default async function ReizinasanaPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // `src/proxy.ts` already guards this route; this is defence in depth for the case
  // where the matcher is changed or the page is rendered outside a matched request.
  if (!user) {
    redirect('/login?redirectTo=/reizinasana')
  }

  return (
    <main className={styles.main}>
      {/* Server Actions are passed as props, so jsdom tests can inject stubs. */}
      <TrainingClient
        startSession={startSession}
        loadPairStats={loadPairStats}
        recordAnswer={recordAnswer}
        finishSession={finishSession}
      />
    </main>
  )
}
