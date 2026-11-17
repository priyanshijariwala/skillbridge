import { z } from "zod"

const optionalUrl = z
  .string()
  .refine(
    (v) => !v || v.trim() === "" || v.startsWith("http://") || v.startsWith("https://"),
    { message: "URL must start with http:// or https://" }
  )
  .optional()
  .or(z.literal(""))

export const educationSchema = z.object({
  degree: z.string().min(1, "Degree is required").max(200),
  institution: z.string().min(1, "Institution is required").max(200),
  graduation_year: z
    .number()
    .int()
    .min(1950)
    .max(2100)
    .optional()
    .nullable(),
})

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  headline: z.string().max(200, "Headline must be under 200 characters").optional(),
  bio: z.string().max(1000, "Bio must be under 1000 characters").optional(),
  target_role_title: z.string().max(200).optional(),
  target_seniority: z
    .enum(["Junior", "Mid", "Senior", "Lead", "Staff", "Principal"])
    .optional(),
  years_of_experience: z.number().min(0).max(60).optional().nullable(),
  skills: z.array(z.string()).optional(),
  linkedin_url: optionalUrl,
  github_url: optionalUrl,
  portfolio_url: optionalUrl,
})

export type ProfileFormValues = z.infer<typeof profileSchema>
