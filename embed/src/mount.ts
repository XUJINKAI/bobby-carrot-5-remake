import {
  createGameplayRuntime,
  ImageManager,
  type CameraOptions,
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
const homePageUrl = "https://bc5r.xujinkai.net/";
const jerseyFontUrl = new URL(
  "../../assets/ui/fonts/jersey-10/Jersey10-Regular.woff2",
  import.meta.url,
).href;

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

interface FrameControls {
  root: HTMLDivElement;
  restart: HTMLButtonElement;
  open: HTMLAnchorElement;
  sound: HTMLButtonElement;
}

interface InfoFooter {
  root: HTMLDivElement;
  joystick: HTMLButtonElement;
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
  const frame = document.createElement("div");
  frame.className = "bc5r-frame";
  const frameLink = document.createElement("a");
  frameLink.className = "bc5r-home-link";
  frameLink.href = homePageUrl;
  frameLink.target = "_blank";
  frameLink.rel = "noopener noreferrer";
  frameLink.textContent = "Bobby Carrot 5 Remake";
  const frameControls = createFrameControls(audio.enabled, options.lang);
  frame.append(frameLink, frameControls.root);
  const canvasWrap = document.createElement("div");
  canvasWrap.className = "bc5r-canvas-wrap";
  canvasWrap.tabIndex = 0;
  const canvas = document.createElement("canvas");
  canvas.className = "bc5r-canvas";
  const terminal = createTerminalOverlay(options.lang ?? "zh-CN");
  canvasWrap.append(canvas, terminal.root);
  const info = createInfoFooter(options.info, options.lang);
  root.append(styleElement(), frame, canvasWrap, info.root);
  shadow.append(root);

  const keyboard = options.input?.keyboard ?? "focus";
  const joystick = resolveJoystick(options.input?.joystick ?? "auto");
  const pointer = options.input?.pointer ?? true;
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
    const camera = resolveCameraOptions(options);
    const playUrl = await officialPlayUrl(level);
    frameControls.open.href = playUrl;
    frameControls.open.removeAttribute("aria-disabled");
    frameControls.open.tabIndex = 0;
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
          camera,
          hud: true,
          input: {
            keyboard: true,
            pointer,
            movement: true,
            pan: true,
            zoom: true,
            pinchZoom,
            wheelZoom,
            debug: false,
            screenJoystick: { enabled: joystick },
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
    installRestartButton(runtime, frameControls.restart, canvasWrap, cleanup);
    installSoundToggle(
      runtime,
      frameControls.sound,
      audio.enabled,
      audioLevels,
      options.lang,
      cleanup,
    );
    installJoystickToggle(
      runtime,
      info.joystick,
      joystick,
      options.lang,
      cleanup,
    );
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

function createFrameControls(
  soundEnabled: boolean,
  lang: string | undefined,
): FrameControls {
  const copy = controlCopy(lang);
  const root = document.createElement("div");
  root.className = "bc5r-frame-actions";
  const restart = createIconButton("restart", copy.restart);
  restart.disabled = true;
  const open = document.createElement("a");
  open.className = "bc5r-icon-button";
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  open.title = copy.open;
  open.setAttribute("aria-label", copy.open);
  open.setAttribute("aria-disabled", "true");
  open.tabIndex = -1;
  open.append(createIcon("open"));
  const sound = createSoundButton(soundEnabled, lang);
  root.append(restart, open, sound);
  return { root, restart, open, sound };
}

function createIconButton(
  icon: "restart" | "joystick",
  label: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bc5r-icon-button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.append(createIcon(icon));
  return button;
}

function createIcon(name: "restart" | "open" | "joystick"): SVGSVGElement {
  const paths = {
    restart: "M20 7v5h-5 M20 12a8 8 0 1 0-2.34 5.66",
    open: "M14 5h5v5 M19 5l-9 9 M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5",
    joystick: "M12 4a2 2 0 1 0 0 4a2 2 0 0 0 0-4 M12 8v6 M8 14h8l2 5H6l2-5",
  } as const;
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.classList.add("bc5r-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(namespace, "path");
  path.setAttribute("d", paths[name]);
  svg.append(path);
  return svg;
}

function createSoundButton(
  enabled: boolean,
  lang: string | undefined,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bc5r-icon-button bc5r-sound";
  button.disabled = true;
  renderSoundButton(button, enabled, lang);
  return button;
}

function renderSoundButton(
  button: HTMLButtonElement,
  enabled: boolean,
  lang: string | undefined,
): void {
  const copy = controlCopy(lang);
  button.textContent = enabled ? "🔊" : "🔇";
  button.title = enabled ? copy.mute : copy.unmute;
  button.setAttribute("aria-label", button.title);
  button.setAttribute("aria-pressed", String(enabled));
}

function createInfoFooter(
  value: string | undefined,
  lang: string | undefined,
): InfoFooter {
  const root = document.createElement("div");
  root.className = "bc5r-info";
  const copy = document.createElement("span");
  copy.className = "bc5r-info-copy";
  const custom = value?.trim();
  copy.textContent = custom || controlCopy(lang).movementHint;
  const joystick = createIconButton("joystick", controlCopy(lang).joystick);
  joystick.disabled = true;
  root.append(copy, joystick);
  return { root, joystick };
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

function installRestartButton(
  runtime: GameplayRuntime,
  button: HTMLButtonElement,
  focusTarget: HTMLElement,
  cleanup: Array<() => void>,
): void {
  const restart = (): void => {
    runtime.game.restart();
    focusTarget.focus({ preventScroll: true });
  };
  button.disabled = false;
  button.addEventListener("click", restart);
  cleanup.push(() => button.removeEventListener("click", restart));
}

function installSoundToggle(
  runtime: GameplayRuntime,
  button: HTMLButtonElement,
  initialEnabled: boolean,
  levels: AudioLevels,
  lang: string | undefined,
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
    renderSoundButton(button, enabled, lang);
  };
  button.disabled = false;
  renderSoundButton(button, enabled, lang);
  button.addEventListener("click", toggle);
  cleanup.push(() => button.removeEventListener("click", toggle));
}

function installJoystickToggle(
  runtime: GameplayRuntime,
  button: HTMLButtonElement,
  initialEnabled: boolean,
  lang: string | undefined,
  cleanup: Array<() => void>,
): void {
  let enabled = initialEnabled;
  const render = (): void => {
    const copy = controlCopy(lang);
    button.disabled = false;
    button.title = copy.joystick;
    button.setAttribute("aria-label", copy.joystick);
    button.setAttribute("aria-pressed", String(enabled));
    button.classList.toggle("active", enabled);
  };
  const toggle = (): void => {
    enabled = !enabled;
    runtime.input.setScreenJoystickEnabled(enabled);
    render();
  };
  render();
  button.addEventListener("click", toggle);
  cleanup.push(() => button.removeEventListener("click", toggle));
}

function resolveCameraOptions(options: BC5RMountOptions): CameraOptions {
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
  return { zoom, minZoom: min, maxZoom: max };
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

function controlCopy(lang: string | undefined): {
  restart: string;
  open: string;
  mute: string;
  unmute: string;
  joystick: string;
  movementHint: string;
} {
  const value = lang && lang !== "auto" ? lang : navigator.language;
  return value.toLowerCase().startsWith("zh")
    ? {
        restart: "重新开始",
        open: "在新窗口打开",
        mute: "关闭声音",
        unmute: "打开声音",
        joystick: "切换屏幕摇杆",
        movementHint: "WASD / 方向键移动",
      }
    : {
        restart: "Restart",
        open: "Open in new window",
        mute: "Mute",
        unmute: "Unmute",
        joystick: "Toggle screen joystick",
        movementHint: "Move with WASD / arrow keys",
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
      "bobby-transition": embedArtUrl("b6.png"),
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
    @font-face { font-family: "Jersey 10"; src: url(${JSON.stringify(jerseyFontUrl)}) format("woff2"); font-style: normal; font-weight: 400; font-display: swap; }
    :host { display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; }
    .bc5r-embed { box-sizing: border-box; width: 100%; height: 100%; min-width: 0; min-height: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #254868; border-radius: 10px; font: 14px/1.4 system-ui, sans-serif; color: #eef5ff; background: #071522; box-shadow: 0 8px 24px rgba(0,0,0,.22); }
    .bc5r-frame { flex: 0 0 auto; padding: 7px 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid #254868; background: #0d2b46; font-size: 12px; font-weight: 700; letter-spacing: .02em; }
    .bc5r-home-link { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #d8efff; text-decoration: none; }
    .bc5r-home-link:hover { text-decoration: underline; }
    .bc5r-frame-actions { flex: 0 0 auto; display: flex; align-items: center; gap: 4px; }
    .bc5r-icon-button { box-sizing: border-box; width: 26px; height: 26px; padding: 4px; display: grid; place-items: center; border: 0; border-radius: 5px; background: transparent; color: inherit; cursor: pointer; font: inherit; line-height: 1; text-decoration: none; }
    .bc5r-icon-button:hover, .bc5r-icon-button.active { background: rgba(255,255,255,.14); }
    .bc5r-icon-button:disabled, .bc5r-icon-button[aria-disabled="true"] { cursor: default; opacity: .55; }
    .bc5r-icon { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .bc5r-sound { font-size: 16px; }
    .bc5r-canvas-wrap { position: relative; flex: 1 1 auto; min-width: 0; min-height: 0; overflow: hidden; outline: none; }
    .bc5r-canvas { display: block; width: 100%; height: 100%; touch-action: none; }
    .bc5r-info { flex: 0 0 auto; min-width: 0; min-height: 32px; padding: 3px 6px 3px 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #c9e6f7; background: #0d2b46; border-top: 1px solid #254868; font-size: 12px; }
    .bc5r-info-copy { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bc5r-terminal { position: absolute; inset: 0; z-index: 10; display: grid; place-items: center; background: rgba(0,0,0,.36); }
    .bc5r-terminal[hidden] { display: none; }
    .bc5r-terminal-card { min-width: 150px; padding: 18px; display: grid; gap: 12px; text-align: center; border-radius: 12px; background: rgba(255,255,255,.95); color: #222; box-shadow: 0 8px 30px rgba(0,0,0,.28); }
    .bc5r-terminal-card strong { font-size: 20px; }
    .bc5r-terminal-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    .bc5r-terminal-actions button, .bc5r-terminal-actions a { border: 0; border-radius: 8px; padding: 8px 12px; cursor: pointer; font: inherit; text-decoration: none; background: #222; color: #fff; }
    .bc5r-terminal-actions a { background: #fff; color: #222; box-shadow: inset 0 0 0 1px rgba(0,0,0,.2); }
    .engine-gameplay-hud { --engine-gameplay-hud-value-font-size: 36px; font-family: "Jersey 10", fantasy; font-weight: 400; -webkit-text-stroke: 1px #000; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; }
    .engine-gameplay-hud-value { font-weight: 400; }
  `;
  return style;
}
