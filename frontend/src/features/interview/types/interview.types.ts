export type InterviewType = "technical" | "behavioral" | "hr" | "mixed"

export type InterviewDifficulty =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "junior"
  | "mid"
  | "senior"

export type InterviewStatus = "created" | "in_progress" | "completed" | "abandoned"

export type MessageRole = "assistant" | "user"

export type MessageType = "question" | "answer" | "follow_up"

export interface InterviewSettings {
  main_question_limit: number
  follow_up_limit_per_question: number
  duration_minutes: number
}

export interface InterviewMessage {
  id: string
  interview_id: string
  sequence: number
  role: MessageRole
  message_type: MessageType
  content: string
  question_number: number
  follow_up_depth: number
  parent_message_id?: string | null
  created_at?: string
}

export interface AnswerEvaluation {
  score: number
  strengths: string[]
  improvements: string[]
}

export interface Interview {
  id: string
  target_role_id: string
  target_role_title: string
  interview_type: InterviewType
  difficulty: string
  mode: string
  status: InterviewStatus
  settings: InterviewSettings
  current_question_number: number
  current_follow_up_depth: number
  current_question?: InterviewMessage | null
  started_at?: string | null
  completed_at?: string | null
  created_at?: string
}

export interface InterviewCreatePayload {
  target_role_id: string
  interview_type?: InterviewType
  difficulty?: InterviewDifficulty
  duration_minutes?: number
  question_limit?: number
}

export interface InterviewAnswerPayload {
  question_id: string
  answer: string
}

export interface InterviewAnswerResponse {
  saved_answer_id: string
  evaluation?: AnswerEvaluation | null
  next_message?: InterviewMessage | null
  interview_status: InterviewStatus
  is_completed: boolean
  message?: string | null
}

export interface CategoryScore {
  category: string
  score: number
  max_score: number
}

export interface AnswerAnalysisItem {
  question: string
  answer: string
  score: number
  feedback: string
}

export interface InterviewFeedback {
  id: string
  interview_id: string
  overall_score: number
  category_scores: CategoryScore[]
  summary: string
  strengths: string[]
  improvements: string[]
  recommended_practice: string[]
  answers_analysis: AnswerAnalysisItem[]
  created_at?: string
}

export interface InterviewListItem {
  id: string
  target_role_title: string
  interview_type: string
  difficulty: string
  status: string
  duration_minutes: number
  overall_score?: number | null
  started_at?: string | null
  completed_at?: string | null
  created_at?: string
}

export interface InterviewListResponse {
  items: InterviewListItem[]
  total: number
  page: number
  page_size: number
}

