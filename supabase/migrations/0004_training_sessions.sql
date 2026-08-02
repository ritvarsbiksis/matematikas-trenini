-- Training sessions and their individual answers.
--
-- One `training_sessions` row per drill a user starts, one `training_answers` row per
-- question answered. The per-answer `duration_ms` and the session timestamps are what
-- future statistics screens are built from, so they are captured even when a session is
-- abandoned half way through.

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'multiplication',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_questions int not null default 10,
  status text not null default 'in_progress',

  constraint training_sessions_status_check
    check (status in ('in_progress', 'completed', 'aborted'))
);

comment on table public.training_sessions is 'One training session (drill run) per row.';

create index if not exists training_sessions_user_started_idx
  on public.training_sessions (user_id, started_at desc);

create table if not exists public.training_answers (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_index int not null,
  left_operand int not null,
  right_operand int not null,
  correct_answer int not null,
  given_answer int,
  is_correct boolean not null,
  duration_ms int not null,
  answered_at timestamptz not null default now(),

  constraint training_answers_question_index_check check (question_index >= 0),
  constraint training_answers_left_operand_check check (left_operand between 1 and 10),
  constraint training_answers_right_operand_check check (right_operand between 1 and 10),
  constraint training_answers_duration_ms_check check (duration_ms >= 0),
  -- A retried Server Action must not double-insert the same question.
  constraint training_answers_session_question_key unique (session_id, question_index)
);

comment on table public.training_answers is 'One answered question inside a training session.';

create index if not exists training_answers_session_idx
  on public.training_answers (session_id, question_index);

-- Row level security -------------------------------------------------------

alter table public.training_sessions enable row level security;

drop policy if exists "Sessions are viewable by their owner" on public.training_sessions;
create policy "Sessions are viewable by their owner"
  on public.training_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own sessions" on public.training_sessions;
create policy "Users can insert their own sessions"
  on public.training_sessions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own sessions" on public.training_sessions;
create policy "Users can update their own sessions"
  on public.training_sessions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.training_answers enable row level security;

drop policy if exists "Answers are viewable by their owner" on public.training_answers;
create policy "Answers are viewable by their owner"
  on public.training_answers
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- The `exists` clause stops an answer being attached to somebody else's session, which
-- the `user_id` check alone would allow.
drop policy if exists "Users can insert answers into their own sessions" on public.training_answers;
create policy "Users can insert answers into their own sessions"
  on public.training_answers
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.training_sessions s
      where s.id = session_id
        and s.user_id = (select auth.uid())
    )
  );
