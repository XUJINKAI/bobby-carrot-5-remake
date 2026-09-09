import type { Game, Replay, ReplayReport } from "@bobby/engine";
import { downloadExchangeText } from "../../shared/data-exchange/dataExchangeFile.js";

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
  onVisibilityChange(open: boolean): void;
  onTimelineRestart(): void;
}): ReplayPanelController {
  const panel = required<HTMLElement>(options.root, "[data-replay-panel]");
  const stage = required<HTMLElement>(options.root, "[data-game-stage]");
  const status = required<HTMLElement>(panel, "[data-replay-status]");
  const ticks = required<HTMLElement>(panel, "[data-replay-ticks]");
  const message = required<HTMLElement>(panel, "[data-replay-message]");
  const verification = required<HTMLElement>(
    panel,
    "[data-replay-verification]",
  );
  const output = required<HTMLTextAreaElement>(panel, "[data-replay-output]");
  const record = actionButton(panel, "record");
  const play = actionButton(panel, "play");
  const slower = actionButton(panel, "slower");
  const faster = actionButton(panel, "faster");
  const speedInput = required<HTMLInputElement>(panel, "[data-replay-speed]");
  const end = actionButton(panel, "end");
  const copy = actionButton(panel, "copy");
  const download = actionButton(panel, "download");
  const playbackSpeeds = [0.1, 0.5, 1, 1.25, 1.5, 2, 4, 8] as const;
  let replay: Replay | null = null;
  let open = false;
  let observedPlaying = false;
  let selectOnClick = true;

  const setOpen = (value: boolean): void => {
    open = value;
    panel.hidden = !value;
    stage.classList.toggle("replay-panel-open", value);
    options.onVisibilityChange(value);
    window.dispatchEvent(new Event("resize"));
  };

  const showReport = (report: ReplayReport): void => {
    verification.textContent = report.passed
      ? `复验通过 · ${report.actual.endTick} ticks`
      : `复验失败 · ${report.errors[0] ?? "结果不一致"}`;
    verification.classList.toggle("failed", !report.passed);
  };

  const showError = (error: unknown): void => {
    verification.textContent = errorMessage(error);
    verification.classList.add("failed");
  };

  const verifyReplay = (): void => {
    if (!replay) return;
    try {
      showReport(options.game.verifyReplay(replay));
    } catch (error) {
      showError(error);
    }
  };

  const startRecording = (): void => {
    try {
      options.onTimelineRestart();
      options.game.startReplayRecording();
      replay = null;
      output.value = "";
      verification.textContent = "正在录制";
      verification.classList.remove("failed");
      message.textContent =
        "继续操作关卡；等待和受阻操作也属于测试过程。完成后选择“停止录制”。";
      update();
    } catch (error) {
      message.textContent = errorMessage(error);
    }
  };

  const stopRecording = (): void => {
    if (!options.game.replayRecording) return;
    try {
      replay = options.game.stopReplayRecording();
      output.value = `${JSON.stringify(replay, null, 2)}\n`;
      message.textContent =
        "Replay 已从关卡起点重新执行并生成最终状态指纹，可以复制或下载为测试输入。";
      verifyReplay();
      update();
    } catch (error) {
      message.textContent = errorMessage(error);
    }
  };

  const playReplay = (): void => {
    if (!replay) return;
    try {
      options.onTimelineRestart();
      options.game.startReplayPlayback(replay);
      message.textContent = "Replay 正在从关卡起点按记录的 World Tick 播放。";
      update();
    } catch (error) {
      showError(error);
    }
  };

  const setPlaybackSpeed = (value: number): void => {
    options.game.setReplayPlaybackSpeed(value);
    speedInput.value = String(options.game.replayPlaybackSpeed);
  };

  const adjustPlaybackSpeed = (direction: -1 | 1): void => {
    const current = options.game.replayPlaybackSpeed;
    const value =
      direction < 0
        ? [...playbackSpeeds].reverse().find((speed) => speed < current)
        : playbackSpeeds.find((speed) => speed > current);
    setPlaybackSpeed(
      value ?? (direction < 0 ? playbackSpeeds[0] : playbackSpeeds[7]),
    );
  };

  const jumpToEnd = (): void => {
    if (!replay) return;
    try {
      options.onTimelineRestart();
      options.game.jumpReplayToEnd(replay);
      message.textContent = "已从关卡起点快速执行到 Replay 终点。";
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

  const onOutputInput = (): void => {
    const text = output.value.trim();
    if (!text) {
      replay = null;
      verification.textContent = "等待录制";
      verification.classList.remove("failed");
      update();
      return;
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
  };

  const onOutputFocus = (): void => {
    selectOnClick = true;
    output.select();
  };

  const onOutputClick = (): void => {
    if (!selectOnClick) return;
    output.select();
    selectOnClick = false;
  };

  const onOutputBlur = (): void => {
    selectOnClick = true;
  };

  const onSpeedInput = (): void => {
    const value = speedInput.valueAsNumber;
    if (Number.isFinite(value) && value > 0) setPlaybackSpeed(value);
  };

  const onSpeedChange = (): void => {
    speedInput.value = String(options.game.replayPlaybackSpeed);
  };

  const onClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-replay-action]",
    );
    const action = button?.dataset.replayAction;
    if (action === "record" && options.game.replayRecording) stopRecording();
    else if (action === "record") startRecording();
    else if (action === "play") playReplay();
    else if (action === "slower") adjustPlaybackSpeed(-1);
    else if (action === "faster") adjustPlaybackSpeed(1);
    else if (action === "end") jumpToEnd();
    else if (action === "copy") void copyReplay();
    else if (action === "download") downloadReplay();
  };
  panel.addEventListener("click", onClick);
  output.addEventListener("input", onOutputInput);
  output.addEventListener("focus", onOutputFocus);
  output.addEventListener("click", onOutputClick);
  output.addEventListener("blur", onOutputBlur);
  speedInput.addEventListener("input", onSpeedInput);
  speedInput.addEventListener("change", onSpeedChange);

  const update = (): void => {
    const recording = options.game.replayRecording;
    const playing = options.game.replayPlaying;
    if (observedPlaying && !playing)
      message.textContent = "Replay 已播放到记录终点。";
    observedPlaying = playing;
    panel.classList.toggle("recording", recording);
    panel.classList.toggle("playing", playing);
    status.textContent = recording
      ? "正在录制"
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
    record.disabled = playing;
    play.disabled = replay === null || recording || playing;
    end.disabled = replay === null || recording || playing;
    speedInput.value = String(options.game.replayPlaybackSpeed);
    slower.disabled = options.game.replayPlaybackSpeed <= playbackSpeeds[0];
    faster.disabled =
      options.game.replayPlaybackSpeed >= playbackSpeeds[7];
    copy.disabled = output.value.length === 0;
    download.disabled = output.value.length === 0;
  };
  update();

  return {
    toggle(): void {
      setOpen(!open);
    },
    update,
    stopRecording,
    destroy(): void {
      panel.removeEventListener("click", onClick);
      output.removeEventListener("input", onOutputInput);
      output.removeEventListener("focus", onOutputFocus);
      output.removeEventListener("click", onOutputClick);
      output.removeEventListener("blur", onOutputBlur);
      speedInput.removeEventListener("input", onSpeedInput);
      speedInput.removeEventListener("change", onSpeedChange);
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

function parseReplayText(text: string): Replay {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Replay JSON 必须是对象");
  return value as Replay;
}
