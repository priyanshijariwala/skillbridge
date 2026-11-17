import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bot, ArrowRight, Filter, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { useInterviewList } from "@/features/interview/hooks/useInterview"

export const InterviewHistoryScreen: React.FC = () => {
  const navigate = useNavigate()
  const [filterType, setFilterType] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")

  const { data: interviewData, isLoading } = useInterviewList({
    interview_type: filterType === "all" ? undefined : filterType,
  })

  const interviews = interviewData?.items || []

  const filteredInterviews = interviews.filter((item) => {
    return item.target_role_title.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock Interview History"
        description="Chronological record of your past mock interview sessions, adaptive scores, and detailed AI feedback."
        badge={{ label: `${interviews.length} Sessions`, variant: "default" }}
        actions={
          <Button onClick={() => navigate("/interview/setup")}>
            <Bot className="w-4 h-4 mr-2" />
            New Practice Session
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              type="text"
              placeholder="Search by role title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:inline" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-none w-full sm:w-auto"
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical Rounds</option>
              <option value="behavioral">Behavioral Rounds</option>
              <option value="mixed">Mixed Rounds</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <Card className="p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading session history...</p>
        </Card>
      ) : filteredInterviews.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No Interview Sessions Found"
          description={
            searchTerm || filterType !== "all"
              ? "No sessions matched your search criteria."
              : "You haven't conducted any mock interview sessions yet. Launch an AI session to practice your technical competencies."
          }
          actionLabel="Start Mock Interview"
          onAction={() => navigate("/interview/setup")}
        />
      ) : (
        <Card className="shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-6">Role / Session</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Duration</th>
                  <th className="py-3 px-6">Performance</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInterviews.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-semibold text-foreground block">
                        {item.target_role_title}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {item.difficulty} Level
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={item.interview_type === "technical" ? "success" : "info"}
                        className="capitalize"
                      >
                        {item.interview_type}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-xs text-muted-foreground">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recent"}
                    </td>
                    <td className="py-4 px-6 text-xs text-muted-foreground font-mono">
                      {item.duration_minutes}m
                    </td>
                    <td className="py-4 px-6">
                      {item.status === "completed" && item.overall_score !== null && item.overall_score !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-foreground">
                            {item.overall_score}%
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.overall_score >= 80
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : item.overall_score >= 60
                                ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300"
                            }`}
                          >
                            {item.overall_score >= 80 ? "Strong" : item.overall_score >= 60 ? "Solid" : "Review"}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="capitalize text-xs">
                          {item.status.replace("_", " ")}
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {item.status === "completed" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/interview/${item.id}/feedback`)}
                        >
                          <span>Feedback</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      ) : item.status === "in_progress" ? (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/interview/${item.id}`)}
                        >
                          <span>Resume</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/interview/setup")}
                        >
                          <span>Retry</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {filteredInterviews.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{item.target_role_title}</h4>
                    <span className="text-xs text-muted-foreground capitalize">
                      {item.difficulty} • {item.interview_type}
                    </span>
                  </div>
                  {item.status === "completed" && item.overall_score !== null && item.overall_score !== undefined ? (
                    <span className="font-mono font-bold text-sm text-emerald-600">
                      {item.overall_score}%
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {item.status.replace("_", " ")}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      : "Recent"}
                  </span>
                  {item.status === "completed" ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-primary"
                      onClick={() => navigate(`/interview/${item.id}/feedback`)}
                    >
                      View Report →
                    </Button>
                  ) : item.status === "in_progress" ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-primary"
                      onClick={() => navigate(`/interview/${item.id}`)}
                    >
                      Resume Session →
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default InterviewHistoryScreen
