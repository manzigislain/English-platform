import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);
  private openai: any = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.length > 0) {
      try {
        // Dynamic import to avoid crash if OpenAI SDK is not configured
        const OpenAI = require("openai");
        this.openai = new OpenAI({ apiKey });
      } catch (err) {
        this.logger.warn("OpenAI SDK not available, TTS disabled");
      }
    } else {
      this.logger.warn("OPENAI_API_KEY not set, TTS disabled");
    }
  }

  /**
   * Generate speech from text using OpenAI TTS
   * Returns audio buffer
   */
  async generateSpeech(
    text: string,
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "nova",
  ): Promise<Buffer> {
    if (!this.openai) {
      throw new Error("TTS is not configured. Set OPENAI_API_KEY in your environment.");
    }

    const response = await this.openai.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  }
}
