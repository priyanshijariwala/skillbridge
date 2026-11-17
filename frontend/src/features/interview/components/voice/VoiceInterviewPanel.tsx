import React, { useEffect, useState } from "react"
import { AlertCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAudioRecorder } from "@/features/interview/hooks/useAudioRecorder"
import { useSpeechToText } from "@/features/interview/hooks/useSpeechToText"
import { useTextToSpeech } from "@/features/interview/hooks/useTextToSpeech"
import { VoiceStatusIndicator, type VoiceStatusState } from "./VoiceStatusIndicator"
import { AudioPlayer } from "./AudioPlayer"
import { VoiceRecorder } from "./VoiceRecorder"
import { TranscriptEditor } from "./TranscriptEditor"
import { MicrophonePermission } from "./MicrophonePermission"
import type { InterviewMessage } from "@/features/interview/types/interview.types"

export interface VoiceInterviewPanelProps {
  activeQuestion?: InterviewMessage
  isSubmittingAnswer: boolean
  onSubmitAnswer: (answer: string) => void
  onSwitchToTextMode: () => void
}

export const VoiceInterviewPanel: React.FC<VoiceInterviewPanelProps> = ({
  activeQuestion,
  isSubmittingAnswer,
  onSubmitAnswer,
  onSwitchToTextMode,
}) => {
  const {
    isRecording,
    durationSeconds,
    audioBlob,
    permissionStatus,
    audioLevel,
    error: recorderError,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording,
  } = useAudioRecorder()

  const {
    isTranscribing,
    transcript,
    error: sttError,
    transcribeAudio,
    setTranscript,
    resetTranscript,
  } = useSpeechToText()

  const {
    isPlaying,
    isSynthesizing,
    isMuted,
    error: ttsError,
    speak,
    stop: stopAudioPlayback,
    replay,
    toggleMute,
  } = useTextToSpeech()

  const [hasSpokenCurrentQuestion, setHasSpokenCurrentQuestion] = useState<string | null>(null)

  // Automatically speak the question aloud when a new question arrives
  useEffect(() => {
    if (
      activeQuestion &&
      activeQuestion.content &&
      activeQuestion.id !== hasSpokenCurrentQuestion &&
      !isMuted
    ) {
      setHasSpokenCurrentQuestion(activeQuestion.id)
      speak(activeQuestion.content)
      resetTranscript()
      resetRecording()
    }
  }, [activeQuestion, hasSpokenCurrentQuestion, isMuted, speak, resetTranscript, resetRecording])

  // When recording stops and audioBlob is ready, trigger transcription
  useEffect(() => {
    if (audioBlob && !isRecording) {
      transcribeAudio(audioBlob)
    }
  }, [audioBlob, isRecording, transcribeAudio])

  // Compute overall voice status
  const getOverallStatus = (): VoiceStatusState => {
    if (recorderError || sttError || ttsError) return "error"
    if (isTranscribing || isSubmittingAnswer) return "processing"
    if (isRecording) return "listening"
    if (isPlaying) return "speaking"
    return "idle"
  }

  const handleStartRecording = async () => {
    stopAudioPlayback()
    resetTranscript()
    await startRecording()
  }

  const handleReRecord = () => {
    resetTranscript()
    resetRecording()
  }

  const handleSubmit = () => {
    if (!transcript.trim()) return
    onSubmitAnswer(transcript.trim())
  }

  const generalError = recorderError || sttError || ttsError

  return (
    <div className="space-y-6">
      {/* Header bar with Status Pill & Mode Switch */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
        <VoiceStatusIndicator status={getOverallStatus()} />

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSwitchToTextMode}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            <span>Switch to Text Mode</span>
          </Button>
        </div>
      </div>

      {/* Permission Request / Denied Banner if applicable */}
      {permissionStatus !== "granted" && (
        <MicrophonePermission
          status={permissionStatus}
          errorMessage={recorderError}
          onRequestPermission={handleStartRecording}
          onSwitchToTextMode={onSwitchToTextMode}
        />
      )}

      {/* General Error Banner */}
      {generalError && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Speech Notice</span>
            <p>{generalError}</p>
          </div>
        </div>
      )}

      {/* Audio Player for Interviewer Speech */}
      {activeQuestion && (
        <AudioPlayer
          isPlaying={isPlaying}
          isSynthesizing={isSynthesizing}
          isMuted={isMuted}
          label="Interviewer Question"
          onReplay={replay}
          onToggleMute={toggleMute}
        />
      )}

      {/* Recording Stage vs Transcript Review Stage */}
      {permissionStatus === "granted" && (
        <>
          {/* If transcript exists and recording is stopped, present TranscriptEditor */}
          {transcript && !isRecording && !isTranscribing ? (
            <TranscriptEditor
              transcript={transcript}
              isSubmitting={isSubmittingAnswer}
              onChangeTranscript={setTranscript}
              onReRecord={handleReRecord}
              onSubmitAnswer={handleSubmit}
            />
          ) : (
            /* Otherwise show the live voice recorder */
            <VoiceRecorder
              isRecording={isRecording}
              durationSeconds={durationSeconds}
              audioLevel={audioLevel}
              disabled={isTranscribing || isSubmittingAnswer}
              onStartRecording={handleStartRecording}
              onStopRecording={stopRecording}
              onCancelRecording={cancelRecording}
            />
          )}
        </>
      )}
    </div>
  )
}

