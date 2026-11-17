import { useState, useRef, useEffect, useCallback } from "react"
import { speechService } from "@/services/speech.service"

export interface UseTextToSpeechReturn {
  isPlaying: boolean
  isSynthesizing: boolean
  isMuted: boolean
  error: string | null
  speak: (text: string, voice?: string) => Promise<void>
  stop: () => void
  replay: () => void
  toggleMute: () => void
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentBlobUrlRef = useRef<string | null>(null)
  const lastSpokenTextRef = useRef<string>("")

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current)
      currentBlobUrlRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const speak = useCallback(
    async (text: string, voice?: string) => {
      cleanupAudio()
      setError(null)

      const trimmed = text.trim()
      if (!trimmed) return
      lastSpokenTextRef.current = trimmed

      if (isMuted) return

      setIsSynthesizing(true)

      try {
        const audioBlob = await speechService.synthesize({ text: trimmed, voice })
        const blobUrl = URL.createObjectURL(audioBlob)
        currentBlobUrlRef.current = blobUrl

        const audio = new Audio(blobUrl)
        audioRef.current = audio

        audio.onended = () => {
          setIsPlaying(false)
        }

        audio.onerror = () => {
          setIsPlaying(false)
          setError("Failed to play synthesized speech.")
        }

        await audio.play()
        setIsPlaying(true)
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
            ?.error?.message || "Speech synthesis is currently unavailable."
        setError(message)
        setIsPlaying(false)
      } finally {
        setIsSynthesizing(false)
      }
    },
    [cleanupAudio, isMuted]
  )

  const stop = useCallback(() => {
    cleanupAudio()
  }, [cleanupAudio])

  const replay = useCallback(() => {
    if (currentBlobUrlRef.current) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => setError("Could not replay audio."))
        setIsPlaying(true)
      }
    } else if (lastSpokenTextRef.current) {
      speak(lastSpokenTextRef.current)
    }
  }, [speak])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev
      if (nextMuted && audioRef.current) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
      return nextMuted
    })
  }, [])

  useEffect(() => {
    return () => {
      cleanupAudio()
    }
  }, [cleanupAudio])

  return {
    isPlaying,
    isSynthesizing,
    isMuted,
    error,
    speak,
    stop,
    replay,
    toggleMute,
  }
}

