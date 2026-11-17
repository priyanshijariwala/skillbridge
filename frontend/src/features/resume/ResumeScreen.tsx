import React, { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2,
  Sparkles,
  FileText,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  Award,
  TrendingUp,
  FileSearch,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SkillBadge, type SkillStatus } from "@/components/common/SkillBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { resumeFileSchema } from "@/features/resume/schemas/resume.schema"
import {
  useListResumes,
  useUploadResume,
  useDeleteResume,
  useDownloadResume,
  useGetResumeAnalysis,
  useAnalyzeResume,
} from "@/features/resume/hooks/useResumes"
import type { ResumeRead } from "@/features/resume/types/resume.types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf: "bg-rose-50 text-rose-700 border-rose-200",
  docx: "bg-blue-50 text-blue-700 border-blue-200",
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
interface ResumeCardProps {
  resume: ResumeRead
  isSelected: boolean
  onSelect: (r: ResumeRead) => void
  onDownload: (r: ResumeRead) => void
  onDelete: (r: ResumeRead) => void
  isDownloading: boolean
  isDeleting: boolean
}

const ResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  isSelected,
  onSelect,
  onDownload,
  onDelete,
  isDownloading,
  isDeleting,
}) => {
  const colorCls = FILE_TYPE_COLORS[resume.file_type] ?? "bg-slate-50 text-slate-700 border-slate-200"
  return (
    <div
      onClick={() => onSelect(resume)}
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${colorCls}`}>
          {resume.file_type.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
              {resume.original_filename}
            </span>
            <Badge variant={resume.status === "completed" ? "success" : "secondary"} className="text-[10px] py-0.5 px-2">
              {resume.status}
            </Badge>
            {isSelected && (
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider ml-1">
                Active Selection
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatBytes(resume.file_size_bytes)} • Uploaded {formatDate(resume.created_at)}
          </p>
        </div>
      </div>
      <div
        className="flex items-center gap-2 self-start sm:self-auto shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDownload(resume)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 mr-1" />
          )}
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(resume)}
          disabled={isDeleting}
          aria-label="Delete resume"
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export const ResumeScreen: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)

  const { data: resumes = [] } = useListResumes()
  const uploadResume = useUploadResume()
  const deleteResume = useDeleteResume()
  const downloadResume = useDownloadResume()

  // Active resume is either manually selected or the first resume in the list
  const activeResumeId = selectedResumeId || (resumes.length > 0 ? resumes[0].id : null)
  const activeResume = resumes.find((r) => r.id === activeResumeId) || resumes[0]

  // Analysis query & mutation
  const {
    data: analysisData,
    isLoading: isLoadingAnalysis,
  } = useGetResumeAnalysis(activeResume?.id)

  const analyzeResumeMutation = useAnalyzeResume()

  // ---------------------------------------------------------------------------
  // File selection & upload
  // ---------------------------------------------------------------------------
  const processFile = (file: File | null | undefined) => {
    if (!file) return
    setFileError(null)

    const result = resumeFileSchema.safeParse(file)
    if (!result.success) {
      const issues = result.error.issues
      setFileError(issues[0]?.message || "Invalid file.")
      return
    }

    setUploadProgress(0)
    uploadResume.mutate(
      {
        file,
        onProgress: setUploadProgress,
      },
      {
        onSuccess: (uploaded) => {
          setUploadProgress(100)
          setSelectedResumeId(uploaded.id)
          if (fileInputRef.current) fileInputRef.current.value = ""
          setTimeout(() => setUploadProgress(0), 1500)
        },
        onError: (err) => {
          setFileError(err.message || "Upload failed. Please try again.")
          setUploadProgress(0)
        },
      }
    )
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0])
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    processFile(e.dataTransfer.files?.[0])
  }

  // ---------------------------------------------------------------------------
  // Delete with confirmation
  // ---------------------------------------------------------------------------
  const handleDeleteClick = (resume: ResumeRead) => {
    if (!window.confirm(`Delete "${resume.original_filename}"? This action cannot be undone.`)) return
    setPendingDeleteId(resume.id)
    deleteResume.mutate(resume.id, {
      onSuccess: () => {
        if (selectedResumeId === resume.id) {
          setSelectedResumeId(null)
        }
      },
      onSettled: () => setPendingDeleteId(null),
    })
  }

  // ---------------------------------------------------------------------------
  // Download
  // ---------------------------------------------------------------------------
  const handleDownload = (resume: ResumeRead) => {
    downloadResume.mutate({ id: resume.id, filename: resume.original_filename })
  }

  // ---------------------------------------------------------------------------
  // Start / Retry Analysis
  // ---------------------------------------------------------------------------
  const handleTriggerAnalysis = () => {
    if (!activeResume) return
    analyzeResumeMutation.mutate(activeResume.id)
  }

  const isUploading = uploadResume.isPending
  const isAnalyzing = analyzeResumeMutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resume Analysis & Competency Audit"
        description="Inspect AI-extracted skills, quantified impact metrics, and alignment with target engineering roles."
      />

      {/* Upload Dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload resume — click or drag and drop"
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click() }}
        className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all select-none focus:outline-none focus:ring-2 focus:ring-primary/50 ${
          isDragOver
            ? "border-primary bg-primary/5"
            : isUploading
            ? "border-border bg-muted/20 cursor-not-allowed"
            : "border-border bg-card hover:border-primary/50 hover:bg-accent/20"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleFileInput}
          aria-label="Resume file input"
        />

        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          {isUploading ? "Uploading…" : "Drag and drop your updated resume, or click to browse"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Supported file formats: PDF, DOCX (Max 5MB). File is parsed securely and never shared publicly.
        </p>

        {isUploading && (
          <div className="mt-4 max-w-xs mx-auto space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading…</span>
              <span className="font-mono">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}
      </div>

      {/* Errors */}
      {fileError && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{fileError}</span>
          <button
            onClick={() => setFileError(null)}
            className="ml-auto text-destructive/70 hover:text-destructive"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploadResume.isError && !fileError && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadResume.error?.message || "Upload failed. Please try again."}</span>
        </div>
      )}

      {/* Resumes List Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Uploaded Resumes
            {resumes.length > 0 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {resumes.length} file{resumes.length !== 1 ? "s" : ""}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          {resumes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No resumes uploaded yet.</p>
              <p className="text-xs mt-1">Use the zone above to upload your first resume.</p>
            </div>
          ) : (
            resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                isSelected={resume.id === activeResume?.id}
                onSelect={(r) => setSelectedResumeId(r.id)}
                onDownload={handleDownload}
                onDelete={handleDeleteClick}
                isDownloading={downloadResume.isPending && downloadResume.variables?.id === resume.id}
                isDeleting={deleteResume.isPending && pendingDeleteId === resume.id}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          AI Analysis Section
          ========================================================================= */}
      {activeResume && (
        <div className="space-y-6">
          {/* State 1: Analysis In Progress */}
          {isAnalyzing && (
            <Card className="p-8 shadow-xs border-primary/30 bg-primary/5 text-center space-y-4 animate-in fade-in-50">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Analyzing Resume Competencies with AI…
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Extracting technical skills, evaluating ATS readability, quantifying impact metrics, and benchmarking against engineering roles.
              </p>
            </Card>
          )}

          {/* State 2: Analysis Failed */}
          {analyzeResumeMutation.isError && !isAnalyzing && (
            <Card className="p-6 shadow-xs border-destructive/30 bg-destructive/5 space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Resume Analysis Failed</h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    {analyzeResumeMutation.error?.message || "An unexpected error occurred during AI analysis."}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerAnalysis}
                className="gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Analysis
              </Button>
            </Card>
          )}

          {/* State 3: Resume Uploaded But Not Yet Analyzed */}
          {!analysisData && !isLoadingAnalysis && !isAnalyzing && !analyzeResumeMutation.isError && (
            <Card className="p-6 shadow-xs border-primary/20 bg-gradient-to-r from-indigo-50/40 via-card to-card dark:from-indigo-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      AI Powered Audit
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mt-1">
                    Ready to Analyze "{activeResume.original_filename}"
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-lg">
                    Run our comprehensive AI audit to score your resume, detect strengths, uncover skill gaps, and benchmark ATS readability.
                  </p>
                </div>
                <Button
                  onClick={handleTriggerAnalysis}
                  disabled={isAnalyzing}
                  className="shrink-0 shadow-sm gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze with AI</span>
                </Button>
              </div>
            </Card>
          )}

          {/* State 4: Analysis Completed & Available */}
          {analysisData && !isAnalyzing && (
            <div className="space-y-6">
              {/* Overall Score Banner */}
              <Card className="p-6 shadow-xs border-primary/20 bg-gradient-to-r from-indigo-50/40 via-card to-card dark:from-indigo-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Overall Resume Score
                      </span>
                      <Badge variant="success" className="text-[10px] py-0.5 px-2">
                        Audit Completed
                      </Badge>
                    </div>
                    <h3 className="text-3xl font-extrabold text-foreground mt-1">
                      {analysisData.overall_score}{" "}
                      <span className="text-lg font-normal text-muted-foreground">/ 100</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                      {analysisData.summary}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <Button
                      variant="outline"
                      onClick={handleTriggerAnalysis}
                      disabled={isAnalyzing}
                      className="gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-run Analysis</span>
                    </Button>
                    <Button onClick={() => navigate("/skill-gap")} className="gap-1.5">
                      <span>Compare Role Gaps →</span>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Main Analysis Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Columns (2 cols): Score Breakdown, Strengths, Improvements */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Score Breakdown Card */}
                  <Card className="shadow-xs">
                    <CardHeader className="pb-3 border-b border-border">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Detailed Evaluation Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3.5">
                      {[
                        { label: "Content Quality & Impact", value: analysisData.score_breakdown.content_quality },
                        { label: "Technical Skills Presentation", value: analysisData.score_breakdown.skills_presentation },
                        { label: "Experience & Ownership Descriptions", value: analysisData.score_breakdown.experience_descriptions },
                        { label: "Structure & Readability", value: analysisData.score_breakdown.structure_readability },
                        { label: "ATS Machine Readability", value: analysisData.score_breakdown.ats_readability },
                      ].map((item) => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-foreground">{item.label}</span>
                            <span className="font-mono text-muted-foreground">{item.value}%</span>
                          </div>
                          <Progress value={item.value} />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Key Strengths */}
                  <Card className="shadow-xs">
                    <CardHeader className="pb-3 border-b border-border">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-base">
                        <CheckCircle className="w-5 h-5" />
                        <span>Key Strengths Detected ({analysisData.strengths.length})</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {analysisData.strengths.map((s) => (
                        <div key={s.id} className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/30 dark:border-emerald-950/40 dark:bg-emerald-950/20">
                          <span className="text-sm font-semibold text-foreground block">{s.title}</span>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.description}</p>
                        </div>
                      ))}
                      {analysisData.strengths.length === 0 && (
                        <p className="text-xs text-muted-foreground py-2">No specific strengths flagged.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Actionable Improvement Areas */}
                  <Card className="shadow-xs">
                    <CardHeader className="pb-3 border-b border-border">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-base">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Recommended Improvements ({analysisData.improvements.length})</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {analysisData.improvements.map((imp) => (
                        <div key={imp.id} className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/30 dark:border-amber-950/40 dark:bg-amber-950/20">
                          <span className="text-sm font-semibold text-foreground block">{imp.title}</span>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{imp.description}</p>
                          {imp.recommendation && (
                            <div className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>Action: {imp.recommendation}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Actionable Content Recommendations */}
                  {analysisData.recommendations && analysisData.recommendations.length > 0 && (
                    <Card className="shadow-xs">
                      <CardHeader className="pb-3 border-b border-border">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Award className="w-4 h-4 text-primary" />
                          Targeted Content Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {analysisData.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-foreground">
                              <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column (1 col): Detected Skills, ATS Readiness, Recommended Roles */}
                <div className="space-y-6">
                  {/* Extracted Headline & Skills */}
                  <Card className="shadow-xs">
                    <CardHeader className="pb-3 border-b border-border">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <FileSearch className="w-4 h-4 text-primary" />
                        Detected Competencies ({analysisData.detected_skills.length})
                      </CardTitle>
                      {analysisData.extracted_data?.headline && (
                        <p className="text-xs font-medium text-muted-foreground mt-1">
                          Role: {analysisData.extracted_data.headline}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex flex-wrap gap-1.5">
                        {analysisData.detected_skills.map((skill) => (
                          <SkillBadge
                            key={skill.id}
                            name={skill.name}
                            status={(skill.status as SkillStatus) || "verified"}
                            category={skill.category}
                          />
                        ))}
                        {analysisData.detected_skills.length === 0 && (
                          <p className="text-xs text-muted-foreground">No specific skills detected.</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => navigate("/skill-gap")}
                      >
                        Proceed to Skill Gap Analysis →
                      </Button>
                    </CardContent>
                  </Card>

                  {/* ATS Readiness Observations */}
                  {analysisData.ats_observations && analysisData.ats_observations.length > 0 && (
                    <Card className="shadow-xs">
                      <CardHeader className="pb-3 border-b border-border">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          ATS Readiness Audit
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {analysisData.ats_observations.map((obs, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                              <span className="leading-relaxed">{obs}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Missing Information Notice */}
                  {analysisData.missing_information && analysisData.missing_information.length > 0 && (
                    <Card className="shadow-xs border-amber-200/60 bg-amber-50/20 dark:bg-amber-950/10">
                      <CardHeader className="pb-3 border-b border-amber-200/40">
                        <CardTitle className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Missing Information Flagged
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-1.5">
                          {analysisData.missing_information.map((item, idx) => (
                            <li key={idx} className="text-xs text-amber-900/80 dark:text-amber-300 flex items-start gap-1.5">
                              <span>•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommended Target Roles */}
                  {analysisData.recommended_roles && analysisData.recommended_roles.length > 0 && (
                    <Card className="shadow-xs">
                      <CardHeader className="pb-3 border-b border-border">
                        <CardTitle className="text-base font-bold">Recommended Target Roles</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {analysisData.recommended_roles.map((role, idx) => (
                            <li
                              key={role}
                              className="p-2.5 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs font-medium"
                            >
                              <span>{idx + 1}. {role}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-primary"
                                onClick={() => navigate("/skill-gap")}
                              >
                                Select
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ResumeScreen
