// Text-to-Speech Manager using ElevenLabs API and Web Speech API Fallback
let currentUtterance = null;
let speechSynthesis = window.speechSynthesis;
let currentAudio = null;
let isElevenLabsPlaying = false;

export const ttsManager = {
  // Check if TTS is supported
  isSupported: () => true, // Will always try at least Web Speech

  // Speak text with customizable options
  speak: async (text, options = {}) => {
    // Stop any ongoing speech first
    ttsManager.stop();

    const elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

    if (elevenLabsApiKey) {
      try {
        // Default voice: Sarah (EXAVITQu4vr4xnSDxMaL) or provide via env
        const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; 
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": elevenLabsApiKey
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          })
        });

        if (!response.ok) {
          throw new Error("ElevenLabs API response not ok");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        currentAudio = new Audio(url);
        currentAudio.playbackRate = options.rate || 1;
        
        currentAudio.onplay = () => {
          isElevenLabsPlaying = true;
          if (options.onStart) options.onStart();

          // Increase TTS volume by 100% using Web Audio API
          try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
              const audioCtx = new AudioContext();
              const source = audioCtx.createMediaElementSource(currentAudio);
              const gainNode = audioCtx.createGain();
              gainNode.gain.value = 2.0; // 100% volume increase
              source.connect(gainNode);
              gainNode.connect(audioCtx.destination);
            }
          } catch(e) { console.error('AudioContext boost failed:', e); }
        };
        
        currentAudio.onended = () => {
          isElevenLabsPlaying = false;
          if (options.onEnd) options.onEnd();
        };
        
        currentAudio.onerror = () => {
          isElevenLabsPlaying = false;
          if (options.onError) options.onError(new Error("Audio playback failed"));
        };

        await currentAudio.play();
        return true;
      } catch (err) {
        console.warn('ElevenLabs TTS error, falling back to Web Speech:', err);
      }
    }

    // --- Fallback to Web Speech API ---
    if (!speechSynthesis) {
      console.warn('Speech Synthesis not supported in this browser');
      return false;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = options.rate || 1; // 0.1 to 10
      utterance.pitch = options.pitch || 1; // 0 to 2
      utterance.volume = options.volume !== undefined ? options.volume : 1; // 0 to 1
      utterance.lang = options.lang || 'en-US';

      if (options.onStart) utterance.onstart = options.onStart;
      if (options.onEnd) utterance.onend = options.onEnd;
      if (options.onError) utterance.onerror = options.onError;

      currentUtterance = utterance;
      speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn('Web Speech TTS error:', err);
      return false;
    }
  },

  // Pause speech
  pause: () => {
    if (isElevenLabsPlaying && currentAudio) {
      currentAudio.pause();
      return true;
    } else if (speechSynthesis && speechSynthesis.paused === false) {
      speechSynthesis.pause();
      return true;
    }
    return false;
  },

  // Resume speech
  resume: () => {
    if (isElevenLabsPlaying && currentAudio && currentAudio.paused) {
      currentAudio.play();
      return true;
    } else if (speechSynthesis && speechSynthesis.paused === true) {
      speechSynthesis.resume();
      return true;
    }
    return false;
  },

  // Stop all speech
  stop: () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
      isElevenLabsPlaying = false;
    }
    if (speechSynthesis) {
      speechSynthesis.cancel();
      currentUtterance = null;
    }
    return true;
  },

  // Check if currently speaking
  isSpeaking: () => {
    if (currentAudio && !currentAudio.paused) return true;
    return speechSynthesis ? speechSynthesis.speaking : false;
  },

  // Check if paused
  isPaused: () => {
    if (currentAudio) return currentAudio.paused;
    return speechSynthesis ? speechSynthesis.paused : false;
  },

  // Get available voices
  getVoices: () => speechSynthesis ? speechSynthesis.getVoices() : [],

  // Set specific voice
  setVoice: (voiceIndex) => {
    const voices = speechSynthesis.getVoices();
    if (currentUtterance && voices[voiceIndex]) {
      currentUtterance.voice = voices[voiceIndex];
    }
  },
};

export default ttsManager;
