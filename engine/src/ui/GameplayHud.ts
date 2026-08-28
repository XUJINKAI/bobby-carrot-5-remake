import { EntityTypeId } from "@bobby/model";
import type { Game } from "../core/Game.js";
import { resolveEntityVisualPreview } from "../visual/preview.js";
import { resolveGameplayMount } from "./gameplayMount.js";

export interface GameplayHudOptions {
  enabled?: boolean;
  root?: HTMLElement;
  hudAtlasUrl?: string;
  entityAtlasUrl?: string;
  goldenCarrotUrl?: string;
  objective?: boolean;
  inventory?: boolean;
}

interface HudChip {
  root: HTMLSpanElement;
  value: HTMLElement | null;
}

/** Engine 基础 HUD：只呈现公开 gameplay state，不读取 World。 */
export class GameplayHud {
  private readonly game: Game;
  private readonly root: HTMLDivElement;
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
  private readonly options: GameplayHudOptions;
  private readonly unsubscribes: (() => void)[];
  private lastSignature = "";
  private goldenCarrotTotal = 0;
  private bonusCoinTotal = 0;

  constructor(
    game: Game,
    canvas: HTMLCanvasElement,
    options: GameplayHudOptions,
  ) {
    const mount = resolveGameplayMount(canvas, options.root, "GameplayHud");
    this.game = game;
    this.options = options;
    this.root = document.createElement("div");
    this.root.className = "engine-gameplay-hud";
    this.root.setAttribute("aria-label", "游戏状态");
    Object.assign(this.root.style, {
      position: "absolute",
      top: "12px",
      right: "12px",
      zIndex: "5",
      display: "grid",
      justifyItems: "end",
      gap: "6px",
      maxWidth: "calc(100% - 24px)",
      pointerEvents: "none",
      color: "#eef5ef",
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
    });

    const objective = document.createElement("div");
    objective.className = "engine-gameplay-hud-objective";
    this.objectiveCarrot = this.chip(
      "目标胡萝卜",
      this.sprite("carrot"),
      true,
    );
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
      "本关已收集 Golden Carrot",
      this.goldenCarrotIcon(),
      true,
    );
    this.bonusCoinChip = this.chip(
      "本关已收集 Bonus Coin",
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
    mount.append(this.root);
    this.root.hidden = options.enabled === false;
    this.unsubscribes = [
      game.on("change", () => this.render()),
      game.on("level-loaded", () => {
        this.goldenCarrotTotal = 0;
        this.bonusCoinTotal = 0;
        this.lastSignature = "";
        this.render();
      }),
    ];
    this.render();
  }

  setEnabled(enabled: boolean): void {
    this.root.hidden = !enabled;
    if (enabled) this.render();
  }

  render(): void {
    if (!this.game.hasLevel || this.root.hidden) return;
    const state = this.game.state;
    const signature = JSON.stringify({
      objective: state.objective,
      profile: state.profile,
      inventory: state.inventory,
      goldenCarrotsInLevel: state.goldenCarrotsInLevel,
      bonusCoinsInLevel: state.bonusCoinsInLevel,
    });
    if (signature === this.lastSignature) return;
    this.lastSignature = signature;

    this.goldenCarrotTotal = Math.max(
      this.goldenCarrotTotal,
      state.goldenCarrotsInLevel,
    );
    this.bonusCoinTotal = Math.max(this.bonusCoinTotal, state.bonusCoinsInLevel);
    const goldenCarrotsCollected = Math.max(
      0,
      this.goldenCarrotTotal - state.goldenCarrotsInLevel,
    );
    const bonusCoinsCollected = Math.max(
      0,
      this.bonusCoinTotal - state.bonusCoinsInLevel,
    );

    const showObjective = this.options.objective !== false;
    this.setChip(
      this.objectiveCarrot,
      showObjective && state.objective.mode === "carrot",
      state.objective.remaining,
    );
    this.setChip(
      this.objectiveEgg,
      showObjective && state.objective.mode === "nest",
      state.objective.remaining,
    );

    const showInventory = this.options.inventory !== false;
    this.setChip(
      this.keyChip,
      showInventory && (state.profile.superKey || state.profile.temporaryKey),
    );
    this.setChip(
      this.speedShoesChip,
      showInventory && state.profile.speedShoes,
    );
    this.setChip(this.gasChip, showInventory && state.inventory.gas);
    this.setChip(this.shovelChip, showInventory && state.inventory.shovel);
    this.setChip(this.kiteChip, showInventory && state.inventory.kite);
    this.setChip(
      this.beanChip,
      showInventory && state.inventory.beans > 0,
      state.inventory.beans,
    );
    this.setChip(
      this.goldenCarrotChip,
      showInventory && goldenCarrotsCollected > 0,
      goldenCarrotsCollected,
    );
    this.setChip(
      this.bonusCoinChip,
      showInventory && bonusCoinsCollected > 0,
      bonusCoinsCollected,
    );
  }

  destroy(): void {
    for (const unsubscribe of this.unsubscribes) unsubscribe();
    this.root.remove();
  }

  private setChip(chip: HudChip, visible: boolean, value?: number): void {
    chip.root.hidden = !visible;
    if (chip.value && value !== undefined) {
      const text = String(value);
      if (chip.value.textContent !== text) chip.value.textContent = text;
    }
  }

  private chip(
    title: string,
    icon: HTMLElement,
    hasValue = false,
  ): HudChip {
    const root = document.createElement("span");
    root.title = title;
    root.hidden = true;
    Object.assign(root.style, {
      display: "inline-flex",
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

  private sprite(
    kind: "carrot" | "gas" | "key" | "kite" | "shovel" | "egg" | "bean",
  ): HTMLElement {
    const fallback: Record<typeof kind, string> = {
      carrot: "🥕",
      gas: "⛽",
      key: "🔑",
      kite: "◇",
      shovel: "♠",
      egg: "🥚",
      bean: "🫘",
    };
    if (!this.options.hudAtlasUrl) return this.textIcon(fallback[kind]);
    const cells: Record<typeof kind, { width: number; x: number }> = {
      carrot: { width: 39, x: -42 },
      gas: { width: 37, x: -83 },
      key: { width: 20, x: -122 },
      kite: { width: 35, x: -144 },
      shovel: { width: 37, x: -179 },
      egg: { width: 29, x: -217 },
      bean: { width: 35, x: -247 },
    };
    const cell = cells[kind];
    const icon = document.createElement("span");
    Object.assign(icon.style, {
      display: "inline-block",
      width: `${cell.width}px`,
      height: "38px",
      backgroundImage: `url("${this.options.hudAtlasUrl}")`,
      backgroundRepeat: "no-repeat",
      backgroundSize: "350px 38px",
      backgroundPosition: `${cell.x}px 0`,
    });
    return icon;
  }

  private entityVisualIcon(type: string): HTMLElement {
    const composition = resolveEntityVisualPreview({ type });
    const layer = composition?.layers.find((item) => item.kind === "atlas");
    if (!layer || layer.kind !== "atlas" || !this.options.entityAtlasUrl)
      return this.textIcon("●");

    const tileSize = 48;
    const canvas = document.createElement("canvas");
    canvas.width = tileSize;
    canvas.height = tileSize;
    canvas.style.width = "28px";
    canvas.style.height = "28px";
    const image = new Image();
    image.decoding = "async";
    image.addEventListener("load", () => {
      canvas
        .getContext("2d")
        ?.drawImage(
          image,
          layer.column * tileSize,
          layer.row * tileSize,
          tileSize,
          tileSize,
          0,
          0,
          tileSize,
          tileSize,
        );
    });
    image.src = this.options.entityAtlasUrl;
    return canvas;
  }

  private goldenCarrotIcon(): HTMLElement {
    if (!this.options.goldenCarrotUrl) return this.textIcon("🥕");
    const image = document.createElement("img");
    image.src = this.options.goldenCarrotUrl;
    image.alt = "";
    image.style.maxHeight = "28px";
    image.style.width = "auto";
    return image;
  }

  private textIcon(text: string): HTMLElement {
    const icon = document.createElement("span");
    icon.textContent = text;
    icon.style.fontSize = text.length > 2 ? "9px" : "16px";
    return icon;
  }
}
