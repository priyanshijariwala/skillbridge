import React from "react"
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  Cpu,
  BookOpen,
  Zap,
} from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import type { AICodeReview } from "@/features/coding/types/coding.types"

interface CodeReviewPanelProps {
  review?: AICodeReview | null
  isLoading?: boolean
  onRequestReview?: () => void
  hasSubmission?: boolean
}

export const CodeReviewPanel: React.FC<CodeReviewPanelProps> = ({
  review,
  isLoading,
  onRequestReview,
  hasSubmission,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-xs text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span>AI is reviewing your code...</span>
      </div>
    )
  }

  if (!review && hasSubmission) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Get AI Code Review</p>
          <p className="text-xs text-muted-foreground">
            Submit your solution first, then request a detailed AI review.
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestReview}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Request AI Review
        </button>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-xs text-muted-foreground">
        <Sparkles className="w-5 h-5" />
        <span>Submit your code to unlock AI review.</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Summary */}
      <Card className="p-4 shadow-xs border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/20 dark:bg-indigo-950/10">
        <div className="flex items-center gap-2 font-bold text-sm text-primary mb-2">
          <Sparkles className="w-4 h-4" />
          <span>AI Code Review Summary</span>
          {review.model && (
            <span className="ml-auto text-[10px] font-normal text-muted-foreground">
              via {review.model}
            </span>
          )}
        </div>
        <p className="text-sm text-foreground leading-relaxed">{review.summary}</p>
      </Card>

      {/* Complexity */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold mb-1">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Time Complexity</span>
          </div>
          <code className="text-foreground font-mono font-bold text-sm">{review.time_complexity}</code>
        </Card>
        <Card className="p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold mb-1">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>Space Complexity</span>
          </div>
          <code className="text-foreground font-mono font-bold text-sm">{review.space_complexity}</code>
        </Card>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {review.strengths.length > 0 && (
          <Card className="shadow-xs">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Strengths</span>
              </div>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <ul className="space-y-2">
                {review.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                    <span className="text-foreground leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {review.improvements.length > 0 && (
          <Card className="shadow-xs">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Improvements</span>
              </div>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <ul className="space-y-2">
                {review.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                    <span className="text-foreground leading-relaxed">{imp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Potential Edge Cases */}
      {review.potential_edge_cases.length > 0 && (
        <Card className="p-4 shadow-xs">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Potential Edge Cases</span>
          </div>
          <ul className="space-y-1.5">
            {review.potential_edge_cases.map((ec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">⚠</span>
                <span className="text-foreground leading-relaxed">{ec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Optimized Approach */}
      {review.optimized_approach && (
        <Card className="p-4 shadow-xs border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 text-primary font-bold text-xs mb-2">
            <Zap className="w-4 h-4" />
            <span>Optimized Approach</span>
          </div>
          <p className="text-foreground leading-relaxed">{review.optimized_approach}</p>
        </Card>
      )}

      {/* Correctness Observations */}
      {review.correctness_observations && (
        <Card className="p-4 shadow-xs">
          <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Correctness Observations</span>
          </div>
          <p className="text-foreground leading-relaxed">{review.correctness_observations}</p>
        </Card>
      )}

      {/* Learning Recommendations */}
      {review.learning_recommendations.length > 0 && (
        <Card className="p-4 shadow-xs">
          <div className="flex items-center gap-2 text-primary font-bold text-xs mb-3">
            <BookOpen className="w-4 h-4" />
            <span>Learning Recommendations</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {review.learning_recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg border border-border bg-secondary/30 text-xs text-foreground leading-relaxed"
              >
                <span className="font-semibold text-primary block mb-0.5">Topic {i + 1}</span>
                {rec}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default CodeReviewPanel

