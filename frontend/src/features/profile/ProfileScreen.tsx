import React, { useEffect, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { User, Target, Award, Check, Save, Plus, X, Sparkles, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"
import { profileSchema, type ProfileFormValues } from "@/features/profile/schemas/profile.schema"
import { useGetProfile, useUpdateProfile } from "@/features/profile/hooks/useProfile"

// ---------------------------------------------------------------------------
// Static target roles — no backend job_roles endpoint yet (Day 7 scope)
// ---------------------------------------------------------------------------
const TARGET_ROLES = [
  { id: "role_backend", title: "Senior Backend Engineer", department: "Engineering" },
  { id: "role_frontend", title: "Senior Frontend Engineer", department: "Engineering" },
  { id: "role_fullstack", title: "Full Stack Software Engineer", department: "Engineering" },
  { id: "role_devops", title: "DevOps & Platform Engineer", department: "Infrastructure" },
  { id: "role_ml", title: "Machine Learning Engineer", department: "AI/ML" },
  { id: "role_data", title: "Data Engineer", department: "Data" },
]

const ROLE_SUGGESTIONS: Record<string, string[]> = {
  role_backend: ["Apache Kafka", "Kubernetes", "Redis", "GraphQL", "AWS ECS", "Terraform", "RabbitMQ", "gRPC"],
  role_frontend: ["Next.js", "Tailwind CSS", "Redux Toolkit", "WebSockets", "Playwright", "Storybook", "TypeScript"],
  role_fullstack: ["Node.js", "React", "PostgreSQL", "Docker", "GraphQL", "AWS", "Prisma"],
  role_devops: ["Kubernetes", "Terraform", "Helm", "Prometheus", "Grafana", "AWS EKS", "Ansible"],
  role_ml: ["PyTorch", "TensorFlow", "scikit-learn", "MLflow", "Kubeflow", "Feature Stores"],
  role_data: ["Apache Spark", "dbt", "Airflow", "BigQuery", "Redshift", "Kafka"],
}

export const ProfileScreen: React.FC = () => {
  const { user } = useAuth()
  const { data: profile, isLoading, isError } = useGetProfile()
  const updateProfile = useUpdateProfile()

  const [skills, setSkills] = useState<string[]>([])
  const [newSkillInput, setNewSkillInput] = useState("")
  const [skillInputError, setSkillInputError] = useState("")
  const [showSavedToast, setShowSavedToast] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState("role_backend")
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.name || "",
      headline: "",
      bio: "",
      target_role_title: "",
      target_seniority: undefined,
      years_of_experience: undefined,
      linkedin_url: "",
      github_url: "",
      portfolio_url: "",
    },
  })

  // Populate form once profile loads
  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || user?.name || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        target_role_title: profile.target_role_title || "",
        target_seniority: (profile.target_seniority as ProfileFormValues["target_seniority"]) || undefined,
        years_of_experience: profile.years_of_experience ?? undefined,
        linkedin_url: profile.linkedin_url || "",
        github_url: profile.github_url || "",
        portfolio_url: profile.portfolio_url || "",
      })
      setSkills(profile.skills || [])
      // Attempt to match existing role title to a static ID for suggestions
      const matched = TARGET_ROLES.find(
        (r) => r.title === profile.target_role_title
      )
      if (matched) setSelectedRoleId(matched.id)
    }
  }, [profile, user, reset])

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync({
        ...data,
        skills,
        years_of_experience: data.years_of_experience ?? undefined,
        linkedin_url: data.linkedin_url ? data.linkedin_url.trim() : null,
        github_url: data.github_url ? data.github_url.trim() : null,
        portfolio_url: data.portfolio_url ? data.portfolio_url.trim() : null,
      })
      if (toastTimer.current) clearTimeout(toastTimer.current)
      setShowSavedToast(true)
      toastTimer.current = setTimeout(() => setShowSavedToast(false), 3000)
    } catch {
      // Error is accessible via updateProfile.error
    }
  }

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim()
    if (!trimmed) return
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInputError(`"${trimmed}" is already in your skills inventory`)
      return
    }
    setSkills([...skills, trimmed])
    setNewSkillInput("")
    setSkillInputError("")
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove))
    if (skillInputError) setSkillInputError("")
  }

  const suggestionsList =
    ROLE_SUGGESTIONS[selectedRoleId] || ROLE_SUGGESTIONS.role_backend

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading profile…</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Candidate Profile & Settings"
          description="Manage your career preparation objectives."
        />
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Failed to load your profile. Please refresh the page.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Candidate Profile & Settings"
        description="Manage your career preparation objectives, target role, and verified skill inventory."
      />

      {/* Success toast */}
      {showSavedToast && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-medium flex items-center gap-2 animate-in fade-in-50 duration-200">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* API error */}
      {updateProfile.isError && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{updateProfile.error?.message || "Failed to save profile. Please try again."}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Information */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              General Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Full Name
                </label>
                <Input error={!!errors.full_name} {...register("full_name")} />
                {errors.full_name && (
                  <p className="text-xs font-medium text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={profile?.email || user?.email || ""}
                  disabled
                  className="opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Professional Headline
              </label>
              <Input
                placeholder="e.g. Senior Backend Engineer • Microservices & Distributed Systems"
                error={!!errors.headline}
                {...register("headline")}
              />
              {errors.headline && (
                <p className="text-xs font-medium text-destructive">{errors.headline.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Candidate Bio & Focus Areas
              </label>
              <Textarea
                rows={3}
                placeholder="Brief summary of your technical background..."
                error={!!errors.bio}
                {...register("bio")}
              />
              {errors.bio && (
                <p className="text-xs font-medium text-destructive">{errors.bio.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Target Career Goals */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Target Career Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Primary Target Job Role
                </label>
                <Controller
                  name="target_role_title"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e.target.value)
                        const matched = TARGET_ROLES.find((r) => r.title === e.target.value)
                        if (matched) setSelectedRoleId(matched.id)
                      }}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="">Select a target role…</option>
                      {TARGET_ROLES.map((role) => (
                        <option key={role.id} value={role.title}>
                          {role.title} ({role.department})
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Target Seniority
                </label>
                <Controller
                  name="target_seniority"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="">Select…</option>
                      <option value="Junior">Junior</option>
                      <option value="Mid">Mid-Level</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead">Lead / Staff</option>
                      <option value="Principal">Principal</option>
                    </select>
                  )}
                />
                {errors.target_seniority && (
                  <p className="text-xs font-medium text-destructive">{errors.target_seniority.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Years of Technical Experience
              </label>
              <Input
                type="number"
                min={0}
                max={60}
                error={!!errors.years_of_experience}
                {...register("years_of_experience", { valueAsNumber: true })}
                className="max-w-[200px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Links */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Professional Links
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {(
              [
                { key: "linkedin_url" as const, label: "LinkedIn URL", placeholder: "https://linkedin.com/in/yourname" },
                { key: "github_url" as const, label: "GitHub URL", placeholder: "https://github.com/yourname" },
                { key: "portfolio_url" as const, label: "Portfolio URL", placeholder: "https://yourportfolio.dev" },
              ] as const
            ).map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {label}
                </label>
                <Input
                  type="url"
                  placeholder={placeholder}
                  error={!!errors[key]}
                  {...register(key)}
                />
                {errors[key] && (
                  <p className="text-xs font-medium text-destructive">{errors[key]?.message}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Verified Skills */}
        <Card className="shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-3 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" />
                Verified Skills Inventory
              </CardTitle>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {skills.length} verified
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              These competencies are evaluated in skill-gap benchmarks and AI interview simulations.
            </p>

            {/* Skill Tags */}
            <div className="flex flex-wrap gap-2 pt-1 min-h-[44px]">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="group inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 hover:border-primary/40 hover:bg-primary/5 transition-all shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/80 shrink-0" />
                  <span className="truncate max-w-[160px] sm:max-w-none">{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <div className="w-full py-4 text-center rounded-lg border border-dashed border-border bg-slate-50/50 dark:bg-slate-900/50 text-xs text-muted-foreground">
                  No skills tracked yet. Use the input below or click suggested competencies.
                </div>
              )}
            </div>

            {/* Add Skill */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="custom-skill-input"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Add Custom Skill
                </label>
                {skillInputError && (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-in fade-in-50">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {skillInputError}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 max-w-lg">
                <div className="relative flex-1 min-w-0">
                  <Input
                    id="custom-skill-input"
                    type="text"
                    placeholder="e.g. Apache Kafka, GraphQL, AWS…"
                    value={newSkillInput}
                    onChange={(e) => {
                      setNewSkillInput(e.target.value)
                      if (skillInputError) setSkillInputError("")
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddSkill()
                      }
                    }}
                    className="h-10 text-xs sm:text-sm pl-3.5 pr-8 rounded-lg bg-background"
                  />
                  {newSkillInput && (
                    <button
                      type="button"
                      onClick={() => { setNewSkillInput(""); setSkillInputError("") }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
                      aria-label="Clear skill input"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={!newSkillInput.trim()}
                  className="h-10 px-4 text-xs font-semibold whitespace-nowrap shrink-0 gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Skill</span>
                </Button>
              </div>
            </div>

            {/* Suggestions */}
            <div className="pt-3 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Recommended for your target role:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestionsList
                  .filter((s) => !skills.some((sk) => sk.toLowerCase() === s.toLowerCase()))
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => { setSkills((prev) => [...prev, suggestion]); setSkillInputError("") }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-muted-foreground border border-border transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3 h-3 text-primary" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 sm:p-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-xs text-muted-foreground text-center sm:text-left">
              Auto-synced with resume analysis & mock interview simulations.
            </span>
            <Button
              type="submit"
              isLoading={isSubmitting || updateProfile.isPending}
              disabled={isSubmitting || updateProfile.isPending}
              className="w-full sm:w-auto shadow-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Profile Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default ProfileScreen
