import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/features/auth/hooks/useAuth"
import {
  FileCheck,
  Compass,
  Milestone,
  Award,
  Play,
  Upload,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "@/components/common/StatCard"
import {
  mockResumeAnalysis,
  mockSkillGapAnalysis,
  mockRoadmap,
  mockInterviewHistory,
} from "@/mocks"

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [roadmapTasks, setRoadmapTasks] = useState(mockRoadmap.weeks[1].tasks)

  const firstName = user?.name ? user.name.split(" ")[0] : "Candidate"

  const toggleTask = (taskId: string) => {
    setRoadmapTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t))
    )
  }

  const completedCount = roadmapTasks.filter((t) => t.isCompleted).length
  const weekProgress = Math.round((completedCount / roadmapTasks.length) * 100)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Good morning, {firstName} 👋
            </h1>
            <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
              Active Prep
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Target Goal: <span className="font-semibold text-foreground">Senior Backend Engineer</span> • 4 weeks until target interview rounds.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
          <Button onClick={() => navigate("/interview/setup")} className="shadow-xs w-full sm:w-auto">
            <Play className="w-4 h-4 mr-2" />
            Start Mock Interview
          </Button>
          <Button variant="outline" onClick={() => navigate("/resume")} className="w-full sm:w-auto">
            <Upload className="w-4 h-4 mr-2" />
            Update Resume
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Resume Score"
          value={mockResumeAnalysis.overallScore}
          unit="/ 100"
          icon={FileCheck}
          trend={{ value: "Strong impact metrics detected", isPositive: true }}
          actionLabel="View Analysis"
          onAction={() => navigate("/resume")}
        />
        <StatCard
          title="Skill Readiness"
          value={`${mockSkillGapAnalysis.matchPercentage}%`}
          unit={`(${mockSkillGapAnalysis.matchedCount}/${mockSkillGapAnalysis.totalCount})`}
          icon={Compass}
          trend={{ value: `${mockSkillGapAnalysis.criticalGapCount} critical gaps to study`, isPositive: false }}
          actionLabel="Review Gaps"
          onAction={() => navigate("/skill-gap")}
        />
        <StatCard
          title="Roadmap Progress"
          value={`${mockRoadmap.completedTasks}`}
          unit={`/ ${mockRoadmap.totalTasks} Tasks`}
          icon={Milestone}
          subtitle={`Week 2 of ${mockRoadmap.totalWeeks} • ${mockRoadmap.completionPercentage}% overall`}
          actionLabel="Open Roadmap"
          onAction={() => navigate("/roadmap")}
        />
        <StatCard
          title="Avg Mock Score"
          value="78%"
          unit="(3 completed)"
          icon={Award}
          trend={{ value: "+6% improvement over baseline", isPositive: true }}
          actionLabel="Session History"
          onAction={() => navigate("/interview-history")}
        />
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Roadmap & Recommended Practice (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Roadmap Card */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Current Milestone
                  </span>
                  <CardTitle className="text-lg font-bold mt-0.5">
                    {mockRoadmap.weeks[1].title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-28">
                    <Progress value={weekProgress} />
                  </div>
                  <span className="text-xs font-mono font-semibold text-muted-foreground">
                    {weekProgress}%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {roadmapTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-border hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => toggleTask(task.id)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-semibold truncate ${
                          task.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        {task.estimatedMinutes} mins
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {task.description}
                    </p>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-muted-foreground">
                  {completedCount} of {roadmapTasks.length} milestone tasks completed
                </span>
                <Button variant="link" size="sm" onClick={() => navigate("/roadmap")}>
                  Full 4-Week Schedule →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Practice Rounds */}
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Recommended Practice Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-slate-50/60 dark:bg-slate-900/40 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="success">Technical</Badge>
                    <span className="text-xs text-muted-foreground">25 mins</span>
                  </div>
                  <h4 className="font-semibold text-sm text-foreground mb-1">
                    Distributed Caching & Redis Lua
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Covers race condition prevention and token bucket rate limits.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/interview/setup")}
                  >
                    Start Session →
                  </Button>
                </div>

                <div className="p-4 rounded-xl border border-border bg-slate-50/60 dark:bg-slate-900/40 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="info">Behavioral</Badge>
                    <span className="text-xs text-muted-foreground">20 mins</span>
                  </div>
                  <h4 className="font-semibold text-sm text-foreground mb-1">
                    Production Outage Incident Response
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Practice STAR method answers for engineering leadership.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/interview/setup")}
                  >
                    Start Session →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Recent Interview Activity & Preparation Insight (1 col) */}
        <div className="space-y-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Recent Interviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockInterviewHistory.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-border/80 bg-slate-50/50 dark:bg-slate-900/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground truncate max-w-[170px]">
                      {item.roleTitle}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.score}%
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                    <span>{item.date} • {item.durationMinutes} mins</span>
                    <span className="capitalize text-primary font-medium">{item.interviewType}</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 text-xs font-medium text-primary p-0"
                    onClick={() => navigate(`/interview/${item.id}/feedback`)}
                  >
                    View AI Critique →
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => navigate("/interview-history")}
              >
                View Complete History
              </Button>
            </CardContent>
          </Card>

          {/* AI Preparation Insight Tip */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-white dark:from-indigo-950/20 dark:to-card border border-indigo-100 dark:border-indigo-900/40 shadow-xs">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              Preparation Calibration
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Addressing your <strong>4 critical skill gaps</strong> in Redis Lua scripting and Kafka partitions will raise your overall role readiness to an estimated <strong>84%</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardScreen
