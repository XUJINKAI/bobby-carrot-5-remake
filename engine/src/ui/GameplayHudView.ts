import type { ImageManager, LoadedImageSlice } from "../image/ImageManager.js";
import { GAMEPLAY_RIGHT_INSET_CSS_VAR } from "./gameplayMount.js";
import type { GameplayHudModel } from "./GameplayHudModel.js";

export interface GameplayHudViewOptions {
  objective?: boolean;
  inventory?: boolean;
}

interface HudChip {
  root: HTMLSpanElement;
  value: HTMLElement | null;
}

interface InventoryRow {
  root: HTMLDivElement;
  marker: HTMLSpanElement;
  gas: HudChip;
  shovel: HudChip;
  kite: HudChip;
  bean: HudChip;
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
  private readonly objectiveCarrot: HudChip;
  private readonly objectiveEgg: HudChip;
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
      top: "12px",
      right: `calc(12px + var(${GAMEPLAY_RIGHT_INSET_CSS_VAR}, 0px))`,
      zIndex: "5",
      display: "grid",
      justifyItems: "end",
      gap: "2px",
      maxWidth: `calc(100% - 24px - var(${GAMEPLAY_RIGHT_INSET_CSS_VAR}, 0px))`,
      pointerEvents: "none",
      color: "#eef5ef",
      opacity: "0.68",
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
    this.root.append(
      objective,
      this.primaryInventory.root,
      this.secondaryInventory.root,
    );
  }

  render(model: GameplayHudModel): void {
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

    const showInventory = this.options.inventory !== false;
    const distinguishPlayers = model.inventories.length > 1;
    this.renderInventory(
      this.primaryInventory,
      model.inventories[0],
      showInventory,
      distinguishPlayers,
    );
    this.renderInventory(
      this.secondaryInventory,
      model.inventories[1],
      showInventory,
      distinguishPlayers,
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
  ): void {
    const visible = enabled && inventory !== undefined;
    row.root.style.display = visible ? "flex" : "none";
    row.marker.style.display = distinguishPlayers ? "inline-block" : "none";
    this.setChip(row.kite, visible && inventory?.kite === true);
    this.setChip(
      row.bean,
      visible && (inventory?.beans ?? 0) > 0,
      inventory?.beans ?? 0,
    );
    this.setChip(row.shovel, visible && inventory?.shovel === true);
    this.setChip(row.gas, visible && inventory?.gas === true);
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
    const kite = this.chip("风筝", this.sprite("kite"));
    const bean = this.chip("魔豆", this.sprite("bean"), {
      value: true,
      valueFirst: true,
      valueFontSize: "18px",
    });
    const shovel = this.chip("雪铲", this.sprite("shovel"));
    const gas = this.chip("汽油", this.sprite("gas"));
    root.append(marker, kite.root, bean.root, shovel.root, gas.root);
    return { root, marker, gas, shovel, kite, bean };
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
