import { useState, useRef, useEffect, useCallback } from "react"

export type MicrophonePermissionStatus = "prompt" | "granted" | "denied" | "unsupported"

export interface UseAudioRecorderReturn {
  isRecording: boolean
  durationSeconds: number
  audioBlob: Blob | null
  permissionStatus: MicrophonePermissionStatus
  audioLevel: number
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  cancelRecording: () => void
  resetRecording: () => void
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [durationSeconds, setDurationSeconds] = useState<number>(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<MicrophonePermissionStatus>(() => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return "unsupported"
    }
    return "prompt"
  })
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close()
      } catch {
        // Ignore audio context close errors
      }
      audioContextRef.current = null
    }
    setAudioLevel(0)
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    chunksRef.current = []

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus("unsupported")
      setError("Audio recording is not supported in this browser.")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      streamRef.current = stream
      setPermissionStatus("granted")

      // Setup audio analyzer for volume meter / waveform
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioCtx) {
          const ctx = new AudioCtx()
          audioContextRef.current = ctx
          const source = ctx.createMediaStreamSource(stream)
          const analyser = ctx.createAnalyser()
          analyser.fftSize = 64
          source.connect(analyser)
          analyserRef.current = analyser

          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          const updateLevel = () => {
            if (analyserRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray)
              const sum = dataArray.reduce((acc, val) => acc + val, 0)
              const avg = sum / dataArray.length / 255
              setAudioLevel(Math.min(1, avg * 1.5))
              animationFrameRef.current = requestAnimationFrame(updateLevel)
            }
          }
          updateLevel()
        }
      } catch {
        // Fallback gracefully without live analyzer
      }

      // Determine supported MIME format
      let mimeType = "audio/webm"
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus"
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm"
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg"
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4"
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setIsRecording(false)
        stopTracks()
      }

      recorder.onerror = () => {
        setError("An error occurred during audio recording.")
        stopTracks()
        setIsRecording(false)
      }

      recorder.start(250) // Chunk every 250ms
      setIsRecording(true)
      setDurationSeconds(0)

      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1)
      }, 1000)
    } catch (err: unknown) {
      stopTracks()
      setIsRecording(false)
      const name = (err as { name?: string })?.name
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setPermissionStatus("denied")
        setError("Microphone permission was denied. Please allow microphone access or switch to text mode.")
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No microphone device was detected on your system.")
      } else {
        setError("Failed to access microphone. Please check system permissions.")
      }
    }
  }, [stopTracks])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    } else {
      stopTracks()
      setIsRecording(false)
    }
  }, [stopTracks])

  const cancelRecording = useCallback(() => {
    chunksRef.current = []
    setAudioBlob(null)
    setDurationSeconds(0)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    stopTracks()
    setIsRecording(false)
  }, [stopTracks])

  const resetRecording = useCallback(() => {
    setAudioBlob(null)
    setDurationSeconds(0)
    setError(null)
  }, [])

  // Auto cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracks()
    }
  }, [stopTracks])

  return {
    isRecording,
    durationSeconds,
    audioBlob,
    permissionStatus,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording,
  }
}

