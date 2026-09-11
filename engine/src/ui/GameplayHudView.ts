import { MapEntityTypeId, originalTileVisual } from "@bobby/model";
import type { ImageManager, LoadedImageSlice } from "../image/ImageManager.js";
import { GAMEPLAY_RIGHT_INSET_CSS_VAR } from "./gameplayMount.js";
import type { GameplayHudModel } from "./GameplayHudModel.js";

export interface GameplayHudViewOptions {
  timer?: boolean;
  steps?: boolean;
  objective?: boolean;
  items?: boolean;
}

interface HudChip {
  root: HTMLSpanElement;
  value: HTMLElement | null;
}

interface InventoryRow {
  root: HTMLDivElement;
  marker: HTMLSpanElement;
  bean: HudChip;
  gas: HudChip;
  shovel: HudChip;
  kite: HudChip;
}

type HudSprite = "carrot" | "gas" | "kite" | "shovel" | "egg" | "bean";

const HUD_SLICE: Record<HudSprite, string> = {
  carrot: "hud-carrot",
  gas: "hud-gas",
  kite: "hud-kite",
  shovel: "hud-shovel",
  egg: "hud-egg",
  bean: "hud-bean",
};

/** DOM-only HUD renderer. It knows semantic image IDs, never URLs or atlas coordinates. */
export class GameplayHudView {
  readonly root: HTMLDivElement;
  private readonly timer: HTMLElement;
  private readonly steps: HTMLElement;
  private readonly objectiveCarrot: HudChip;
  private readonly objectiveEgg: HudChip;
  private readonly coins: HudChip;
  private readonly primaryInventory: InventoryRow;
  private readonly secondaryInventory: InventoryRow;

  constructor(
    private readonly images: ImageManager,
    private readonly options: GameplayHudViewOptions = {},
  ) {
    this.root = document.createElement("div");
    this.root.className = "engine-gameplay-hud";
    this.root.setAttribute("aria-label", "游戏状态");
    Object.assign(this.root.style, {
      position: "absolute",
      inset: "0",
      zIndex: "5",
      pointerEvents: "none",
      color: "#eef5ef",
      opacity: "0.68",
    });

    const left = document.createElement("div");
    left.className = "engine-gameplay-hud-left";
    Object.assign(left.style, {
      position: "absolute",
      top: "12px",
      left: "12px",
      display: "grid",
      gap: "2px",
      justifyItems: "start",
    });

    this.timer = document.createElement("strong");
    this.timer.className =
      "engine-gameplay-hud-timer engine-gameplay-hud-value";
    Object.assign(this.timer.style, {
      display: "none",
      fontSize: "var(--engine-gameplay-hud-value-font-size, 26px)",
      lineHeight: "1",
      fontVariantNumeric: "tabular-nums",
    });
    this.steps = document.createElement("strong");
    this.steps.className =
      "engine-gameplay-hud-steps engine-gameplay-hud-value";
    this.steps.setAttribute("aria-label", "本关步数");
    Object.assign(this.steps.style, {
      display: "none",
      fontSize: "var(--engine-gameplay-hud-value-font-size, 26px)",
      lineHeight: "1",
      fontVariantNumeric: "tabular-nums",
    });
    left.append(this.timer, this.steps);

    const right = document.createElement("div");
    right.className = "engine-gameplay-hud-right";
    Object.assign(right.style, {
      position: "absolute",
      top: "12px",
      right: `calc(12px + var(${GAMEPLAY_RIGHT_INSET_CSS_VAR}, 0px))`,
      display: "grid",
      justifyItems: "end",
      rowGap: "10px",
      maxWidth: `calc(100% - 24px - var(${GAMEPLAY_RIGHT_INSET_CSS_VAR}, 0px))`,
    });

    const objective = document.createElement("div");
    objective.className = "engine-gameplay-hud-objective";
    Object.assign(objective.style, {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
      justifyContent: "flex-end",
    });
    this.objectiveCarrot = this.chip("目标胡萝卜", this.sprite("carrot"), {
      value: true,
      valueFirst: true,
      valueFontSize: "26px",
    });
    this.objectiveEgg = this.chip("目标彩蛋", this.sprite("egg"), {
      value: true,
      valueFirst: true,
      valueFontSize: "26px",
    });
    objective.append(this.objectiveCarrot.root, this.objectiveEgg.root);

    this.primaryInventory = this.inventoryRow("primary", "#ff665e");
    this.secondaryInventory = this.inventoryRow("secondary", "#5796ff");
    this.coins = this.chip(
      "金币",
      this.entitySprite(MapEntityTypeId.BONUS_COIN, 32),
      {
        value: true,
        valueFirst: true,
        valueFontSize: "26px",
      },
    );
    this.coins.root.classList.add("engine-gameplay-hud-coins");
    this.primaryInventory.root.append(this.coins.root);
    right.append(
      objective,
      this.primaryInventory.root,
      this.secondaryInventory.root,
    );
    this.root.append(left, right);
  }

  render(model: GameplayHudModel): void {
    const showTimedChallenge =
      this.options.timer !== false &&
      model.timedChallengeRemainingMs !== null;
    const showElapsedTime =
      this.options.timer !== false && !showTimedChallenge;
    this.timer.style.display =
      showTimedChallenge || showElapsedTime ? "block" : "none";
    if (showTimedChallenge) {
      this.timer.setAttribute(
        "aria-label",
        model.timedChallengePhase === "waiting"
          ? "挑战倒计时，等待开锁"
          : "挑战剩余时间",
      );
      this.timer.textContent = formatGameplayCountdown(
        model.timedChallengeRemainingMs!,
      );
    } else if (showElapsedTime) {
      this.timer.setAttribute("aria-label", "本关用时");
      this.timer.textContent = formatGameplayElapsed(model.elapsedMs);
    }
    const showSteps = this.options.steps !== false;
    this.steps.style.display = showSteps ? "block" : "none";
    this.steps.textContent = String(model.moves);

    const showObjective = this.options.objective !== false;
    this.setChip(
      this.objectiveCarrot,
      showObjective && model.objectives.carrotRemaining !== null,
      model.objectives.carrotRemaining ?? undefined,
    );
    this.setChip(
      this.objectiveEgg,
      showObjective && model.objectives.eggRemaining !== null,
      model.objectives.eggRemaining ?? undefined,
    );

    const showItems = this.options.items !== false;
    const showCoins = model.coins !== null;
    this.setChip(this.coins, showCoins, model.coins ?? undefined);
    const distinguishPlayers = model.inventories.length > 1;
    this.renderInventory(
      this.primaryInventory,
      model.inventories[0],
      showItems,
      distinguishPlayers,
      showCoins,
    );
    this.renderInventory(
      this.secondaryInventory,
      model.inventories[1],
      showItems,
      distinguishPlayers,
      false,
    );
  }

  destroy(): void {
    this.root.remove();
  }

  private setChip(chip: HudChip, visible: boolean, value?: number): void {
    chip.root.style.display = visible ? "inline-flex" : "none";
    if (chip.value && value !== undefined) {
      const text = String(value);
      if (chip.value.textContent !== text) chip.value.textContent = text;
    }
  }

  private renderInventory(
    row: InventoryRow,
    inventory: GameplayHudModel["inventories"][number] | undefined,
    enabled: boolean,
    distinguishPlayers: boolean,
    forceRowVisible: boolean,
  ): void {
    const itemRowVisible = enabled && inventory !== undefined;
    row.root.style.display =
      itemRowVisible || forceRowVisible ? "flex" : "none";
    row.marker.style.display =
      itemRowVisible && distinguishPlayers ? "inline-block" : "none";
    this.setItemChip(row.kite, itemRowVisible && inventory?.kite ? 1 : 0);
    this.setItemChip(row.bean, itemRowVisible ? inventory?.beans ?? 0 : 0);
    this.setItemChip(row.shovel, itemRowVisible && inventory?.shovel ? 1 : 0);
    this.setItemChip(row.gas, itemRowVisible && inventory?.gas ? 1 : 0);
  }

  private setItemChip(chip: HudChip, count: number): void {
    const normalized = Math.max(0, Math.floor(count));
    this.setChip(chip, normalized > 0, normalized);
    if (chip.value) chip.value.style.display = normalized > 1 ? "inline" : "none";
  }

  private inventoryRow(
    role: "primary" | "secondary",
    color: string,
  ): InventoryRow {
    const root = document.createElement("div");
    root.className = `engine-gameplay-hud-items engine-gameplay-hud-items-${role}`;
    Object.assign(root.style, {
      display: "none",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "8px",
      justifyContent: "flex-end",
      maxWidth: "100%",
    });
    const marker = document.createElement("span");
    marker.setAttribute(
      "aria-label",
      role === "primary" ? "主 Bobby" : "副 Bobby",
    );
    Object.assign(marker.style, {
      display: "none",
      color,
      fontSize: "12px",
      lineHeight: "1",
    });
    marker.textContent = "●";
    const kite = this.itemChip("风筝", "kite");
    const bean = this.chip("魔豆", this.sprite("bean"), {
      value: true,
      valueFirst: true,
      valueFontSize: "18px",
    });
    const shovel = this.itemChip("雪铲", "shovel");
    const gas = this.itemChip("汽油", "gas");
    root.append(marker, bean.root, gas.root, shovel.root, kite.root);
    return { root, marker, gas, shovel, kite, bean };
  }

  private itemChip(title: string, sprite: HudSprite): HudChip {
    return this.chip(title, this.sprite(sprite), {
      value: true,
      valueFirst: true,
      valueFontSize: "18px",
    });
  }

  private chip(
    title: string,
    icon: HTMLElement,
    options: {
      value?: boolean;
      valueFirst?: boolean;
      valueFontSize?: string;
    } = {},
  ): HudChip {
    const root = document.createElement("span");
    root.title = title;
    Object.assign(root.style, {
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      whiteSpace: "nowrap",
    });
    const value = options.value ? document.createElement("strong") : null;
    if (value && options.valueFontSize) {
      value.className = "engine-gameplay-hud-value";
      value.style.fontSize =
        `var(--engine-gameplay-hud-value-font-size, ${options.valueFontSize})`;
      value.style.lineHeight = "1";
    }
    if (value && options.valueFirst) root.append(value, icon);
    else if (value) root.append(icon, value);
    else root.append(icon);
    return { root, value };
  }

  private sprite(kind: HudSprite): HTMLElement {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    void this.images
      .loadSlice(HUD_SLICE[kind])
      .then((slice) => drawSlice(canvas, slice))
      .catch(() => undefined);
    return canvas;
  }

  private entitySprite(type: string, displaySize: number): HTMLElement {
    const canvas = document.createElement("canvas");
    const visual = originalTileVisual({ type });
    const size = this.images.sourceTileSize;
    void this.images
      .load(this.images.atlasId)
      .then((image) => {
        drawSlice(canvas, {
          source: this.images.atlasId,
          image,
          x: (visual.column - 1) * size,
          y: (visual.row - 1) * size,
          width: size,
          height: size,
        });
        canvas.style.width = `${displaySize}px`;
        canvas.style.height = `${displaySize}px`;
      })
      .catch(() => undefined);
    return canvas;
  }
}

export function formatGameplayCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return formatGameplaySeconds(totalSeconds);
}

export function formatGameplayElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  return formatGameplaySeconds(totalSeconds);
}

function formatGameplaySeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function drawSlice(canvas: HTMLCanvasElement, slice: LoadedImageSlice): void {
  canvas.width = slice.width;
  canvas.height = slice.height;
  canvas.style.width = `${slice.width}px`;
  canvas.style.height = `${slice.height}px`;
  canvas
    .getContext("2d")
    ?.drawImage(
      slice.image,
      slice.x,
      slice.y,
      slice.width,
      slice.height,
      0,
      0,
      slice.width,
      slice.height,
    );
}
