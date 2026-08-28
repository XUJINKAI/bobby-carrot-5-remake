import {
  createGameplayRuntime,
  ImageManager,
  type GameplayRuntime,
} from "@bobby/engine";
import type { LevelMap } from "@bobby/model";
import { loadEmbedMap } from "./mapInput.js";
import type { BC5RHandle, BC5RMountOptions } from "./types.js";

const publicBaseUrl =
  typeof document === "undefined"
    ? new URL("http://localhost/")
    : document.currentScript instanceof HTMLScriptElement && document.currentScript.src
      ? new URL("../../", document.currentScript.src)
      : new URL(".", document.baseURI);
const repositoryUrl = "https://github.com/XUJINKAI/bobby-carrot-5-remake";

interface ActiveFocusEmbed {
  token: symbol;
  deactivate(): void;
}

interface TerminalOverlay {
  root: HTMLDivElement;
  title: HTMLElement;
  restart: HTMLButtonElement;
  official: HTMLAnchorElement;
}

interface AudioLevels {
  musicGain: number;
  soundGain: number;
}

let activeFocusEmbed: ActiveFocusEmbed | null = null;

export function mount(options: BC5RMountOptions): BC5RHandle {
  const target = resolveTarget(options.target);
  const token = Symbol("bc5r-embed");
  let runtime: GameplayRuntime | null = null;
  let images: ImageManager | null = null;
  let destroyed = false;
  const cleanup: Array<() => void> = [];
  const audio = resolveAudio(options.audio);

  const shadow = target.shadowRoot ?? target.attachShadow({ mode: "open" });
  shadow.replaceChildren();
  const root = document.createElement("div");
  root.className = "bc5r-embed";
  root.dataset.lang = options.lang ?? "zh-CN";
  root.dataset.theme = options.theme ?? "retro";
  const frame = document.createElement("div");
  frame.className = "bc5r-frame";
  const frameLink = document.createElement("a");
  frameLink.href = publicBaseUrl.href;
  frameLink.target = "_blank";
  frameLink.rel = "noopener noreferrer";
  frameLink.textContent = "Bobby Carrot 5 Remake";
  const soundButton = createSoundButton(audio.enabled);
  frame.append(frameLink, soundButton);
  const canvasWrap = document.createElement("div");
  canvasWrap.className = "bc5r-canvas-wrap";
  canvasWrap.tabIndex = 0;
  const canvas = document.createElement("canvas");
  canvas.className = "bc5r-canvas";
  const terminal = createTerminalOverlay(options.lang ?? "zh-CN");
  canvasWrap.append(canvas, terminal.root);
  const info = createInfoFooter(options.info);
  root.append(styleElement(), frame, canvasWrap, info);
  shadow.append(root);

  const keyboard = options.input?.keyboard ?? "focus";
  const joystick = resolveJoystick(options.input?.joystick ?? "auto");
  const pinchZoom = options.camera?.pinchZoom ?? true;
  const wheelZoom = options.camera?.wheelZoom ?? false;

  const suspendFocusInput = (): void => runtime?.input.setKeyboardEnabled(false);
  const activate = (): void => {
    if (keyboard !== "focus") return;
    if (activeFocusEmbed?.token !== token) activeFocusEmbed?.deactivate();
    activeFocusEmbed = { token, deactivate: suspendFocusInput };
    runtime?.input.setKeyboardEnabled(true);
    canvasWrap.focus({ preventScroll: true });
  };
  const deactivate = (event: FocusEvent): void => {
    if (keyboard !== "focus" || activeFocusEmbed?.token !== token) return;
    const next = event.relatedTarget;
    if (next instanceof Node && root.contains(next)) return;
    activeFocusEmbed = null;
    suspendFocusInput();
  };
  root.addEventListener("pointerdown", activate, { capture: true });
  root.addEventListener("focusin", activate);
  root.addEventListener("focusout", deactivate);
  cleanup.push(() =>
    root.removeEventListener("pointerdown", activate, { capture: true }),
  );
  cleanup.push(() => root.removeEventListener("focusin", activate));
  cleanup.push(() => root.removeEventListener("focusout", deactivate));

  const ready = (async (): Promise<void> => {
    const level = await loadEmbedMap({ map: options.map, mapUrl: options.mapUrl });
    if (destroyed) return;
    const playUrl = await officialPlayUrl(level);
    frameLink.href = playUrl;
    terminal.official.href = playUrl;
    const imageManager = createEmbedImageManager();
    images = imageManager;
    try {
      runtime = await createGameplayRuntime({
        level,
        canvas,
        images: imageManager,
        audioOptions: {
          baseUrl: new URL("assets/audio/original/", publicBaseUrl),
          musicEnabled: audio.enabled,
          musicStyle: options.musicStyle ?? "modern",
        },
        runtime: {
          hud: true,
          input: {
            keyboard: keyboard !== false,
            pointer: true,
            movement: true,
            pan: true,
            zoom: false,
            debug: false,
            screenJoystick: joystick,
          },
        },
      });
    } catch (error) {
      if (images === imageManager) images = null;
      imageManager.destroy();
      throw error;
    }
    if (destroyed) {
      runtime.destroy();
      runtime = null;
      if (images === imageManager) images = null;
      imageManager.destroy();
      return;
    }
    if (keyboard === "focus" && activeFocusEmbed?.token !== token)
      runtime.input.setKeyboardEnabled(false);
    const audioLevels = applyAudio(runtime, audio);
    runtime.audio.playMusic("ingame1");
    installSoundToggle(runtime, soundButton, audio.enabled, audioLevels, cleanup);
    applyCamera(runtime, options);
    installZoomPolicy(runtime, canvas, pinchZoom, wheelZoom, cleanup);
    installTerminalOverlay(runtime, terminal, canvasWrap, cleanup);
    const resumeAudio = (): void => runtime?.audio.resume();
    root.addEventListener("pointerdown", resumeAudio, { passive: true });
    cleanup.push(() => root.removeEventListener("pointerdown", resumeAudio));
  })();

  return {
    ready,
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      if (activeFocusEmbed?.token === token) activeFocusEmbed = null;
      for (const dispose of cleanup.splice(0)) dispose();
      if (runtime) {
        runtime.destroy();
        runtime = null;
        images?.destroy();
        images = null;
      }
      shadow.replaceChildren();
    },
  };
}

function resolveTarget(target: string | HTMLElement): HTMLElement {
  if (target instanceof HTMLElement) return target;
  const element = document.querySelector<HTMLElement>(target);
  if (!element) throw new Error(`BC5R target not found: ${target}`);
  return element;
}

function createSoundButton(enabled: boolean): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bc5r-sound";
  button.disabled = true;
  renderSoundButton(button, enabled);
  return button;
}

function renderSoundButton(button: HTMLButtonElement, enabled: boolean): void {
  button.textContent = enabled ? "🔊" : "🔇";
  button.title = enabled ? "关闭声音" : "打开声音";
  button.setAttribute("aria-label", button.title);
  button.setAttribute("aria-pressed", String(enabled));
}

function createInfoFooter(value: string | undefined): HTMLDivElement {
  const footer = document.createElement("div");
  footer.className = "bc5r-info";
  const custom = value?.trim();
  if (custom) {
    footer.textContent = custom;
    return footer;
  }
  const link = document.createElement("a");
  link.href = repositoryUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Powered by xujinkai/bobby-carrot-5-remake";
  footer.append(link);
  return footer;
}

function resolveJoystick(value: boolean | "auto"): boolean {
  if (value !== "auto") return value;
  return (
    typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches
  );
}

interface ResolvedAudio {
  enabled: boolean;
  multiplier: number | null;
}

function resolveAudio(value: boolean | number | undefined): ResolvedAudio {
  if (value === false) return { enabled: false, multiplier: null };
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0)
      throw new Error("BC5R audio volume must be a non-negative number");
    return { enabled: value > 0, multiplier: value };
  }
  return { enabled: true, multiplier: null };
}

function applyAudio(runtime: GameplayRuntime, audio: ResolvedAudio): AudioLevels {
  const multiplier = audio.multiplier ?? 1;
  const levels = {
    musicGain: runtime.audio.getMusicGain() * multiplier,
    soundGain: runtime.audio.getSoundGain() * multiplier,
  };
  runtime.audio.setMusicGain(audio.enabled ? levels.musicGain : 0);
  runtime.audio.setSoundGain(audio.enabled ? levels.soundGain : 0);
  runtime.audio.setMusicEnabled(audio.enabled);
  return levels;
}

function installSoundToggle(
  runtime: GameplayRuntime,
  button: HTMLButtonElement,
  initialEnabled: boolean,
  levels: AudioLevels,
  cleanup: Array<() => void>,
): void {
  let enabled = initialEnabled;
  const toggle = (): void => {
    enabled = !enabled;
    if (enabled) {
      runtime.audio.setMusicGain(levels.musicGain);
      runtime.audio.setSoundGain(levels.soundGain);
      runtime.audio.setMusicEnabled(true);
      runtime.audio.resume();
    } else {
      runtime.audio.setMusicEnabled(false);
      runtime.audio.setMusicGain(0);
      runtime.audio.setSoundGain(0);
    }
    renderSoundButton(button, enabled);
  };
  button.disabled = false;
  renderSoundButton(button, enabled);
  button.addEventListener("click", toggle);
  cleanup.push(() => button.removeEventListener("click", toggle));
}

function applyCamera(runtime: GameplayRuntime, options: BC5RMountOptions): void {
  const min = options.camera?.minZoom ?? 0.5;
  const max = options.camera?.maxZoom ?? 3;
  const zoom = options.camera?.zoom ?? 1;
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min <= 0 ||
    max < min
  )
    throw new Error("BC5R camera zoom limits are invalid");
  if (!Number.isFinite(zoom) || zoom <= 0)
    throw new Error("BC5R camera zoom must be a positive number");
  runtime.game.setZoomLimits(min, max);
  runtime.game.setZoom(zoom);
}

function createTerminalOverlay(lang: string | undefined): TerminalOverlay {
  const copy = terminalCopy(lang);
  const root = document.createElement("div");
  root.className = "bc5r-terminal";
  root.hidden = true;
  root.setAttribute("aria-live", "polite");
  const card = document.createElement("div");
  card.className = "bc5r-terminal-card";
  const title = document.createElement("strong");
  const actions = document.createElement("div");
  actions.className = "bc5r-terminal-actions";
  const restart = document.createElement("button");
  restart.type = "button";
  restart.textContent = copy.restart;
  actions.append(restart);
  const official = document.createElement("a");
  official.href = publicBaseUrl.href;
  official.target = "_blank";
  official.rel = "noopener noreferrer";
  official.textContent = copy.official;
  actions.append(official);
  card.append(title, actions);
  root.append(card);
  return { root, title, restart, official };
}

function installTerminalOverlay(
  runtime: GameplayRuntime,
  terminal: TerminalOverlay,
  focusTarget: HTMLElement,
  cleanup: Array<() => void>,
): void {
  const copy = terminalCopy(
    focusTarget.closest<HTMLElement>(".bc5r-embed")?.dataset.lang,
  );
  const render = (): void => {
    const status = runtime.game.state.status;
    terminal.root.hidden = status === "playing";
    if (status !== "playing")
      terminal.title.textContent = status === "won" ? copy.won : copy.dead;
  };
  const restart = (): void => {
    runtime.game.restart();
    focusTarget.focus({ preventScroll: true });
  };
  terminal.restart.addEventListener("click", restart);
  cleanup.push(() => terminal.restart.removeEventListener("click", restart));
  cleanup.push(runtime.game.on("change", render));
  render();
}

function terminalCopy(lang: string | undefined): {
  won: string;
  dead: string;
  restart: string;
  official: string;
} {
  const value = lang && lang !== "auto" ? lang : navigator.language;
  const chinese = value.toLowerCase().startsWith("zh");
  return chinese
    ? {
        won: "通关",
        dead: "失败",
        restart: "重新开始",
        official: "前往官网",
      }
    : {
        won: "Level complete",
        dead: "Game over",
        restart: "Restart",
        official: "Visit BC5R",
      };
}

async function officialPlayUrl(level: LevelMap): Promise<string> {
  const stream = new Blob([JSON.stringify(level)])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const payload = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const url = new URL("import/v1", publicBaseUrl);
  url.hash = payload;
  return url.href;
}

interface ZoomPointer {
  x: number;
  y: number;
}

function installZoomPolicy(
  runtime: GameplayRuntime,
  canvas: HTMLCanvasElement,
  pinchZoom: boolean,
  wheelZoom: boolean,
  cleanup: Array<() => void>,
): void {
  const pointers = new Map<number, ZoomPointer>();
  let pinchStartDistance = 0;
  let pinchStartZoom = 1;

  const distance = (): number => {
    const values = [...pointers.values()];
    const a = values[0];
    const b = values[1];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (!pinchZoom) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      pinchStartDistance = distance();
      pinchStartZoom = runtime.game.zoom;
    }
  };
  const onPointerMove = (event: PointerEvent): void => {
    if (!pinchZoom) return;
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (pointers.size !== 2 || pinchStartDistance <= 0) return;
    runtime.game.setZoom(pinchStartZoom * (distance() / pinchStartDistance));
  };
  const onPointerUp = (event: PointerEvent): void => {
    if (!pinchZoom) return;
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchStartDistance = 0;
  };

  if (pinchZoom) {
    canvas.addEventListener("pointerdown", onPointerDown, { capture: true });
    canvas.addEventListener("pointermove", onPointerMove, { capture: true });
    canvas.addEventListener("pointerup", onPointerUp, { capture: true });
    canvas.addEventListener("pointercancel", onPointerUp, { capture: true });
    cleanup.push(() =>
      canvas.removeEventListener("pointerdown", onPointerDown, { capture: true }),
    );
    cleanup.push(() =>
      canvas.removeEventListener("pointermove", onPointerMove, { capture: true }),
    );
    cleanup.push(() =>
      canvas.removeEventListener("pointerup", onPointerUp, { capture: true }),
    );
    cleanup.push(() =>
      canvas.removeEventListener("pointercancel", onPointerUp, { capture: true }),
    );
  }

  if (wheelZoom) {
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      runtime.game.zoomBy(event.deltaY < 0 ? 1.08 : 1 / 1.08);
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    cleanup.push(() => canvas.removeEventListener("wheel", onWheel));
  }
}

function embedArtUrl(path: string): string {
  return new URL(`assets/art/hd/${path}`, publicBaseUrl).href;
}

function createEmbedImageManager(): ImageManager {
  return new ImageManager({
    atlas: "entity-atlas",
    sourceTileSize: 48,
    sources: {
      "entity-atlas": embedArtUrl("ts.png"),
      "original-animated-tiles": embedArtUrl("ta.png"),
      "bobby-left": embedArtUrl("b0.png"),
      "bobby-right": embedArtUrl("b1.png"),
      "bobby-up": embedArtUrl("b2.png"),
      "bobby-down": embedArtUrl("b3.png"),
      "bobby-idle": embedArtUrl("b4.png"),
      "bobby-death": embedArtUrl("b5.png"),
      "bobby-mower": embedArtUrl("b7.png"),
      "bobby-kite": embedArtUrl("b9.png"),
      "hud-atlas": embedArtUrl("hud.png"),
      "golden-carrot": embedArtUrl("icon.png"),
    },
    slices: {
      "hud-carrot": { source: "hud-atlas", x: 42, y: 0, width: 39, height: 38 },
      "hud-gas": { source: "hud-atlas", x: 83, y: 0, width: 37, height: 38 },
      "hud-key": { source: "hud-atlas", x: 122, y: 0, width: 20, height: 38 },
      "hud-kite": { source: "hud-atlas", x: 144, y: 0, width: 35, height: 38 },
      "hud-shovel": { source: "hud-atlas", x: 179, y: 0, width: 37, height: 38 },
      "hud-egg": { source: "hud-atlas", x: 217, y: 0, width: 29, height: 38 },
      "hud-bean": { source: "hud-atlas", x: 247, y: 0, width: 35, height: 38 },
    },
  });
}

function styleElement(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = `
    :host { display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; }
    .bc5r-embed { box-sizing: border-box; width: 100%; height: 100%; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #254868; border-radius: 10px; font: 14px/1.4 system-ui, sans-serif; color: #eef5ff; background: #071522; box-shadow: 0 8px 24px rgba(0,0,0,.22); }
    .bc5r-frame { flex: 0 0 auto; padding: 7px 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid #254868; background: #0d2b46; font-size: 12px; font-weight: 700; letter-spacing: .02em; }
    .bc5r-frame a { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #d8efff; text-decoration: none; }
    .bc5r-frame a:hover { text-decoration: underline; }
    .bc5r-sound { flex: 0 0 auto; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; font: inherit; line-height: 1; }
    .bc5r-sound:disabled { cursor: default; opacity: .55; }
    .bc5r-canvas-wrap { position: relative; flex: 1 1 auto; min-width: 0; min-height: 0; overflow: hidden; outline: none; }
    .bc5r-canvas { display: block; width: 100%; height: 100%; touch-action: none; }
    .bc5r-info { flex: 0 0 auto; padding: 7px 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #c9e6f7; background: #0d2b46; border-top: 1px solid #254868; font-size: 12px; }
    .bc5r-info a { color: inherit; text-decoration: none; }
    .bc5r-info a:hover { text-decoration: underline; }
    .bc5r-terminal { position: absolute; inset: 0; z-index: 10; display: grid; place-items: center; background: rgba(0,0,0,.36); }
    .bc5r-terminal[hidden] { display: none; }
    .bc5r-terminal-card { min-width: 150px; padding: 18px; display: grid; gap: 12px; text-align: center; border-radius: 12px; background: rgba(255,255,255,.95); color: #222; box-shadow: 0 8px 30px rgba(0,0,0,.28); }
    .bc5r-terminal-card strong { font-size: 20px; }
    .bc5r-terminal-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    .bc5r-terminal-actions button, .bc5r-terminal-actions a { border: 0; border-radius: 8px; padding: 8px 12px; cursor: pointer; font: inherit; text-decoration: none; background: #222; color: #fff; }
    .bc5r-terminal-actions a { background: #fff; color: #222; box-shadow: inset 0 0 0 1px rgba(0,0,0,.2); }
  `;
  return style;
}
