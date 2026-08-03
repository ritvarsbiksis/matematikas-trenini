'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { AnswerCard } from '@/components/AnswerCard/AnswerCard'
import { Button } from '@/components/Button/Button'
import { now } from '@/lib/training/clock'
import { buildOptions, generateQuestions } from '@/lib/training/multiplication'
import { FEEDBACK_COOLDOWN_MS, QUESTIONS_PER_SESSION } from '@/lib/training/sessionState'
import type { AnswerCardState } from '@/components/AnswerCard/AnswerCard'
import type { Question } from '@/lib/training/multiplication'
import type { AnswerRecord, SessionStatus, TrainingActions } from '@/lib/training/sessionState'
import { Statistics } from './Statistics'
import styles from './page.module.css'

type Phase = 'idle' | 'question' | 'feedback' | 'finished'

type Round = {
  question: Question
  options: number[]
}

const SAVE_ERROR = 'Rezultāts netika saglabāts.'

function buildRounds(): Round[] {
  return generateQuestions(QUESTIONS_PER_SESSION).map(question => ({
    question,
    options: buildOptions(question),
  }))
}

export function TrainingClient({
  startSession,
  recordAnswer,
  finishSession,
}: Readonly<TrainingActions>) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [rounds, setRounds] = useState<Round[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Mirrors of state that the cooldown timeout reads. The timeout fires outside React's
  // render cycle, where the captured `index` / `sessionId` would be a render behind.
  const indexRef = useRef(0)
  const sessionIdRef = useRef<string | null>(null)
  const questionShownAtRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => clearTimer, [])

  function showQuestion(nextIndex: number) {
    indexRef.current = nextIndex
    setIndex(nextIndex)
    questionShownAtRef.current = now()
    setPhase('question')
  }

  function endSession(status: Exclude<SessionStatus, 'in_progress'>) {
    clearTimer()
    setPhase('finished')

    const sessionId = sessionIdRef.current
    sessionIdRef.current = null

    if (sessionId) {
      void finishSession(sessionId, status)
        .then(result => {
          if (result.error) {
            setSaveError(SAVE_ERROR)
          }
        })
        .catch(() => setSaveError(SAVE_ERROR))
    }
  }

  function advance() {
    clearTimer()

    const next = indexRef.current + 1

    if (next >= QUESTIONS_PER_SESSION) {
      endSession('completed')
      return
    }

    showQuestion(next)
  }

  async function handleStart() {
    setStarting(true)
    setStartError(null)
    setSaveError(null)

    const result = await startSession()

    setStarting(false)

    if (result.error !== null) {
      setStartError(result.error)
      return
    }

    sessionIdRef.current = result.sessionId
    setRounds(buildRounds())
    setAnswers([])
    showQuestion(0)
  }

  function handleAnswer(value: number) {
    // Ignores taps during the cooldown, so a fast double tap cannot answer twice.
    if (phase !== 'question') {
      return
    }

    const { question } = rounds[indexRef.current]
    const durationMs = Math.max(0, Math.round(now() - questionShownAtRef.current))
    const isCorrect = value === question.answer

    setAnswers(previous => [
      ...previous,
      { questionIndex: indexRef.current, question, givenAnswer: value, isCorrect, durationMs },
    ])
    setPhase('feedback')
    timerRef.current = setTimeout(advance, FEEDBACK_COOLDOWN_MS)

    const sessionId = sessionIdRef.current

    if (sessionId) {
      // Deliberately not awaited: a slow or failed write must not hold up the drill.
      void recordAnswer({
        sessionId,
        questionIndex: indexRef.current,
        leftOperand: question.left,
        rightOperand: question.right,
        correctAnswer: question.answer,
        givenAnswer: value,
        isCorrect,
        durationMs,
      })
        .then(result => {
          if (result.error) {
            setSaveError(SAVE_ERROR)
          }
        })
        .catch(() => setSaveError(SAVE_ERROR))
    }
  }

  if (phase === 'idle' || phase === 'finished') {
    // The idle screen centres its "Sākt" button; the statistics list starts from the top.
    const screenClass = phase === 'idle' ? `${styles.screen} ${styles.centered}` : styles.screen

    return (
      <div className={screenClass}>
        {phase === 'finished' ? (
          <Statistics answers={answers} total={QUESTIONS_PER_SESSION} />
        ) : (
          <div className={styles.intro}>
            <h1 className={styles.title}>Reizināšana</h1>
            <p className={styles.lead}>
              {QUESTIONS_PER_SESSION} piemēri ar reizināšanu no 1 līdz 10. Izvēlies pareizo atbildi!
            </p>
          </div>
        )}

        {startError && (
          <p className={styles.error} role="alert">
            {startError}
          </p>
        )}
        {saveError && (
          <p className={styles.warning} role="status">
            {saveError}
          </p>
        )}

        <Button fullWidth onClick={() => void handleStart()} disabled={starting}>
          {starting ? 'Sākam…' : 'Sākt'}
        </Button>

        <nav className={styles.navActions}>
          <Link className={styles.navLink} href="/">
            Uz Sākumu
          </Link>
          <Link className={styles.navLink} href="/statistika">
            Statistika
          </Link>
        </nav>
      </div>
    )
  }

  const round = rounds[index]
  const lastAnswer = answers.at(-1)
  const showingFeedback = phase === 'feedback' && lastAnswer !== undefined

  function cardState(option: number): AnswerCardState {
    if (!showingFeedback || !lastAnswer) {
      return 'neutral'
    }

    if (option === lastAnswer.givenAnswer) {
      return lastAnswer.isCorrect ? 'correct' : 'wrong'
    }

    if (!lastAnswer.isCorrect && option === round.question.answer) {
      return 'revealed'
    }

    return 'neutral'
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <p className={styles.progress}>
          {index + 1} / {QUESTIONS_PER_SESSION}
        </p>
        <button
          type="button"
          className={styles.close}
          aria-label="Beigt treniņu"
          onClick={() => endSession('aborted')}
        >
          ×
        </button>
      </header>

      <div className={styles.question}>
        <span className={styles.equation}>
          {round.question.left} × {round.question.right}
        </span>
        <span className={styles.equals}>= ?</span>
      </div>

      <div className={styles.feedback} aria-live="polite">
        {showingFeedback && (
          <p className={lastAnswer.isCorrect ? styles.correctText : styles.wrongText}>
            {lastAnswer.isCorrect ? 'Pareizi!' : 'Nav pareizi!'}
          </p>
        )}
      </div>

      <div className={styles.options}>
        {round.options.map(option => (
          <AnswerCard
            key={option}
            value={option}
            state={cardState(option)}
            disabled={phase !== 'question'}
            onClick={() => handleAnswer(option)}
          />
        ))}
      </div>

      <div className={styles.footer}>
        {showingFeedback ? (
          <Button fullWidth variant="secondary" onClick={advance}>
            Tālāk
          </Button>
        ) : (
          <p className={styles.hint}>Izvēlies pareizo atbildi</p>
        )}
      </div>
    </div>
  )
}
