/**
 * Database types.
 *
 * This file is checked in so the template type-checks before you have a database
 * running. Regenerate it against your own schema whenever a migration lands:
 *
 *     pnpm db:start   # once, requires Docker
 *     pnpm db:types
 *
 * It is excluded from ESLint and Prettier because it is generated output.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      training_sessions: {
        Row: {
          id: string
          user_id: string
          kind: string
          started_at: string
          ended_at: string | null
          total_questions: number
          status: string
        }
        Insert: {
          id?: string
          user_id: string
          kind?: string
          started_at?: string
          ended_at?: string | null
          total_questions?: number
          status?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: string
          started_at?: string
          ended_at?: string | null
          total_questions?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'training_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      training_answers: {
        Row: {
          id: number
          session_id: string
          user_id: string
          question_index: number
          left_operand: number
          right_operand: number
          correct_answer: number
          given_answer: number | null
          is_correct: boolean
          duration_ms: number
          answered_at: string
        }
        Insert: {
          id?: number
          session_id: string
          user_id: string
          question_index: number
          left_operand: number
          right_operand: number
          correct_answer: number
          given_answer?: number | null
          is_correct: boolean
          duration_ms: number
          answered_at?: string
        }
        Update: {
          id?: number
          session_id?: string
          user_id?: string
          question_index?: number
          left_operand?: number
          right_operand?: number
          correct_answer?: number
          given_answer?: number | null
          is_correct?: boolean
          duration_ms?: number
          answered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'training_answers_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'training_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'training_answers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']

export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']

export type Profile = Tables<'profiles'>

export type TrainingSession = Tables<'training_sessions'>

export type TrainingAnswer = Tables<'training_answers'>
