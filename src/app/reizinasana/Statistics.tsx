import { AnswerList } from '@/components/AnswerList/AnswerList'
import { formatSeconds, totalDurationMs } from '@/lib/training/stats'
import type { AnswerRecord } from '@/lib/training/sessionState'
import styles from './page.module.css'

export type StatisticsProps = {
  answers: AnswerRecord[]
  /** Questions the session was meant to have, so an aborted run still reads "4 no 10". */
  total: number
}

export function Statistics({ answers, total }: Readonly<StatisticsProps>) {
  const correct = answers.filter(answer => answer.isCorrect).length

  return (
    <section className={styles.stats}>
      <h1 className={styles.title}>Rezultāti</h1>

      <p className={styles.score}>
        {correct} no {total} pareizi
      </p>
      <p className={styles.lead}>Kopējais laiks: {formatSeconds(totalDurationMs(answers))}</p>

      {answers.length === 0 ? (
        <p className={styles.lead}>Šoreiz neviens piemērs netika atrisināts.</p>
      ) : (
        <AnswerList answers={answers} />
      )}
    </section>
  )
}
