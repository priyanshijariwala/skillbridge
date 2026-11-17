import React from "react"
import { Search, X } from "lucide-react"

const DIFFICULTIES = [
  { value: "", label: "All Levels" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "arrays", label: "Arrays" },
  { value: "strings", label: "Strings" },
  { value: "linked-lists", label: "Linked Lists" },
  { value: "trees", label: "Trees" },
  { value: "graphs", label: "Graphs" },
  { value: "dynamic-programming", label: "Dynamic Programming" },
  { value: "sorting", label: "Sorting" },
  { value: "searching", label: "Searching" },
  { value: "math", label: "Math" },
  { value: "hash-tables", label: "Hash Tables" },
  { value: "two-pointers", label: "Two Pointers" },
  { value: "sliding-window", label: "Sliding Window" },
  { value: "binary-search", label: "Binary Search" },
  { value: "stack-queue", label: "Stack / Queue" },
  { value: "heap", label: "Heap" },
  { value: "backtracking", label: "Backtracking" },
  { value: "bit-manipulation", label: "Bit Manipulation" },
  { value: "design", label: "Design" },
]

interface ProblemFiltersProps {
  difficulty: string
  onDifficultyChange: (v: string) => void
  search: string
  onSearchChange: (v: string) => void
  category: string
  onCategoryChange: (v: string) => void
}

export const ProblemFilters: React.FC<ProblemFiltersProps> = ({
  difficulty,
  onDifficultyChange,
  search,
  onSearchChange,
  category,
  onCategoryChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search problems..."
          className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Difficulty Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => onDifficultyChange(d.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              difficulty === d.value
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Category Select */}
      <div className="shrink-0">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-muted/60 border border-border/80 text-foreground text-xs rounded-lg px-2.5 py-2 font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value} className="bg-popover text-popover-foreground">
              {c.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default ProblemFilters

