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
  getAudioContext?(): AudioContext;
}

const LOCAL_TINYSYNTH_URL = '/vendor/webaudio-tinysynth.min.js';
const CDN_TINYSYNTH_URL = 'https://cdn.jsdelivr.net/npm/webaudio-tinysynth@1.1.4/webaudio-tinysynth.min.js';

/**
 * WebAudio TinySynth MIDI 后端。
 *
 * 选择它的原因：单文件、无 PCM/SoundFont 外部资产、自带 MIDI-SMF sequencer，
 * 适合这个“保留原始 .mid 并直接静态发布”的项目。库本身 Apache-2.0。
 */
export class TinySynthAudioBackend implements AudioBackend {
  private synth: TinySynthLike | null = null;
  private loading: Promise<TinySynthLike> | null = null;
  private currentMusic: string | null = null;
  private enabled = localStorage.getItem('bobby.musicEnabled') !== 'false';
  private musicVolume = Number(localStorage.getItem('bobby.musicVolume') ?? '0.55');
  private soundVolume = Number(localStorage.getItem('bobby.soundVolume') ?? '0.65');
  private requestSerial = 0;

  playMusic(id: string): void {
    this.currentMusic = id;
    if (!this.enabled) return;
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
      await synth.getAudioContext?.().resume().catch(() => undefined);
      synth.playMIDI();
    }).catch((error: unknown) => console.warn('MIDI 播放初始化失败：', error));
  }

  stopMusic(): void {
    this.currentMusic = null;
    this.requestSerial += 1;
    this.synth?.stopMIDI();
  }

  playSound(id: string): void {
    // 原 JAR 主要把 MIDI 用作场景音乐；没有可独立映射到 carrot/coin 的短 MIDI。
    // 这里用极短 WebAudio tone 提供操作反馈，但不污染原始音乐文件。
    if (this.soundVolume <= 0) return;
    void this.ensureSynth().then((synth) => {
      const ctx = synth.getAudioContext?.();
      if (!ctx) return;
      void ctx.resume().catch(() => undefined);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = id === 'dragon-fire' ? 'sawtooth' : 'sine';
      osc.frequency.value = id === 'coin' ? 880 : id === 'carrot' ? 660 : 180;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, 0.08 * this.soundVolume), ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
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

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('bobby.musicEnabled', String(enabled));
    if (!enabled) this.synth?.stopMIDI();
    else if (this.currentMusic) this.playMusic(this.currentMusic);
  }

  isEnabled(): boolean { return this.enabled; }
  getMusicVolume(): number { return this.musicVolume; }
  getSoundVolume(): number { return this.soundVolume; }

  /** 浏览器自动播放策略需要用户手势；任何点击/按键时调用即可。 */
  resume(): void {
    void this.ensureSynth().then(async (synth) => {
      await synth.getAudioContext?.().resume().catch(() => undefined);
      if (this.enabled && this.currentMusic) this.playMusic(this.currentMusic);
    }).catch(() => undefined);
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
      const synth = new Constructor({ quality: 1, useReverb: 1, voices: 48, internalcontext: 1 });
      synth.setMasterVol(this.musicVolume);
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
  // 正常 npm build 会把依赖复制到 /vendor；若当前构建环境没有安装可选运行库，
  // 再回退到固定版本 CDN，游戏本体仍不受影响。
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
