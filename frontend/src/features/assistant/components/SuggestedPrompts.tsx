import React from "react"
import { Sparkles, ArrowRight, Compass, Code, Mic, FileText, CheckSquare, Layers } from "lucide-react"

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void
  disabled?: boolean
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  const prompts = [
    {
      title: "Analyze Skill Gaps",
      prompt: "How should I prioritize my missing skills to prepare for my target job role?",
      icon: Compass,
      tag: "Skill Gap",
    },
    {
      title: "Portfolio Project Idea",
      prompt: "What hands-on portfolio project would best demonstrate my missing competencies?",
      icon: Code,
      tag: "Projects",
    },
    {
      title: "Mock Interview Strategy",
      prompt: "Based on my interview feedback, how can I improve my technical articulation?",
      icon: Mic,
      tag: "Interview Prep",
    },
    {
      title: "Resume ATS Bullet Points",
      prompt: "How can I rewrite my experience bullet points to quantify engineering impact?",
      icon: FileText,
      tag: "Resume",
    },
    {
      title: "Roadmap Next Steps",
      prompt: "What is my next priority milestone on my active roadmap, and how can I complete it faster?",
      icon: CheckSquare,
      tag: "Roadmap",
    },
    {
      title: "System Design Concepts",
      prompt: "Explain the key system design patterns and trade-offs expected for my target role.",
      icon: Layers,
      tag: "Architecture",
    },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto my-6 px-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Personalized Career Guidance</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          How can I help you today?
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
          I am grounded in your SkillBridge profile, resume analysis, skill gaps, learning roadmap, and mock interviews.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {prompts.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group flex flex-col items-start p-4 text-left rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {item.tag}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                "{item.prompt}"
              </p>
              <div className="flex items-center gap-1 text-[11px] font-medium text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Ask this</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

