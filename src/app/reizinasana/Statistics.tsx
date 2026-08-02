import type { AnswerRecord } from '@/lib/training/sessionState'
import styles from './page.module.css'

export type StatisticsProps = {
  answers: AnswerRecord[]
  /** Questions the session was meant to have, so an aborted run still reads "4 no 10". */
  total: number
}

function formatSeconds(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(1)} s`
}

export function Statistics({ answers, total }: Readonly<StatisticsProps>) {
  const correct = answers.filter(answer => answer.isCorrect).length
  const totalMs = answers.reduce((sum, answer) => sum + answer.durationMs, 0)

  return (
    <section className={styles.stats}>
      <h1 className={styles.title}>Rezultāti</h1>

      <p className={styles.score}>
        {correct} no {total} pareizi
      </p>
      <p className={styles.lead}>Kopējais laiks: {formatSeconds(totalMs)}</p>

      {answers.length === 0 ? (
        <p className={styles.lead}>Šoreiz neviens piemērs netika atrisināts.</p>
      ) : (
        <ol className={styles.statsList}>
          {answers.map(answer => (
            <li key={answer.questionIndex} className={styles.statsRow}>
              <span className={styles.statsEquation}>
                {answer.question.left} × {answer.question.right} = {answer.question.answer}
              </span>
              <span className={answer.isCorrect ? styles.statsOk : styles.statsBad}>
                {answer.isCorrect ? '✓' : `✗ ${answer.givenAnswer}`}
              </span>
              <span className={styles.statsTime}>{formatSeconds(answer.durationMs)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
