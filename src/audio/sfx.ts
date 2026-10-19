import * as synth from './synth';

/**
 * Web Audio wrapper around the procedural synth. It lazily creates an
 * AudioContext on the first user gesture, caches rendered buffers, and keeps
 * the looping ambience in sync with the current scene.
 */
export class Sfx {
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambGain: GainNode | null = null;
  private ambSrc: AudioBufferSourceNode | null = null;
  private muted = false;
  private readonly cache = new Map<string, AudioBuffer>();

  /** Called from the first pointer interaction (browser autoplay policy). */
  init(): void {
    if (this.ac) {
      if (this.ac.state === 'suspended') void this.ac.resume();
      return;
    }
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ac = new AudioContextCtor();
    this.ac = ac;
    const compressor = ac.createDynamicsCompressor();
    const master = ac.createGain();
    master.gain.value = 0.9;
    master.connect(compressor).connect(ac.destination);
    this.master = master;
    // Pre-render the common effects during idle time to avoid first-play hitches.
    const warm = [
      'click',
      'select',
      'stamp_deny',
      'stamp_approve',
      'tray',
      'tray_back',
      'discrepancy',
      'inspect_on',
      'inspect_off',
      'thud',
      'intercom',
      'citation',
      'detain',
      'scuffle',
      'day_hit',
      'whoosh',
      'sad',
      'bell',
      'xray',
      'gunshot',
    ];
    let i = 0;
    const step = () => {
      if (i < warm.length) {
        this.buffer(warm[i++]);
        setTimeout(step, 30);
      }
    };
    setTimeout(step, 50);
  }

  private buffer(name: string, make?: () => Float32Array): AudioBuffer {
    const cached = this.cache.get(name);
    if (cached) return cached;
    const ac = this.ac;
    if (!ac) throw new Error('AudioContext is not initialized');
    const data = make ? make() : synth.MAKERS[name]();
    const buffer = ac.createBuffer(1, data.length, synth.SR);
    buffer.copyToChannel(data, 0);
    this.cache.set(name, buffer);
    return buffer;
  }

  private playBuf(buffer: AudioBuffer, gain = 1, when = 0): AudioBufferSourceNode | null {
    const ac = this.ac;
    if (!ac || this.muted) return null;
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const g = ac.createGain();
    g.gain.value = gain;
    source.connect(g).connect(this.master!);
    source.start(ac.currentTime + when);
    return source;
  }

  play(name: string, gain = 1, when = 0): AudioBufferSourceNode | null {
    if (!this.ac) return null;
    return this.playBuf(this.buffer(name), gain, when);
  }

  paper(seed = 0): void {
    if (this.ac) this.playBuf(this.buffer(`paper${seed % 8}`, () => synth.paper(seed % 8)));
  }

  step(seed = 0): void {
    if (this.ac) this.playBuf(this.buffer(`step${seed % 6}`, () => synth.footstep(60 + (seed % 6))));
  }

  key(seed = 0): void {
    if (this.ac) this.playBuf(this.buffer(`key${seed % 16}`, () => synth.typekey(seed % 16)), 1.5);
  }

  mumble(text: string, pitch: number, seed: number): void {
    if (!this.ac) return;
    const duration = Math.round(Math.min(1.3, 0.25 + 0.065 * [...text].length) * 100) / 100;
    const key = `mum${duration}|${pitch}|${seed % 12}`;
    this.playBuf(this.buffer(key, () => synth.mumble(duration, pitch, seed % 12)));
  }

  printer(duration: number): void {
    if (this.ac) this.playBuf(this.buffer(`printer${duration}`, () => synth.printer(duration)));
  }

  ambient(on: boolean): void {
    const ac = this.ac;
    if (!ac) return;
    if (on && !this.ambSrc) {
      const source = ac.createBufferSource();
      source.buffer = this.buffer('ambient', synth.ambient);
      source.loop = true;
      const gain = ac.createGain();
      gain.gain.value = this.muted ? 0 : 0.8;
      source.connect(gain).connect(this.master!);
      source.start();
      this.ambSrc = source;
      this.ambGain = gain;
    } else if (!on && this.ambSrc) {
      this.ambSrc.stop();
      this.ambSrc = null;
      this.ambGain = null;
    }
  }

  stop(source: AudioBufferSourceNode | null): void {
    try {
      source?.stop();
    } catch {
      /* already stopped */
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.9;
    if (this.ambGain) this.ambGain.gain.value = muted ? 0 : 0.8;
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }
}
