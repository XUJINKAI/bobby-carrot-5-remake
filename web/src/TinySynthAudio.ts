import type { AudioBackend } from '@bobby/engine';

declare global {
  interface Window {
    WebAudioTinySynth?: new (options?: Record<string, unknown>) => TinySynthLike;
  }
}

interface TinySynthLike {
  loadMIDI(data: ArrayBuffer): void;
  playMIDI(): void;
  stopMIDI(): void;
  setLoop(value: number): void;
  setMasterVol(value: number): void;
  setQuality?(value: number): void;
  setReverbLev?(value: number): void;
  getAudioContext?(): AudioContext;
}

export type TinySynthTone = 'fm' | 'chip';

const LOCAL_TINYSYNTH_URL = '/vendor/webaudio-tinysynth.min.js';
const CDN_TINYSYNTH_URL = 'https://cdn.jsdelivr.net/npm/webaudio-tinysynth@1.1.3/webaudio-tinysynth.min.js';

/**
 * WebAudio TinySynth MIDI 后端。
 *
 * TinySynth 是算法合成器，不使用 PCM/SF2；quality=1 是 FM GM 音色，quality=0 是单振荡器
 * chip 音色。因此“更真实/更柔和”的最终方案应是可选 SoundFont 后端（见 docs/reference/midi-backends.md），
 * 这里仍保留 TinySynth 作为零外部音色资产的轻量默认实现。
 */
export class TinySynthAudioBackend implements AudioBackend {
  private synth: TinySynthLike | null = null;
  private loading: Promise<TinySynthLike> | null = null;
  private currentMusic: string | null = null;
  private playingMusic: string | null = null;
  private enabled = localStorage.getItem('bobby.musicEnabled') !== 'false';
  private musicVolume = Number(localStorage.getItem('bobby.musicVolume') ?? '0.42');
  private soundVolume = Number(localStorage.getItem('bobby.soundVolume') ?? '0.45');
  private tone: TinySynthTone = localStorage.getItem('bobby.tinySynthTone') === 'chip' ? 'chip' : 'fm';
  private reverbLevel = Number(localStorage.getItem('bobby.tinySynthReverb') ?? '0.42');
  private requestSerial = 0;

  playMusic(id: string): void {
    this.currentMusic = id;
    if (!this.enabled || this.playingMusic === id) return;
    const serial = ++this.requestSerial;
    void this.ensureSynth().then(async (synth) => {
      if (serial !== this.requestSerial || !this.enabled || this.currentMusic !== id) return;
      const response = await fetch(`/assets/audio/midi/${encodeURIComponent(id)}.mid`);
      if (!response.ok) return;
      const data = await response.arrayBuffer();
      if (serial !== this.requestSerial || !this.enabled || this.currentMusic !== id) return;
      synth.stopMIDI();
      synth.loadMIDI(data);
      synth.setLoop(this.shouldLoop(id) ? 1 : 0);
      synth.setMasterVol(this.musicVolume);
      synth.setQuality?.(this.tone === 'chip' ? 0 : 1);
      synth.setReverbLev?.(this.reverbLevel);
      await synth.getAudioContext?.().resume().catch(() => undefined);
      synth.playMIDI();
      this.playingMusic = id;
    }).catch((error: unknown) => console.warn('MIDI 播放初始化失败：', error));
  }

  stopMusic(): void {
    this.currentMusic = null;
    this.playingMusic = null;
    this.requestSerial += 1;
    this.synth?.stopMIDI();
  }

  playSound(id: string): void {
    if (this.soundVolume <= 0) return;
    void this.ensureSynth().then((synth) => {
      const ctx = synth.getAudioContext?.();
      if (!ctx) return;
      void ctx.resume().catch(() => undefined);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = id === 'dragon-fire' ? 'triangle' : 'sine';
      // 操作提示刻意压低频率与增益，避免短促高频音盖过 MIDI。
      osc.frequency.value = id === 'coin' ? 660 : id === 'carrot' ? 520 : 150;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.045 * this.soundVolume), ctx.currentTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }).catch(() => undefined);
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = clamp(volume);
    localStorage.setItem('bobby.musicVolume', String(this.musicVolume));
    this.synth?.setMasterVol(this.musicVolume);
  }

  setSoundVolume(volume: number): void {
    this.soundVolume = clamp(volume);
    localStorage.setItem('bobby.soundVolume', String(this.soundVolume));
  }

  setTone(tone: TinySynthTone): void {
    if (this.tone === tone) return;
    this.tone = tone;
    localStorage.setItem('bobby.tinySynthTone', tone);
    this.synth?.setQuality?.(tone === 'chip' ? 0 : 1);
    // 已加载 MIDI 不需要重载；TinySynth 可以实时切换 timbre set。
  }

  getTone(): TinySynthTone { return this.tone; }

  setReverbLevel(value: number): void {
    this.reverbLevel = clamp(value);
    localStorage.setItem('bobby.tinySynthReverb', String(this.reverbLevel));
    this.synth?.setReverbLev?.(this.reverbLevel);
  }

  getReverbLevel(): number { return this.reverbLevel; }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('bobby.musicEnabled', String(enabled));
    if (!enabled) {
      this.requestSerial += 1;
      this.playingMusic = null;
      this.synth?.stopMIDI();
    } else if (this.currentMusic) {
      this.playMusic(this.currentMusic);
    }
  }

  isEnabled(): boolean { return this.enabled; }
  getMusicVolume(): number { return this.musicVolume; }
  getSoundVolume(): number { return this.soundVolume; }

  /**
   * 浏览器自动播放策略只要求恢复 AudioContext。绝不能在这里重新调用 playMusic()：
   * document keydown 会在每次移动时触发 resume()，旧实现因此让 MIDI 每走一步都从头开始。
   */
  resume(): void {
    void this.ensureSynth()
      .then((synth) => synth.getAudioContext?.().resume())
      .catch(() => undefined);
  }

  private shouldLoop(id: string): boolean {
    return id.startsWith('ingame') || ['title', 'bonus', 'mow', 'fly', 'shop', 'sandman', 'train', 'universe'].includes(id);
  }

  private ensureSynth(): Promise<TinySynthLike> {
    if (this.synth) return Promise.resolve(this.synth);
    if (this.loading) return this.loading;
    this.loading = loadTinySynth().then(() => {
      const Constructor = window.WebAudioTinySynth;
      if (!Constructor) throw new Error('WebAudioTinySynth 未注册');
      const synth = new Constructor({ quality: this.tone === 'chip' ? 0 : 1, useReverb: 1, voices: 48, internalcontext: 1 });
      synth.setMasterVol(this.musicVolume);
      synth.setReverbLev?.(this.reverbLevel);
      this.synth = synth;
      return synth;
    });
    return this.loading;
  }
}

let tinySynthScript: Promise<void> | null = null;
function loadTinySynth(): Promise<void> {
  if (window.WebAudioTinySynth) return Promise.resolve();
  if (tinySynthScript) return tinySynthScript;
  tinySynthScript = loadScript(LOCAL_TINYSYNTH_URL).catch(() => loadScript(CDN_TINYSYNTH_URL));
  return tinySynthScript;
}

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); reject(new Error(`无法加载 MIDI 库 ${url}`)); };
    document.head.append(script);
  });
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}
