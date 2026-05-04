const SAMPLE_VERSION = "20260504-louder1";

// Master audible target. 0.5 leaves headroom for the compressor while staying
// loud enough to be heard on a phone speaker in a noisy room.
const MASTER_AUDIBLE = 0.5;

const SAMPLE_PATHS = {
  music: [
    "assets/audio/cc0-techno/tech-rave.wav",
    "assets/audio/cc0-techno/techno-5.mp3",
    "assets/audio/cc0-techno/space-flight.mp3"
  ],
  fire: [
    "assets/audio/mixkit-premium/fire-1.mp3",
    "assets/audio/mixkit-premium/fire-2.mp3"
  ],
  boom: [
    "assets/audio/mixkit-premium/boom-1.mp3",
    "assets/audio/mixkit-premium/boom-2.mp3",
    "assets/audio/mixkit-premium/boom-3.mp3"
  ],
  hit: [
    "assets/audio/mixkit-premium/hit-1.mp3",
    "assets/audio/mixkit-premium/hit-2.mp3",
    "assets/audio/mixkit-premium/hit-3.mp3"
  ],
  levelUp: [
    "assets/audio/mixkit-premium/level-up-1.mp3",
    "assets/audio/mixkit-premium/level-up-2.mp3"
  ],
  upgrade: [
    "assets/audio/mixkit-premium/upgrade-1.mp3",
    "assets/audio/mixkit-premium/upgrade-2.mp3"
  ],
  select: [
    "assets/audio/mixkit-premium/select-1.mp3",
    "assets/audio/mixkit-premium/select-2.mp3",
    "assets/audio/mixkit-premium/select-3.mp3"
  ],
  laser: [
    "assets/audio/mixkit-premium/laser-1.mp3"
  ],
  beam: [
    "assets/audio/mixkit-premium/beam-1.mp3",
    "assets/audio/mixkit-premium/beam-2.mp3"
  ]
};

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.enabled = false;
    this.started = false;
    this.samples = {};
    this.samplePromise = null;
    this.musicSource = null;
    this.fallbackNodes = [];
    this.fallbackTimers = [];
    this.lastFire = 0;
    this.lastBoom = 0;
    this.lastLaser = 0;
    this.lastBeam = 0;
    this.lastUpgrade = 0;
  }

  preload() {
    if (!this.ctx) this.createContext();
    this.loadSamples();
  }

  async start() {
    if (!this.ctx) this.createContext();
    // iOS WKWebView quirk: kicking a 1-frame silent BufferSource synchronously
    // inside the user gesture forces the iOS audio engine to fully wake up.
    // Without this, ctx.resume() can transition to "running" while the speaker
    // output silently stays muted.
    try {
      const silent = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = silent;
      src.connect(this.ctx.destination);
      src.start(0);
    } catch (e) { /* legacy webkit can throw; safe to ignore */ }

    if (this.ctx.state === "suspended") await this.ctx.resume();
    // Use direct setValueAtTime instead of setTargetAtTime — the latter takes
    // a few frames to ramp up and can leave the gain mid-transition (=quiet)
    // if iOS suspends the ctx during the ramp.
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(MASTER_AUDIBLE, this.ctx.currentTime);
    this.enabled = true;
    await this.loadSamples();
    if (!this.started) {
      this.started = true;
      this.startMusic();
    }
  }

  createContext() {
    const Context = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Context();

    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.value = -10;
    compressor.knee.value = 18;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.22;

    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.78;
    this.sfxGain.gain.value = 0.92;

    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(compressor).connect(this.ctx.destination);
  }

  async loadSamples() {
    if (this.samplePromise) return this.samplePromise;
    this.samplePromise = Promise.all(
      Object.entries(SAMPLE_PATHS).map(async ([key, paths]) => {
        try {
          const list = Array.isArray(paths) ? paths : [paths];
          this.samples[key] = await Promise.all(
            list.map(async (path) => {
              const response = await fetch(`${path}?v=${SAMPLE_VERSION}`);
              if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
              const buffer = await response.arrayBuffer();
              return this.ctx.decodeAudioData(buffer.slice(0));
            })
          );
        } catch (error) {
          console.warn(`音频采样加载失败：${key}`, error);
        }
      })
    );
    return this.samplePromise;
  }

  setEnabled(value) {
    this.enabled = value;
    if (!this.ctx || !this.master) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(value ? MASTER_AUDIBLE : 0, this.ctx.currentTime);
  }

  playSample(name, options = {}) {
    if (!this.enabled || !this.ctx || !this.samples[name]?.length) return null;
    const choices = this.samples[name];
    const buffer = choices[Math.floor(Math.random() * choices.length)];
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    source.loop = options.loop ?? false;
    source.playbackRate.value = options.rate ?? 1;
    gain.gain.value = options.gain ?? 1;
    source.connect(gain).connect(options.destination || this.sfxGain);
    source.start();
    return source;
  }

  startMusic() {
    if (!this.ctx || !this.enabled || this.musicSource) return;
    const source = this.playSample("music", {
      loop: true,
      gain: 0.86,
      destination: this.musicGain
    });
    if (source) {
      this.musicSource = source;
      return;
    }
    this.startFallbackMusic();
  }

  startFallbackMusic() {
    const now = this.ctx.currentTime;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 560;
    filter.Q.value = 0.75;

    for (const voice of [
      { freq: 42, gain: 0.06, type: "sine" },
      { freq: 63, gain: 0.032, type: "triangle" },
      { freq: 84, gain: 0.022, type: "sine" }
    ]) {
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      osc.type = voice.type;
      osc.frequency.value = voice.freq;
      amp.gain.value = voice.gain;
      osc.connect(amp).connect(filter);
      osc.start(now);
      this.fallbackNodes.push(osc, amp);
    }

    filter.connect(this.musicGain);
    this.fallbackNodes.push(filter);

    const notes = [144, 144, 108, 162, 128, 108, 192, 162];
    let step = 0;
    const timer = setInterval(() => {
      if (!this.enabled || !this.ctx) return;
      const freq = notes[step % notes.length];
      step += 1;
      this.tone({ freq, slideTo: freq * 0.55, duration: 0.36, type: "triangle", gain: step % 4 === 0 ? 0.026 : 0.014, destination: this.musicGain });
    }, 620);
    this.fallbackTimers.push(timer);
  }

  envelope(gain, now, amount, attack, hold, release) {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, amount), now + attack);
    gain.gain.setTargetAtTime(0.0001, now + attack + hold, release);
  }

  tone({ freq, duration, type = "sine", gain = 0.04, destination = this.sfxGain, slideTo = null }) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + duration * 0.86);
    this.envelope(amp, now, gain, 0.006, Math.max(0.01, duration * 0.35), duration * 0.28);
    osc.connect(amp).connect(destination);
    osc.start(now);
    osc.stop(now + duration + 0.08);
  }

  fire() {
    const now = performance.now();
    if (now - this.lastFire < 38) return;
    this.lastFire = now;
    if (this.playSample("fire", { gain: 0.58, rate: 0.96 + Math.random() * 0.08 })) return;
    const freq = 980 + Math.random() * 120;
    this.tone({ freq, slideTo: freq * 1.22, duration: 0.07, type: "triangle", gain: 0.026 });
  }

  boom() {
    const now = performance.now();
    if (now - this.lastBoom < 80) return;
    this.lastBoom = now;
    if (this.playSample("boom", { gain: 0.66, rate: 0.96 + Math.random() * 0.06 })) return;
    this.tone({ freq: 72, slideTo: 38, duration: 0.22, type: "sine", gain: 0.055 });
  }

  hit() {
    if (this.playSample("hit", { gain: 0.58, rate: 0.96 + Math.random() * 0.05 })) return;
    this.tone({ freq: 96, slideTo: 58, duration: 0.2, type: "sine", gain: 0.052 });
  }

  levelUp() {
    if (this.playSample("levelUp", { gain: 0.5 })) return;
    [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => this.tone({ freq, duration: 0.18, type: "sine", gain: 0.045 }), i * 72);
    });
  }

  upgrade() {
    const now = performance.now();
    if (now - this.lastUpgrade < 180) return;
    this.lastUpgrade = now;
    if (this.playSample("upgrade", { gain: 0.58, rate: 0.98 + Math.random() * 0.04 })) return;
    [523.25, 659.25, 987.77].forEach((freq, i) => {
      setTimeout(() => this.tone({ freq, duration: 0.15, type: "sine", gain: 0.04 }), i * 62);
    });
  }

  select() {
    if (this.playSample("select", { gain: 0.42, rate: 0.98 + Math.random() * 0.04 })) return;
    this.tone({ freq: 880, slideTo: 1320, duration: 0.11, type: "triangle", gain: 0.042 });
    setTimeout(() => this.tone({ freq: 1760, duration: 0.08, type: "sine", gain: 0.028 }), 76);
  }

  laser() {
    const now = performance.now();
    if (now - this.lastLaser < 240) return;
    this.lastLaser = now;
    if (this.playSample("laser", { gain: 0.46, rate: 0.97 + Math.random() * 0.05 })) return;
    this.tone({ freq: 520, slideTo: 1620, duration: 0.18, type: "triangle", gain: 0.032 });
  }

  beam() {
    const now = performance.now();
    if (now - this.lastBeam < 360) return;
    this.lastBeam = now;
    if (this.playSample("beam", { gain: 0.56, rate: 0.96 + Math.random() * 0.04 })) return;
    this.tone({ freq: 128, slideTo: 88, duration: 0.4, type: "sine", gain: 0.05 });
  }
}
