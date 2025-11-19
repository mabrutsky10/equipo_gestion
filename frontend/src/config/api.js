// Configuración de APIs
export const API_CONFIG = {
  // N8N Webhook (para procesamiento de audio)
  N8N_WEBHOOK_URL: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://mas10.app.n8n.cloud/webhook-test/voice_message',
  
  // ElevenLabs Text-to-Speech
  ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
  ELEVENLABS_TTS_URL: 'https://api.elevenlabs.io/v1/text-to-speech/9oPKasc15pfAbMr7N6Gs',
  
  // Configuración de audio
  AUDIO_CONFIG: {
    encoding: 'LINEAR16',
    sampleRateHertz: 48000,
    languageCode: 'es-ES',
    alternativeLanguageCodes: ['es-AR', 'es-MX'],
    enableAutomaticPunctuation: true
  }
}

