export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      votings: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string
          multiple_choice: boolean
          reveal_mode: 'after_vote' | 'after_end'
          end_at: string
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description: string
          multiple_choice: boolean
          reveal_mode: 'after_vote' | 'after_end'
          end_at: string
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          title?: string
          description?: string
          multiple_choice?: boolean
          reveal_mode?: 'after_vote' | 'after_end'
          end_at?: string
          created_at?: string
        }
      }
      options: {
        Row: {
          id: string
          voting_id: string
          text: string
        }
        Insert: {
          id?: string
          voting_id: string
          text: string
        }
        Update: {
          id?: string
          voting_id?: string
          text?: string
        }
      }
      votes: {
        Row: {
          id: string
          voting_id: string
          option_id: string
          voter_uuid: string
          created_at: string
        }
        Insert: {
          id?: string
          voting_id: string
          option_id: string
          voter_uuid: string
          created_at?: string
        }
        Update: {
          id?: string
          voting_id?: string
          option_id?: string
          voter_uuid?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 