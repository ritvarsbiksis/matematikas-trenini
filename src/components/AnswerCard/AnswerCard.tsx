import styles from './AnswerCard.module.css'

/**
 * `neutral` while the question is open, then `correct` / `wrong` to mark the tapped
 * answer and `revealed` to point out the right one after a miss.
 */
export type AnswerCardState = 'neutral' | 'correct' | 'wrong' | 'revealed'

export type AnswerCardProps = {
  value: number
  state?: AnswerCardState
  disabled?: boolean
  onClick?: () => void
}

/** One big, tappable answer tile. */
export function AnswerCard({
  value,
  state = 'neutral',
  disabled = false,
  onClick,
}: Readonly<AnswerCardProps>) {
  return (
    <button
      type="button"
      className={`${styles.card} ${styles[state]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {value}
    </button>
  )
}
