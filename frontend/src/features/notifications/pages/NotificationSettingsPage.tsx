import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Mail,
  Shield,
  FileText,
  Compass,
  Milestone,
  Bot,
  Code2,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  Lock,
} from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { Card } from "@/components/ui/card"
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton"
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/features/notifications/hooks/useNotifications"

interface CategoryOption {
  key: string
  title: string
  description: string
  icon: React.ElementType
  isLocked?: boolean
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    key: "security",
    title: "Account Security & Authentication Alerts",
    description: "Password changes, unrecognized logins, and security notices. (Essential & non-disableable).",
    icon: Shield,
    isLocked: true,
  },
  {
    key: "resume",
    title: "Resume Analysis Completed",
    description: "Receive an email when your resume extraction, score, and recommendations are ready.",
    icon: FileText,
  },
  {
    key: "skill_gap",
    title: "Skill Gap Evaluation Results",
    description: "Notifications about your strengths, missing skills, and market role benchmarks.",
    icon: Compass,
  },
  {
    key: "roadmap",
    title: "Learning Roadmap & Milestone Updates",
    description: "Alerts when your adaptive learning roadmap is generated or updated.",
    icon: Milestone,
  },
  {
    key: "interview",
    title: "Mock Interview Feedback & Scores",
    description: "Detailed interview evaluations, answer analyses, and performance reports.",
    icon: Bot,
  },
  {
    key: "coding",
    title: "Coding Assessment & Submission Verdicts",
    description: "Execution results and AI code reviews for your algorithm solutions.",
    icon: Code2,
  },
]

export const NotificationSettingsPage: React.FC = () => {
  const { data: preferences, isLoading, error } = useNotificationPreferences()
  const updateMutation = useUpdateNotificationPreferences()

  const [emailEnabled, setEmailEnabled] = useState<boolean>(true)
  const [categoryPrefs, setCategoryPrefs] = useState<Record<string, boolean>>({})
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.email_enabled)
      setCategoryPrefs(preferences.category_preferences || {})
    }
  }, [preferences])

  const handleToggleCategory = (categoryKey: string) => {
    if (categoryKey === "security") return // Locked
    setCategoryPrefs((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg(null)
    await updateMutation.mutateAsync({
      email_enabled: emailEnabled,
      category_preferences: categoryPrefs,
    })
    setSuccessMsg("Notification preferences successfully saved.")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notification Preferences" />
        <LoadingSkeleton variant="card" count={3} />
      </div>
    )
  }

  if (error || !preferences) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notification Preferences" />
        <Card className="p-8 text-center text-rose-500 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="font-semibold text-sm">Failed to load notification preferences.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/notifications"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Notifications
        </Link>
      </div>

      <PageHeader
        title="Email & Notification Settings"
        description="Choose which updates and transactional notifications you wish to receive by email."
      />

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Master Email Toggle Card */}
        <Card className="p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Transactional Email Notifications</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive career milestones, assessment scores, and system updates directly in your inbox.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="sr-only peer"
              aria-label="Toggle all email notifications"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </Card>

        {/* Category Notification Preferences */}
        <Card className="p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Notification Categories</h3>
            <p className="text-xs text-muted-foreground">
              Customize which specific actions trigger an email alert when transactional emails are enabled.
            </p>
          </div>

          <div className="divide-y divide-border/60">
            {CATEGORY_OPTIONS.map((item) => {
              const Icon = item.icon
              const isChecked = item.isLocked ? true : (categoryPrefs[item.key] ?? true)
              const isDisabled = !emailEnabled && !item.isLocked

              return (
                <div
                  key={item.key}
                  className={`py-3.5 flex items-start justify-between gap-4 transition-opacity ${
                    isDisabled ? "opacity-40 pointer-events-none" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-muted shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-foreground/80" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{item.title}</span>
                        {item.isLocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                            <Lock className="w-2.5 h-2.5" />
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={item.isLocked || isDisabled}
                      onChange={() => handleToggleCategory(item.key)}
                      className="sr-only peer"
                      aria-label={`Toggle ${item.title}`}
                    />
                    <div
                      className={`w-9 h-5 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                        item.isLocked ? "bg-primary opacity-80 cursor-not-allowed" : "peer-checked:bg-primary"
                      }`}
                    ></div>
                  </label>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{updateMutation.isPending ? "Saving..." : "Save Preferences"}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default NotificationSettingsPage

