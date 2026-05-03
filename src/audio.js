const SAMPLE_VERSION = "20260503-cc0-techno1";

const SAMPLE_PATHS = {
  // 5 CC0 techno/EDM tracks from OpenGameArt — randomly rotated each game.
  // (Armin van Buuren tracks are copyrighted; we picked the closest royalty-free
  //  matches: tech-rave + Pro Sensory techno + bright/melodic EDM + space.)
  music: [
    "assets/audio/cc0-techno/tech-rave.wav",
    "assets/audio/cc0-techno/techno-5.mp3",
    "assets/audio/cc0-techno/space-flight.mp3"
  ],
  fire: [
    "assets/audio/kenney-sci-fi/Audio/laserSmall_000.ogg",
    "assets/audio/kenney-sci-fi/Audio/laserSmall_001.ogg",
    "assets/audio/kenney-sci-fi/Audio/laserSmall_002.ogg"
  ],
  boom: [
    "assets/audio/kenney-sci-fi/Audio/explosionCrunch_000.ogg",
    "assets/audio/kenney-sci-fi/Audio/explosionCrunch_001.ogg",
    "assets/audio/kenney-sci-fi/Audio/lowFrequency_explosion_000.ogg"
  ],
  hit: [
    "assets/audio/kenney-sci-fi/Audio/impactMetal_000.ogg",
    "assets/audio/kenney-sci-fi/Audio/impactMetal_001.ogg",
    "assets/audio/kenney-sci-fi/Audio/impactMetal_002.ogg"
  ],
  levelUp: [
    "assets/audio/opengameart-powerup/processed/level_up_reward_001.wav",
    "assets/audio/opengameart-powerup/processed/level_up_reward_002.wav"
  ],
  upgrade: [
    "assets/audio/opengameart-powerup/processed/weapon_upgrade_001.wav",
    "assets/audio/opengameart-powerup/processed/weapon_upgrade_002.wav",
    "assets/audio/opengameart-powerup/processed/weapon_upgrade_003.wav"
  ],
  select: [
    "assets/audio/kenney-interface/Audio/confirmation_001.ogg",
    "assets/audio/kenney-interface/Audio/confirmation_002.ogg",
    "assets/audio/kenney-interface/Audio/select_004.ogg",
    "assets/audio/kenney-interface/Audio/select_005.ogg"
  ],
  laser: [
    "assets/audio/kenney-sci-fi/Audio/laserLarge_000.ogg",
    "assets/audio/kenney-sci-fi/Audio/laserLarge_001.ogg",
    "assets/audio/kenney-sci-fi/Audio/laserLarge_002.ogg"
  ],
  beam: [
    "assets/audio/kenney-sci-fi/Audio/forceField_000.ogg",
    "assets/audio/kenney-sci-fi/Audio/forceField_001.ogg",
    "assets/audio/kenney-sci-fi/Audio/spaceEngineLarge_000.ogg"
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
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.enabled = true;
    this.master.gain.setTargetAtTime(0.34, this.ctx.currentTime, 0.08);
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
    compressor.threshold.value = -16;
    compressor.knee.value = 20;
    compressor.ratio.value = 7;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.22;

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0001;
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.58;
    this.sfxGain.gain.value = 0.72;

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
    this.master.gain.setTargetAtTime(value ? 0.34 : 0.0001, this.ctx.currentTime, 0.08);
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
