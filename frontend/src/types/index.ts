// SkillBridge AI — TypeScript Definitions

export interface User {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  targetRoleTitle?: string
  createdAt: string
}

export interface StatMetric {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  trend?: {
    value: string
    isPositive: boolean
  }
}

export interface ResumeMetadata {
  id: string
  fileName: string
  fileSizeBytes: number
  status: "uploaded" | "processing" | "completed" | "failed"
  uploadedAt: string
}

export interface ResumeAuditItem {
  id: string
  type: "strength" | "improvement" | "format"
  title: string
  description: string
  recommendation?: string
}

export interface DetectedSkill {
  id: string
  name: string
  category: "Languages" | "Frameworks" | "Databases" | "Cloud & DevOps" | "Architecture" | "Soft Skills"
  status: "verified" | "partial" | "gap" | "critical_gap"
  evidenceSnippet?: string
}

export interface ResumeAnalysis {
  resumeId: string
  overallScore: number
  evaluationSummary: string
  strengths: ResumeAuditItem[]
  improvements: ResumeAuditItem[]
  detectedSkills: DetectedSkill[]
  recommendedRoles: string[]
  analyzedAt: string
}

export interface TargetRole {
  id: string
  title: string
  department: string
  seniority: "Junior" | "Mid" | "Senior" | "Lead"
  requiredSkillCount: number
  description: string
}

export interface SkillGapItem {
  id: string
  skillName: string
  category: string
  priority: "critical" | "high" | "medium"
  status: "missing" | "partial" | "matched"
  expectedDescription: string
  detectedDescription: string
  roadmapRecommended: boolean
}

export interface SkillGapAnalysis {
  id: string
  targetRoleId: string
  targetRoleTitle: string
  matchPercentage: number
  matchedCount: number
  totalCount: number
  criticalGapCount: number
  moderateGapCount: number
  items: SkillGapItem[]
  calculatedAt: string
}

export interface RoadmapTask {
  id: string
  weekNumber: number
  title: string
  description: string
  type: "concept" | "implementation" | "practice"
  estimatedMinutes: number
  priority: "high" | "medium" | "low"
  resource?: {
    title: string
    url: string
  }
  isCompleted: boolean
}

export interface RoadmapWeek {
  weekNumber: number
  title: string
  theme: string
  estimatedHours: number
  tasks: RoadmapTask[]
}

export interface LearningRoadmap {
  id: string
  targetRoleTitle: string
  totalWeeks: number
  totalTasks: number
  completedTasks: number
  completionPercentage: number
  weeks: RoadmapWeek[]
  generatedAt: string
}

export interface InterviewQuestion {
  id: string
  sequence: number
  topic: string
  questionText: string
  guidanceTip?: string
  isFollowUp?: boolean
  followUpIndex?: number
  parentQuestionSequence?: number
}

export interface InterviewSession {
  id: string
  targetRoleId: string
  targetRoleTitle: string
  interviewType: "technical" | "behavioral" | "mixed"
  difficulty: "junior" | "mid" | "senior"
  mode: "text" | "voice"
  totalQuestions: number
  currentQuestionIndex: number
  currentQuestion: InterviewQuestion
  status: "in_progress" | "completed" | "abandoned"
  startedAt: string
}

export interface DimensionScore {
  name: string
  score: number // 0-100
  weightPercentage: number
}

export interface TranscriptItem {
  id: string
  questionSequence: number
  topic: string
  questionText: string
  userAnswer: string
  followUpQuestion?: string
  followUpAnswer?: string
  scoreOutOfTen: number
  strengths: string[]
  improvements: string[]
  evaluatorCritique: string
  modelAnswerRecommendation: string
}

export interface InterviewFeedback {
  interviewId: string
  roleTitle: string
  interviewType: string
  overallScore: number
  benchmarkTier: "Needs Practice" | "Solid Foundation" | "Interview Ready" | "Exceptional"
  durationMinutes: number
  dimensions: DimensionScore[]
  strengthsSummary: string[]
  growthSummary: string[]
  transcript: TranscriptItem[]
  completedAt: string
}

export interface InterviewHistoryItem {
  id: string
  roleTitle: string
  interviewType: "technical" | "behavioral" | "mixed"
  difficulty: "junior" | "mid" | "senior"
  score: number
  benchmarkTier: string
  date: string
  durationMinutes: number
  status: "completed" | "in_progress"
}

export interface UserProfile {
  fullName: string
  email: string
  headline: string
  targetRoleId: string
  targetSeniority: "Junior" | "Mid" | "Senior" | "Lead"
  yearsOfExperience: number
  bio: string
  verifiedSkills: string[]
}
