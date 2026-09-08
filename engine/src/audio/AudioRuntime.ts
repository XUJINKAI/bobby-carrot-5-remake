import type { AudioBackend, MusicStyle } from "./AudioBackend.js";

export interface AudioRuntimeOptions {
  baseUrl?: string | URL;
  musicStyle?: MusicStyle;
  musicEnabled?: boolean;
  musicGain?: number;
  soundGain?: number;
  crossfadeMs?: number;
}

export type MusicInteractionRequiredListener = (required: boolean) => void;

interface PlayingMusic {
  id: string;
  loop: boolean;
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  sourceGain: GainNode | null;
  startedAt: number;
  offset: number;
}

const LOOPING_TRACKS = new Set([
  "title",
  "bonus",
  "mow",
  "fly",
  "shop",
  "sandman",
  "train",
  "universe",
]);

/** Engine-owned browser audio runtime for original OGG music and lightweight SFX. */
export class AudioRuntime implements AudioBackend {
  private readonly baseUrl: URL;
  private readonly crossfadeSeconds: number;
  private readonly buffers = new Map<string, Promise<AudioBuffer>>();
  private readonly musicInteractionListeners =
    new Set<MusicInteractionRequiredListener>();
  private context: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private soundGainNode: GainNode | null = null;
  private musicStyle: MusicStyle;
  private musicEnabled: boolean;
  private musicGain: number;
  private soundGain: number;
  private currentMusic: PlayingMusic | null = null;
  private requestSerial = 0;
  private destroyed = false;
  private musicInteractionRequired = false;

  constructor(options: AudioRuntimeOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? defaultAudioBaseUrl());
    this.musicStyle = options.musicStyle ?? "8bit";
    this.musicEnabled = options.musicEnabled ?? true;
    this.musicGain = normalizeGain(options.musicGain ?? 0.42);
    this.soundGain = normalizeGain(options.soundGain ?? 0.45);
    this.crossfadeSeconds = Math.max(0, options.crossfadeMs ?? 40) / 1000;
  }

  playMusic(id: string): void {
    if (this.destroyed || !id) return;
    if (this.currentMusic?.id === id) {
      if (this.musicEnabled && !this.currentMusic.source)
        void this.startCurrentMusic(false);
      return;
    }
    this.stopCurrentSource();
    this.currentMusic = {
      id,
      loop: shouldLoop(id),
      buffer: null,
      source: null,
      sourceGain: null,
      startedAt: 0,
      offset: 0,
    };
    if (this.musicEnabled) void this.startCurrentMusic(false);
    this.updateMusicInteractionRequired();
  }

  stopMusic(): void {
    this.requestSerial += 1;
    this.stopCurrentSource();
    this.currentMusic = null;
    this.updateMusicInteractionRequired();
  }

  playSound(id: string): void {
    if (this.destroyed || this.soundGain <= 0) return;
    void this.ensureContext()
      .then((context) => {
        if (this.destroyed || !this.soundGainNode) return;
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        oscillator.type = id === "dragon-fire" ? "triangle" : "sine";
        oscillator.frequency.value =
          id === "coin" ? 660 : id === "carrot" ? 520 : 150;
        envelope.gain.setValueAtTime(0.0001, context.currentTime);
        envelope.gain.exponentialRampToValueAtTime(
          0.045,
          context.currentTime + 0.012,
        );
        envelope.gain.exponentialRampToValueAtTime(
          0.0001,
          context.currentTime + 0.14,
        );
        oscillator.connect(envelope).connect(this.soundGainNode);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.15);
      })
      .catch(() => undefined);
  }

  setMusicStyle(style: MusicStyle): void {
    if (this.musicStyle === style) return;
    this.musicStyle = style;
    if (this.currentMusic && this.musicEnabled)
      void this.startCurrentMusic(true);
  }

  getMusicStyle(): MusicStyle {
    return this.musicStyle;
  }

  getMusicPosition(): number {
    return this.currentPosition();
  }

  setMusicEnabled(enabled: boolean): void {
    if (this.musicEnabled === enabled) return;
    this.musicEnabled = enabled;
    if (!enabled) {
      if (this.currentMusic) this.currentMusic.offset = this.currentPosition();
      this.requestSerial += 1;
      this.stopCurrentSource();
      this.updateMusicInteractionRequired();
      return;
    }
    if (this.currentMusic) void this.startCurrentMusic(false);
    this.updateMusicInteractionRequired();
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  isMusicInteractionRequired(): boolean {
    return this.musicInteractionRequired;
  }

  onMusicInteractionRequiredChange(
    listener: MusicInteractionRequiredListener,
  ): () => void {
    this.musicInteractionListeners.add(listener);
    return () => this.musicInteractionListeners.delete(listener);
  }

  setMusicGain(gain: number): void {
    this.musicGain = normalizeGain(gain);
    if (this.musicGainNode) this.musicGainNode.gain.value = this.musicGain;
  }

  getMusicGain(): number {
    return this.musicGain;
  }

  setSoundGain(gain: number): void {
    this.soundGain = normalizeGain(gain);
    if (this.soundGainNode) this.soundGainNode.gain.value = this.soundGain;
  }

  getSoundGain(): number {
    return this.soundGain;
  }

  resume(): void {
    if (this.destroyed) return;
    void this.ensureContext()
      .then(async (context) => {
        await context.resume();
        this.updateMusicInteractionRequired();
      })
      .catch(() => undefined);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopMusic();
    this.buffers.clear();
    const context = this.context;
    this.context = null;
    this.musicGainNode = null;
    this.soundGainNode = null;
    this.musicInteractionListeners.clear();
    if (context) void context.close().catch(() => undefined);
  }

  private async startCurrentMusic(crossfade: boolean): Promise<void> {
    const state = this.currentMusic;
    if (!state || !this.musicEnabled || this.destroyed) return;
    const serial = ++this.requestSerial;
    try {
      const context = await this.ensureContext();
      const buffer = await this.loadBuffer(state.id, this.musicStyle);
      if (
        serial !== this.requestSerial ||
        state !== this.currentMusic ||
        !this.musicEnabled ||
        this.destroyed
      )
        return;
      const position = this.currentPosition();
      this.replaceSource(context, state, buffer, position, crossfade);
      const counterpart: MusicStyle =
        this.musicStyle === "modern" ? "8bit" : "modern";
      void this.loadBuffer(state.id, counterpart).catch(() => undefined);
    } catch (error) {
      console.warn(`OGG 音乐加载失败：${state.id}`, error);
    }
  }

  private replaceSource(
    context: AudioContext,
    state: PlayingMusic,
    buffer: AudioBuffer,
    position: number,
    crossfade: boolean,
  ): void {
    const previousSource = state.source;
    const previousGain = state.sourceGain;
    const source = context.createBufferSource();
    const sourceGain = context.createGain();
    const fade = crossfade ? this.crossfadeSeconds : 0;
    const now = context.currentTime;
    const offset = normalizeOffset(position, buffer.duration, state.loop);
    source.buffer = buffer;
    source.loop = state.loop;
    source.connect(sourceGain).connect(this.requireMusicGainNode());
    sourceGain.gain.setValueAtTime(fade > 0 ? 0 : 1, now);
    if (fade > 0)
      sourceGain.gain.linearRampToValueAtTime(1, now + fade);
    source.start(now, offset);

    state.buffer = buffer;
    state.source = source;
    state.sourceGain = sourceGain;
    state.startedAt = now;
    state.offset = offset;
    source.onended = () => {
      if (state.source !== source) return;
      state.source = null;
      state.sourceGain = null;
      if (!state.loop) state.offset = buffer.duration;
    };

    if (previousSource) {
      if (fade > 0 && previousGain) {
        previousGain.gain.cancelScheduledValues(now);
        previousGain.gain.setValueAtTime(previousGain.gain.value, now);
        previousGain.gain.linearRampToValueAtTime(0, now + fade);
        previousSource.stop(now + fade);
      } else {
        previousSource.stop();
      }
    }
  }

  private currentPosition(): number {
    const state = this.currentMusic;
    if (!state) return 0;
    let position = state.offset;
    if (state.source && this.context)
      position += Math.max(0, this.context.currentTime - state.startedAt);
    if (!state.buffer) return position;
    return normalizeOffset(position, state.buffer.duration, state.loop);
  }

  private stopCurrentSource(): void {
    const state = this.currentMusic;
    if (!state?.source) return;
    state.source.onended = null;
    try {
      state.source.stop();
    } catch {
      // A source can only be stopped once.
    }
    state.source.disconnect();
    state.sourceGain?.disconnect();
    state.source = null;
    state.sourceGain = null;
  }

  private loadBuffer(id: string, style: MusicStyle): Promise<AudioBuffer> {
    const key = `${style}:${id}`;
    const cached = this.buffers.get(key);
    if (cached) return cached;
    const promise = this.ensureContext().then(async (context) => {
      const response = await fetch(
        resolveOriginalMusicUrl(this.baseUrl, style, id),
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return context.decodeAudioData(await response.arrayBuffer());
    });
    this.buffers.set(key, promise);
    promise.catch(() => this.buffers.delete(key));
    return promise;
  }

  private ensureContext(): Promise<AudioContext> {
    if (this.context) return Promise.resolve(this.context);
    const Constructor = globalThis.AudioContext;
    if (!Constructor)
      return Promise.reject(new Error("Web Audio API unavailable"));
    const context = new Constructor();
    const musicGain = context.createGain();
    const soundGain = context.createGain();
    musicGain.gain.value = this.musicGain;
    soundGain.gain.value = this.soundGain;
    musicGain.connect(context.destination);
    soundGain.connect(context.destination);
    this.context = context;
    this.musicGainNode = musicGain;
    this.soundGainNode = soundGain;
    context.addEventListener("statechange", this.onContextStateChange);
    this.updateMusicInteractionRequired();
    return Promise.resolve(context);
  }

  private readonly onContextStateChange = (): void => {
    this.updateMusicInteractionRequired();
  };

  private updateMusicInteractionRequired(): void {
    const required = Boolean(
      !this.destroyed &&
      this.musicEnabled &&
      this.currentMusic &&
      this.context?.state === "suspended",
    );
    if (required === this.musicInteractionRequired) return;
    this.musicInteractionRequired = required;
    for (const listener of this.musicInteractionListeners) listener(required);
  }

  private requireMusicGainNode(): GainNode {
    if (!this.musicGainNode) throw new Error("Audio runtime not initialized");
    return this.musicGainNode;
  }
}

export function resolveOriginalMusicUrl(
  baseUrl: string | URL,
  style: MusicStyle,
  id: string,
): string {
  return new URL(
    `${style}/${encodeURIComponent(id)}.ogg`,
    normalizeBaseUrl(baseUrl),
  ).href;
}

function shouldLoop(id: string): boolean {
  return id.startsWith("ingame") || LOOPING_TRACKS.has(id);
}

function normalizeGain(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, value);
}

function normalizeOffset(
  position: number,
  duration: number,
  loop: boolean,
): number {
  if (!Number.isFinite(position) || position <= 0 || duration <= 0) return 0;
  if (loop) return position % duration;
  return Math.min(position, Math.max(0, duration - 0.001));
}

function normalizeBaseUrl(value: string | URL): URL {
  const url =
    value instanceof URL
      ? new URL(value.href)
      : new URL(value, documentBaseUrl());
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

function defaultAudioBaseUrl(): URL {
  return new URL("assets/audio/original/", documentBaseUrl());
}

function documentBaseUrl(): string {
  if (typeof document !== "undefined") return document.baseURI;
  return "http://localhost/";
}
