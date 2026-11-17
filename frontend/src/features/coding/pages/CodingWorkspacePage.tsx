import React, { useState, useEffect, useCallback, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import {
  Play,
  Send,
  ArrowLeft,
  Loader2,
  Sparkles,
  FileText,
  Code2,
} from "lucide-react"
import {
  useCodingProblem,
  useRunCode,
  useSubmitCode,
  useAICodeReview,
} from "@/features/coding/hooks/useCoding"
import { ProblemDescription } from "@/features/coding/components/ProblemDescription"
import { CodeEditor } from "@/features/coding/components/CodeEditor"
import { LanguageSelector } from "@/features/coding/components/LanguageSelector"
import { TestCasePanel } from "@/features/coding/components/TestCasePanel"
import { ExecutionOutputPanel } from "@/features/coding/components/ExecutionOutputPanel"
import { CodeReviewPanel } from "@/features/coding/components/CodeReviewPanel"

type LeftTab = "description" | "review"
type MobileTab = "description" | "editor"

export const CodingWorkspacePage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>()

  const { data: problem, isLoading: problemLoading } = useCodingProblem(problemId)
  const runCodeMutation = useRunCode()
  const submitCodeMutation = useSubmitCode()
  const aiReviewMutation = useAICodeReview()

  // language state
  const [language, setLanguage] = useState("python")

  // per-language code map
  const [codeMap, setCodeMap] = useState<Record<string, string>>({})

  // test case state
  const [customInput, setCustomInput] = useState("")
  const [useCustomInput, setUseCustomInput] = useState(false)

  // tabs
  const [leftTab, setLeftTab] = useState<LeftTab>("description")
  const [mobileTab, setMobileTab] = useState<MobileTab>("description")

  // submission state (track last submission for AI review)
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null)
  const [aiReview, setAiReview] = useState<typeof aiReviewMutation.data | null>(null)

  // Track whether code has changed from starter
  const starterRef = useRef<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)

  // Load starter code when problem loads
  useEffect(() => {
    if (!problem) return
    const starters = problem.starter_code ?? {}
    starterRef.current = starters

    // Set language to first supported or current if supported
    const supported = problem.supported_languages
    const defaultLang =
      supported.includes(language) ? language : supported[0] ?? "python"
    setLanguage(defaultLang)

    // Seed code map with starters (only for languages not yet edited)
    setCodeMap((prev) => {
      const updated: Record<string, string> = { ...prev }
      for (const lang of supported) {
        if (!updated[lang]) {
          updated[lang] = starters[lang] ?? ""
        }
      }
      return updated
    })
    setIsDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem?.id])

  // Current code value
  const currentCode = codeMap[language] ?? ""

  const handleCodeChange = (val: string) => {
    setCodeMap((prev) => ({ ...prev, [language]: val }))
    const starter = starterRef.current[language] ?? ""
    setIsDirty(val !== starter)
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    // Seed if not yet set
    if (!codeMap[lang] && problem?.starter_code?.[lang]) {
      setCodeMap((prev) => ({ ...prev, [lang]: problem.starter_code[lang] }))
    }
  }

  const handleReset = () => {
    const starter = starterRef.current[language] ?? ""
    setCodeMap((prev) => ({ ...prev, [language]: starter }))
    setIsDirty(false)
  }

  // Unsaved-work prompt
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  // Run code
  const handleRun = useCallback(() => {
    if (!problem) return
    runCodeMutation.mutate({
      problem_id: problem.id,
      source_code: currentCode,
      language,
      custom_stdin: useCustomInput ? customInput : undefined,
    })
  }, [problem, currentCode, language, useCustomInput, customInput, runCodeMutation])

  // Submit code
  const handleSubmit = useCallback(() => {
    if (!problem || submitCodeMutation.isPending) return
    submitCodeMutation.mutate(
      {
        problem_id: problem.id,
        source_code: currentCode,
        language,
      },
      {
        onSuccess: (data) => {
          setLastSubmissionId(data.id)
          setAiReview(null)
          setLeftTab("review")
        },
      }
    )
  }, [problem, currentCode, language, submitCodeMutation])

  // AI Review
  const handleRequestReview = useCallback(() => {
    if (!lastSubmissionId) return
    aiReviewMutation.mutate(lastSubmissionId, {
      onSuccess: (data) => setAiReview(data),
    })
  }, [lastSubmissionId, aiReviewMutation])

  const isRunning = runCodeMutation.isPending
  const isSubmitting = submitCodeMutation.isPending

  // Loading state
  if (problemLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading problem...</p>
        </div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-foreground">Problem not found</p>
          <Link
            to="/coding"
            className="inline-flex items-center gap-2 text-xs text-primary hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Problems
          </Link>
        </div>
      </div>
    )
  }

  const sampleTestCases = problem.sample_test_cases ?? []

  // ——— Mobile Layout ———
  return (
    <div className="flex flex-col h-full -mx-4 sm:-mx-6 lg:-mx-8 -my-4 sm:-my-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm shrink-0 gap-3">
        <Link
          to="/coding"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Problems</span>
        </Link>

        <span className="text-sm font-semibold text-foreground truncate max-w-[180px] sm:max-w-xs">
          {problem.title}
        </span>

        {/* Mobile Tab Toggle */}
        <div className="flex lg:hidden items-center gap-1">
          <button
            onClick={() => setMobileTab("description")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              mobileTab === "description"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMobileTab("editor")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              mobileTab === "editor"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <div
          className={`${
            mobileTab === "editor" ? "hidden" : "flex"
          } lg:flex flex-col w-full lg:w-[42%] xl:w-[38%] border-r border-border overflow-hidden`}
        >
          {/* Left Tab Bar */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border bg-muted/30 shrink-0">
            <button
              onClick={() => setLeftTab("description")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                leftTab === "description"
                  ? "bg-background text-foreground border border-border shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Description
            </button>
            <button
              onClick={() => setLeftTab("review")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                leftTab === "review"
                  ? "bg-background text-foreground border border-border shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Review
            </button>
          </div>

          {/* Left Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {leftTab === "description" ? (
              <ProblemDescription problem={problem} />
            ) : (
              <CodeReviewPanel
                review={aiReview ?? null}
                isLoading={aiReviewMutation.isPending}
                hasSubmission={Boolean(lastSubmissionId)}
                onRequestReview={handleRequestReview}
              />
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div
          className={`${
            mobileTab === "description" ? "hidden" : "flex"
          } lg:flex flex-col flex-1 overflow-hidden`}
        >
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/20 shrink-0 gap-3 flex-wrap">
            <LanguageSelector
              selectedLanguage={language}
              onSelectLanguage={handleLanguageChange}
              disabled={isRunning || isSubmitting}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning || isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-500" />
                )}
                {isRunning ? "Running..." : "Run Code"}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-hidden p-2 min-h-0">
            <CodeEditor
              value={currentCode}
              language={language}
              onChange={handleCodeChange}
              onReset={handleReset}
            />
          </div>

          {/* Bottom Panels */}
          <div className="h-[220px] shrink-0 border-t border-border flex overflow-hidden">
            {/* Test Cases */}
            <div className="w-1/2 border-r border-border overflow-hidden">
              <TestCasePanel
                sampleTestCases={sampleTestCases}
                customInput={customInput}
                onCustomInputChange={setCustomInput}
                useCustomInput={useCustomInput}
                onToggleCustomInput={setUseCustomInput}
              />
            </div>

            {/* Output */}
            <div className="w-1/2 overflow-hidden">
              <ExecutionOutputPanel
                runResult={runCodeMutation.data ?? null}
                submissionResult={submitCodeMutation.data ?? null}
                isLoading={isRunning || isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodingWorkspacePage
