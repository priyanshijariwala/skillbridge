export interface ResumeRead {
  id: string
  user_id: string
  original_filename: string
  file_type: string
  file_size_bytes: number
  status: string
  created_at?: string | null
  updated_at?: string | null
}

export type ResumeUploadStatus = "idle" | "uploading" | "success" | "error"

export interface ScoreBreakdown {
  content_quality: number
  skills_presentation: number
  experience_descriptions: number
  structure_readability: number
  ats_readability: number
}

export interface ExperienceItem {
  title: string
  company: string
  duration?: string | null
  highlights: string[]
}

export interface EducationItem {
  degree: string
  institution: string
  graduation_year?: number | null
}

export interface ProjectItem {
  name: string
  description?: string | null
  technologies: string[]
}

export interface ExtractedData {
  headline?: string | null
  skills: string[]
  experience: ExperienceItem[]
  education: EducationItem[]
  projects: ProjectItem[]
  certifications: string[]
}

export interface ResumeAuditItem {
  id: string
  type: string
  title: string
  description: string
  recommendation?: string | null
}

export interface DetectedSkill {
  id: string
  name: string
  category: string
  status: string
  evidence_snippet?: string | null
}

export interface ResumeAnalysisRead {
  id: string
  user_id: string
  resume_id: string
  status: "completed" | "processing" | "failed" | "pending"
  overall_score: number
  score_breakdown: ScoreBreakdown
  summary: string
  extracted_data: ExtractedData
  strengths: ResumeAuditItem[]
  improvements: ResumeAuditItem[]
  recommendations: string[]
  missing_information: string[]
  ats_observations: string[]
  detected_skills: DetectedSkill[]
  recommended_roles: string[]
  ai_metadata?: Record<string, unknown>
  created_at?: string | null
  updated_at?: string | null
}
