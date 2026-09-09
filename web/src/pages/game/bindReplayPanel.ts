import type { Game, Replay, ReplayReport } from "@bobby/engine";
import { downloadExchangeText } from "../../shared/data-exchange/dataExchangeFile.js";

export interface ReplayPanelController {
  toggle(): void;
  update(): void;
  destroy(): void;
}

export function bindReplayPanel(options: {
  root: HTMLElement;
  game: Game;
  filename: string;
  onVisibilityChange(open: boolean): void;
  onRecordingStart(): void;
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
  const start = actionButton(panel, "start");
  const stop = actionButton(panel, "stop");
  const verify = actionButton(panel, "verify");
  const copy = actionButton(panel, "copy");
  const download = actionButton(panel, "download");
  let replay: Replay | null = null;
  let open = false;

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

  const verifyReplay = (): void => {
    if (!replay) return;
    try {
      showReport(options.game.verifyReplay(replay));
    } catch (error) {
      verification.textContent = errorMessage(error);
      verification.classList.add("failed");
    }
  };

  const startRecording = (): void => {
    try {
      options.game.startReplayRecording();
      options.onRecordingStart();
      replay = null;
      output.value = "";
      verification.textContent = "正在录制";
      verification.classList.remove("failed");
      message.textContent =
        "继续操作关卡；等待和受阻操作也属于测试过程。完成后选择“停止并复验”。";
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

  const copyReplay = async (): Promise<void> => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      verification.textContent = "Replay JSON 已复制";
    } catch (error) {
      verification.textContent = errorMessage(error);
      verification.classList.add("failed");
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

  const onClick = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-replay-action]",
    );
    const action = button?.dataset.replayAction;
    if (action === "close") setOpen(false);
    else if (action === "start") startRecording();
    else if (action === "stop") stopRecording();
    else if (action === "verify") verifyReplay();
    else if (action === "copy") void copyReplay();
    else if (action === "download") downloadReplay();
  };
  panel.addEventListener("click", onClick);

  const update = (): void => {
    const recording = options.game.replayRecording;
    panel.classList.toggle("recording", recording);
    status.textContent = recording ? "正在录制" : replay ? "录制完成" : "准备录制";
    ticks.textContent = recording
      ? `World ${options.game.replayTickCount} ticks`
      : replay
        ? `从关卡起点记录 · ${replay.endTick} ticks`
        : "从关卡起点记录 · 0 ticks";
    start.disabled = recording;
    stop.disabled = !recording;
    verify.disabled = replay === null;
    copy.disabled = replay === null;
    download.disabled = replay === null;
  };
  update();

  return {
    toggle(): void {
      setOpen(!open);
    },
    update,
    destroy(): void {
      panel.removeEventListener("click", onClick);
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
