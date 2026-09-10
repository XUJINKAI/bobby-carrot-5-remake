import type {
  Game,
  Replay,
  ReplayRecordingMeta,
  ReplayReport,
} from "@bobby/engine";
import { downloadExchangeText } from "../../shared/data-exchange/dataExchangeFile.js";
import { loadReplayAsset, parseReplayText } from "./replayAssets.js";

const REPLAY_PARSE_DELAY_MS = 300;

export function replayVerificationPresentation(
  report: ReplayReport,
  expected: Replay,
): { text: string; failed: boolean } {
  if (report.actual.status !== expected.finalState.status) {
    return {
      text:
        `终局不一致 · 记录 ${expected.finalState.status} / ` +
        `复跑 ${report.actual.status}`,
      failed: true,
    };
  }
  return {
    text: `复跑完成 · ${report.endTick} ticks`,
    failed: false,
  };
}

export interface ReplayPanelController {
  toggle(): void;
  update(): void;
  stopRecording(): void;
  destroy(): void;
}

export function bindReplayPanel(options: {
  root: HTMLElement;
  game: Game;
  filename: string;
  builtinReplayUrl?: string;
  meta: ReplayRecordingMeta;
  initialOpen?: boolean;
  onVisibilityChange(open: boolean): void;
  onTimelineRestart(): void;
}): ReplayPanelController {
  const panel = required<HTMLElement>(options.root, "[data-replay-panel]");
  const stage = required<HTMLElement>(options.root, "[data-game-stage]");
  const status = required<HTMLElement>(panel, "[data-replay-status]");
  const ticks = required<HTMLElement>(panel, "[data-replay-ticks]");
  const verification = required<HTMLElement>(
    panel,
    "[data-replay-verification]",
  );
  const output = required<HTMLTextAreaElement>(panel, "[data-replay-output]");
  const record = actionButton(panel, "record");
  const play = actionButton(panel, "play");
  const stopPlayback = actionButton(panel, "stop-playback");
  const slower = actionButton(panel, "slower");
  const faster = actionButton(panel, "faster");
  const speedControl = required<HTMLElement>(panel, ".replay-panel-speed");
  const speedInput = required<HTMLInputElement>(panel, "[data-replay-speed]");
  const skipThinking = required<HTMLInputElement>(
    panel,
    "[data-replay-skip-thinking]",
  );
  const beginning = actionButton(panel, "beginning");
  const end = actionButton(panel, "end");
  const copy = actionButton(panel, "copy");
  const download = actionButton(panel, "download");
  const loadBuiltin = panel.querySelector<HTMLButtonElement>(
    '[data-replay-action="load-builtin"]',
  );
  const builtinReplayUrl = options.builtinReplayUrl;
  const timeScales = [0.1, 0.5, 1, 1.25, 1.5, 2, 4, 8] as const;
  let replay: Replay | null = null;
  let open = options.initialOpen ?? false;
  let appliedTimeScale = 1;
  let loadingBuiltin = false;
  let replayTextDirty = false;
  let replayParseTimer: number | null = null;
  let destroyed = false;

  const setOpen = (value: boolean, notify = true): void => {
    open = value;
    panel.hidden = !value;
    stage.classList.toggle("replay-panel-open", value);
    if (notify) options.onVisibilityChange(value);
    window.dispatchEvent(new Event("resize"));
  };

  const showReport = (report: ReplayReport, expected: Replay): void => {
    const presentation = replayVerificationPresentation(report, expected);
    verification.textContent = presentation.text;
    verification.classList.toggle("failed", presentation.failed);
  };

  const showError = (error: unknown): void => {
    verification.textContent = errorMessage(error);
    verification.classList.add("failed");
  };

  const clearSpeedError = (): void => {
    speedControl.classList.remove("invalid");
    speedInput.removeAttribute("aria-invalid");
  };

  const readTimeScale = (): number | null => {
    const value = speedInput.valueAsNumber;
    if (Number.isFinite(value) && value > 0) {
      clearSpeedError();
      return value;
    }
    speedControl.classList.add("invalid");
    speedInput.setAttribute("aria-invalid", "true");
    return null;
  };

  const verifyReplay = (): void => {
    if (!replay) return;
    try {
      showReport(options.game.verifyReplay(replay), replay);
    } catch (error) {
      showError(error);
    }
  };

  const clearReplayParseTimer = (): void => {
    if (replayParseTimer === null) return;
    window.clearTimeout(replayParseTimer);
    replayParseTimer = null;
  };

  const parseReplayOutput = (): Replay | null => {
    clearReplayParseTimer();
    replayTextDirty = false;
    const text = output.value.trim();
    if (!text) {
      replay = null;
      verification.textContent = "等待录制";
      verification.classList.remove("failed");
      update();
      return null;
    }
    try {
      replay = parseReplayText(text);
      verification.textContent = "Replay JSON 已更新";
      verification.classList.remove("failed");
    } catch (error) {
      replay = null;
      showError(error);
    }
    update();
    return replay;
  };

  const replayForAction = (): Replay | null =>
    replayTextDirty ? parseReplayOutput() : replay;

  const startRecording = (): void => {
    try {
      options.onTimelineRestart();
      options.game.startReplayRecording(options.meta);
      replay = null;
      output.value = "";
      clearReplayParseTimer();
      replayTextDirty = false;
      verification.textContent = "正在录制";
      verification.classList.remove("failed");
      update();
    } catch (error) {
      showError(error);
    }
  };

  const stopRecording = (): void => {
    if (!options.game.replayRecording) return;
    try {
      replay = options.game.stopReplayRecording();
      output.value = `${JSON.stringify(replay, null, 2)}\n`;
      clearReplayParseTimer();
      replayTextDirty = false;
      verifyReplay();
      update();
    } catch (error) {
      showError(error);
    }
  };

  const toggleReplayPlayback = (): void => {
    if (options.game.replayPlaying && !options.game.replayPaused) {
      options.game.pauseReplayPlayback();
      update();
      return;
    }
    const selectedReplay = replayForAction();
    if (!selectedReplay) return;
    const speed = readTimeScale();
    if (speed === null) return;
    try {
      options.game.setTimeScale(speed);
      appliedTimeScale = speed;
      if (options.game.replayPlaying) {
        options.game.resumeReplayPlayback();
      } else {
        options.onTimelineRestart();
        options.game.startReplayPlayback(selectedReplay, {
          skipIdleTime: skipThinking.checked,
        });
      }
      update();
    } catch (error) {
      showError(error);
    }
  };

  const exitReplayPlayback = (): void => {
    options.game.stopReplayPlayback();
    update();
  };

  const adjustTimeScale = (direction: -1 | 1): void => {
    const entered = speedInput.valueAsNumber;
    const current =
      Number.isFinite(entered) && entered > 0
        ? entered
        : appliedTimeScale;
    const value =
      direction < 0
        ? [...timeScales].reverse().find((speed) => speed < current)
        : timeScales.find((speed) => speed > current);
    const next = value ?? current;
    speedInput.value = String(next);
    clearSpeedError();
    appliedTimeScale = next;
    options.game.setTimeScale(next);
  };

  const jumpToBeginning = (): void => {
    if (!replayForAction()) return;
    options.onTimelineRestart();
    options.game.restart();
    update();
  };

  const jumpToEnd = (): void => {
    const selectedReplay = replayForAction();
    if (!selectedReplay) return;
    try {
      options.onTimelineRestart();
      options.game.jumpReplayToEnd(selectedReplay);
      update();
    } catch (error) {
      showError(error);
    }
  };

  const copyReplay = async (): Promise<void> => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      verification.textContent = "Replay JSON 已复制";
    } catch (error) {
      showError(error);
    }
  };

  const downloadReplay = (): void => {
    if (!output.value) return;
    downloadExchangeText({
      text: output.value,
      filename: `${safeFilename(options.filename)}-replay.json`,
      compressed: false,
    });
  };

  const loadBuiltinReplay = async (): Promise<void> => {
    if (!builtinReplayUrl) return;
    loadingBuiltin = true;
    verification.textContent = "正在读取内置过法";
    verification.classList.remove("failed");
    update();
    try {
      const loaded = await loadReplayAsset(builtinReplayUrl);
      if (destroyed) return;
      options.game.stopReplayPlayback();
      replay = loaded.replay;
      output.value = loaded.text;
      clearReplayParseTimer();
      replayTextDirty = false;
      verification.textContent = "内置过法已载入";
      verification.classList.remove("failed");
    } catch (error) {
      if (!destroyed) showError(error);
    } finally {
      loadingBuiltin = false;
      if (!destroyed) update();
    }
  };

  const onOutputInput = (): void => {
    options.game.stopReplayPlayback();
    clearReplayParseTimer();
    replayTextDirty = true;
    verification.textContent =
      output.value.length > 0 ? "等待校验" : "等待录制";
    verification.classList.remove("failed");
    replayParseTimer = window.setTimeout(() => {
      replayParseTimer = null;
      parseReplayOutput();
    }, REPLAY_PARSE_DELAY_MS);
    update();
  };

  const onSpeedInput = (): void => {
    clearSpeedError();
    const speed = speedInput.valueAsNumber;
    if (!Number.isFinite(speed) || speed <= 0) return;
    appliedTimeScale = speed;
    options.game.setTimeScale(speed);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.key !== "Tab" ||
      event.repeat ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey ||
      isInteractiveTarget(event.target)
    )
      return;
    event.preventDefault();
    setOpen(!open);
  };

  const onClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-replay-action]",
    );
    const action = button?.dataset.replayAction;
    if (action === "record" && options.game.replayRecording) stopRecording();
    else if (action === "record") startRecording();
    else if (action === "play") toggleReplayPlayback();
    else if (action === "stop-playback") exitReplayPlayback();
    else if (action === "slower") adjustTimeScale(-1);
    else if (action === "faster") adjustTimeScale(1);
    else if (action === "beginning") jumpToBeginning();
    else if (action === "end") jumpToEnd();
    else if (action === "copy") void copyReplay();
    else if (action === "download") downloadReplay();
    else if (action === "load-builtin") void loadBuiltinReplay();
  };
  panel.addEventListener("click", onClick);
  output.addEventListener("input", onOutputInput);
  speedInput.addEventListener("input", onSpeedInput);
  window.addEventListener("keydown", onKeyDown);

  const update = (): void => {
    const recording = options.game.replayRecording;
    const playing = options.game.replayPlaying;
    const paused = options.game.replayPaused;
    panel.classList.toggle("recording", recording);
    panel.classList.toggle("playing", playing && !paused);
    status.textContent = recording
      ? "正在录制"
      : paused
        ? "播放已暂停"
        : playing
          ? "正在播放"
          : replay
            ? "Replay 已载入"
            : "准备录制";
    ticks.textContent = recording
      ? `World ${options.game.replayTickCount} ticks`
      : playing && replay
        ? `World ${options.game.replayTickCount} / ${replay.endTick} ticks`
        : replay
          ? `从关卡起点记录 · ${replay.endTick} ticks`
          : "从关卡起点记录 · 0 ticks";
    record.textContent = recording ? "停止录制" : "重新开始并录制";
    record.disabled = playing || loadingBuiltin;
    play.textContent = playing && !paused ? "暂停" : "播放";
    play.disabled =
      replayTextDirty || replay === null || recording || loadingBuiltin;
    stopPlayback.disabled = !playing;
    skipThinking.disabled = playing || loadingBuiltin;
    beginning.disabled =
      replayTextDirty || replay === null || recording || loadingBuiltin;
    end.disabled =
      replayTextDirty || replay === null || recording || loadingBuiltin;
    copy.disabled = output.value.length === 0 || loadingBuiltin;
    download.disabled = output.value.length === 0 || loadingBuiltin;
    if (loadBuiltin) {
      loadBuiltin.disabled = recording || playing || loadingBuiltin;
      loadBuiltin.textContent = loadingBuiltin ? "读取中…" : "加载内置过法";
    }
  };
  setOpen(open, false);
  update();

  return {
    toggle(): void {
      setOpen(!open);
    },
    update,
    stopRecording,
    destroy(): void {
      destroyed = true;
      clearReplayParseTimer();
      panel.removeEventListener("click", onClick);
      output.removeEventListener("input", onOutputInput);
      speedInput.removeEventListener("input", onSpeedInput);
      window.removeEventListener("keydown", onKeyDown);
      stage.classList.remove("replay-panel-open");
    },
  };
}

function actionButton(root: ParentNode, action: string): HTMLButtonElement {
  return required(root, `[data-replay-action="${action}"]`);
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Replay UI failed to mount: ${selector}`);
  return element;
}

function safeFilename(value: string): string {
  return (
    value
      .trim()
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "level"
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest(
      "a, button, input, select, textarea, [contenteditable], [tabindex]",
    ) !== null
  );
}
