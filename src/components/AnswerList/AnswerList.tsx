import { formatSeconds } from '@/lib/training/stats'
import type { AnswerRecord } from '@/lib/training/sessionState'
import styles from './AnswerList.module.css'

export type AnswerListProps = {
  answers: AnswerRecord[]
}

/**
 * Per-question breakdown of one session, shared by the end-of-drill screen and the
 * saved-session page so both read the same way.
 */
export function AnswerList({ answers }: Readonly<AnswerListProps>) {
  return (
    <ol className={styles.list}>
      {answers.map(answer => (
        <li key={answer.questionIndex} className={styles.row}>
          <span className={styles.equation}>
            {answer.question.left} × {answer.question.right} = {answer.question.answer}
          </span>
          <span className={answer.isCorrect ? styles.ok : styles.bad}>
            {answer.isCorrect ? '✓' : `✗ ${answer.givenAnswer ?? '—'}`}
          </span>
          <span className={styles.time}>{formatSeconds(answer.durationMs)}</span>
        </li>
      ))}
    </ol>
  )
}
