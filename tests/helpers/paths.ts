import path from 'node:path'

/** Session cookies written by tests/auth.setup.ts and reused by authenticated projects. */
export const STORAGE_STATE = path.join(process.cwd(), 'playwright/.auth/user.json')
