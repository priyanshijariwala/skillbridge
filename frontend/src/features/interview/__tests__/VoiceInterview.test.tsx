import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { VoiceRecorder } from "../components/voice/VoiceRecorder"
import { AudioPlayer } from "../components/voice/AudioPlayer"
import { MicrophonePermission } from "../components/voice/MicrophonePermission"
import { VoiceStatusIndicator } from "../components/voice/VoiceStatusIndicator"
import { TranscriptEditor } from "../components/voice/TranscriptEditor"
import { AudioWaveform } from "../components/voice/AudioWaveform"

describe("Voice Interview Components", () => {
  // 1. VoiceRecorder Tests
  describe("VoiceRecorder", () => {
    it("renders record button and initial timer when idle", () => {
      const startMock = vi.fn()
      render(
        <VoiceRecorder
          isRecording={false}
          durationSeconds={0}
          onStartRecording={startMock}
          onStopRecording={vi.fn()}
          onCancelRecording={vi.fn()}
        />
      )

      expect(screen.getByText("Record Your Answer")).toBeInTheDocument()
      expect(screen.getByText("00:00")).toBeInTheDocument()

      fireEvent.click(screen.getByText("Record Your Answer"))
      expect(startMock).toHaveBeenCalledTimes(1)
    })

    it("renders active recording controls and timer when recording", () => {
      const stopMock = vi.fn()
      const cancelMock = vi.fn()
      render(
        <VoiceRecorder
          isRecording={true}
          durationSeconds={45}
          onStartRecording={vi.fn()}
          onStopRecording={stopMock}
          onCancelRecording={cancelMock}
        />
      )

      expect(screen.getByText("LIVE")).toBeInTheDocument()
      expect(screen.getByText("00:45")).toBeInTheDocument()
      expect(screen.getByText("Done Speaking")).toBeInTheDocument()
      expect(screen.getByText("Discard")).toBeInTheDocument()

      fireEvent.click(screen.getByText("Done Speaking"))
      expect(stopMock).toHaveBeenCalledTimes(1)

      fireEvent.click(screen.getByText("Discard"))
      expect(cancelMock).toHaveBeenCalledTimes(1)
    })
  })

  // 2. AudioPlayer Tests
  describe("AudioPlayer", () => {
    it("renders question label, replay button and mute toggle", () => {
      const replayMock = vi.fn()
      const muteMock = vi.fn()
      render(
        <AudioPlayer
          isPlaying={false}
          isSynthesizing={false}
          isMuted={false}
          label="Interviewer Question"
          onReplay={replayMock}
          onToggleMute={muteMock}
        />
      )

      expect(screen.getByText("Interviewer Question")).toBeInTheDocument()
      expect(screen.getByText("Replay Question")).toBeInTheDocument()

      fireEvent.click(screen.getByText("Replay Question"))
      expect(replayMock).toHaveBeenCalledTimes(1)
    })

    it("shows synthesizing state when loading audio", () => {
      render(
        <AudioPlayer
          isPlaying={false}
          isSynthesizing={true}
          isMuted={false}
          onReplay={vi.fn()}
          onToggleMute={vi.fn()}
        />
      )

      expect(screen.getByText("Generating speech...")).toBeInTheDocument()
    })
  })

  // 3. MicrophonePermission Tests
  describe("MicrophonePermission", () => {
    it("renders denied warning and action to switch to text mode", () => {
      const switchMock = vi.fn()
      const enableMock = vi.fn()

      render(
        <MicrophonePermission
          status="denied"
          errorMessage="Microphone permission was denied."
          onRequestPermission={enableMock}
          onSwitchToTextMode={switchMock}
        />
      )

      expect(
        screen.getByText("Microphone Access Required for Voice Mode")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Switch to Text Practice Mode")
      ).toBeInTheDocument()

      fireEvent.click(screen.getByText("Switch to Text Practice Mode"))
      expect(switchMock).toHaveBeenCalledTimes(1)
    })

    it("does not render when permission is granted", () => {
      const { container } = render(
        <MicrophonePermission
          status="granted"
          onRequestPermission={vi.fn()}
          onSwitchToTextMode={vi.fn()}
        />
      )
      expect(container).toBeEmptyDOMElement()
    })
  })

  // 4. VoiceStatusIndicator Tests
  describe("VoiceStatusIndicator", () => {
    it("renders speaking state correctly", () => {
      render(<VoiceStatusIndicator status="speaking" />)
      expect(screen.getByText("AI Interviewer Speaking...")).toBeInTheDocument()
    })

    it("renders listening state correctly", () => {
      render(<VoiceStatusIndicator status="listening" />)
      expect(screen.getByText("Recording Spoken Answer...")).toBeInTheDocument()
    })

    it("renders processing state correctly", () => {
      render(<VoiceStatusIndicator status="processing" />)
      expect(screen.getByText("Transcribing Audio...")).toBeInTheDocument()
    })
  })

  // 5. TranscriptEditor Tests
  describe("TranscriptEditor", () => {
    it("renders transcript text, calculates word count, and allows editing", () => {
      const changeMock = vi.fn()
      const reRecordMock = vi.fn()
      const submitMock = vi.fn()

      render(
        <TranscriptEditor
          transcript="We use PostgreSQL and Redis Lua scripts for atomic increments."
          isSubmitting={false}
          onChangeTranscript={changeMock}
          onReRecord={reRecordMock}
          onSubmitAnswer={submitMock}
        />
      )

      expect(
        screen.getByText(/Word count: 10 words/i)
      ).toBeInTheDocument()

      const textarea = screen.getByDisplayValue(
        "We use PostgreSQL and Redis Lua scripts for atomic increments."
      )
      fireEvent.change(textarea, { target: { value: "Updated answer" } })
      expect(changeMock).toHaveBeenCalledWith("Updated answer")

      fireEvent.click(screen.getByText("Re-record Answer"))
      expect(reRecordMock).toHaveBeenCalledTimes(1)

      fireEvent.click(screen.getByText("Submit Spoken Answer"))
      expect(submitMock).toHaveBeenCalledTimes(1)
    })
  })

  // 6. AudioWaveform Tests
  describe("AudioWaveform", () => {
    it("renders without crashing", () => {
      const { container } = render(<AudioWaveform isActive={true} level={0.8} />)
      expect(container.querySelectorAll("span").length).toBe(18)
    })
  })
})

