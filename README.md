# Full Stack Starter

Template repo for full-stack React projects: **Next.js 16** (App Router, SSR), **Supabase**
(Postgres + auth), **CSS Modules**, and **Vitest + Testing Library** for component unit tests.

## Stack

| Concern    | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack, Server Actions) |
| UI         | React 19                                           |
| Backend    | Supabase — Postgres, auth, row level security      |
| Styling    | CSS Modules, one `*.module.css` per component      |
| Tests      | Vitest 4 + @testing-library/react, jsdom           |
| Language   | TypeScript 6 (strict)                              |
| Lint       | ESLint 10 flat config, type-aware                  |
| Formatting | Prettier 3                                         |

## Getting started

Requires **Node >= 20.9** (`.nvmrc` pins 24.11.1) and **pnpm**. Docker is needed only for the
local database.

```bash
nvm use && pnpm install && cp .env.example .env.local
```

Then either point `.env.local` at a hosted Supabase project, or start one locally:

```bash
pnpm db:start && pnpm db:reset
```

`pnpm db:start` prints the API URL and anon key — copy them into `.env.local`. Then:

```bash
pnpm dev
```

## Scripts

| Script                 | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `pnpm dev`             | Dev server on http://localhost:3000             |
| `pnpm build` / `start` | Production build / serve                        |
| `pnpm lint`            | ESLint (`lint:fix` to autofix)                  |
| `pnpm typecheck`       | `tsc --noEmit`                                  |
| `pnpm format`          | Prettier write (`format:check` to verify)       |
| `pnpm test`            | Vitest once (`test:watch`, `test:coverage`)     |
| `pnpm db:start`/`stop` | Local Supabase stack                            |
| `pnpm db:reset`        | Re-apply migrations and seed                    |
| `pnpm db:types`        | Regenerate `src/lib/supabase/database.types.ts` |

## Layout

```
src/
  proxy.ts                  Session refresh + route guard (Next 16's middleware)
  app/
    layout.tsx page.tsx     Root layout and home page
    login/                  Login page, client form, auth Server Actions
    auth/callback/route.ts  PKCE code exchange
    protected/              Auth-gated page reading the profiles table
  components/
    Button/                 Button.tsx + Button.module.css + Button.test.tsx
    OAuthButtons/           Google / GitHub / Facebook sign-in
    SignOutButton/
  lib/
    env.ts                  Validated Supabase env vars
    auth/                   Provider list, redirect guard, Server Action state
    supabase/               Browser / server / proxy clients + generated types
  test/utils.tsx            renderWithProviders helper
supabase/
  migrations/               SQL migrations
  seed.sql                  Local dev data
configs/                    Reference copies of the house ESLint/TS/Prettier style
```

### Adding a component

Create a folder under `src/components/`, with the component, its stylesheet, and its test
side by side:

```
src/components/Card/
  Card.tsx
  Card.module.css
  Card.test.tsx
```

Import the render helper from `@/test/utils` rather than `@testing-library/react` directly, so
new providers are picked up automatically.

## Social sign-in

`/login` offers Google, GitHub and Facebook alongside email. **These buttons register and
sign in through the same click** — Supabase creates the user on the first successful
callback — so there is no separate social sign-up path.

All three ship **disabled**, so a fresh clone runs without any OAuth credentials and the
buttons return an inline "provider is not enabled" error until you turn one on.

To enable one locally:

1. Register an OAuth app with the provider, using
   `http://127.0.0.1:54321/auth/v1/callback` as the redirect / callback URL — that is
   Supabase's endpoint, not the app's.
2. Put the client id and secret in `.env` at the repo root (gitignored). The Supabase CLI
   resolves the `env(...)` placeholders in `supabase/config.toml` from there; see
   `.env.example` for the variable names.
3. Set `enabled = true` in the provider's `[auth.external.*]` block, then
   `pnpm db:stop && pnpm db:start`.

A hosted project ignores `config.toml` — configure providers in the Dashboard, and add your
deployed origin's `/auth/callback` to the redirect allow list.

Notes:

- **`skip_nonce_check = true` is set for Google** because it returns no nonce against a
  local instance. Remove it for hosted setups.
- **Adding a fourth provider** means three edits: an id in `OAUTH_PROVIDERS`
  (`src/lib/auth/providers.ts`), a label and brand mark in `OAuthButtons`, and an
  `[auth.external.*]` block. The provider maps are keyed by the id union, so skipping
  either of the first two is a type error.
- **`handle_new_user()` already populates `profiles`** from `full_name` and `avatar_url` in
  the provider's user metadata — no migration change was needed for OAuth.

## Supabase notes

- **Three clients, one per environment.** `lib/supabase/client.ts` for Client Components,
  `server.ts` for Server Components / Actions / Route Handlers, and `proxy.ts` for the request
  proxy. They share auth state through cookies.
- **Always `getUser()`, never `getSession()`** on the server. `getUser()` revalidates the token
  against the Auth server; `getSession()` trusts the cookie contents.
- **Row level security is on by default.** Every new table should enable RLS and add policies
  scoped to `auth.uid()`. See `supabase/migrations/0001_profiles.sql` for the pattern.
- **Regenerate types after every migration** with `pnpm db:types`.

## Conventions worth knowing

- **`src/proxy.ts`, not `middleware.ts`.** Next.js 16 renamed the convention; the exported
  function is `proxy()`. Add auth-gated route prefixes to `PROTECTED_PREFIXES` there.
- **`'use server'` files may only export async functions.** Shared constants and types live
  outside them instead — see `src/lib/auth/authState.ts`.
- **Never pass a `redirectTo` query param straight to `redirect()`.** `safeRedirect` in
  `src/lib/auth/redirects.ts` constrains it to a same-origin path; a crafted link would
  otherwise bounce a freshly signed-in user off-site.
- **Server Actions are passed to Client Components as props** (`SignOutButton`,
  `OAuthButtons`) rather than imported by them, so jsdom tests can inject a stub.
- **`NEXT_PUBLIC_*` vars must be read with literal keys.** Next inlines them via static
  analysis, so `process.env[name]` silently becomes `undefined` in the browser. `lib/env.ts`
  does this correctly.
- **`verbatimModuleSyntax` is on**, so type-only imports must be written `import type { … }`.
- **`tsconfig.json` is partly managed by Next.js.** It sets `jsx: "react-jsx"` and maintains the
  `.next/**/types` includes on every build.

### Testing limitation

Vitest cannot render **async** Server Components. Client Components and sync Server Components
test normally; cover async ones with an end-to-end tool instead.

### Why TypeScript 6 and not 7

TypeScript 7 ships the native Go compiler and **drops the JavaScript compiler API**
(`typescript/lib/typescript.js`). `@typescript-eslint/parser` needs that API to parse `.ts`/`.tsx`
at all, so TS 7 would mean no TypeScript linting whatsoever — and Next.js would additionally
require `experimental.useTypeScriptCli`. TypeScript 6.0.3 keeps the API, satisfies
typescript-eslint's `<6.1.0` peer range, and preserves type-aware lint rules. Revisit once
typescript-eslint supports TS 7.
