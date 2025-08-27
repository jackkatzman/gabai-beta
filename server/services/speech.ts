export interface SpeechService {
  generateSpeech(text: string): Promise<Buffer>;
}

class ElevenLabsService implements SpeechService {
  private apiKey: string;
  private voiceId: string = "21m00Tcm4TlvDq8ikWAM"; // Default voice

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY_ENV_VAR || "";
  }

  async generateSpeech(text: string): Promise<Buffer> {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    } catch (error: any) {
      console.error("ElevenLabs speech generation error:", error);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }
}

// Fallback to OpenAI TTS if ElevenLabs is not available
import { generateSpeech as openaiGenerateSpeech } from './openai';

export const speechService: SpeechService = {
  async generateSpeech(text: string): Promise<Buffer> {
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY_ENV_VAR;
    
    if (elevenLabsKey) {
      try {
        const elevenLabs = new ElevenLabsService();
        return await elevenLabs.generateSpeech(text);
      } catch (error) {
        console.warn("ElevenLabs failed, falling back to OpenAI TTS:", error);
      }
    }
    
    // Fallback to OpenAI TTS
    return await openaiGenerateSpeech(text);
  }
};
