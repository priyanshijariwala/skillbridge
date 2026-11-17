import React, { useState } from "react"
import { Link } from "react-router-dom"
import { Code2 } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { Card } from "@/components/ui/card"
import { SubmissionHistory } from "@/features/coding/components/SubmissionHistory"
import { useSubmissions } from "@/features/coding/hooks/useCoding"
import { CODING_LANGUAGES } from "@/features/coding/types/coding.types"

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "accepted", label: "Accepted" },
  { value: "wrong_answer", label: "Wrong Answer" },
  { value: "time_limit_exceeded", label: "Time Limit Exceeded" },
  { value: "memory_limit_exceeded", label: "Memory Limit Exceeded" },
  { value: "compilation_error", label: "Compilation Error" },
  { value: "runtime_error", label: "Runtime Error" },
]

const PAGE_SIZE = 20

export const SubmissionHistoryPage: React.FC = () => {
  const [status, setStatus] = useState("")
  const [language, setLanguage] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useSubmissions({
    status: status || undefined,
    language: language || undefined,
    page,
    page_size: PAGE_SIZE,
  })

  const submissions = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleStatusChange = (v: string) => {
    setStatus(v)
    setPage(1)
  }

  const handleLanguageChange = (v: string) => {
    setLanguage(v)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submission History"
        description="Review all your past code submissions across all problems."
        badge={{ label: `${total} Total`, variant: "secondary" }}
        actions={
          <Link
            to="/coding"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            Browse Problems
          </Link>
        }
      />

      {/* Filters */}
      <Card className="p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Status filter */}
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full bg-muted/60 border border-border/80 text-foreground text-xs rounded-lg px-2.5 py-2 font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value} className="bg-popover text-popover-foreground">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Language filter */}
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full bg-muted/60 border border-border/80 text-foreground text-xs rounded-lg px-2.5 py-2 font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
            >
              <option value="" className="bg-popover text-popover-foreground">
                All Languages
              </option>
              {CODING_LANGUAGES.map((lang) => (
                <option key={lang.slug} value={lang.slug} className="bg-popover text-popover-foreground">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      <SubmissionHistory
        submissions={submissions}
        isLoading={isLoading}
        total={total}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <span className="text-xs text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page}</span> of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default SubmissionHistoryPage

