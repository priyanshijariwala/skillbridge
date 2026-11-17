import React from "react"
import { CheckCircle2, Tag, Layers } from "lucide-react"
import type { ProblemDetail } from "@/features/coding/types/coding.types"

interface ProblemDescriptionProps {
  problem: ProblemDetail
}

export const ProblemDescription: React.FC<ProblemDescriptionProps> = ({ problem }) => {
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
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

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-5 bg-card/40 border border-border/70 rounded-xl space-y-5 text-sm">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getDifficultyBadge(
                problem.difficulty
              )}`}
            >
              {problem.difficulty}
            </span>

            {problem.is_solved && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Solved</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Layers className="w-3.5 h-3.5" />
            <span className="capitalize">{problem.category.replace("-", " ")}</span>
          </div>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {problem.title}
        </h1>

        {/* Topic Tags */}
        {problem.topics && problem.topics.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
            {problem.topics.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted px-2 py-0.5 rounded-md text-muted-foreground"
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{t}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border/60" />

      {/* Problem Statement */}
      <div className="space-y-3 leading-relaxed text-foreground/90 whitespace-pre-wrap">
        {problem.description}
      </div>

      {/* Examples */}
      {problem.examples && problem.examples.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider text-xs">
            Examples
          </h2>
          {problem.examples.map((ex, idx) => (
            <div
              key={idx}
              className="bg-muted/50 border border-border/70 rounded-xl p-3.5 space-y-2 text-xs"
            >
              <div className="font-semibold text-foreground/80">Example {idx + 1}:</div>
              <div className="space-y-1 font-mono">
                <div>
                  <span className="text-muted-foreground font-sans mr-2">Input:</span>
                  <code className="text-foreground bg-background px-1.5 py-0.5 rounded border border-border/50">
                    {ex.input}
                  </code>
                </div>
                <div>
                  <span className="text-muted-foreground font-sans mr-2">Output:</span>
                  <code className="text-foreground bg-background px-1.5 py-0.5 rounded border border-border/50">
                    {ex.output}
                  </code>
                </div>
                {ex.explanation && (
                  <div className="font-sans text-muted-foreground mt-1">
                    <span className="font-medium mr-1 text-foreground/75">Explanation:</span>
                    {ex.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Constraints */}
      {problem.constraints && problem.constraints.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-foreground text-sm uppercase tracking-wider text-xs">
            Constraints
          </h2>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground font-mono">
            {problem.constraints.map((c, i) => (
              <li key={i}>
                <code className="text-foreground/90">{c}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
