import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText,
  Lightbulb,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton"
import { EmptyState } from "@/components/common/EmptyState"
import {
  useJobRoles,
  useLatestSkillGap,
  useResumes,
  useUserProfile,
  useAnalyzeSkillGap,
} from "./hooks/useSkillGap"

export const SkillGapScreen: React.FC = () => {
  const navigate = useNavigate()

  // Queries
  const { data: roles = [], isLoading: rolesLoading } = useJobRoles()
  const { data: latestGap, isLoading: gapLoading } = useLatestSkillGap()
  const { data: resumes = [], isLoading: resumesLoading } = useResumes()
  const { data: profile } = useUserProfile()
  const analyzeMutation = useAnalyzeSkillGap()

  // Local state
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"all" | "missing" | "partial" | "matched" | "optional">("all")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Initialize selected role when data loads
  useEffect(() => {
    if (latestGap?.target_role_id) {
      setSelectedRoleId(latestGap.target_role_id)
    } else if (profile?.target_role_id) {
      setSelectedRoleId(profile.target_role_id)
    } else if (roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(roles[0].id)
    }
  }, [latestGap, profile, roles, selectedRoleId])

  const selectedRole = roles.find((r) => r.id === selectedRoleId || r.slug === selectedRoleId) || roles[0]

  const hasUploadedResume = resumes && resumes.length > 0
  const latestResume = hasUploadedResume ? resumes[0] : null

  // Trigger analysis handler
  const handleAnalyze = async () => {
    if (!selectedRole) return
    setErrorMessage(null)
    try {
      await analyzeMutation.mutateAsync({
        target_role_id: selectedRole.id,
        resume_id: latestResume?.id,
      })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ||
        "Failed to generate skill gap analysis. Please try again."
      setErrorMessage(msg)
    }
  }

  // Filter skills based on active tab
  const matchedSkills = latestGap?.matched_skills || []
  const partialSkills = latestGap?.partially_matched_skills || []
  const missingSkills = latestGap?.missing_skills || []
  const optionalSkills = latestGap?.optional_skills || []

  const totalRequired = latestGap?.counts?.total_required ?? (matchedSkills.length + partialSkills.length + missingSkills.length)
  const isStale = Boolean(latestGap?.is_stale || (latestGap && selectedRole && latestGap.target_role_id !== selectedRole.id))

  if (rolesLoading || gapLoading || resumesLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Skill Gap Analysis"
          description="Evaluating candidate competencies against market benchmarks for engineering roles."
        />
        <LoadingSkeleton count={3} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Gap Analysis"
        description="Compare your verified resume competencies against market benchmarks for target engineering roles."
        badge={{ label: "Market Calibrated", variant: "info" }}
        actions={
          latestGap && (
            <Button onClick={() => navigate("/roadmap")}>
              Generate Roadmap from Gaps
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )
        }
      />

      {/* Target Role Selector Card */}
      <Card className="p-4 sm:p-5 shadow-xs border-border bg-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <label htmlFor="role-select" className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Target Engineering Role
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  id="role-select"
                  value={selectedRoleId}
                  onChange={(e) => {
                    setSelectedRoleId(e.target.value)
                    setErrorMessage(null)
                  }}
                  className="font-bold text-base sm:text-lg text-foreground bg-transparent border-0 focus:ring-0 cursor-pointer p-0"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id} className="text-foreground bg-card">
                      {r.title} — {r.experience_level}
                    </option>
                  ))}
                </select>
                {selectedRole && (
                  <Badge variant="outline" className="text-xs font-medium">
                    {selectedRole.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {latestResume ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Source: <strong className="text-foreground">{latestResume.original_filename}</strong>
                </span>
              </div>
            ) : (
              <span className="text-xs text-rose-500 font-medium">No resume on file</span>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending || !hasUploadedResume}
              className="shrink-0"
            >
              {analyzeMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Competencies...
                </>
              ) : latestGap ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-evaluate Role
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Gap Analysis
                </>
              )}
            </Button>
          </div>
        </div>

        {selectedRole && (
          <p className="mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
            {selectedRole.description}
          </p>
        )}
      </Card>

      {/* Error Message Alert */}
      {errorMessage && (
        <Card className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="block font-semibold">Analysis Failed</strong>
            <span>{errorMessage}</span>
          </div>
        </Card>
      )}

      {/* Case A: No Resume Uploaded */}
      {!hasUploadedResume && (
        <EmptyState
          icon={FileText}
          title="No Resume Uploaded"
          description="Upload your PDF or DOCX resume to extract your verified skills and compare them against market benchmarks."
          actionLabel="Upload Resume"
          onAction={() => navigate("/resume")}
        />
      )}

      {/* Case B: Has Resume but No Analysis Generated Yet */}
      {hasUploadedResume && !latestGap && (
        <Card className="p-8 text-center space-y-4 shadow-xs border-dashed border-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-foreground">Ready for Competency Evaluation</h3>
            <p className="text-xs text-muted-foreground">
              Click &quot;Run Gap Analysis&quot; above to measure your experience against the required competencies for{" "}
              <strong>{selectedRole?.title}</strong>.
            </p>
          </div>
          <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
            {analyzeMutation.isPending ? "Evaluating..." : "Start Skill Gap Analysis"}
          </Button>
        </Card>
      )}

      {/* Case C: Stale Analysis Warning */}
      {latestGap && isStale && (
        <Card className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <strong className="font-semibold block sm:inline mr-1">Analysis Calibrated to Previous Version:</strong>
              <span>Newer resume data or role selection is available.</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending}
            className="shrink-0 border-amber-400 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Recalibrate Now
          </Button>
        </Card>
      )}

      {/* Case D: Active Skill Gap Analysis Dashboard */}
      {latestGap && (
        <div className="space-y-6">
          {/* Readiness Benchmark Score Banner */}
          <Card className="p-6 shadow-xs border-primary/20 bg-gradient-to-r from-indigo-50/30 via-card to-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Target Readiness Benchmark
                  </span>
                  {missingSkills.length > 0 && (
                    <Badge variant="warning">{missingSkills.length} High-Impact Gaps</Badge>
                  )}
                  {latestGap.match_percentage >= 75 && (
                    <Badge variant="success">Interview Ready</Badge>
                  )}
                </div>
                <h3 className="text-3xl font-extrabold text-foreground">
                  {latestGap.match_percentage}%{" "}
                  <span className="text-sm font-normal text-muted-foreground">Competency Match</span>
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {latestGap.summary || (
                    <>
                      You match <strong>{matchedSkills.length} of {totalRequired}</strong> core competencies for{" "}
                      <strong>{latestGap.target_role_title}</strong>. Bridging high-impact missing areas will substantially
                      boost candidate interview qualification probability.
                    </>
                  )}
                </p>
              </div>

              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Weighted Match</span>
                  <span className="font-mono">{latestGap.match_percentage}%</span>
                </div>
                <Progress value={latestGap.match_percentage} />
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span className="text-emerald-600 font-medium">✓ {matchedSkills.length} Matched</span>
                  <span className="text-amber-600 font-medium">~ {partialSkills.length} Partial</span>
                  <span className="text-rose-600 font-medium">⚠️ {missingSkills.length} Missing</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Stat Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-4 shadow-xs border-emerald-200/50 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Verified Matched</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{matchedSkills.length}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Full weighted credit</p>
            </Card>

            <Card className="p-4 shadow-xs border-amber-200/50 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Partially Matched</span>
                <HelpCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{partialSkills.length}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">50% partial credit</p>
            </Card>

            <Card className="p-4 shadow-xs border-rose-200/50 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Missing Competencies</span>
                <AlertCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{missingSkills.length}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Key gaps to bridge</p>
            </Card>

            <Card className="p-4 shadow-xs border-indigo-200/50 dark:border-indigo-900/30 bg-indigo-50/20 dark:bg-indigo-950/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Optional / Bonus</span>
                <Star className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{optionalSkills.length}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Differentiating skills</p>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === "all" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              All Skills ({matchedSkills.length + partialSkills.length + missingSkills.length + optionalSkills.length})
            </button>
            <button
              onClick={() => setActiveTab("missing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === "missing" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Missing Gaps ({missingSkills.length})
            </button>
            <button
              onClick={() => setActiveTab("partial")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === "partial" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Partial Matches ({partialSkills.length})
            </button>
            <button
              onClick={() => setActiveTab("matched")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === "matched" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              Verified Matched ({matchedSkills.length})
            </button>
            {optionalSkills.length > 0 && (
              <button
                onClick={() => setActiveTab("optional")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  activeTab === "optional" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                Optional Extras ({optionalSkills.length})
              </button>
            )}
          </div>

          {/* Detailed Skill Cards Section */}
          <div className="space-y-3">
            {/* 1. Missing Skills */}
            {(activeTab === "all" || activeTab === "missing") &&
              missingSkills.map((item, idx) => (
                <Card key={`missing-${idx}`} className="p-4 sm:p-5 shadow-xs border-l-4 border-l-rose-500 hover:border-border transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-foreground">{item.name}</h4>
                        <Badge variant="destructive" className="text-[10px]">Missing Gap</Badge>
                        <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Required competency for this role. Priority weight: {item.importance}/5.
                      </p>
                    </div>
                    <div className="text-xs text-rose-600 font-semibold shrink-0">
                      Earned: 0% credit
                    </div>
                  </div>
                </Card>
              ))}

            {/* 2. Partial Skills */}
            {(activeTab === "all" || activeTab === "partial") &&
              partialSkills.map((item, idx) => (
                <Card key={`partial-${idx}`} className="p-4 sm:p-5 shadow-xs border-l-4 border-l-amber-500 hover:border-border transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-foreground">{item.name}</h4>
                        <Badge variant="warning" className="text-[10px]">Partial Match</Badge>
                        <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.reason || "Partial proficiency or related foundational experience detected in resume."}
                      </p>
                    </div>
                    <div className="text-xs text-amber-600 font-semibold shrink-0">
                      Earned: 50% credit
                    </div>
                  </div>
                </Card>
              ))}

            {/* 3. Matched Skills */}
            {(activeTab === "all" || activeTab === "matched") &&
              matchedSkills.map((item, idx) => (
                <Card key={`matched-${idx}`} className="p-4 sm:p-5 shadow-xs border-l-4 border-l-emerald-500 hover:border-border transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-foreground">{item.name}</h4>
                        <Badge variant="success" className="text-[10px]">Verified Match</Badge>
                        <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.evidence || "Confirmed by candidate resume analysis."}
                      </p>
                    </div>
                    <div className="text-xs text-emerald-600 font-semibold shrink-0">
                      Earned: 100% credit
                    </div>
                  </div>
                </Card>
              ))}

            {/* 4. Optional Skills */}
            {(activeTab === "all" || activeTab === "optional") &&
              optionalSkills.map((item, idx) => (
                <Card key={`opt-${idx}`} className="p-4 sm:p-5 shadow-xs border-l-4 border-l-indigo-400 hover:border-border transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-foreground">{item.name}</h4>
                        <Badge variant="secondary" className="text-[10px]">Optional Bonus</Badge>
                        <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Candidate status: <span className="font-medium text-foreground uppercase">{item.status}</span>. Differentiates senior applicants.
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
          </div>

          {/* AI-Powered Actionable Recommendations */}
          {latestGap.recommendations && latestGap.recommendations.length > 0 && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-foreground">Actionable Improvement Roadmap</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestGap.recommendations.map((rec, idx) => (
                  <Card key={`rec-${idx}`} className="p-5 shadow-xs border-border flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-foreground">{rec.skill}</h4>
                        <Badge
                          variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "warning" : "info"}
                          className="text-[10px] uppercase font-bold"
                        >
                          {rec.priority} Priority
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
                      {rec.practical_project && (
                        <div className="p-2.5 rounded-lg bg-accent/40 border border-border/80">
                          <strong className="text-foreground block font-semibold mb-0.5">Practical Project:</strong>
                          <span className="text-muted-foreground">{rec.practical_project}</span>
                        </div>
                      )}
                      {rec.learning_activity && (
                        <div className="p-2.5 rounded-lg bg-accent/40 border border-border/80">
                          <strong className="text-foreground block font-semibold mb-0.5">Targeted Activity:</strong>
                          <span className="text-muted-foreground">{rec.learning_activity}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SkillGapScreen
