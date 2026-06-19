import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);
  private openai: any = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.length > 0) {
      try {
        const OpenAI = require("openai");
        this.openai = new OpenAI({ apiKey });
      } catch (err) {
        this.logger.warn("OpenAI SDK not available, transcription disabled");
      }
    } else {
      this.logger.warn("OPENAI_API_KEY not set, transcription disabled");
    }
  }

  /**
   * Transcribe audio buffer using OpenAI Whisper API
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    fileName: string = "audio.webm",
  ): Promise<{ transcript: string; confidence: number }> {
    // Save buffer to temp file for Whisper API (it needs a file)
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const tmpPath = path.join(tmpDir, `whisper-${Date.now()}-${fileName}`);
    fs.writeFileSync(tmpPath, audioBuffer);

    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tmpPath),
        model: "whisper-1",
        language: "en",
        response_format: "verbose_json",
      });

      // Clean up temp file
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // ignore cleanup errors
      }

      return {
        transcript: transcription.text,
        confidence: (transcription as any).segments
          ? (transcription as any).segments.reduce(
              (avg: number, s: any, _: number, arr: any[]) =>
                avg + (s.confidence || 0) / arr.length,
              0,
            )
          : 0.85, // fallback if segments not available
      };
    } catch (error) {
      // Clean up temp file on error too
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // ignore
      }
      throw error;
    }
  }

  /**
   * Score pronunciation by comparing transcribed text against expected answer.
   * Returns accuracy percentage based on word-level and character-level matching.
   */
  scorePronunciation(
    transcript: string,
    expectedAnswer: string,
  ): { accuracy: number; pronunciationScore: number; matchedWords: string[]; missedWords: string[] } {
    const normalizedTranscript = transcript.toLowerCase().trim();
    const normalizedExpected = expectedAnswer.toLowerCase().trim();

    // Word-level matching
    const expectedWords = normalizedExpected.split(/\s+/).filter(Boolean);
    const transcriptWords = normalizedTranscript.split(/\s+/).filter(Boolean);

    if (expectedWords.length === 0) {
      return { accuracy: 0, pronunciationScore: 0, matchedWords: [], missedWords: [] };
    }

    // Find which expected words appear in the transcript
    const matchedWords: string[] = [];
    const missedWords: string[] = [];

    for (const word of expectedWords) {
      if (transcriptWords.some((tw) => this.wordSimilarity(tw, word) >= 0.7)) {
        matchedWords.push(word);
      } else {
        missedWords.push(word);
      }
    }

    // Word-level accuracy
    const wordAccuracy = Math.round((matchedWords.length / expectedWords.length) * 100);

    // Character-level similarity (Levenshtein-based) for fine-grained scoring
    let charSimilaritySum = 0;
    let charComparisons = 0;

    // Compare the full transcript as a whole
    const maxLen = Math.max(normalizedTranscript.length, normalizedExpected.length);
    if (maxLen > 0) {
      const levenshteinDist = this.levenshteinDistance(
        normalizedTranscript,
        normalizedExpected,
      );
      const charAccuracy = Math.max(
        0,
        Math.round((1 - levenshteinDist / maxLen) * 100),
      );
      charSimilaritySum = charAccuracy;
      charComparisons = 1;
    }

    // Combine word accuracy (70%) and character accuracy (30%)
    const charAccuracy =
      charComparisons > 0
        ? Math.round(charSimilaritySum / charComparisons)
        : 0;
    const combinedAccuracy = Math.round(wordAccuracy * 0.7 + charAccuracy * 0.3);

    return {
      accuracy: combinedAccuracy,
      pronunciationScore: combinedAccuracy, // Pronunciation score = accuracy for Whisper-based scoring
      matchedWords,
      missedWords,
    };
  }

  /**
   * Simple word similarity using character overlap
   */
  private wordSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.8;

    const dist = this.levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    return maxLen > 0 ? 1 - dist / maxLen : 0;
  }

  /**
   * Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
      Array(n + 1).fill(0),
    );

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] =
          a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }

    return dp[m][n];
  }
}
