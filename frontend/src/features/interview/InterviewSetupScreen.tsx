import React, { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { Code2, Users, Scale, Sparkles, MicOff, ArrowRight, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/PageHeader"
import { useJobRoles } from "@/features/skill-gap/hooks/useSkillGap"
import { useCreateInterview } from "@/features/interview/hooks/useInterview"

const setupSchema = z.object({
  targetRoleId: z.string().min(1, "Please select a target role"),
  interviewType: z.enum(["technical", "behavioral", "mixed"]),
  difficulty: z.enum(["junior", "mid", "senior"]),
  questionCount: z.number().min(2).max(10),
})

type SetupFormValues = z.infer<typeof setupSchema>

export const InterviewSetupScreen: React.FC = () => {
  const navigate = useNavigate()
  const { data: jobRoles = [], isLoading: isLoadingRoles } = useJobRoles()
  const { mutate: createInterview, isPending: isCreating } = useCreateInterview()
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      targetRoleId: "",
      interviewType: "technical",
      difficulty: "mid",
      questionCount: 5,
    },
  })

  // Auto-select first role when loaded
  const selectedRole = watch("targetRoleId")
  React.useEffect(() => {
    if (!selectedRole && jobRoles.length > 0) {
      setValue("targetRoleId", jobRoles[0].id || jobRoles[0].slug)
    }
  }, [jobRoles, selectedRole, setValue])

  const onSubmit = (values: SetupFormValues) => {
    setApiError(null)
    const durationMinutes = values.questionCount <= 4 ? 15 : values.questionCount <= 6 ? 30 : 45

    createInterview(
      {
        target_role_id: values.targetRoleId,
        interview_type: values.interviewType,
        difficulty: values.difficulty,
        duration_minutes: durationMinutes,
        question_limit: values.questionCount,
      },
      {
        onSuccess: (data) => {
          navigate(`/interview/${data.id}`)
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { error?: { message?: string } } } })?.response
              ?.data?.error?.message || "Failed to start mock interview session. Please try again."
          setApiError(message)
        },
      }
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Configure AI Mock Interview"
        description="Select your target role, evaluation type, and difficulty level for an adaptive session."
      />

      {apiError && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-xs space-y-6">
          <CardContent className="pt-6 space-y-6">
            {/* 1. Target Role */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                1. Select Target Job Role
              </label>
              {isLoadingRoles ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Loading available roles...
                </div>
              ) : (
                <Controller
                  name="targetRoleId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      {jobRoles.map((role) => (
                        <option key={role.id || role.slug} value={role.id || role.slug}>
                          {role.title} ({role.category || "General"})
                        </option>
                      ))}
                    </select>
                  )}
                />
              )}
              {errors.targetRoleId && (
                <p className="text-xs font-medium text-destructive">{errors.targetRoleId.message}</p>
              )}
            </div>

            {/* 2. Interview Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                2. Interview Category
              </label>
              <Controller
                name="interviewType"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div
                      onClick={() => field.onChange("technical")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        field.value === "technical"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                          : "border-border bg-card hover:bg-accent/40"
                      }`}
                    >
                      <Code2 className="w-5 h-5 text-primary mb-2" />
                      <div className="font-semibold text-sm text-foreground">Technical</div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        System design, APIs, data structures, concurrency.
                      </p>
                    </div>

                    <div
                      onClick={() => field.onChange("behavioral")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        field.value === "behavioral"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                          : "border-border bg-card hover:bg-accent/40"
                      }`}
                    >
                      <Users className="w-5 h-5 text-primary mb-2" />
                      <div className="font-semibold text-sm text-foreground">Behavioral</div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        STAR method, conflict resolution, leadership.
                      </p>
                    </div>

                    <div
                      onClick={() => field.onChange("mixed")}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        field.value === "mixed"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                          : "border-border bg-card hover:bg-accent/40"
                      }`}
                    >
                      <Scale className="w-5 h-5 text-primary mb-2" />
                      <div className="font-semibold text-sm text-foreground">Mixed Round</div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Comprehensive evaluation of code and culture.
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* 3. Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                3. Seniority & Difficulty Level
              </label>
              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => field.onChange("junior")}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        field.value === "junior"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-border bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      Junior / Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("mid")}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        field.value === "mid"
                          ? "border-amber-500 bg-amber-50 text-amber-800 ring-1 ring-amber-500 dark:bg-amber-950 dark:text-amber-300"
                          : "border-border bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      Mid-Level
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("senior")}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        field.value === "senior"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
                          : "border-border bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      Senior / Staff
                    </button>
                  </div>
                )}
              />
            </div>

            {/* 4. Question Count & Duration */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                4. Session Length
              </label>
              <Controller
                name="questionCount"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value={3}>3 Questions (approx. 15 minutes)</option>
                    <option value={5}>5 Questions (approx. 25 minutes — Recommended)</option>
                    <option value={8}>8 Questions (approx. 40 minutes — Comprehensive)</option>
                  </select>
                )}
              />
            </div>

            {/* Mode Notice: Text Active / Voice Mode Phase 2 */}
            <div className="p-4 rounded-xl border border-border bg-slate-50/60 dark:bg-slate-900/30 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-card border border-border">
                  <MicOff className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">Practice Mode: Text-Based</span>
                    <Badge variant="outline" className="text-[10px] py-0">Phase 1 Active</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Voice interview mode (Web Speech STT/TTS) is scheduled for Phase 2.
                  </p>
                </div>
              </div>
            </div>

            {/* Adaptive Notice */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Adaptive Follow-Ups Enabled:</strong> The AI interviewer will analyze your answer depth and ask real-time probing follow-up questions to test concurrency and architectural trade-offs.
              </p>
            </div>
          </CardContent>

          <CardFooter className="pt-2 pb-6 border-t border-border">
            <Button type="submit" size="lg" className="w-full" isLoading={isCreating}>
              <span>Launch Distraction-Free Interview</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default InterviewSetupScreen
