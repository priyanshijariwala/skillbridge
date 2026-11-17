import React, { useState } from "react"
import type { SampleTestCase } from "@/features/coding/types/coding.types"

interface TestCasePanelProps {
  sampleTestCases: SampleTestCase[]
  customInput: string
  onCustomInputChange: (val: string) => void
  useCustomInput: boolean
  onToggleCustomInput: (useCustom: boolean) => void
}

export const TestCasePanel: React.FC<TestCasePanelProps> = ({
  sampleTestCases,
  customInput,
  onCustomInputChange,
  useCustomInput,
  onToggleCustomInput,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0)

  return (
    <div className="flex flex-col h-full bg-card/40 border border-border/70 rounded-xl overflow-hidden text-xs">
      {/* Tab Header */}
      <div className="flex items-center gap-1 px-3 py-2 bg-muted/40 border-b border-border/60 overflow-x-auto">
        {sampleTestCases.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onToggleCustomInput(false)
              setActiveTab(idx)
            }}
            className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              !useCustomInput && activeTab === idx
                ? "bg-background text-foreground border border-border/70 shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            Case {idx + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onToggleCustomInput(true)}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
            useCustomInput
              ? "bg-background text-foreground border border-border/70 shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          Custom Input
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-3.5 flex-1 overflow-y-auto space-y-3 font-mono">
        {useCustomInput ? (
          <div>
            <label className="block text-muted-foreground font-sans text-xs font-medium mb-1.5">
              Standard Input (stdin):
            </label>
            <textarea
              rows={4}
              value={customInput}
              onChange={(e) => onCustomInputChange(e.target.value)}
              placeholder="Enter custom input..."
              className="w-full bg-background border border-border/80 rounded-lg p-2.5 text-xs text-foreground outline-hidden focus:border-primary resize-none"
            />
          </div>
        ) : sampleTestCases[activeTab] ? (
          <div className="space-y-3">
            <div>
              <span className="block text-muted-foreground font-sans text-xs font-medium mb-1">
                Input:
              </span>
              <pre className="bg-background border border-border/70 rounded-lg p-2.5 text-xs text-foreground overflow-x-auto">
                {sampleTestCases[activeTab].input}
              </pre>
            </div>
            <div>
              <span className="block text-muted-foreground font-sans text-xs font-medium mb-1">
                Expected Output:
              </span>
              <pre className="bg-background border border-border/70 rounded-lg p-2.5 text-xs text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                {sampleTestCases[activeTab].expected_output}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground font-sans">No test cases available.</div>
        )}
      </div>
    </div>
  )
}
