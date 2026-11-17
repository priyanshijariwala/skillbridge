import React, { Suspense, lazy } from "react"
import { RotateCcw } from "lucide-react"
import { CODING_LANGUAGES } from "@/features/coding/types/coding.types"

// Lazy load Monaco Editor to support test runners and fast initial page load
const MonacoEditor = lazy(() => import("@monaco-editor/react"))

interface CodeEditorProps {
  value: string
  language: string
  onChange: (value: string) => void
  onReset?: () => void
  isReadOnly?: boolean
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language,
  onChange,
  onReset,
  isReadOnly = false,
}) => {
  const currentLang = CODING_LANGUAGES.find((l) => l.slug === language)
  const monacoLanguage = currentLang ? currentLang.monacoId : "python"

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-xl overflow-hidden border border-border/80 shadow-xs">
      {/* Top Editor Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#333333] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="text-[#cccccc] font-mono text-[11px] ml-1">
            solution.{currentLang?.extension || "py"}
          </span>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[#aaaaaa] hover:text-[#ffffff] px-2 py-0.5 rounded hover:bg-[#333333] transition-colors cursor-pointer text-[11px]"
            title="Reset code to starter template"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Code</span>
          </button>
        )}
      </div>

      {/* Monaco Container with Textarea Fallback for Tests/Loading */}
      <div className="flex-1 relative min-h-[220px]">
        <Suspense
          fallback={
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              readOnly={isReadOnly}
              aria-label="Code Editor"
              data-testid="code-editor-textarea"
              className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs p-3 outline-hidden resize-none"
            />
          }
        >
          <MonacoEditor
            height="100%"
            language={monacoLanguage}
            value={value}
            theme="vs-dark"
            onChange={(val) => onChange(val || "")}
            options={{
              readOnly: isReadOnly,
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              tabSize: 4,
              fontFamily: "Fira Code, Menlo, Monaco, Consolas, monospace",
              padding: { top: 8, bottom: 8 },
            }}
          />
        </Suspense>
      </div>
    </div>
  )
}
