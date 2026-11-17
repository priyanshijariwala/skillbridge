export interface EducationDTO {
  degree: string
  institution: string
  graduation_year?: number | null
}

export interface ProfileRead {
  id?: string | null
  user_id: string
  full_name: string
  email: string
  headline?: string | null
  bio?: string | null
  target_role_id?: string | null
  target_role_title?: string | null
  target_seniority?: string | null
  years_of_experience?: number | null
  skills: string[]
  education: EducationDTO[]
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ProfileUpdate {
  full_name?: string
  headline?: string
  bio?: string
  target_role_id?: string
  target_role_title?: string
  target_seniority?: string
  years_of_experience?: number | null
  skills?: string[]
  education?: EducationDTO[]
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
}

