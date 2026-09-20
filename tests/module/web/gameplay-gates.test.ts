import { describe, expect, test, vi } from "vitest";
import { GameplayGateManager } from "../../../web/src/runtime/game/GameplayGateManager.js";

describe("GameplayGateManager", () => {
  test("重叠 gate 只在最后一个 lease 释放后恢复 gameplay", () => {
    const pause = vi.fn();
    const abort = vi.fn();
    const released: string[] = [];
    const manager = new GameplayGateManager(
      {
        setHostGameplayPaused: pause,
        abortReplayRecording: abort,
      } as never,
      {
        acquireBlock(reason: string) {
          return { release: () => released.push(reason) };
        },
      } as never,
    );

    const interaction = manager.acquire("blocking-interaction");
    const shell = manager.acquire("shell-dialog");
    expect(abort).toHaveBeenCalledTimes(1);
    interaction.release();
    expect(pause).not.toHaveBeenLastCalledWith(false);
    shell.release();
    expect(pause).toHaveBeenLastCalledWith(false);
    expect(released).toEqual(["blocking-interaction", "shell-dialog"]);
  });
});
