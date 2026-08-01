'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { readField } from '@/lib/formData'
import { USERNAME_RULE_MESSAGE, validateUsername } from '@/lib/profile/username'
import type { ProfileState } from '@/lib/profile/profileState'

/** Postgres error codes we can turn into something a human wants to read. */
const UNIQUE_VIOLATION = '23505'
const CHECK_VIOLATION = '23514'

export async function updateUsername(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // `src/proxy.ts` guards `/profile`; this is defence in depth for a direct action call.
  if (!user) {
    return { error: 'You need to be signed in to update your profile.', message: null }
  }

  const username = readField(formData, 'username').trim()
  const invalid = validateUsername(username)

  if (invalid) {
    return { error: invalid, message: null }
  }

  // Upsert rather than update: an account created before the `handle_new_user`
  // trigger existed has no `profiles` row, and `.update()` would quietly match none.
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, username }, { onConflict: 'id' })

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: 'That username is already taken.', message: null }
    }

    if (error.code === CHECK_VIOLATION) {
      return { error: USERNAME_RULE_MESSAGE, message: null }
    }

    return { error: error.message, message: null }
  }

  revalidatePath('/profile')
  // The protected page renders the username too.
  revalidatePath('/protected')

  return { error: null, message: 'Username updated.' }
}
