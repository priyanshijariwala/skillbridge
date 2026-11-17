import React from "react"
import { ClipboardList } from "lucide-react"
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton"
import { SubmissionResult } from "@/features/coding/components/SubmissionResult"
import type { SubmissionResponse } from "@/features/coding/types/coding.types"

interface SubmissionHistoryProps {
  submissions: SubmissionResponse[]
  isLoading?: boolean
  total?: number
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  submissions,
  isLoading,
  total,
}) => {
  if (isLoading) {
    return <LoadingSkeleton variant="table-row" count={5} />
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <ClipboardList className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">No submissions yet</p>
          <p className="text-xs text-muted-foreground">
            Your submission history will appear here once you solve problems.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {total !== undefined && (
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{submissions.length}</span> of{" "}
          <span className="font-semibold text-foreground">{total}</span> submissions
        </p>
      )}
      {submissions.map((sub) => (
        <SubmissionResult key={sub.id} submission={sub} />
      ))}
    </div>
  )
}

export default SubmissionHistory

