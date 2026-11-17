export type ProblemDifficulty = "easy" | "medium" | "hard"

export type SubmissionStatus =
  | "accepted"
  | "wrong_answer"
  | "time_limit_exceeded"
  | "memory_limit_exceeded"
  | "compilation_error"
  | "runtime_error"
  | "internal_error"
  | "pending"

export interface ProblemExample {
  input: string
  output: string
  explanation?: string
}

export interface SampleTestCase {
  input: string
  expected_output: string
}

export interface ProblemListItem {
  id: string
  title: string
  slug: string
  difficulty: ProblemDifficulty
  category: string
  topics: string[]
  is_solved?: boolean
}

export interface ProblemListResponse {
  items: ProblemListItem[]
  total: number
  page: number
  page_size: number
}

export interface ProblemDetail {
  id: string
  title: string
  slug: string
  description: string
  difficulty: ProblemDifficulty
  category: string
  topics: string[]
  constraints: string[]
  examples: ProblemExample[]
  sample_test_cases: SampleTestCase[]
  supported_languages: string[]
  starter_code: Record<string, string>
  is_solved?: boolean
}

export interface TestCaseResultItem {
  test_case_index: number
  passed: boolean
  verdict: string
  input?: string
  expected_output?: string
  stdout?: string
  stderr?: string
  compile_output?: string
  execution_time_ms?: number
  memory_kb?: number
  is_hidden?: boolean
}

export interface RunCodeRequest {
  problem_id: string
  source_code: string
  language: string
  custom_stdin?: string
}

export interface RunCodeResponse {
  verdict: string
  passed: boolean
  test_cases_passed: number
  total_test_cases: number
  execution_time_ms?: number
  memory_kb?: number
  error_message?: string
  test_case_results: TestCaseResultItem[]
}

export interface SubmitCodeRequest {
  problem_id: string
  source_code: string
  language: string
}

export interface AICodeReview {
  summary: string
  correctness_observations: string
  strengths: string[]
  improvements: string[]
  potential_edge_cases: string[]
  time_complexity: string
  space_complexity: string
  optimized_approach?: string
  learning_recommendations: string[]
  model?: string
}

export interface SubmissionResponse {
  id: string
  user_id: string
  problem_id: string
  problem_title: string
  problem_slug: string
  language: string
  source_code: string
  execution_status: SubmissionStatus
  test_cases_passed: number
  total_test_cases: number
  execution_time_ms?: number
  memory_kb?: number
  error_message?: string
  test_case_results: TestCaseResultItem[]
  ai_review?: AICodeReview
  created_at?: string
}

export interface SubmissionListResponse {
  items: SubmissionResponse[]
  total: number
  page: number
  page_size: number
}

export interface LanguageOption {
  slug: string
  name: string
  monacoId: string
  extension: string
}

export const CODING_LANGUAGES: LanguageOption[] = [
  { slug: "python", name: "Python 3", monacoId: "python", extension: "py" },
  { slug: "javascript", name: "JavaScript", monacoId: "javascript", extension: "js" },
  { slug: "typescript", name: "TypeScript", monacoId: "typescript", extension: "ts" },
  { slug: "java", name: "Java", monacoId: "java", extension: "java" },
  { slug: "cpp", name: "C++", monacoId: "cpp", extension: "cpp" },
  { slug: "go", name: "Go", monacoId: "go", extension: "go" },
]
