import type { Game } from "../core/Game.js";
import { resolveGameplayMount } from "./gameplayMount.js";

export interface GameplayHudOptions {
  enabled?: boolean;
  root?: HTMLElement;
  hudAtlasUrl?: string;
  goldenCarrotUrl?: string;
  objective?: boolean;
  inventory?: boolean;
}

/** Engine 基础 HUD：只呈现公开 gameplay state，不读取 World。 */
export class GameplayHud {
  private readonly game: Game;
  private readonly root: HTMLDivElement;
  private readonly objective: HTMLDivElement;
  private readonly items: HTMLDivElement;
  private readonly options: GameplayHudOptions;
  private readonly unsubscribe: () => void;
  private lastSignature = "";

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
      inset: "0",
      zIndex: "5",
      pointerEvents: "none",
      color: "#eef5ef",
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
    });
    const cluster = document.createElement("div");
    cluster.className = "engine-gameplay-hud-cluster";
    Object.assign(cluster.style, {
      position: "absolute",
      top: "12px",
      right: "12px",
      display: "grid",
      justifyItems: "end",
      gap: "6px",
      maxWidth: "calc(100% - 24px)",
    });
    this.objective = document.createElement("div");
    this.objective.className = "engine-gameplay-hud-objective";
    this.items = document.createElement("div");
    this.items.className = "engine-gameplay-hud-items";
    Object.assign(this.items.style, {
      display: "flex",
      flexDirection: "row-reverse",
      flexWrap: "wrap",
      gap: "5px",
      justifyContent: "flex-start",
      maxWidth: "100%",
    });
    cluster.append(this.objective, this.items);
    this.root.append(cluster);
    mount.append(this.root);
    this.root.hidden = options.enabled === false;
    this.unsubscribe = game.on("change", () => this.render());
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
    this.objective.innerHTML = "";
    if (this.options.objective !== false) {
      this.objective.append(
        this.chip(
          state.objective.mode === "carrot" ? "目标胡萝卜" : "目标巢穴",
          this.sprite(state.objective.mode === "carrot" ? "carrot" : "egg"),
          String(state.objective.remaining),
        ),
      );
    }
    const items: HTMLElement[] = [];
    if (this.options.inventory !== false) {
      if (state.profile.superKey || state.profile.temporaryKey)
        items.push(this.chip("钥匙", this.sprite("key")));
      if (state.profile.speedShoes)
        items.push(this.chip("加速鞋", this.textIcon("👟")));
      if (state.inventory.gas)
        items.push(this.chip("汽油", this.sprite("gas")));
      if (state.inventory.shovel)
        items.push(this.chip("雪铲", this.sprite("shovel")));
      if (state.inventory.kite)
        items.push(this.chip("风筝", this.sprite("kite")));
      if (state.inventory.beans > 0)
        items.push(
          this.chip("魔豆", this.sprite("bean"), String(state.inventory.beans)),
        );
      if (state.goldenCarrotsInLevel > 0)
        items.push(
          this.chip(
            "本关 Golden Carrot",
            this.goldenCarrotIcon(),
            String(state.goldenCarrotsInLevel),
          ),
        );
      if (state.bonusCoinsInLevel > 0)
        items.push(
          this.chip(
            "本关 Bonus Coin",
            this.textIcon("BONUS"),
            String(state.bonusCoinsInLevel),
          ),
        );
    }
    this.items.replaceChildren(...items);
  }

  destroy(): void {
    this.unsubscribe();
    this.root.remove();
  }

  private chip(title: string, icon: HTMLElement, value?: string): HTMLSpanElement {
    const chip = document.createElement("span");
    chip.title = title;
    Object.assign(chip.style, {
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
    chip.append(icon);
    if (value !== undefined) {
      const strong = document.createElement("strong");
      strong.textContent = value;
      chip.append(strong);
    }
    return chip;
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
