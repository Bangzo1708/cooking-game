// Synthesised sound effects for Dapur Kilat. No audio files: every sound is a
// short WebAudio oscillator/noise burst built at play time, so the game stays
// fully offline. The context is created lazily on the first user gesture, and
// everything is a no-op while muted or before that gesture (headless screenshots).

export class SoundBoard {
  constructor() {
    this.context = null;
    this.muted = false;
    this.master = null;
  }

  /** Create the context. Call from a user gesture; safe to call repeatedly. */
  unlock() {
    if (this.context || typeof window === 'undefined') return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.context.destination);
    } catch (error) {
      this.context = null;
    }
  }

  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
  }

  tone(frequency, duration, type, volume, when, slideTo) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + (when || 0);
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume || 0.5, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  noise(duration, volume, when, lowpass) {
    if (!this.context || this.muted) return;
    const start = this.context.currentTime + (when || 0);
    const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    }
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass || 1200;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume || 0.4, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(start);
  }

  chop() {
    this.noise(0.09, 0.55, 0, 900);
    this.tone(180, 0.07, 'triangle', 0.35, 0, 90);
  }

  pick() {
    this.tone(520, 0.08, 'sine', 0.35, 0, 760);
  }

  plop() {
    this.tone(300, 0.1, 'sine', 0.4, 0, 160);
  }

  serve() {
    this.tone(660, 0.12, 'sine', 0.5);
    this.tone(880, 0.16, 'sine', 0.5, 0.09);
    this.tone(1320, 0.2, 'sine', 0.35, 0.18);
  }

  coin() {
    this.tone(1180, 0.09, 'square', 0.18);
    this.tone(1560, 0.14, 'square', 0.15, 0.07);
  }

  error() {
    this.tone(220, 0.22, 'sawtooth', 0.3, 0, 140);
  }

  pop() {
    this.tone(440, 0.06, 'sine', 0.3, 0, 880);
  }

  tick() {
    this.tone(980, 0.05, 'square', 0.12);
  }

  bell() {
    this.tone(1046, 0.35, 'sine', 0.4);
    this.tone(1568, 0.4, 'sine', 0.25, 0.05);
  }

  gameOver() {
    this.tone(392, 0.25, 'triangle', 0.4);
    this.tone(311, 0.25, 'triangle', 0.4, 0.22);
    this.tone(233, 0.5, 'triangle', 0.4, 0.44);
  }
}
