import type { AnnouncementAudio } from "@shared/api";

const DEFAULT_VOICE_ID = 20299;
const REQUEST_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 1_000;
const API_BASE_URL = "https://client.camb.ai/apis";
const audioCache = new Map<string, AnnouncementAudio>();

type TtsTask = { task_id?: string };
type TtsResult = { status?: string; run_id?: number | null };

function getApiKey(): string | undefined {
  return process.env.CAMB_AI_API_KEY?.trim() || undefined;
}

export async function requestCambAiSpeech(
  sentence: string,
  voiceId: number = DEFAULT_VOICE_ID,
): Promise<AnnouncementAudio | null> {
  const text = sentence.trim();
  const apiKey = getApiKey();
  if (!text || !apiKey) return null;

  const cached = audioCache.get(text);
  if (cached) return cached;

  try {
    const headers = {
      "x-api-key": apiKey,
      Accept: "application/json",
    };
    const createResponse = await fetch(`${API_BASE_URL}/tts`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice_id: voiceId, language: 3 }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!createResponse.ok) return null;

    const { task_id: taskId } = (await createResponse.json()) as TtsTask;
    if (!taskId) return null;

    const deadline = Date.now() + REQUEST_TIMEOUT_MS;
    let runId: number | null | undefined;
    while (Date.now() < deadline) {
      const statusResponse = await fetch(
        `${API_BASE_URL}/tts/${encodeURIComponent(taskId)}`,
        { headers, signal: AbortSignal.timeout(10_000) },
      );
      if (!statusResponse.ok) return null;

      const result = (await statusResponse.json()) as TtsResult;
      if (result.status === "SUCCESS" && result.run_id != null) {
        runId = result.run_id;
        break;
      }
      if (["ERROR", "TIMEOUT", "PAYMENT_REQUIRED"].includes(result.status || "")) {
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    if (runId == null) return null;

    const audioResponse = await fetch(
      `${API_BASE_URL}/tts-result/${runId}?output_type=raw_bytes`,
      {
        headers: {
          ...headers,
          Accept: "audio/flac, audio/wav, audio/mp3, audio/aac",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
    if (!audioResponse.ok) return null;

    const audio = Buffer.from(await audioResponse.arrayBuffer());
    if (audio.length === 0) return null;

    const payload: AnnouncementAudio = {
      mimeType: audioResponse.headers.get("content-type")?.split(";")[0] || "audio/mpeg",
      base64: audio.toString("base64"),
    };
    audioCache.set(text, payload);
    return payload;
  } catch {
    console.error("CambAI TTS request failed");
    return null;
  }
}
