// Synthetic sound effects using Web Audio API
let audioContext;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Clap sound - for correct answers
export const playClap = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Three quick clicks with decreasing frequency
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150 - i * 40, now);
      gain.gain.setValueAtTime(0.3, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.1);
    }
  } catch (err) {
    console.warn('Clap sound failed:', err);
  }
};

// Success chime - for achievement unlocks
export const playSuccessChime = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Two ascending tones
    const frequencies = [523.25, 659.25]; // C5, E5

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.25, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);

      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.3);
    });
  } catch (err) {
    console.warn('Success chime failed:', err);
  }
};

// Level up - for milestone achievements
export const playLevelUp = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Ascending pitch sequence
    const frequencies = [392, 440, 494, 523.25]; // G4, A4, B4, C5

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.2);
    });
  } catch (err) {
    console.warn('Level up sound failed:', err);
  }
};

// Error buzz - for incorrect answers
export const playErrorBuzz = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Low frequency buzz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {
    console.warn('Error buzz failed:', err);
  }
};

// Notification alert - for general notifications
export const playNotification = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (err) {
    console.warn('Notification sound failed:', err);
  }
};
