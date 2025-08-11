import express from 'express';
// Import isAuthenticated if available, otherwise create a simple check
// import { isAuthenticated } from '../auth/middleware';
const isAuthenticated = (req: any, res: any, next: any) => {
  // Simple auth check - you can replace with your actual auth middleware
  if (req.session?.user || req.user) {
    return next();
  }
  // For now, allow access for testing - remove in production
  return next();
};

const router = express.Router();

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Generate alarm voice using ElevenLabs
router.post('/generate-alarm', isAuthenticated, async (req, res) => {
  try {
    const { text, voiceId, speed = 1.0, stability = 0.75, similarityBoost = 0.75 } = req.body;

    // Debug logging to show exactly what text is being sent to ElevenLabs
    console.log('🎤 ElevenLabs Request:', {
      text: text,
      voiceId: voiceId,
      speed: speed,
      stability: stability,
      similarityBoost: similarityBoost
    });

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({ 
        error: 'ElevenLabs API key not configured',
        fallback: 'Using text-to-speech fallback'
      });
    }

    const requestBody = {
      text: text,
      model_id: 'eleven_turbo_v2_5', // Updated to latest model for better quality
      voice_settings: {
        stability: Math.max(0, Math.min(1, stability)),
        similarity_boost: Math.max(0, Math.min(1, similarityBoost)),
        style: voiceId === 'DGzg6RaUqxGRTHSBjfgF' ? 1.0 : 0.0, // Maximum style for authentic drill sergeant
        use_speaker_boost: true
      }
    };

    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId || '21m00Tcm4TlvDq8ikWAM'}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Set proper headers for audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.byteLength);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('ElevenLabs generation error:', error);
    
    // Fallback to OpenAI TTS if ElevenLabs fails
    try {
      const openaiResponse = await generateOpenAITTS(req.body.text);
      if (openaiResponse) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(openaiResponse);
        return;
      }
    } catch (fallbackError) {
      console.error('OpenAI TTS fallback error:', fallbackError);
    }

    res.status(500).json({ 
      error: 'Voice generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available ElevenLabs voices
router.get('/voices', isAuthenticated, async (req, res) => {
  try {
    if (!ELEVENLABS_API_KEY) {
      return res.json({
        voices: [
          { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Gentle)' },
          { voice_id: 'DGzg6RaUqxGRTHSBjfgF', name: 'Drill Sergeant (Military)' },
          { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Strong)' },
          { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Energetic)' },
          { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (Casual)' },
          { voice_id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya (Stern)' },
          { voice_id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte (Grandma)' }
        ]
      });
    }

    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

// OpenAI TTS fallback function
async function generateOpenAITTS(text: string): Promise<Buffer | null> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) return null;

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'alloy',
        speed: 1.0
      }),
    });

    if (response.ok) {
      const audioBuffer = await response.arrayBuffer();
      return Buffer.from(audioBuffer);
    }
    
    return null;
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    return null;
  }
}

export default router;