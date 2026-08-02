/**
 * Monotonic clock used to time answers.
 *
 * Wrapped rather than called inline so the drill measures elapsed time with a clock the
 * user cannot skew by changing the system time, and so `react-hooks/purity` does not see
 * an impure global inside the component.
 */
export function now(): number {
  return performance.now()
}
