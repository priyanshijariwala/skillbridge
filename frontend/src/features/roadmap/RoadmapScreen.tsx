import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  AlertCircle,
  RefreshCw,
  FileText,
  Compass,
  Layers,
  CheckCircle,
  Play,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton"
import { EmptyState } from "@/components/common/EmptyState"
import {
  useCurrentRoadmap,
  useGenerateRoadmap,
  useUpdateTaskStatus,
  useLatestSkillGap,
  useResumes,
} from "./hooks/useRoadmap"
import type { TaskStatus } from "./types/roadmap.types"

export const RoadmapScreen: React.FC = () => {
  const navigate = useNavigate()

  // Queries & Mutations
  const { data: roadmap, isLoading: roadmapLoading } = useCurrentRoadmap()
  const { data: latestGap, isLoading: gapLoading } = useLatestSkillGap()
  const { data: resumes = [], isLoading: resumesLoading } = useResumes()
  const generateMutation = useGenerateRoadmap()
  const updateTaskMutation = useUpdateTaskStatus()

  // Local state
  const [selectedMilestoneOrder, setSelectedMilestoneOrder] = useState<number>(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Sync selected milestone order when roadmap loads
  useEffect(() => {
    if (roadmap?.milestones && roadmap.milestones.length > 0) {
      // Find first in_progress or not_started milestone, else default to 1
      const activeM =
        roadmap.milestones.find((m) => m.status === "in_progress") ||
        roadmap.milestones.find((m) => m.status === "not_started") ||
        roadmap.milestones[0]
      setSelectedMilestoneOrder(activeM.order)
    }
  }, [roadmap?.id])

  const hasUploadedResume = resumes && resumes.length > 0
  const hasSkillGap = Boolean(latestGap)

  // Handle roadmap generation
  const handleGenerate = async () => {
    setErrorMessage(null)
    try {
      await generateMutation.mutateAsync({
        skill_gap_analysis_id: latestGap?.id,
      })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ||
        "Failed to generate learning roadmap. Please try again."
      setErrorMessage(msg)
    }
  }

  // Handle task status transition
  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!roadmap) return
    try {
      await updateTaskMutation.mutateAsync({
        roadmapId: roadmap.id,
        taskId,
        status: newStatus,
      })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Failed to update task progress."
      setErrorMessage(msg)
    }
  }

  if (roadmapLoading || gapLoading || resumesLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Personalized Learning Roadmap"
          description="Synthesizing personalized milestone curriculum from your verified skill gaps."
        />
        <LoadingSkeleton count={3} />
      </div>
    )
  }

  // Derived progress statistics
  const milestones = roadmap?.milestones || []
  const allTasks = milestones.flatMap((m) => m.tasks)
  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter((t) => t.status === "completed").length
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length
  const remainingHours = allTasks
    .filter((t) => t.status !== "completed")
    .reduce((acc, t) => acc + (t.estimated_duration_hours || 0), 0)

  const completedMilestones = milestones.filter((m) => m.status === "completed").length
  const currentMilestone =
    milestones.find((m) => m.order === selectedMilestoneOrder) || milestones[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personalized Learning Roadmap"
        description="A structured, dependency-aware preparation curriculum synthesized directly from your verified skill gaps."
        badge={{
          label: roadmap
            ? roadmap.status === "completed"
              ? "Curriculum Completed"
              : roadmap.status === "archived"
              ? "Archived Plan"
              : `Active Plan (${roadmap.estimated_duration_days} Days)`
            : "Adaptive Curriculum",
          variant: roadmap?.status === "completed" ? "success" : "default",
        }}
        actions={
          roadmap && (
            <Button onClick={() => navigate("/interview/setup")}>
              <Bot className="w-4 h-4 mr-2" />
              Practice Roadmap Topics
            </Button>
          )
        }
      />

      {/* Error Message Alert */}
      {errorMessage && (
        <Card className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="block font-semibold">Action Failed</strong>
            <span>{errorMessage}</span>
          </div>
        </Card>
      )}

      {/* Case 1: No Resume Uploaded */}
      {!hasUploadedResume && (
        <EmptyState
          icon={FileText}
          title="No Resume on File"
          description="Upload your resume first to extract competencies and generate your personalized curriculum."
          actionLabel="Upload Resume"
          onAction={() => navigate("/resume")}
        />
      )}

      {/* Case 2: Resume exists but No Skill Gap Analysis yet */}
      {hasUploadedResume && !hasSkillGap && (
        <EmptyState
          icon={Compass}
          title="Skill Gap Analysis Required"
          description="Compare your resume against your target job role benchmarks so we can tailor roadmap milestones to your exact gaps."
          actionLabel="Go to Skill Gap Analysis"
          onAction={() => navigate("/skill-gap")}
        />
      )}

      {/* Case 3: Skill Gap exists but No Roadmap Generated yet */}
      {hasSkillGap && !roadmap && (
        <Card className="p-8 text-center space-y-4 shadow-xs border-dashed border-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-foreground">Ready to Build Your Learning Curriculum</h3>
            <p className="text-xs text-muted-foreground">
              We detected skill gaps for <strong>{latestGap?.target_role_title}</strong>. Generate a sequenced,
              milestone-driven plan to systematically bridge missing competencies.
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Synthesizing Custom Roadmap...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Learning Roadmap
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Case 4: Stale Roadmap Warning */}
      {roadmap && roadmap.is_stale && (
        <Card className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <strong className="font-semibold block sm:inline mr-1">Curriculum Calibrated to Previous Version:</strong>
              <span>Newer skill gap evaluation is available. Regenerate to align with your latest progress.</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="shrink-0 border-amber-400 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Regenerate Roadmap
          </Button>
        </Card>
      )}

      {/* Case 5: Active Learning Roadmap Dashboard */}
      {roadmap && (
        <div className="space-y-6">
          {/* Overall Progress Banner */}
          <Card className="p-6 shadow-xs border-primary/20 bg-gradient-to-r from-indigo-50/30 via-card to-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Target Goal: {roadmap.target_role_title}
                  </span>
                  {roadmap.status === "completed" && (
                    <Badge variant="success">All Milestones Completed</Badge>
                  )}
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {completedTasks} of {totalTasks} Tasks Completed ({roadmap.completion_percentage}%)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {roadmap.description}
                </p>
              </div>

              <div className="w-full sm:w-64 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Curriculum Completion</span>
                  <span className="font-mono">{roadmap.completion_percentage}%</span>
                </div>
                <Progress value={roadmap.completion_percentage} />
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>{completedMilestones} of {milestones.length} Milestones Done</span>
                  <span>~{remainingHours} Hours Left</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Milestones</span>
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {completedMilestones} <span className="text-xs font-normal text-muted-foreground">/ {milestones.length}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Structured learning phases</p>
            </Card>

            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Completed Tasks</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {completedTasks} <span className="text-xs font-normal text-muted-foreground">/ {totalTasks}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Verified hands-on work</p>
            </Card>

            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">In Progress</span>
                <Play className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{inProgressTasks}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active focused learning</p>
            </Card>

            <Card className="p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Estimated Time</span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {remainingHours} <span className="text-xs font-normal text-muted-foreground">hrs</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">To role readiness</p>
            </Card>
          </div>

          {/* Milestone Stepper / Tabs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Learning Milestones
              </h4>
              <span className="text-xs text-muted-foreground">
                Select a milestone to view actionable tasks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {milestones.map((m) => {
                const mCompleted = m.tasks.filter((t) => t.status === "completed").length
                const isSelected = m.order === selectedMilestoneOrder
                const isDone = m.status === "completed"
                const isInProgress = m.status === "in_progress"

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMilestoneOrder(m.order)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40"
                        : "border-border bg-card hover:bg-accent/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-foreground">
                        Phase {m.order}
                      </span>
                      {isDone ? (
                        <Badge variant="success" className="text-[10px]">Completed</Badge>
                      ) : isInProgress ? (
                        <Badge variant="warning" className="text-[10px]">In Progress</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Not Started</Badge>
                      )}
                    </div>
                    <h5 className="font-semibold text-sm text-foreground line-clamp-1">{m.title}</h5>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                      <span>{mCompleted} of {m.tasks.length} tasks</span>
                      <span>{m.estimated_duration_days} days</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active Milestone Details & Task List */}
          {currentMilestone && (
            <Card className="p-5 sm:p-6 shadow-xs border-border space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-border/70">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Phase {currentMilestone.order}
                    </span>
                    <Badge variant="outline" className="text-xs font-medium uppercase">
                      {currentMilestone.priority} Priority
                    </Badge>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    {currentMilestone.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {currentMilestone.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {currentMilestone.related_skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Actionable Tasks ({currentMilestone.tasks.length})
                </h4>

                <div className="space-y-3">
                  {currentMilestone.tasks.map((task) => {
                    const isCompleted = task.status === "completed"
                    const isInProgress = task.status === "in_progress"

                    return (
                      <Card
                        key={task.id}
                        className={`p-4 sm:p-5 shadow-xs transition-colors border-l-4 ${
                          isCompleted
                            ? "border-l-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/10"
                            : isInProgress
                            ? "border-l-amber-500 bg-amber-50/15 dark:bg-amber-950/10"
                            : "border-l-slate-300 dark:border-l-slate-700 bg-card"
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className={`font-bold text-sm sm:text-base ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {task.title}
                              </h5>
                              <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                                {task.task_type}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                {task.related_skill}
                              </Badge>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {task.description}
                            </p>

                            {/* Authoritative Resource Guidance */}
                            {task.resources && task.resources.length > 0 && (
                              <div className="pt-1.5">
                                <span className="text-[11px] font-semibold text-foreground/80 block mb-1">
                                  Authoritative Resource Guidance:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {task.resources.map((res, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/60 border border-border/80 text-[11px] text-muted-foreground"
                                    >
                                      <BookOpen className="w-3 h-3 text-primary shrink-0" />
                                      <span>{res}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                ~{task.estimated_duration_hours} Hours
                              </span>
                              <span>•</span>
                              <span className="uppercase font-medium">{task.priority} Priority</span>
                              {task.completed_at && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-600 font-medium">Completed</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Task Action Controls */}
                          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                            {task.status === "not_started" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTaskStatusChange(task.id, "in_progress")}
                                disabled={updateTaskMutation.isPending}
                              >
                                <Play className="w-3.5 h-3.5 mr-1 text-primary" />
                                Start Task
                              </Button>
                            )}

                            {task.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() => handleTaskStatusChange(task.id, "completed")}
                                disabled={updateTaskMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Mark Completed
                              </Button>
                            )}

                            {task.status === "completed" && (
                              <div className="flex items-center gap-2">
                                <Badge variant="success" className="gap-1 py-1 px-2">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Done
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTaskStatusChange(task.id, "in_progress")}
                                  disabled={updateTaskMutation.isPending}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Reopen
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default RoadmapScreen
