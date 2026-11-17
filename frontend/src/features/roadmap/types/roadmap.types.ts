export type TaskType = "learn" | "practice" | "project" | "assessment" | "revise"
export type TaskStatus = "not_started" | "in_progress" | "completed"
export type MilestoneStatus = "not_started" | "in_progress" | "completed"
export type RoadmapStatus = "active" | "completed" | "archived"
export type PriorityLevel = "high" | "medium" | "low"

export interface Task {
  id: string
  title: string
  description: string
  task_type: TaskType
  related_skill: string
  estimated_duration_hours: number
  priority: PriorityLevel
  status: TaskStatus
  completed_at?: string | null
  resources: string[]
}

export interface Milestone {
  id: string
  title: string
  description: string
  order: number
  estimated_duration_days: number
  priority: PriorityLevel
  status: MilestoneStatus
  related_skills: string[]
  tasks: Task[]
}

export interface Roadmap {
  id: string
  user_id: string
  target_role_id: string
  target_role_title: string
  source_skill_gap_analysis_id: string
  title: string
  description: string
  estimated_duration_days: number
  milestones: Milestone[]
  status: RoadmapStatus
  completion_percentage: number
  is_stale: boolean
  ai_metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface RoadmapProgress {
  roadmap_id: string
  status: RoadmapStatus
  completion_percentage: number
  total_milestones: number
  completed_milestones: number
  in_progress_milestones: number
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  pending_tasks: number
  estimated_remaining_hours: number
}

export interface RoadmapGeneratePayload {
  skill_gap_analysis_id?: string
  available_hours_per_week?: number
}

export interface TaskUpdatePayload {
  status: TaskStatus
}

