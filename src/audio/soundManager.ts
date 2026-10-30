class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5; // 0 to 1
  private masterGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedMute = window.localStorage.getItem('rootrange_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedVol = window.localStorage.getItem('rootrange_volume');
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) {
          this.volume = v;
        }
      }
    }
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('rootrange_muted', String(this.isMuted));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('rootrange_muted', String(this.isMuted));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.volume = clamped;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('rootrange_volume', String(clamped));
    }
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // Mechanical keyboard click
  public playKey() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1800 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Ignore
    }
  }

  // Shell connection pop
  public playConnect() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }

  // Flag capture fanfare chords
  public playFlagSuccess() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime + idx * 0.1;

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.35);
      });
    } catch {
      // Ignore
    }
  }

  // Port scan ping sweep
  public playScanPing() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.2);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Ignore
    }
  }
}

export const soundManager = new SoundManager();
