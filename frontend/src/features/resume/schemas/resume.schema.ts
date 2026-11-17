import { z } from "zod"

const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const ALLOWED_EXTENSIONS = [".pdf", ".docx"]
const ALLOWED_MIMES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export const resumeFileSchema = z.instanceof(File).superRefine((file, ctx) => {
  if (file.size === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "File is empty.",
    })
    return
  }

  if (file.size > MAX_SIZE_BYTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `File exceeds the maximum allowed size of ${MAX_SIZE_MB} MB.`,
    })
    return
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `File type '${ext}' is not supported. Upload a PDF or DOCX file.`,
    })
    return
  }

  if (!ALLOWED_MIMES.includes(file.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid file format. Upload a PDF or DOCX file.",
    })
  }
})

export type ResumeFileInput = z.infer<typeof resumeFileSchema>

