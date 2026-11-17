import { useState, useCallback } from "react"
import { speechService, type TranscriptionResponse } from "@/services/speech.service"

export interface UseSpeechToTextReturn {
  isTranscribing: boolean
  transcript: string
  transcriptionData: TranscriptionResponse | null
  error: string | null
  transcribeAudio: (blob: Blob) => Promise<string | null>
  setTranscript: (text: string) => void
  resetTranscript: () => void
}

export const useSpeechToText = (): UseSpeechToTextReturn => {
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false)
  const [transcript, setTranscript] = useState<string>("")
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const transcribeAudio = useCallback(async (blob: Blob): Promise<string | null> => {
    setIsTranscribing(true)
    setError(null)

    try {
      const data = await speechService.transcribe(blob)
      setTranscriptionData(data)
      setTranscript(data.text)
      return data.text
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message || "Failed to transcribe audio recording. Please review or type your answer."
      setError(message)
      return null
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript("")
    setTranscriptionData(null)
    setError(null)
  }, [])

  return {
    isTranscribing,
    transcript,
    transcriptionData,
    error,
    transcribeAudio,
    setTranscript,
    resetTranscript,
  }
}

