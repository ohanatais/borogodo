export type ProfileArea =
  | 'tech'
  | 'vendas'
  | 'financas'
  | 'marketing'
  | 'rh'
  | 'administracao'
  | 'outro'

export type Profile = {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  linkedin_url: string | null
  github_url: string | null
  current_title: string | null
  area: ProfileArea | null
  onboarding_completed: boolean
  created_at: string
  terms_accepted_at: string | null
  terms_version: string | null
  marketing_consent: boolean
}
