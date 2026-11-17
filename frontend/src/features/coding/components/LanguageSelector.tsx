import React from "react"
import { Code2 } from "lucide-react"
import { CODING_LANGUAGES } from "@/features/coding/types/coding.types"

interface LanguageSelectorProps {
  selectedLanguage: string
  onSelectLanguage: (lang: string) => void
  disabled?: boolean
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-1.5">
      <Code2 className="w-4 h-4 text-muted-foreground" />
      <select
        value={selectedLanguage}
        onChange={(e) => onSelectLanguage(e.target.value)}
        disabled={disabled}
        className="bg-muted/60 border border-border/80 text-foreground text-xs rounded-lg px-2.5 py-1 font-medium outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer disabled:opacity-50"
      >
        {CODING_LANGUAGES.map((lang) => (
          <option key={lang.slug} value={lang.slug} className="bg-popover text-popover-foreground">
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  )
}
