# Test plan — basic operations

Scope: the core user-visible behaviour of the app — the home screen, the route guard,
and the multiplication drill (`/reizinasana`) with its results and statistics screens.
Out of scope here: OAuth provider flows, magic-link delivery, profile editing.

App is Latvian; all assertions below quote the literal UI strings.

## Environment

- App: `pnpm dev` on `http://localhost:3000`.
- Database: local Supabase (`pnpm db:start`, requires Docker) with `pnpm db:reset` applied,
  which seeds `demo@example.com` / `password123` via `supabase/seed.sql`.
- Seed file for signed-out suites: `seed.spec.ts` (navigates to `http://localhost:3000`).
- Seed file for signed-in suites: `tests/auth.setup.ts`. It signs in as the demo user on
  `/login` and saves the storage state, which the `chromium-authenticated` Playwright
  project reuses. Every suite marked _(authenticated)_ depends on it, and on the app being
  pointed at local Supabase — a hosted project has no seeded demo user.

## Suite: Home screen

Seed: `seed.spec.ts`

1. **shows the four training worlds** — Navigate to `/`. Expect heading
   `Matemātikas treniņi 🚀`, section heading `Izvēlies pasauli`, and four tiles:
   `Reizināšana` (subtitle `1 × 1 līdz 10 × 10`), `Saskaitīšana`, `Atņemšana`, `Dalīšana`
   (each `Drīzumā`).
2. **only multiplication is a link** — On `/`, expect `Reizināšana` to be a link to
   `/reizinasana`; expect the other three tiles to carry `aria-disabled="true"` and to have
   no `href`.
3. **signed-out header and action** — On `/` while signed out, expect the subtitle
   `Pieslēdzies, lai sāktu trenēties.` and a `Pieslēgties` link to `/login`.
4. **signed-in header and action** _(authenticated)_ — On `/` while signed in, expect the
   subtitle `Gatavs šodienas treniņam?` and a `Mans profils` link to `/profile`.

## Suite: Route protection

Seed: `seed.spec.ts`

1. **drill redirects when signed out** — Navigate to `/reizinasana`. Expect the URL to be
   `/login?redirectTo=%2Freizinasana` and the heading `Sign in` to be visible.
2. **statistics redirects when signed out** — Navigate to `/statistika`. Expect the URL to
   be `/login?redirectTo=%2Fstatistika`.
3. **session detail redirects when signed out** — Navigate to `/statistika/abc-123`. Expect
   the URL to be `/login?redirectTo=%2Fstatistika%2Fabc-123`.
4. **signed-in user is bounced off login** _(authenticated)_ — Navigate to
   `/login?redirectTo=/reizinasana`. Expect to land on `/reizinasana`.

## Suite: Drill start screen _(authenticated)_

1. **intro copy and actions** — Navigate to `/reizinasana`. Expect heading `Reizināšana`,
   the lead text `10 piemēri ar reizināšanu no 1 līdz 10. Izvēlies pareizo atbildi!`, a
   `Sākt` button, and nav links `Uz Sākumu` (→ `/`) and `Statistika` (→ `/statistika`).
2. **starting shows the first question** — Click `Sākt`. Expect progress `1 / 10`, an
   equation of the form `N × M`, `= ?`, exactly three answer buttons, the hint
   `Izvēlies pareizo atbildi`, and a `Beigt treniņu` close button.
3. **the correct answer is always offered** — Click `Sākt`, read the two operands from the
   equation, and expect one of the three answer buttons to equal their product.

## Suite: Answering a question _(authenticated)_

Each test starts from `/reizinasana` → `Sākt`.

1. **correct answer is confirmed** — Click the button whose value equals the product.
   Expect the text `Pareizi!`, the clicked card marked correct, and a `Tālāk` button in
   place of the hint.
2. **wrong answer is rejected and the right one revealed** — Click a button whose value is
   not the product. Expect `Nav pareizi!`, the clicked card marked wrong, and the card
   holding the product marked as revealed.
3. **`Tālāk` advances immediately** — Answer question 1, click `Tālāk`. Expect progress
   `2 / 10` and no feedback text.
4. **feedback auto-advances** — Answer question 1 and do not click. Within ~1.5 s expect
   progress `2 / 10` on its own.
5. **answer buttons are inert during feedback** — Answer question 1, then immediately click
   a second answer button. Expect progress to still read `1 / 10` and the feedback text to
   be unchanged (a double tap must not answer twice).
6. **consecutive questions differ** — Answer questions 1 and 2. Expect the two equations to
   use a different operand pair.

## Suite: Finishing a session _(authenticated)_

1. **completing all ten shows results** — Start a drill and answer all ten questions
   (clicking `Tālāk` each time). Expect heading `Rezultāti`, a score line matching
   `N no 10 pareizi`, a `Kopējais laiks: X.X s` line, and a list of exactly 10 rows.
2. **all-correct run scores 10** — Answer every question with the product. Expect
   `10 no 10 pareizi` and 10 rows each showing `✓`.
3. **wrong answers are itemised** — Answer question 1 wrongly and the rest correctly.
   Expect `9 no 10 pareizi`, and the first row to read `L × R = P` with `✗ <given answer>`.
4. **aborting shows a partial result** — Answer 3 questions, then click `Beigt treniņu`.
   Expect heading `Rezultāti`, a score line ending `no 10 pareizi`, and 3 rows.
5. **aborting before answering anything** — Click `Sākt`, then `Beigt treniņu` on question
   1. Expect `0 no 10 pareizi` and the text `Šoreiz neviens piemērs netika atrisināts.`
6. **a second run can be started from the results** — After finishing, click `Sākt`. Expect
   progress `1 / 10` and a fresh question.

## Suite: Statistics _(authenticated)_

1. **empty state for a new user** — With no sessions recorded, navigate to `/statistika`.
   Expect heading `Statistika` and the text `Vēl nav neviena treniņa. Sāc savu pirmo!`
2. **a completed session appears in the list** — Complete a drill, then open `Statistika`.
   Expect the newest list entry to show a Latvian date, `N no 10 pareizi · Pabeigts`, and
   an accuracy percentage.
3. **an aborted session is labelled** — Abort a drill after 2 answers, then open
   `Statistika`. Expect the newest entry to read `… · Pārtraukts`.
4. **newest session is listed first** — Complete two drills with different scores. Expect
   the second run's entry to be the first item in the list.
5. **opening a session shows its detail** — Click the newest entry. Expect the URL
   `/statistika/<uuid>`, a large accuracy heading `NN%`, `N no 10 pareizi`, a
   `Pabeigts · Kopējais laiks: X.X s` line, and one row per answered question.
6. **detail page navigation** — On a session detail page, click `Atpakaļ` → expect
   `/statistika`; click `Uz Sākumu` → expect `/`.
7. **an unknown session id 404s** — Navigate to
   `/statistika/00000000-0000-0000-0000-000000000000`. Expect the not-found page.
8. **another user's session is not readable** — Sign in as a second user and open the first
   user's session URL. Expect the not-found page (RLS makes it invisible).

## Notes / risks

- The results and statistics screens both render `AnswerList`, so the per-question row
  format (`L × R = P`, `✓` or `✗ given`, `X.X s`) can be asserted with one shared helper.
- Timing values (`Kopējais laiks`, per-row seconds) are wall-clock dependent — assert the
  `X.X s` shape, not a value.
- `recordAnswer` is fired without being awaited, so a completed drill may need a short wait
  before the statistics list reflects it.
- Question generation is random. Tests must read the operands from the DOM and compute the
  expected product rather than hard-coding answers.
