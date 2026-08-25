import {
  Terrain,
  objectAtlasCell,
  objectVariantCycle,
  terrainAtlasCell,
  transformObjectVariant,
  type AudioBackend,
  type ObjectType,
  type TerrainType,
} from "@bobby/engine";
import {
  anchorForCursor,
  intersectingOwners,
  objectCells,
  placementCells,
  placementFits,
  removeOwners,
  resolveObjectOwner,
  type Cell,
} from "./authoring.js";
import { renderInspectorHtml } from "./inspector.js";
import {
  GROUP_ORDER,
  paletteGroup,
  paletteItems,
  paletteLabel,
  type PaletteItem,
} from "./palette.js";
import {
  createBlankLevel,
  normalizeEditorLevel,
  parseEditorLevel,
  resizeEditorLevel,
  serializeEditorLevel,
  validateEditorLevel,
  type EditorLevel,
} from "./level.js";
import { EditorPlayTest } from "./playtest.js";

export interface BobbyEditorOptions {
  root: HTMLElement;
  level?: EditorLevel;
  atlasUrl: string;
  animationAtlasUrl?: string;
  bobbyUrls: { left: string; right: string; up: string; down: string };
  mowerBobbyUrl?: string;
  kiteUrl?: string;
  hudAtlasUrl?: string;
  goldenCarrotUrl?: string;
  screenJoystick?: boolean;
  audio?: AudioBackend;
  onClose?: () => void;
}

type PointerButton = 0 | 2 | null;
interface PanState {
  pointerId: number;
  lastX: number;
  lastY: number;
}
const SOURCE_TILE = 48;
const EDIT_TILE = 38;
const HISTORY_LIMIT = 100;
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.75;
const ZOOM_STEP = 1.08;
const PALETTE_SIZES = [32, 40, 48, 56, 64] as const;
const PALETTE_KEY = "bobby.editor.paletteSize";

export class BobbyEditor {
  private readonly root: HTMLElement;
  private readonly options: BobbyEditorOptions;
  private readonly playTest = new EditorPlayTest();
  private level: EditorLevel;
  private selection: PaletteItem = { kind: "terrain", type: Terrain.GROUND_C };
  private hover: Cell | null = null;
  private pointerButton: PointerButton = null;
  private middlePan: PanState | null = null;
  private lastStroke = "";
  private readonly undoStack: string[] = [];
  private readonly redoStack: string[] = [];
  private canvas!: HTMLCanvasElement;
  private palette!: HTMLElement;
  private inspector!: HTMLElement;
  private status!: HTMLElement;
  private atlas: HTMLImageElement | null = null;
  private playing = false;
  private destroyed = false;
  private zoom = 1;
  private panX = 0;
  private panY = 0;
  private paletteSize = readPaletteSize();

  constructor(options: BobbyEditorOptions) {
    this.options = options;
    this.root = options.root;
    this.level = normalizeEditorLevel(options.level ?? createBlankLevel());
    this.mount();
    void this.loadAtlas();
  }

  getLevel(): EditorLevel {
    return structuredClone(this.level);
  }

  setLevel(level: EditorLevel): void {
    this.stopPlay();
    this.level = normalizeEditorLevel(level);
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.hover = null;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.refresh();
  }

  destroy(): void {
    this.destroyed = true;
    this.stopPlay();
    window.removeEventListener("keydown", this.onKeyDown);
    this.root.replaceChildren();
  }

  private mount(): void {
    this.root.innerHTML = `<div class="bobby-editor"><header class="editor-toolbar"><button class="editor-btn editor-back" data-editor="close">← 返回</button><strong class="editor-title">Bobby Carrot 5 Remake</strong><span class="editor-spacer"></span><button class="editor-btn editor-play" data-editor="play-toggle">▶ Play</button><button class="editor-btn" data-editor="file">地图文件</button><button class="editor-btn editor-help" data-editor="help">?</button><input type="file" accept="application/json,.json" data-editor-file hidden></header><main class="editor-body"><aside class="editor-palette"><div class="editor-palette-head"><div class="editor-panel-title">素材</div><div class="editor-palette-zoom"><button class="editor-mini-btn" data-editor="palette-smaller">−</button><span data-editor-palette-size>${this.paletteSize}</span><button class="editor-mini-btn" data-editor="palette-larger">+</button></div></div><div class="editor-selected-tile" data-editor-selected></div><div class="editor-palette-groups" data-editor-palette></div></aside><section class="editor-map-shell" data-editor-map-shell><canvas class="editor-canvas" data-editor-canvas></canvas><div class="editor-play-status" data-editor-status></div></section><aside class="editor-inspector" data-editor-inspector></aside></main><dialog class="editor-dialog" data-editor-file-dialog><header><strong>地图文件</strong><button class="editor-mini-btn" data-dialog-close>×</button></header><label class="editor-field"><span>名称</span><input data-map-name maxlength="120"></label><label class="editor-field"><span>作者</span><input data-map-author maxlength="80" placeholder="可选"></label><label class="editor-field"><span>描述</span><textarea data-map-description maxlength="500" rows="3" placeholder="可选"></textarea></label><p class="editor-muted">Bobby Carrot 5 Remake 的用户地图只使用语义 JSON；原版 DAT 仅供工具链验证与官方地图解码。</p><div class="editor-dialog-actions"><button class="editor-btn" data-editor="import">导入 JSON</button><button class="editor-btn editor-primary" data-editor="export">导出 JSON</button></div></dialog><dialog class="editor-dialog editor-help-dialog" data-editor-help-dialog><header><strong>操作帮助</strong><button class="editor-mini-btn" data-dialog-close>×</button></header><div class="editor-help-list"><p><strong>左键 / 拖动</strong><span>放置当前 Terrain / Object；相交的大型 Object 会整体替换。</span></p><p><strong>右键 / Del</strong><span>删除鼠标指向的完整 Object。</span></p><p><strong>Q / E</strong><span>旋转 / 翻转 / 切换鼠标指向 Object 的 authoring variant。</span></p><p><strong>滚轮</strong><span>指向可变 Object 时切换变体，否则缩放地图。</span></p><p><strong>中键拖动</strong><span>平移地图。</span></p><p><strong>Ctrl/Cmd+Z / Y</strong><span>Undo / Redo。</span></p><p><strong>泛蓝高亮</strong><span>表示当前操作会删除或替换的完整 owner。</span></p></div></dialog></div>`;
    this.canvas = this.required("[data-editor-canvas]");
    this.palette = this.required("[data-editor-palette]");
    this.inspector = this.required("[data-editor-inspector]");
    this.status = this.required("[data-editor-status]");
    this.root.addEventListener("click", this.onRootClick);
    this.root.addEventListener("input", this.onRootInput);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("lostpointercapture", this.onPointerUp);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("contextmenu", (event) =>
      event.preventDefault(),
    );
    window.addEventListener("keydown", this.onKeyDown);
    this.root.querySelectorAll<HTMLDialogElement>("dialog").forEach((dialog) =>
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      }),
    );
    this.refresh();
  }

  private required<T extends Element>(selector: string): T {
    const value = this.root.querySelector<T>(selector);
    if (!value) throw new Error(`Editor element missing: ${selector}`);
    return value;
  }

  private async loadAtlas(): Promise<void> {
    const image = new Image();
    image.src = this.options.atlasUrl;
    await image.decode();
    if (this.destroyed) return;
    this.atlas = image;
    this.renderCanvas();
  }

  private refresh(): void {
    this.renderPalette();
    this.renderInspector();
    this.renderCanvas();
    this.updateToolbar();
  }

  private renderPalette(): void {
    const grouped = new Map<string, PaletteItem[]>();
    for (const item of paletteItems(this.level)) {
      const group = paletteGroup(item);
      const items = grouped.get(group) ?? [];
      items.push(item);
      grouped.set(group, items);
    }
    this.palette.innerHTML = GROUP_ORDER.map((group) => {
      const items = grouped.get(group) ?? [];
      if (!items.length) return "";
      return `<section class="editor-palette-group"><h3>${group}</h3><div class="editor-palette-grid" style="--palette-size:${this.paletteSize}px">${items
        .map((item) => {
          const selected =
            this.selection.kind === item.kind &&
            this.selection.type === item.type;
          return `<button class="editor-palette-item ${selected ? "selected" : ""}" data-palette-kind="${item.kind}" data-palette-type="${item.type}" title="${escapeHtml(paletteLabel(item))}"><span style="${this.iconStyle(item)}"></span></button>`;
        })
        .join("")}</div></section>`;
    }).join("");
    const selected = this.root.querySelector<HTMLElement>(
      "[data-editor-selected]",
    );
    if (selected)
      selected.innerHTML = `<span class="editor-selected-icon" style="${this.iconStyle(this.selection)}"></span><div><strong>${escapeHtml(paletteLabel(this.selection))}</strong><small>${this.selection.type}</small></div>`;
    const size = this.root.querySelector<HTMLElement>(
      "[data-editor-palette-size]",
    );
    if (size) size.textContent = String(this.paletteSize);
  }

  private iconStyle(item: PaletteItem): string {
    const cell =
      item.kind === "terrain"
        ? terrainAtlasCell(item.type)
        : objectAtlasCell(item.type);
    const scale = this.paletteSize / SOURCE_TILE;
    return `width:${this.paletteSize}px;height:${this.paletteSize}px;background-image:url('${this.options.atlasUrl}');background-size:${16 * SOURCE_TILE * scale}px ${16 * SOURCE_TILE * scale}px;background-position:${-cell.column * SOURCE_TILE * scale}px ${-cell.row * SOURCE_TILE * scale}px;display:block;image-rendering:pixelated`;
  }

  private renderCanvas(): void {
    if (this.playing || !this.canvas) return;
    const cssW = this.level.width * EDIT_TILE;
    const cssH = this.level.height * EDIT_TILE;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.canvas.style.transformOrigin = "0 0";
    this.canvas.style.transform = `translate(${this.panX}px,${this.panY}px) scale(${this.zoom})`;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "#09110c";
    ctx.fillRect(0, 0, cssW, cssH);
    if (this.atlas) {
      for (let y = 0; y < this.level.height; y++)
        for (let x = 0; x < this.level.width; x++)
          this.drawAtlas(
            ctx,
            terrainAtlasCell(this.level.terrain[y]![x]!),
            x,
            y,
            1,
          );
      for (const object of this.level.objects)
        for (const cell of objectCells(object))
          this.drawAtlas(ctx, objectAtlasCell(cell.type), cell.x, cell.y, 1);
    }
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= this.level.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * EDIT_TILE, 0);
      ctx.lineTo(x * EDIT_TILE, cssH);
      ctx.stroke();
    }
    for (let y = 0; y <= this.level.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * EDIT_TILE);
      ctx.lineTo(cssW, y * EDIT_TILE);
      ctx.stroke();
    }
    if (!this.hover) return;
    const owner = resolveObjectOwner(this.level, this.hover.x, this.hover.y);
    const preview =
      this.selection.kind === "object"
        ? placementCells(this.selection.type, this.hover)
        : [];
    const affected = new Map<string, Cell>();
    if (owner)
      for (const cell of owner.cells) affected.set(`${cell.x},${cell.y}`, cell);
    if (this.pointerButton === 0 && preview.length)
      for (const old of intersectingOwners(this.level, preview))
        for (const cell of objectCells(old))
          affected.set(`${cell.x},${cell.y}`, cell);
    ctx.fillStyle = "rgba(90,170,255,.26)";
    for (const cell of affected.values())
      ctx.fillRect(
        cell.x * EDIT_TILE,
        cell.y * EDIT_TILE,
        EDIT_TILE,
        EDIT_TILE,
      );
    if (this.atlas) {
      ctx.globalAlpha = 0.55;
      if (this.selection.kind === "terrain")
        this.drawAtlas(
          ctx,
          terrainAtlasCell(this.selection.type),
          this.hover.x,
          this.hover.y,
          1,
        );
      else if (placementFits(this.level, this.selection.type, this.hover))
        for (const cell of preview)
          this.drawAtlas(ctx, objectAtlasCell(cell.type), cell.x, cell.y, 1);
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = "#99d6ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.hover.x * EDIT_TILE + 1,
      this.hover.y * EDIT_TILE + 1,
      EDIT_TILE - 2,
      EDIT_TILE - 2,
    );
  }

  private drawAtlas(
    ctx: CanvasRenderingContext2D,
    cell: { column: number; row: number },
    x: number,
    y: number,
    alpha: number,
  ): void {
    if (!this.atlas) return;
    const before = ctx.globalAlpha;
    ctx.globalAlpha *= alpha;
    ctx.drawImage(
      this.atlas,
      cell.column * SOURCE_TILE,
      cell.row * SOURCE_TILE,
      SOURCE_TILE,
      SOURCE_TILE,
      x * EDIT_TILE,
      y * EDIT_TILE,
      EDIT_TILE,
      EDIT_TILE,
    );
    ctx.globalAlpha = before;
  }

  private canvasCell(event: { clientX: number; clientY: number }): Cell | null {
    if (this.playing) return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor(
      ((event.clientX - rect.left) / rect.width) * this.level.width,
    );
    const y = Math.floor(
      ((event.clientY - rect.top) / rect.height) * this.level.height,
    );
    return x >= 0 && y >= 0 && x < this.level.width && y < this.level.height
      ? { x, y }
      : null;
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.playing) return;
    if (event.button === 1) {
      event.preventDefault();
      this.middlePan = {
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
      };
      this.canvas.setPointerCapture(event.pointerId);
      return;
    }
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();
    this.pointerButton = event.button as 0 | 2;
    this.lastStroke = "";
    this.canvas.setPointerCapture(event.pointerId);
    const cell = this.canvasCell(event);
    if (cell) {
      this.hover = cell;
      this.applyStroke(cell);
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.middlePan?.pointerId === event.pointerId) {
      this.panX += event.clientX - this.middlePan.lastX;
      this.panY += event.clientY - this.middlePan.lastY;
      this.middlePan.lastX = event.clientX;
      this.middlePan.lastY = event.clientY;
      this.renderCanvas();
      return;
    }
    const cell = this.canvasCell(event);
    this.hover = cell;
    if (cell && this.pointerButton !== null) this.applyStroke(cell);
    else {
      this.renderCanvas();
      this.renderInspector();
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (this.middlePan?.pointerId === event.pointerId) this.middlePan = null;
    this.pointerButton = null;
    this.lastStroke = "";
  };

  private readonly onPointerLeave = (): void => {
    if (this.pointerButton === null && !this.middlePan) {
      this.hover = null;
      this.renderCanvas();
      this.renderInspector();
    }
  };

  private applyStroke(cell: Cell): void {
    const key = `${cell.x},${cell.y}:${this.pointerButton}:${this.selection.kind}:${this.selection.type}`;
    if (key === this.lastStroke) return;
    this.lastStroke = key;
    if (this.pointerButton === 2) {
      const owner = resolveObjectOwner(this.level, cell.x, cell.y);
      if (owner) {
        this.pushHistory();
        this.level = removeOwners(this.level, [owner.object]);
        this.afterEdit();
      }
      return;
    }
    if (this.pointerButton !== 0) return;
    if (this.selection.kind === "terrain") {
      if (this.level.terrain[cell.y]![cell.x] === this.selection.type) return;
      this.pushHistory();
      this.level.terrain[cell.y]![cell.x] = this.selection.type;
      this.afterEdit();
      return;
    }
    if (!placementFits(this.level, this.selection.type, cell)) return;
    const cells = placementCells(this.selection.type, cell);
    const owners = intersectingOwners(this.level, cells);
    const anchor = anchorForCursor(this.selection.type, cell);
    if (
      owners.length === 1 &&
      owners[0]?.type === this.selection.type &&
      owners[0].x === anchor.x &&
      owners[0].y === anchor.y
    )
      return;
    this.pushHistory();
    this.level = removeOwners(this.level, owners);
    this.level.objects.push({
      type: this.selection.type,
      x: anchor.x,
      y: anchor.y,
    });
    this.level = normalizeEditorLevel(this.level);
    this.afterEdit();
  }

  private pushHistory(): void {
    this.undoStack.push(serializeEditorLevel(this.level));
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  private undo(): void {
    const previous = this.undoStack.pop();
    if (!previous) return;
    this.redoStack.push(serializeEditorLevel(this.level));
    this.level = parseEditorLevel(previous);
    this.afterEdit(false);
  }

  private redo(): void {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(serializeEditorLevel(this.level));
    this.level = parseEditorLevel(next);
    this.afterEdit(false);
  }

  private afterEdit(updatePalette = true): void {
    if (updatePalette) this.renderPalette();
    this.renderCanvas();
    this.renderInspector();
    this.updateToolbar();
  }

  private transformHovered(step: number): boolean {
    if (!this.hover) return false;
    const owner = resolveObjectOwner(this.level, this.hover.x, this.hover.y);
    if (!owner || !objectVariantCycle(owner.object.type)) return false;
    const next = transformObjectVariant(owner.object.type, step);
    if (!next) return false;
    const replacement = { ...owner.object, type: next };
    const cells = objectCells(replacement);
    if (
      cells.some(
        (cell) =>
          cell.x < 0 ||
          cell.y < 0 ||
          cell.x >= this.level.width ||
          cell.y >= this.level.height,
      )
    )
      return false;
    const collisions = intersectingOwners(
      removeOwners(this.level, [owner.object]),
      cells,
    );
    this.pushHistory();
    this.level = removeOwners(this.level, [owner.object, ...collisions]);
    this.level.objects.push(replacement);
    this.level = normalizeEditorLevel(this.level);
    this.afterEdit();
    return true;
  }

  private readonly onWheel = (event: WheelEvent): void => {
    if (this.playing) return;
    event.preventDefault();
    const cell = this.canvasCell(event);
    if (cell) this.hover = cell;
    if (this.transformHovered(event.deltaY > 0 ? 1 : -1)) return;
    const before = this.zoom;
    const next = Math.min(
      ZOOM_MAX,
      Math.max(
        ZOOM_MIN,
        before * (event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP),
      ),
    );
    if (next === before) return;
    const rect = this.canvas.getBoundingClientRect();
    const rx = event.clientX - rect.left;
    const ry = event.clientY - rect.top;
    this.zoom = next;
    this.panX += (rx / Math.max(before, 0.001)) * (before - next);
    this.panY += (ry / Math.max(before, 0.001)) * (before - next);
    this.renderCanvas();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.playing) return;
    const target = event.target as HTMLElement;
    if (target.matches("input,textarea,select")) return;
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? this.redo() : this.undo();
      return;
    }
    if (mod && event.key.toLowerCase() === "y") {
      event.preventDefault();
      this.redo();
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      if (this.hover) {
        event.preventDefault();
        const owner = resolveObjectOwner(
          this.level,
          this.hover.x,
          this.hover.y,
        );
        if (owner) {
          this.pushHistory();
          this.level = removeOwners(this.level, [owner.object]);
          this.afterEdit();
        }
      }
      return;
    }
    if (event.key.toLowerCase() === "q" || event.key.toLowerCase() === "e") {
      event.preventDefault();
      this.transformHovered(event.key.toLowerCase() === "e" ? 1 : -1);
    }
  };

  private readonly onRootClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const close = target.closest<HTMLElement>("[data-dialog-close]");
    if (close) {
      close.closest<HTMLDialogElement>("dialog")?.close();
      return;
    }
    const palette = target.closest<HTMLButtonElement>("[data-palette-kind]");
    if (palette) {
      const kind = palette.dataset.paletteKind;
      const type = palette.dataset.paletteType;
      if (kind === "terrain" && type)
        this.selection = { kind, type: type as TerrainType };
      else if (kind === "object" && type)
        this.selection = { kind, type: type as ObjectType };
      this.renderPalette();
      this.renderCanvas();
      this.renderInspector();
      return;
    }
    const button = target.closest<HTMLButtonElement>("[data-editor]");
    if (!button) return;
    switch (button.dataset.editor) {
      case "close":
        this.options.onClose?.();
        break;
      case "play-toggle":
        this.playing ? this.stopPlay() : void this.startPlay();
        break;
      case "file":
        this.openFileDialog();
        break;
      case "import":
        this.required<HTMLInputElement>("[data-editor-file]").click();
        break;
      case "export":
        this.exportJson();
        break;
      case "help":
        this.required<HTMLDialogElement>(
          "[data-editor-help-dialog]",
        ).showModal();
        break;
      case "palette-smaller":
        this.changePalette(-1);
        break;
      case "palette-larger":
        this.changePalette(1);
        break;
      case "resize":
        this.applyResize();
        break;
    }
  };

  private readonly onRootInput = (event: Event): void => {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (input.matches("[data-object-property]")) {
      this.updateObjectProperty(input);
      return;
    }
    if (!(input instanceof HTMLInputElement)) return;
    if (!input.matches("[data-editor-file]") || !input.files?.[0]) return;
    const file = input.files[0];
    void file.text().then((text) => {
      try {
        this.setLevel(parseEditorLevel(text));
      } catch (error) {
        window.alert(error instanceof Error ? error.message : String(error));
      } finally {
        input.value = "";
      }
    });
  };

  private updateObjectProperty(
    input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  ): void {
    const key = input.dataset.objectProperty;
    const x = Number(input.dataset.objectX);
    const y = Number(input.dataset.objectY);
    if (!key || !Number.isInteger(x) || !Number.isInteger(y)) return;
    const object = this.level.objects.find(
      (candidate) => candidate.x === x && candidate.y === y,
    );
    if (!object) return;
    const previous = object.properties?.[key] ?? "";
    if (previous === input.value) return;
    this.pushHistory();
    const properties = { ...(object.properties ?? {}) };
    if (input.value === "") delete properties[key];
    else properties[key] = input.value;
    if (Object.keys(properties).length > 0) object.properties = properties;
    else delete object.properties;
  }

  private openFileDialog(): void {
    const dialog = this.required<HTMLDialogElement>("[data-editor-file-dialog]");
    this.required<HTMLInputElement>("[data-map-name]").value = this.level.name;
    this.required<HTMLInputElement>("[data-map-author]").value =
      this.level.author ?? "";
    this.required<HTMLTextAreaElement>("[data-map-description]").value =
      this.level.description ?? "";
    dialog.showModal();
  }

  private syncMetadata(): void {
    this.level.name =
      this.required<HTMLInputElement>("[data-map-name]").value.trim() ||
      "Untitled Bobby Level";
    const author = this.required<HTMLInputElement>("[data-map-author]").value.trim();
    const description = this.required<HTMLTextAreaElement>(
      "[data-map-description]",
    ).value.trim();
    if (author) this.level.author = author;
    else delete this.level.author;
    if (description) this.level.description = description;
    else delete this.level.description;
  }

  private exportJson(): void {
    this.syncMetadata();
    const blob = new Blob([serializeEditorLevel(this.level)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${this.level.name.replace(/[^\w\-\u4e00-\u9fff]+/g, "-") || "bobby-level"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private changePalette(step: number): void {
    const index = PALETTE_SIZES.indexOf(this.paletteSize as never);
    const next =
      PALETTE_SIZES[
        Math.min(PALETTE_SIZES.length - 1, Math.max(0, index + step))
      ] ?? 48;
    this.paletteSize = next;
    localStorage.setItem(PALETTE_KEY, String(next));
    this.renderPalette();
  }

  private async startPlay(): Promise<void> {
    const issues = validateEditorLevel(this.level).filter(
      (issue) => issue.level === "error",
    );
    if (issues.length) {
      window.alert(issues.map((issue) => issue.message).join("\n"));
      return;
    }
    this.playing = true;
    this.canvas.style.transform = "none";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.status.textContent =
      "Play Test · 使用正式 Engine；Stop 后 Draft 保持不变。";
    this.updateToolbar();
    try {
      await this.playTest.start({
        canvas: this.canvas,
        level: this.level,
        assets: {
          atlasUrl: this.options.atlasUrl,
          ...(this.options.animationAtlasUrl
            ? { animationAtlasUrl: this.options.animationAtlasUrl }
            : {}),
          bobbyUrls: this.options.bobbyUrls,
          ...(this.options.mowerBobbyUrl
            ? { mowerBobbyUrl: this.options.mowerBobbyUrl }
            : {}),
          ...(this.options.kiteUrl ? { kiteUrl: this.options.kiteUrl } : {}),
          ...(this.options.hudAtlasUrl
            ? { hudAtlasUrl: this.options.hudAtlasUrl }
            : {}),
          ...(this.options.goldenCarrotUrl
            ? { goldenCarrotUrl: this.options.goldenCarrotUrl }
            : {}),
          sourceTileSize: SOURCE_TILE,
        },
        ...(this.options.screenJoystick === undefined
          ? {}
          : { screenJoystick: this.options.screenJoystick }),
        ...(this.options.audio ? { audio: this.options.audio } : {}),
        onStatus: (text) => {
          if (this.playing) this.status.textContent = text;
        },
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
      this.stopPlay();
    }
  }

  private stopPlay(): void {
    this.playTest.stop();
    this.playing = false;
    if (this.canvas) {
      this.status.textContent = "";
      this.renderCanvas();
    }
    this.updateToolbar();
  }

  private applyResize(): void {
    const width = Number(
      this.root.querySelector<HTMLInputElement>("[data-resize-width]")?.value,
    );
    const height = Number(
      this.root.querySelector<HTMLInputElement>("[data-resize-height]")?.value,
    );
    if (!width || !height) return;
    this.pushHistory();
    this.level = resizeEditorLevel(this.level, width, height);
    this.afterEdit();
  }

  private renderInspector(): void {
    if (this.inspector)
      this.inspector.innerHTML = renderInspectorHtml(
        this.level,
        this.hover,
        this.selection,
      );
  }

  private updateToolbar(): void {
    const play = this.root.querySelector<HTMLButtonElement>(
      '[data-editor="play-toggle"]',
    );
    if (play) play.textContent = this.playing ? "■ Stop" : "▶ Play";
    this.palette?.toggleAttribute("inert", this.playing);
  }
}

function readPaletteSize(): number {
  const stored = Number(localStorage.getItem(PALETTE_KEY));
  return (PALETTE_SIZES as readonly number[]).includes(stored) ? stored : 48;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>\"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[char] ??
      char,
  );
}
