import React from "react"
import { CheckCircle2, XCircle, Clock, Cpu, AlertTriangle, Calendar } from "lucide-react"
import type { SubmissionResponse, SubmissionStatus } from "@/features/coding/types/coding.types"

interface SubmissionResultProps {
  submission: SubmissionResponse
}

const getStatusStyle = (status: SubmissionStatus) => {
  switch (status) {
    case "accepted":
      return {
        bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: CheckCircle2,
        label: "Accepted",
        border: "border-l-emerald-500",
      }
    case "wrong_answer":
      return {
        bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        icon: XCircle,
        label: "Wrong Answer",
        border: "border-l-rose-500",
      }
    case "compilation_error":
      return {
        bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        icon: AlertTriangle,
        label: "Compilation Error",
        border: "border-l-amber-500",
      }
    case "time_limit_exceeded":
      return {
        bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        icon: Clock,
        label: "Time Limit Exceeded",
        border: "border-l-orange-500",
      }
    case "memory_limit_exceeded":
      return {
        bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        icon: Cpu,
        label: "Memory Limit Exceeded",
        border: "border-l-purple-500",
      }
    case "runtime_error":
      return {
        bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        icon: XCircle,
        label: "Runtime Error",
        border: "border-l-rose-500",
      }
    case "pending":
      return {
        bg: "bg-muted text-muted-foreground border-border",
        icon: Clock,
        label: "Pending",
        border: "border-l-muted-foreground",
      }
    default:
      return {
        bg: "bg-muted text-muted-foreground border-border",
        icon: AlertTriangle,
        label: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        border: "border-l-muted-foreground",
      }
  }
}

const formatDate = (iso?: string) => {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

export const SubmissionResult: React.FC<SubmissionResultProps> = ({ submission }) => {
  const style = getStatusStyle(submission.execution_status)
  const Icon = style.icon

  return (
    <div
      className={`p-4 rounded-xl border border-l-4 ${style.border} border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-accent/20 transition-colors`}
    >
      {/* Left: status + title + language */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${style.bg}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {style.label}
          </span>
          <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">
            {submission.problem_title}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
            {submission.language}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(submission.created_at)}
          </span>
        </div>
      </div>

      {/* Right: stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 font-mono">
        <span
          className={
            submission.test_cases_passed === submission.total_test_cases
              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-rose-600 dark:text-rose-400 font-semibold"
          }
        >
          {submission.test_cases_passed}/{submission.total_test_cases} passed
        </span>
        {submission.execution_time_ms !== undefined && (
          <span className="flex items-center gap-1" title="Execution Time">
            <Clock className="w-3 h-3" />
            {submission.execution_time_ms}ms
          </span>
        )}
        {submission.memory_kb !== undefined && submission.memory_kb > 0 && (
          <span className="flex items-center gap-1" title="Memory">
            <Cpu className="w-3 h-3" />
            {Math.round(submission.memory_kb / 1024)} MB
          </span>
        )}
      </div>
    </div>
  )
}

export default SubmissionResult
