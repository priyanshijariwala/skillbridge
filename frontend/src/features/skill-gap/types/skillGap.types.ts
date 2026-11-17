export interface RoleSkill {
  name: string
  importance: number // 1 to 5 scale
  category: string
  description?: string
}

export interface JobRole {
  id: string
  slug: string
  title: string
  category: string
  description: string
  experience_level: string
  required_skills: RoleSkill[]
  optional_skills: RoleSkill[]
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface JobRoleListResponse {
  items: JobRole[]
  total: number
}

export interface MatchedSkill {
  name: string
  importance: number
  category: string
  evidence?: string
}

export interface PartialSkill {
  name: string
  importance: number
  category: string
  reason?: string
}

export interface MissingSkill {
  name: string
  importance: number
  category: string
}

export interface OptionalSkill {
  name: string
  importance: number
  category: string
  status: "matched" | "partial" | "missing"
}

export interface SkillRecommendation {
  skill: string
  priority: "high" | "medium" | "low"
  reason: string
  practical_project?: string
  learning_activity?: string
}

export interface SkillGapCounts {
  matched: number
  partial: number
  missing: number
  optional: number
  total_required: number
}

export interface SkillGapAnalysis {
  id: string
  user_id: string
  resume_id: string
  resume_analysis_id: string
  target_role_id: string
  target_role_title: string
  match_percentage: number
  summary?: string
  counts: SkillGapCounts
  matched_skills: MatchedSkill[]
  partially_matched_skills: PartialSkill[]
  missing_skills: MissingSkill[]
  optional_skills: OptionalSkill[]
  recommendations: SkillRecommendation[]
  is_stale: boolean
  ai_metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface SkillGapAnalyzePayload {
  target_role_id: string
  resume_id?: string
}

