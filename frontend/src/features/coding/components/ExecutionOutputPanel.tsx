import React, { useState } from "react"
import { CheckCircle2, XCircle, Clock, Cpu, AlertTriangle } from "lucide-react"
import type {
  RunCodeResponse,
  SubmissionResponse,
} from "@/features/coding/types/coding.types"

interface ExecutionOutputPanelProps {
  runResult?: RunCodeResponse | null
  submissionResult?: SubmissionResponse | null
  isLoading?: boolean
}

export const ExecutionOutputPanel: React.FC<ExecutionOutputPanelProps> = ({
  runResult,
  submissionResult,
  isLoading,
}) => {
  const result = submissionResult || runResult
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-xs text-muted-foreground animate-pulse space-y-2">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Executing code in isolated sandbox...</span>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-xs text-muted-foreground">
        <span>Click "Run Code" to test against sample cases, or "Submit" for full assessment.</span>
      </div>
    )
  }

  const verdict = submissionResult
    ? submissionResult.execution_status
    : runResult?.verdict || "pending"

  const isAccepted = verdict === "accepted"

  const getVerdictStyle = (v: string) => {
    switch (v) {
      case "accepted":
        return {
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: CheckCircle2,
          label: "Accepted",
        }
      case "wrong_answer":
        return {
          bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          icon: XCircle,
          label: "Wrong Answer",
        }
      case "compilation_error":
        return {
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: AlertTriangle,
          label: "Compilation Error",
        }
      case "time_limit_exceeded":
        return {
          bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
          icon: Clock,
          label: "Time Limit Exceeded",
        }
      case "runtime_error":
        return {
          bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          icon: XCircle,
          label: "Runtime Error",
        }
      default:
        return {
          bg: "bg-muted text-muted-foreground border-border",
          icon: AlertTriangle,
          label: v.replace("_", " ").toUpperCase(),
        }
    }
  }

  const style = getVerdictStyle(verdict)
  const Icon = style.icon
  const testResults = result.test_case_results || []
  const activeCase = testResults[selectedCaseIdx]

  return (
    <div className="flex flex-col h-full bg-card/40 border border-border/70 rounded-xl overflow-hidden text-xs">
      {/* Summary Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border/60 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border ${style.bg}`}
          >
            <Icon className="w-4 h-4" />
            <span>{style.label}</span>
          </span>

          <span className="font-medium text-foreground">
            {result.test_cases_passed} / {result.total_test_cases} Test Cases Passed
          </span>
        </div>

        <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
          {result.execution_time_ms !== undefined && (
            <span className="flex items-center gap-1" title="Execution Time">
              <Clock className="w-3.5 h-3.5" />
              <span>{result.execution_time_ms} ms</span>
            </span>
          )}

          {result.memory_kb !== undefined && result.memory_kb > 0 && (
            <span className="flex items-center gap-1" title="Memory Used">
              <Cpu className="w-3.5 h-3.5" />
              <span>{Math.round(result.memory_kb / 1024)} MB</span>
            </span>
          )}
        </div>
      </div>

      {/* Test Case Selectors */}
      {testResults.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/20 border-b border-border/50 overflow-x-auto">
          {testResults.map((tc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedCaseIdx(idx)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer shrink-0 ${
                selectedCaseIdx === idx
                  ? "bg-background text-foreground border border-border/70 shadow-xs"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  tc.passed ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <span>Case {idx + 1}</span>
            </button>
          ))}
        </div>
      )}

      {/* Details Container */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3 font-mono text-xs">
        {result.error_message && !isAccepted && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg whitespace-pre-wrap">
            <div className="font-semibold font-sans mb-1">Execution Diagnostics:</div>
            {result.error_message}
          </div>
        )}

        {activeCase ? (
          <div className="space-y-3">
            <div>
              <span className="block text-muted-foreground font-sans text-xs font-medium mb-1">
                Input:
              </span>
              <pre className="bg-background border border-border/70 rounded-lg p-2.5 text-foreground overflow-x-auto">
                {activeCase.input || "No input"}
              </pre>
            </div>

            <div>
              <span className="block text-muted-foreground font-sans text-xs font-medium mb-1">
                Output:
              </span>
              <pre
                className={`bg-background border rounded-lg p-2.5 overflow-x-auto ${
                  activeCase.passed
                    ? "border-border/70 text-foreground"
                    : "border-rose-500/40 text-rose-500"
                }`}
              >
                {activeCase.stdout || activeCase.stderr || "(No output)"}
              </pre>
            </div>

            {activeCase.expected_output && (
              <div>
                <span className="block text-muted-foreground font-sans text-xs font-medium mb-1">
                  Expected:
                </span>
                <pre className="bg-background border border-border/70 rounded-lg p-2.5 text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                  {activeCase.expected_output}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground font-sans">
            {isAccepted
              ? "All test cases passed successfully!"
              : "Review error diagnostics above."}
          </div>
        )}
      </div>
    </div>
  )
}
