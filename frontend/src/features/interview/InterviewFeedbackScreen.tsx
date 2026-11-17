import React, { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LayoutDashboard,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  History,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/common/PageHeader"
import {
  useInterview,
  useInterviewFeedback,
  useCompleteInterview,
} from "@/features/interview/hooks/useInterview"

export const InterviewFeedbackScreen: React.FC = () => {
  const navigate = useNavigate()
  const { interviewId } = useParams<{ interviewId: string }>()

  const { data: interview, isLoading: isLoadingInterview } = useInterview(interviewId)
  const {
    data: feedback,
    isLoading: isLoadingFeedback,
    error: feedbackError,
  } = useInterviewFeedback(interviewId)

  const { mutate: completeInterview, isPending: isFinalizing } = useCompleteInterview(interviewId || "")
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  if (isLoadingInterview || isLoadingFeedback || isFinalizing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">
            Compiling Comprehensive Evaluation Report...
          </p>
        </div>
      </div>
    )
  }

  if (feedbackError || !feedback) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <Card className="p-8 space-y-4">
          <Sparkles className="w-10 h-10 text-primary mx-auto" />
          <h2 className="text-lg font-bold">Feedback Report Pending</h2>
          <p className="text-sm text-muted-foreground">
            The interview has not been completed or feedback is being generated.
          </p>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => completeInterview(undefined)}
              isLoading={isFinalizing}
            >
              Generate Report Now
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const roleTitle = interview?.target_role_title || "Target Role"
  const interviewType = interview?.interview_type || "technical"
  const durationMinutes = interview?.settings?.duration_minutes || 30

  // Calculate benchmark tier
  const tier =
    feedback.overall_score >= 85
      ? "Strong Candidate Tier (Top 15%)"
      : feedback.overall_score >= 70
      ? "Solid Readiness Tier (Top 35%)"
      : feedback.overall_score >= 50
      ? "Developing Competency Tier"
      : "Needs Structured Review"

  const tierVariant =
    feedback.overall_score >= 85
      ? "success"
      : feedback.overall_score >= 70
      ? "default"
      : "warning"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview Performance Report"
        description={`Session: ${roleTitle} (${interviewType}) • Duration: ${durationMinutes} mins`}
        badge={{ label: tier, variant: tierVariant }}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate("/interview-history")}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/interview/setup")}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Practice Again
            </Button>
            <Button onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </>
        }
      />

      {/* Advisory Notice */}
      <div className="p-4 rounded-xl border border-border bg-slate-50 dark:bg-slate-900/40 flex items-start gap-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Advisory AI Estimate:</strong> SkillBridge AI performance benchmarks are simulated estimates calculated against industry expectations for {roleTitle}. They are intended as diagnostic learning tools and do not constitute formal employment guarantees.
        </p>
      </div>

      {/* Score Breakdown Radial & Dimension Bars */}
      <Card className="p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Overall Radial Score */}
          <div className="flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-border text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Overall Benchmark Rating
            </span>
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-secondary"
                  strokeWidth="3.2"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary"
                  strokeDasharray={`${feedback.overall_score}, 100`}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold font-mono text-foreground">
                  {feedback.overall_score}
                </span>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                  / 100
                </span>
              </div>
            </div>
            <span className="mt-3 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
              {tier}
            </span>
          </div>

          {/* Dimension Bars */}
          <div className="md:col-span-2 space-y-4">
            {feedback.category_scores.map((dim) => (
              <div key={dim.category}>
                <div className="flex justify-between text-xs font-semibold text-foreground mb-1.5">
                  <span>{dim.category}</span>
                  <span className="font-mono">{dim.score}%</span>
                </div>
                <Progress value={dim.score} />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Executive Summary */}
      {feedback.summary && (
        <Card className="p-6 shadow-xs border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/20 dark:bg-indigo-950/10">
          <div className="flex items-center gap-2 font-bold text-sm text-primary mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Executive Evaluation Summary</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{feedback.summary}</p>
        </Card>
      )}

      {/* Strengths and Growth Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Key Strengths Observed</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {feedback.strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-foreground leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Growth Areas */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>High-Priority Areas for Growth</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              {feedback.improvements.map((growth, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">•</span>
                  <span className="text-foreground leading-relaxed">{growth}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Practice */}
      {feedback.recommended_practice && feedback.recommended_practice.length > 0 && (
        <Card className="shadow-xs p-6">
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-3">
            <BookOpen className="w-4 h-4" />
            <span>Recommended Follow-Up Practice</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {feedback.recommended_practice.map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-border bg-secondary/30 text-xs text-foreground leading-relaxed"
              >
                <span className="font-semibold block text-primary mb-1">Topic {i + 1}</span>
                {item}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Question Transcript & AI Critique Accordion */}
      {feedback.answers_analysis && feedback.answers_analysis.length > 0 && (
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              Question Transcript & Detailed Critique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback.answers_analysis.map((item, index) => {
              const isExpanded = expandedIndex === index

              return (
                <div
                  key={index}
                  className="border border-border rounded-xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="p-4 bg-secondary/40 flex items-center justify-between cursor-pointer hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs bg-card px-2 py-0.5 rounded border border-border">
                        Q{index + 1}
                      </span>
                      <span className="text-sm font-semibold text-foreground line-clamp-1">
                        {item.question}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-600 font-mono">
                        {item.score} / 100
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 space-y-4 text-xs border-t border-border">
                      {/* Prompt */}
                      <div>
                        <span className="font-bold text-muted-foreground block mb-1">
                          Question Prompt:
                        </span>
                        <p className="text-foreground font-medium">{item.question}</p>
                      </div>

                      {/* User Answer */}
                      <div>
                        <span className="font-bold text-muted-foreground block mb-1">
                          Your Submitted Answer:
                        </span>
                        <p className="p-3 bg-secondary/30 rounded-lg text-foreground font-mono text-xs leading-relaxed border border-border whitespace-pre-wrap">
                          "{item.answer}"
                        </p>
                      </div>

                      {/* AI Critique */}
                      <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 dark:bg-indigo-950/10">
                        <div className="flex items-center gap-1.5 font-bold text-primary mb-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Evaluator Commentary</span>
                        </div>
                        <p className="text-foreground leading-relaxed">{item.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default InterviewFeedbackScreen
