import { EntityTypeId } from "@bobby/model";
import type { ImageManager, LoadedImageSlice } from "../image/ImageManager.js";
import { resolveEntityVisualPreview } from "../visual/preview.js";
import { GAMEPLAY_RIGHT_INSET_CSS_VAR } from "./gameplayMount.js";
import type { GameplayHudModel } from "./GameplayHudModel.js";

export interface GameplayHudViewOptions {
  objective?: boolean;
  inventory?: boolean;
  economy?: boolean;
}

interface HudChip {
  root: HTMLSpanElement;
  value: HTMLElement | null;
}

type HudSprite = "carrot" | "gas" | "key" | "kite" | "shovel" | "egg" | "bean";

const HUD_SLICE: Record<HudSprite, string> = {
  carrot: "hud-carrot",
  gas: "hud-gas",
  key: "hud-key",
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
  private readonly keyChip: HudChip;
  private readonly speedShoesChip: HudChip;
  private readonly gasChip: HudChip;
  private readonly shovelChip: HudChip;
  private readonly kiteChip: HudChip;
  private readonly beanChip: HudChip;
  private readonly goldenCarrotChip: HudChip;
  private readonly bonusCoinChip: HudChip;

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
      gap: "6px",
      maxWidth: `calc(100% - 24px - var(${GAMEPLAY_RIGHT_INSET_CSS_VAR}, 0px))`,
      pointerEvents: "none",
      color: "#eef5ef",
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
    });

    const objective = document.createElement("div");
    objective.className = "engine-gameplay-hud-objective";
    Object.assign(objective.style, {
      display: "flex",
      flexWrap: "wrap",
      gap: "5px",
      justifyContent: "flex-end",
    });
    this.objectiveCarrot = this.chip("目标胡萝卜", this.sprite("carrot"), true);
    this.objectiveEgg = this.chip("目标彩蛋", this.sprite("egg"), true);
    objective.append(this.objectiveCarrot.root, this.objectiveEgg.root);

    const items = document.createElement("div");
    items.className = "engine-gameplay-hud-items";
    Object.assign(items.style, {
      display: "flex",
      flexDirection: "row-reverse",
      flexWrap: "wrap",
      gap: "5px",
      justifyContent: "flex-start",
      maxWidth: "100%",
    });
    this.keyChip = this.chip("钥匙", this.sprite("key"));
    this.speedShoesChip = this.chip("加速鞋", this.textIcon("👟"));
    this.gasChip = this.chip("汽油", this.sprite("gas"));
    this.shovelChip = this.chip("雪铲", this.sprite("shovel"));
    this.kiteChip = this.chip("风筝", this.sprite("kite"));
    this.beanChip = this.chip("魔豆", this.sprite("bean"), true);
    this.goldenCarrotChip = this.chip(
      "Golden Carrot",
      this.wholeImageIcon("golden-carrot", "🥕"),
      true,
    );
    this.bonusCoinChip = this.chip(
      "Bonus Coin",
      this.entityVisualIcon(EntityTypeId.BONUS_COIN),
      true,
    );
    items.append(
      this.keyChip.root,
      this.speedShoesChip.root,
      this.gasChip.root,
      this.shovelChip.root,
      this.kiteChip.root,
      this.beanChip.root,
      this.goldenCarrotChip.root,
      this.bonusCoinChip.root,
    );

    this.root.append(objective, items);
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
    this.setChip(this.keyChip, showInventory && model.inventory.key);
    this.setChip(this.speedShoesChip, showInventory && model.inventory.speedShoes);
    this.setChip(this.gasChip, showInventory && model.inventory.gas);
    this.setChip(this.shovelChip, showInventory && model.inventory.shovel);
    this.setChip(this.kiteChip, showInventory && model.inventory.kite);
    this.setChip(
      this.beanChip,
      showInventory && model.inventory.beans > 0,
      model.inventory.beans,
    );

    const showEconomy = this.options.economy === true;
    this.setChip(
      this.goldenCarrotChip,
      showEconomy,
      model.economy.goldenCarrots,
    );
    this.setChip(
      this.bonusCoinChip,
      showEconomy,
      model.economy.bonusCoins,
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

  private chip(title: string, icon: HTMLElement, hasValue = false): HudChip {
    const root = document.createElement("span");
    root.title = title;
    Object.assign(root.style, {
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      minHeight: "32px",
      padding: "2px 8px",
      border: "1px solid rgba(255,255,255,.16)",
      borderRadius: "999px",
      background: "rgba(6,15,10,.76)",
      boxShadow: "0 3px 14px rgba(0,0,0,.22)",
      whiteSpace: "nowrap",
    });
    root.append(icon);
    const value = hasValue ? document.createElement("strong") : null;
    if (value) root.append(value);
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

  private entityVisualIcon(type: string): HTMLElement {
    const composition = resolveEntityVisualPreview({ type });
    const layer = composition?.layers.find((item) => item.kind === "atlas");
    if (!layer || layer.kind !== "atlas") return this.textIcon("●");

    const source = this.images.sourceTileSize;
    const canvas = document.createElement("canvas");
    canvas.width = source;
    canvas.height = source;
    canvas.style.width = "28px";
    canvas.style.height = "28px";
    void this.images
      .load(this.images.atlasId)
      .then((image) => {
        canvas
          .getContext("2d")
          ?.drawImage(
            image,
            layer.column * source,
            layer.row * source,
            source,
            source,
            0,
            0,
            source,
            source,
          );
      })
      .catch(() => undefined);
    return canvas;
  }

  private wholeImageIcon(asset: string, fallback: string): HTMLElement {
    const canvas = document.createElement("canvas");
    canvas.width = 28;
    canvas.height = 28;
    canvas.style.width = "28px";
    canvas.style.height = "28px";
    void this.images
      .load(asset)
      .then((image) => drawContained(canvas, image))
      .catch(() => {
        const context = canvas.getContext("2d");
        if (!context) return;
        context.font = "20px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(fallback, 14, 14);
      });
    return canvas;
  }

  private textIcon(text: string): HTMLElement {
    const icon = document.createElement("span");
    icon.textContent = text;
    icon.style.fontSize = text.length > 2 ? "9px" : "16px";
    return icon;
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

function drawContained(canvas: HTMLCanvasElement, image: HTMLImageElement): void {
  const context = canvas.getContext("2d");
  if (!context || image.width <= 0 || image.height <= 0) return;
  const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(
    image,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height,
  );
}
