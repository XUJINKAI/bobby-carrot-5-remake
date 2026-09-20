import {
  createOriginalGameplayImageManager,
  createGameplayRuntime,
  type CameraOptions,
  type GameplayRuntime,
  type ImageManager,
} from "@bobby/engine";
import { encodeExchangeText } from "@bobby/exchange";
import type { LevelMap } from "@bobby/model";
import {
  EMBED_RUNTIME_CATALOGS,
  normalizeLocale,
  type Locale,
} from "@bobby/i18n";
import { loadEmbedMap } from "./mapInput.js";
import {
  embedAssetUrl,
  embedPublicBaseUrl,
  loadEmbedJerseyFont,
} from "./runtimeAssets.js";
import { createEmbedStatus } from "./status.js";
import type { BC5RHandle, BC5RMountOptions } from "./types.js";

const homePageUrl = "https://bc5r.xujinkai.net/";

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
  const locale = resolveEmbedLocale(options.lang);
  const fontReady = loadEmbedJerseyFont();

  const shadow = target.shadowRoot ?? target.attachShadow({ mode: "open" });
  shadow.replaceChildren();
  const root = document.createElement("div");
  root.className = "bc5r-embed";
  root.dataset.lang = locale;
  const frame = document.createElement("div");
  frame.className = "bc5r-frame";
  const frameLink = document.createElement("a");
  frameLink.className = "bc5r-home-link";
  frameLink.href = homePageUrl;
  frameLink.target = "_blank";
  frameLink.rel = "noopener noreferrer";
  frameLink.textContent = "Bobby Carrot 5 Remake";
  const frameControls = createFrameControls(audio.enabled, locale);
  frame.append(frameLink, frameControls.root);
  const canvasWrap = document.createElement("div");
  canvasWrap.className = "bc5r-canvas-wrap";
  canvasWrap.tabIndex = 0;
  const canvas = document.createElement("canvas");
  canvas.className = "bc5r-canvas";
  const status = createEmbedStatus(locale);
  const terminal = createTerminalOverlay(locale);
  canvasWrap.append(canvas, status.root, terminal.root);
  const info = createInfoFooter(options.info, locale);
  root.append(styleElement(), frame, canvasWrap, info.root);
  shadow.append(root);

  const keyboard = options.input?.keyboard === "global" ? "global" : "focus";
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
    status.loading();
    try {
      const level = await loadEmbedMap({
        map: options.map,
        mapUrl: options.mapUrl,
      });
      await fontReady;
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
            baseUrl: embedAssetUrl("assets/audio/original/"),
            musicEnabled: audio.enabled,
            musicStyle: options.musicStyle ?? "modern",
          },
          runtime: {
            camera,
            hud: {
              timer: options.hud?.timer ?? false,
              steps: options.hud?.steps ?? false,
            },
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
        locale,
        cleanup,
      );
      installJoystickToggle(
        runtime,
        info.joystick,
        joystick,
        locale,
        cleanup,
      );
      installTerminalOverlay(runtime, terminal, canvasWrap, locale, cleanup);
      const resumeAudio = (): void => runtime?.audio.resume();
      root.addEventListener("pointerdown", resumeAudio, { passive: true });
      cleanup.push(() => root.removeEventListener("pointerdown", resumeAudio));
      status.hide();
    } catch (error) {
      if (!destroyed) status.error(error);
      throw error;
    }
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
  locale: Locale,
): FrameControls {
  const copy = controlCopy(locale);
  const root = document.createElement("div");
  root.className = "bc5r-frame-actions";
  const restart = createIconButton("restart", copy.restart);
  restart.dataset.action = "restart";
  restart.disabled = true;
  const open = document.createElement("a");
  open.className = "bc5r-icon-button";
  open.dataset.action = "open";
  open.target = "_blank";
  open.rel = "noopener noreferrer";
  open.title = copy.open;
  open.setAttribute("aria-label", copy.open);
  open.setAttribute("aria-disabled", "true");
  open.tabIndex = -1;
  open.append(createIcon("open"));
  const sound = createSoundButton(soundEnabled, locale);
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
  locale: Locale,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "bc5r-icon-button bc5r-sound";
  button.dataset.action = "sound";
  button.disabled = true;
  renderSoundButton(button, enabled, locale);
  return button;
}

function renderSoundButton(
  button: HTMLButtonElement,
  enabled: boolean,
  locale: Locale,
): void {
  const copy = controlCopy(locale);
  button.textContent = enabled ? "🔊" : "🔇";
  button.title = enabled ? copy.mute : copy.unmute;
  button.setAttribute("aria-label", button.title);
  button.setAttribute("aria-pressed", String(enabled));
}

function createInfoFooter(
  value: string | undefined,
  locale: Locale,
): InfoFooter {
  const root = document.createElement("div");
  root.className = "bc5r-info";
  const copy = document.createElement("span");
  copy.className = "bc5r-info-copy";
  const custom = value?.trim();
  copy.textContent = custom || controlCopy(locale).movementHint;
  const joystick = createIconButton("joystick", controlCopy(locale).joystick);
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
  locale: Locale,
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
    renderSoundButton(button, enabled, locale);
  };
  button.disabled = false;
  renderSoundButton(button, enabled, locale);
  button.addEventListener("click", toggle);
  cleanup.push(() => button.removeEventListener("click", toggle));
}

function installJoystickToggle(
  runtime: GameplayRuntime,
  button: HTMLButtonElement,
  initialEnabled: boolean,
  locale: Locale,
  cleanup: Array<() => void>,
): void {
  let enabled = initialEnabled;
  const render = (): void => {
    const copy = controlCopy(locale);
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

function createTerminalOverlay(locale: Locale): TerminalOverlay {
  const copy = terminalCopy(locale);
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
  official.href = embedPublicBaseUrl.href;
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
  locale: Locale,
  cleanup: Array<() => void>,
): void {
  const copy = terminalCopy(locale);
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

function terminalCopy(locale: Locale): {
  won: string;
  dead: string;
  restart: string;
  official: string;
} {
  return {
    won: embedRuntimeText(locale, "embedRuntime.won"),
    dead: embedRuntimeText(locale, "embedRuntime.dead"),
    restart: embedRuntimeText(locale, "embedRuntime.restart"),
    official: embedRuntimeText(locale, "embedRuntime.official"),
  };
}

function controlCopy(locale: Locale): {
  restart: string;
  open: string;
  mute: string;
  unmute: string;
  joystick: string;
  movementHint: string;
} {
  return {
    restart: embedRuntimeText(locale, "embedRuntime.restart"),
    open: embedRuntimeText(locale, "embedRuntime.open"),
    mute: embedRuntimeText(locale, "embedRuntime.mute"),
    unmute: embedRuntimeText(locale, "embedRuntime.unmute"),
    joystick: embedRuntimeText(locale, "embedRuntime.joystick"),
    movementHint: embedRuntimeText(locale, "embedRuntime.movementHint"),
  };
}

type EmbedRuntimeKey =
  | "embedRuntime.won"
  | "embedRuntime.dead"
  | "embedRuntime.restart"
  | "embedRuntime.official"
  | "embedRuntime.open"
  | "embedRuntime.mute"
  | "embedRuntime.unmute"
  | "embedRuntime.joystick"
  | "embedRuntime.movementHint";

function resolveEmbedLocale(lang: string | undefined): Locale {
  const requested = lang && lang !== "auto" ? lang : navigator.language;
  return normalizeLocale(requested) ?? "en";
}

function embedRuntimeText(locale: Locale, key: EmbedRuntimeKey): string {
  return EMBED_RUNTIME_CATALOGS[locale][key] ?? key;
}

async function officialPlayUrl(level: LevelMap): Promise<string> {
  return encodeExchangeText(JSON.stringify(level), {
    publicBaseUrl: embedPublicBaseUrl.href,
  });
}

function embedArtUrl(path: string): string {
  return embedAssetUrl(`assets/art/hd/${path}`).href;
}

function createEmbedImageManager(): ImageManager {
  return createOriginalGameplayImageManager(embedArtUrl);
}

function styleElement(): HTMLStyleElement {
  const style = document.createElement("style");
  style.textContent = `
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
    .bc5r-status { position: absolute; inset: 0; z-index: 8; display: grid; place-content: center; gap: 7px; padding: 24px; text-align: center; background: #071522; color: #c9e6f7; }
    .bc5r-status[hidden] { display: none; }
    .bc5r-status strong { color: #eef5ff; font-size: 17px; }
    .bc5r-status span { max-width: 520px; color: #9fc4db; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
    .bc5r-status[data-state="error"] strong { color: #ffb4ab; }
    .bc5r-info { flex: 0 0 auto; min-width: 0; min-height: 32px; padding: 3px 6px 3px 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #c9e6f7; background: #0d2b46; border-top: 1px solid #254868; font-size: 12px; }
    .bc5r-info-copy { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bc5r-terminal { position: absolute; inset: 0; z-index: 10; display: grid; place-items: center; background: rgba(0,0,0,.36); }
    .bc5r-terminal[hidden] { display: none; }
    .bc5r-terminal-card { min-width: 150px; padding: 18px; display: grid; gap: 12px; text-align: center; border-radius: 12px; background: rgba(255,255,255,.95); color: #222; box-shadow: 0 8px 30px rgba(0,0,0,.28); }
    .bc5r-terminal-card strong { font-size: 20px; }
    .bc5r-terminal-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    .bc5r-terminal-actions button, .bc5r-terminal-actions a { border: 0; border-radius: 8px; padding: 8px 12px; cursor: pointer; font: inherit; text-decoration: none; background: #222; color: #fff; }
    .bc5r-terminal-actions a { background: #fff; color: #222; box-shadow: inset 0 0 0 1px rgba(0,0,0,.2); }
    .engine-gameplay-hud { --engine-gameplay-hud-value-font-size: 36px; font-family: "BC5R Jersey 10", "Jersey 10", fantasy; font-weight: 400; -webkit-text-stroke: 1px #000; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; }
    .engine-gameplay-hud-value { font-weight: 400; }
  `;
  return style;
}
