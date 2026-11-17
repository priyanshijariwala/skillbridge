import React from "react"
import { CheckCircle2, RotateCcw, ArrowRight, Loader2, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export interface TranscriptEditorProps {
  transcript: string
  isSubmitting: boolean
  onChangeTranscript: (text: string) => void
  onReRecord: () => void
  onSubmitAnswer: () => void
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  transcript,
  isSubmitting,
  onChangeTranscript,
  onReRecord,
  onSubmitAnswer,
}) => {
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-4 p-5 rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-primary" />
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Review & Edit Your Transcribed Answer
          </label>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Transcribed from speech</span>
        </div>
      </div>

      <Textarea
        rows={6}
        value={transcript}
        onChange={(e) => onChangeTranscript(e.target.value)}
        placeholder="Your transcribed answer will appear here. You can refine or edit before final submission..."
        className="font-sans text-sm leading-relaxed"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <span className="text-xs text-muted-foreground font-mono">
          Word count: {wordCount} words {wordCount < 30 ? "(Aim for at least 40 words for depth)" : ""}
        </span>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onReRecord}
            disabled={isSubmitting}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Re-record Answer</span>
          </Button>

          <Button
            onClick={onSubmitAnswer}
            disabled={isSubmitting || !transcript.trim()}
            className="shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Evaluating with AI...</span>
              </>
            ) : (
              <>
                <span>Submit Spoken Answer</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

