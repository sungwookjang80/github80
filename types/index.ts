export type Role = 'user' | 'assistant'

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: Role
  content: string
  created_at: string
}

export interface Topic {
  id: string
  user_id: string
  tag: string
  count: number
  last_seen_at: string
}
