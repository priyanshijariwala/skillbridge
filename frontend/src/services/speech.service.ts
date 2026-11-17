import apiClient from "@/lib/axios"

export interface TranscriptionResponse {
  text: string
  duration_seconds?: number | null
  language?: string | null
  confidence?: number | null
}

export interface TTSPayload {
  text: string
  voice?: string
  speed?: number
}

export const speechService = {
  async transcribe(audioBlob: Blob): Promise<TranscriptionResponse> {
    const formData = new FormData()
    // Determine file extension from blob MIME type
    const mimeType = audioBlob.type || "audio/webm"
    const ext = mimeType.includes("wav")
      ? "wav"
      : mimeType.includes("mp4") || mimeType.includes("m4a")
      ? "m4a"
      : mimeType.includes("ogg")
      ? "ogg"
      : "webm"

    formData.append("file", audioBlob, `recording.${ext}`)

    const { data } = await apiClient.post<TranscriptionResponse>(
      "/speech/transcribe",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
    return data
  },

  async synthesize(payload: TTSPayload): Promise<Blob> {
    const response = await apiClient.post("/speech/synthesize", payload, {
      responseType: "blob",
    })
    return response.data
  },
}

