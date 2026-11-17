import React, { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  CornerDownRight,
  AlertCircle,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ZenInterviewHeader } from "@/components/layout/ZenInterviewHeader"
import {
  useInterview,
  useInterviewMessages,
  useSubmitAnswer,
  useCompleteInterview,
  useAbandonInterview,
} from "@/features/interview/hooks/useInterview"
import type { InterviewMessage } from "@/features/interview/types/interview.types"

export const InterviewScreen: React.FC = () => {
  const navigate = useNavigate()
  const { interviewId } = useParams<{ interviewId: string }>()

  const { data: interview, isLoading: isLoadingSession, error: sessionError } = useInterview(interviewId)
  const { data: messages = [], isLoading: isLoadingMessages } = useInterviewMessages(interviewId)

  const { mutate: submitAnswer, isPending: isSubmitting } = useSubmitAnswer(interviewId || "")
  const { mutate: completeInterview, isPending: isCompleting } = useCompleteInterview(interviewId || "")
  const { mutate: abandonInterview } = useAbandonInterview(interviewId || "")

  const [answerText, setAnswerText] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [elapsedMinutes, setElapsedMinutes] = useState(1)

  // Track session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMinutes((prev) => prev + 1)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Auto-redirect if interview is already completed
  useEffect(() => {
    if (interview && interview.status === "completed") {
      navigate(`/interview/${interview.id}/feedback`, { replace: true })
    }
  }, [interview, navigate])

  // Identify the active question to be answered
  // The active question is the latest assistant message in the conversation
  const assistantMessages = messages.filter((m) => m.role === "assistant")
  const activeQuestion: InterviewMessage | undefined =
    interview?.current_question || assistantMessages[assistantMessages.length - 1]

  const isFollowUp = activeQuestion?.message_type === "follow_up"
  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0

  const handleSubmitAnswer = () => {
    if (!answerText.trim() || !activeQuestion || isSubmitting) return

    setErrorMessage(null)
    submitAnswer(
      {
        question_id: activeQuestion.id,
        answer: answerText.trim(),
      },
      {
        onSuccess: (response) => {
          setAnswerText("")
          if (response.is_completed) {
            navigate(`/interview/${interviewId}/feedback`)
          }
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { error?: { message?: string } } } })?.response
              ?.data?.error?.message || "Failed to submit answer. Please try again."
          setErrorMessage(msg)
        },
      }
    )
  }

  const handleFinishEarly = () => {
    if (window.confirm("Complete interview session early and generate your AI feedback report?")) {
      completeInterview(undefined, {
        onSuccess: () => {
          navigate(`/interview/${interviewId}/feedback`)
        },
      })
    }
  }

  const handleExitZen = () => {
    if (window.confirm("Exit interview session? Unfinished questions will not be evaluated.")) {
      if (interviewId) {
        abandonInterview(undefined)
      }
      navigate("/dashboard")
    }
  }

  if (isLoadingSession || isLoadingMessages) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Connecting to AI Interviewer...</p>
        </div>
      </div>
    )
  }

  if (sessionError || !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-background p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">Interview Session Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The requested interview session could not be retrieved or has expired.
          </p>
          <Button onClick={() => navigate("/interview/setup")}>Configure New Session</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-background">
      {/* Zen Distraction-Free Header */}
      <ZenInterviewHeader
        roleTitle={interview.target_role_title}
        currentQuestion={interview.current_question_number}
        totalQuestions={interview.settings?.main_question_limit || 5}
        followUpIndex={interview.current_follow_up_depth}
        maxFollowUps={interview.settings?.follow_up_limit_per_question || 2}
        elapsedMinutes={elapsedMinutes}
        onExit={handleExitZen}
      />

      {/* Main Interview Stage */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {errorMessage && (
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Previous Transcript Q&A Accordion/History if any */}
        {messages.length > 1 && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Conversation History ({messages.length} messages)
            </span>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {messages.slice(0, -1).map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg text-xs leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-secondary/60 border border-border text-foreground"
                      : "bg-primary/5 border border-primary/20 text-foreground ml-6"
                  }`}
                >
                  <span className="font-semibold block mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {msg.role === "assistant" ? "Interviewer" : "You"}:
                  </span>
                  {msg.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Question or Adaptive Follow-Up Card */}
        {activeQuestion && (
          <Card
            className={`shadow-xs border ${
              isFollowUp
                ? "border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20"
                : "border-border bg-card"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    Q{activeQuestion.question_number}
                  </span>
                  <Badge variant={isFollowUp ? "default" : "outline"} className="text-xs capitalize">
                    {isFollowUp ? `Adaptive Follow-up (Depth ${activeQuestion.follow_up_depth})` : "Main Question"}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  Question {interview.current_question_number} of {interview.settings?.main_question_limit || 5}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2.5">
                {isFollowUp && <CornerDownRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />}
                <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
                  "{activeQuestion.content}"
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Answer Drafting Editor */}
        <Card className="shadow-xs space-y-4 p-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your Answer (Text Practice Mode)
            </label>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready to submit</span>
            </div>
          </div>

          <Textarea
            rows={7}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Type your technical explanation here. Cover core concepts, algorithms, concurrency, architecture, and operational trade-offs..."
            className="font-sans text-sm leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <span className="text-xs text-muted-foreground font-mono">
              Word count: {wordCount} words {wordCount < 30 ? "(Aim for at least 40 words for comprehensive evaluation)" : ""}
            </span>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAnswerText("")}
                disabled={isSubmitting || !answerText}
              >
                Clear
              </Button>

              <Button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !answerText.trim() || !activeQuestion}
                className="shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Evaluating with AI...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer & Continue</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Finish Session Early Shortcut */}
        <div className="text-center pt-2">
          <button
            onClick={handleFinishEarly}
            disabled={isCompleting}
            className="text-xs font-medium text-muted-foreground hover:text-primary underline disabled:opacity-50"
          >
            {isCompleting ? "Finalizing Report..." : "Complete Session Early & View AI Feedback Report →"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InterviewScreen
