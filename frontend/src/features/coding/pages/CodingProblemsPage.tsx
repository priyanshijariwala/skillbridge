import React, { useState } from "react"
import { Link } from "react-router-dom"
import {
  CheckCircle2,
  Tag,
  ChevronLeft,
  ChevronRight,
  Code2,
} from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton"
import { Card } from "@/components/ui/card"
import { ProblemFilters } from "@/features/coding/components/ProblemFilters"
import { useCodingProblems } from "@/features/coding/hooks/useCoding"
import type { ProblemDifficulty } from "@/features/coding/types/coding.types"

const PAGE_SIZE = 20

const getDifficultyStyle = (difficulty: ProblemDifficulty) => {
  switch (difficulty) {
    case "easy":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    case "medium":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
    case "hard":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export const CodingProblemsPage: React.FC = () => {
  const [search, setSearch] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [category, setCategory] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useCodingProblems({
    search: search || undefined,
    difficulty: difficulty || undefined,
    category: category || undefined,
    page,
    page_size: PAGE_SIZE,
  })

  const problems = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (v: string) => {
      setter(v)
      setPage(1)
    }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coding Practice"
        description="Sharpen your problem-solving skills with curated algorithm challenges."
        badge={{ label: `${total} Problems`, variant: "info" }}
        actions={
          <Link
            to="/coding/submissions"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            My Submissions
          </Link>
        }
      />

      {/* Filters */}
      <Card className="p-4 shadow-xs">
        <ProblemFilters
          search={search}
          onSearchChange={handleFilterChange(setSearch)}
          difficulty={difficulty}
          onDifficultyChange={handleFilterChange(setDifficulty)}
          category={category}
          onCategoryChange={handleFilterChange(setCategory)}
        />
      </Card>

      {/* Problem List */}
      {isLoading ? (
        <LoadingSkeleton variant="table-row" count={8} />
      ) : problems.length === 0 ? (
        <Card className="p-12 text-center space-y-3 border-dashed border-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Code2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No problems found</p>
          <p className="text-xs text-muted-foreground">Try adjusting your filters.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[2fr_1fr_2fr_1fr] gap-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Title</span>
            <span>Difficulty</span>
            <span>Topics</span>
            <span className="text-right">Status</span>
          </div>

          {problems.map((problem, idx) => (
            <Link
              key={problem.id}
              to={`/coding/problems/${problem.slug}`}
              className="block"
            >
              <Card className="px-4 py-3 shadow-xs hover:border-primary/40 hover:bg-accent/20 transition-all group">
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_2fr_1fr] gap-2 sm:gap-4 items-center">
                  {/* Title + number */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0 w-7 text-right">
                      {(page - 1) * PAGE_SIZE + idx + 1}.
                    </span>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {problem.title}
                    </span>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${getDifficultyStyle(
                        problem.difficulty
                      )}`}
                    >
                      {problem.difficulty}
                    </span>
                  </div>

                  {/* Topics */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {problem.topics.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                      >
                        <Tag className="w-2 h-2" />
                        {t}
                      </span>
                    ))}
                    {problem.topics.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{problem.topics.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Solved */}
                  <div className="sm:text-right">
                    {problem.is_solved ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Solved
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not solved</span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number
              if (totalPages <= 5) {
                p = i + 1
              } else if (page <= 3) {
                p = i + 1
              } else if (page >= totalPages - 2) {
                p = totalPages - 4 + i
              } else {
                p = page - 2 + i
              }
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    page === p
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {p}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default CodingProblemsPage

