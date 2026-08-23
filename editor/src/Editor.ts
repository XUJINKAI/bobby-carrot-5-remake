import {
  Game,
  InputController,
  NullAudioBackend,
  ObjectId,
  Terrain,
  hexByte,
  signedByte,
  type AudioBackend
} from '@bobby/engine';
import {
  createBlankLevel,
  normalizeEditorLevel,
  parseEditorLevel,
  resizeEditorLevel,
  serializeEditorLevel,
  toLevelData,
  validateEditorLevel,
  type EditorLevel
} from './level.js';
import { encodeShareLevel } from './share.js';

export interface BobbyEditorOptions {
  root: HTMLElement;
  level?: EditorLevel;
  atlasUrl: string;
  animationAtlasUrl?: string;
  bobbyUrls: { left: string; right: string; up: string; down: string };
  mowerBobbyUrl?: string;
  kiteUrl?: string;
  audio?: AudioBackend;
  /** 返回玩家 Web；Editor 自身不负责路由。 */
  onClose?: () => void;
  /** 生成分享 URL 时使用，默认 location.origin。 */
  shareOrigin?: string;
}

type Layer = 'terrain' | 'object';
type Tool = 'pencil' | 'erase' | 'eyedropper';
interface Cell { x: number; y: number; }

const TILE_SOURCE_SIZE = 48;
const EDIT_TILE_SIZE = 38;
const HISTORY_LIMIT = 100;

const terrainNames = idNameMap(Terrain);
const objectNames = idNameMap(ObjectId);

export class BobbyEditor {
  private readonly root: HTMLElement;
  private readonly options: BobbyEditorOptions;
  private level: EditorLevel;
  private layer: Layer = 'terrain';
  private tool: Tool = 'pencil';
  private selectedTerrain = 0x90;
  private selectedObject = 0xca;
  private selectedCell: Cell | null = null;
  private readonly undoStack: string[] = [];
  private readonly redoStack: string[] = [];
  private strokeStarted = false;
  private pointerDown = false;
  private atlas: HTMLImageElement | null = null;
  private canvas!: HTMLCanvasElement;
  private canvasShell!: HTMLElement;
  private status!: HTMLElement;
  private inspector!: HTMLElement;
  private paletteGrid!: HTMLElement;
  private game: Game | null = null;
  private gameInput: InputController | null = null;
  private playing = false;
  private destroyed = false;

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
    this.selectedCell = null;
    this.refreshAll();
  }

  destroy(): void {
    this.destroyed = true;
    this.stopPlay();
    window.removeEventListener('keydown', this.onKeyDown);
    this.root.replaceChildren();
  }

  private mount(): void {
    this.root.innerHTML = `
      <div class="bobby-editor">
        <header class="editor-toolbar">
          <button class="editor-btn" data-editor="close">← 返回</button>
          <strong class="editor-title">Bobby Editor</strong>
          <span class="editor-separator"></span>
          <button class="editor-btn active" data-layer="terrain">Terrain</button>
          <button class="editor-btn" data-layer="object">Object</button>
          <span class="editor-separator"></span>
          <button class="editor-btn active" data-tool="pencil">画笔 B</button>
          <button class="editor-btn" data-tool="erase">擦除 E</button>
          <button class="editor-btn" data-tool="eyedropper">吸管 I</button>
          <span class="editor-separator"></span>
          <button class="editor-btn" data-editor="undo">↶ Undo</button>
          <button class="editor-btn" data-editor="redo">↷ Redo</button>
          <span class="editor-spacer"></span>
          <button class="editor-btn" data-editor="import">Import JSON</button>
          <button class="editor-btn" data-editor="export">Export JSON</button>
          <button class="editor-btn" data-editor="share-play">分享游玩</button>
          <button class="editor-btn" data-editor="share-edit">分享编辑</button>
          <button class="editor-btn editor-play" data-editor="play">▶ Play</button>
          <button class="editor-btn editor-stop" data-editor="stop" hidden>■ Stop</button>
          <input type="file" accept="application/json,.json" data-editor-file hidden>
        </header>
        <main class="editor-body">
          <aside class="editor-palette">
            <div class="editor-panel-title">素材</div>
            <div class="editor-selected-tile" data-editor-selected></div>
            <div class="editor-palette-grid" data-editor-palette></div>
          </aside>
          <section class="editor-map-shell" data-editor-map-shell>
            <canvas class="editor-canvas" data-editor-canvas></canvas>
            <div class="editor-play-status" data-editor-status></div>
          </section>
          <aside class="editor-inspector" data-editor-inspector></aside>
        </main>
      </div>`;

    this.canvas = this.required<HTMLCanvasElement>('[data-editor-canvas]');
    this.canvasShell = this.required<HTMLElement>('[data-editor-map-shell]');
    this.status = this.required<HTMLElement>('[data-editor-status]');
    this.inspector = this.required<HTMLElement>('[data-editor-inspector]');
    this.paletteGrid = this.required<HTMLElement>('[data-editor-palette]');

    this.root.addEventListener('click', this.onRootClick);
    this.root.addEventListener('input', this.onRootInput);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    window.addEventListener('keydown', this.onKeyDown);

    this.renderPalette();
    this.renderInspector();
    this.updateToolbar();
  }

  private async loadAtlas(): Promise<void> {
    const image = new Image();
    image.src = this.options.atlasUrl;
    await image.decode();
    if (this.destroyed) return;
    this.atlas = image;
    this.renderCanvas();
  }

  private renderCanvas(): void {
    if (this.playing) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssWidth = this.level.width * EDIT_TILE_SIZE;
    const cssHeight = this.level.height * EDIT_TILE_SIZE;
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.width = Math.round(cssWidth * dpr);
    this.canvas.height = Math.round(cssHeight * dpr);
    const context = this.canvas.getContext('2d');
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, cssWidth, cssHeight);
    context.fillStyle = '#0a110d';
    context.fillRect(0, 0, cssWidth, cssHeight);

    if (!this.atlas) {
      context.fillStyle = '#dbe8dd';
      context.font = '14px system-ui';
      context.fillText('正在加载原版图集…', 18, 28);
      return;
    }

    for (let y = 0; y < this.level.height; y += 1) {
      for (let x = 0; x < this.level.width; x += 1) {
        this.drawAtlasTile(context, this.level.terrain[y]![x]!, x, y);
      }
    }
    // Editor 的数据仍完整保存 Object；这里只复刻原版可见性：未割高草会遮住格内对象。
    for (const object of this.level.objects) {
      const terrain = this.level.terrain[object.y]?.[object.x];
      if (terrain === Terrain.HIGH_GRASS || terrain === Terrain.HIGH_GRASS_OBJECTIVE) continue;
      this.drawAtlasTile(context, object.id, object.x, object.y);
    }

    context.strokeStyle = 'rgba(255,255,255,.12)';
    context.lineWidth = 1;
    for (let x = 0; x <= this.level.width; x += 1) {
      context.beginPath(); context.moveTo(x * EDIT_TILE_SIZE + .5, 0); context.lineTo(x * EDIT_TILE_SIZE + .5, cssHeight); context.stroke();
    }
    for (let y = 0; y <= this.level.height; y += 1) {
      context.beginPath(); context.moveTo(0, y * EDIT_TILE_SIZE + .5); context.lineTo(cssWidth, y * EDIT_TILE_SIZE + .5,); context.stroke();
    }

    if (this.selectedCell) {
      context.strokeStyle = '#d8f5a6';
      context.lineWidth = 2;
      context.strokeRect(this.selectedCell.x * EDIT_TILE_SIZE + 1, this.selectedCell.y * EDIT_TILE_SIZE + 1, EDIT_TILE_SIZE - 2, EDIT_TILE_SIZE - 2);
    }
  }

  private drawAtlasTile(context: CanvasRenderingContext2D, id: number, x: number, y: number): void {
    if (!this.atlas) return;
    const column = id & 0x0f;
    const row = id >> 4;
    context.drawImage(
      this.atlas,
      column * TILE_SOURCE_SIZE,
      row * TILE_SOURCE_SIZE,
      TILE_SOURCE_SIZE,
      TILE_SOURCE_SIZE,
      x * EDIT_TILE_SIZE,
      y * EDIT_TILE_SIZE,
      EDIT_TILE_SIZE,
      EDIT_TILE_SIZE
    );
  }

  private renderPalette(): void {
    const known = this.layer === 'terrain' ? terrainNames : objectNames;
    const selected = this.layer === 'terrain' ? this.selectedTerrain : this.selectedObject;
    const ids = this.layer === 'terrain'
      ? Array.from({ length: 256 }, (_, id) => id)
      : Array.from({ length: 55 }, (_, index) => 0xc9 + index);

    this.paletteGrid.innerHTML = ids.map((id) => {
      const col = id & 15;
      const row = id >> 4;
      const name = known.get(id) ?? 'UNKNOWN';
      return `<button class="editor-palette-tile ${id === selected ? 'active' : ''}" data-palette-id="${id}"
        title="${hexByte(id)} / ${signedByte(id)} · ${escapeHtml(name)}"
        style="background-image:url('${escapeAttribute(this.options.atlasUrl)}');background-size:${16 * 30}px ${16 * 30}px;background-position:${-col * 30}px ${-row * 30}px"></button>`;
    }).join('');
    this.renderSelectedTile();
  }

  private renderSelectedTile(): void {
    const id = this.layer === 'terrain' ? this.selectedTerrain : this.selectedObject;
    const name = (this.layer === 'terrain' ? terrainNames : objectNames).get(id) ?? 'UNKNOWN';
    const target = this.required<HTMLElement>('[data-editor-selected]');
    target.innerHTML = `<strong>${this.layer === 'terrain' ? 'Terrain' : 'Object'} · ${hexByte(id)}</strong><span>${signedByte(id)} · ${escapeHtml(name)}</span>`;
  }

  private renderInspector(): void {
    const cell = this.selectedCell;
    const terrain = cell ? this.level.terrain[cell.y]?.[cell.x] ?? 0xff : null;
    const object = cell ? this.objectAt(cell.x, cell.y)?.id ?? 0xff : null;
    const issues = validateEditorLevel(this.level);
    this.inspector.innerHTML = `
      <div class="editor-panel-title">地图</div>
      <label class="editor-field"><span>名称</span><input data-level-name value="${escapeAttribute(this.level.name)}" maxlength="120"></label>
      <label class="editor-field"><span>作者</span><input data-level-author value="${escapeAttribute(this.level.author ?? '')}" maxlength="80" placeholder="可选"></label>
      <div class="editor-size-row">
        <label class="editor-field"><span>宽</span><input data-level-width type="number" min="3" max="128" value="${this.level.width}"></label>
        <label class="editor-field"><span>高</span><input data-level-height type="number" min="3" max="128" value="${this.level.height}"></label>
        <button class="editor-btn" data-editor="resize">应用</button>
      </div>
      <div class="editor-panel-title inspector-gap">当前格</div>
      ${cell ? `
        <div class="editor-inspect-grid">
          <span>位置</span><strong>${cell.x}, ${cell.y}</strong>
          <span>Terrain</span><strong>${hexByte(terrain!)} · ${escapeHtml(terrainNames.get(terrain!) ?? 'UNKNOWN')}</strong>
          <span>Object</span><strong>${object === 0xff ? 'EMPTY' : `${hexByte(object!)} · ${escapeHtml(objectNames.get(object!) ?? 'UNKNOWN')}`}</strong>
        </div>` : '<p class="editor-muted">点击地图中的格子查看。</p>'}
      <div class="editor-panel-title inspector-gap">校验</div>
      <div class="editor-issues">${issues.length ? issues.map((issue) => `<div class="editor-issue ${issue.level}">${escapeHtml(issue.message)}</div>`).join('') : '<div class="editor-ok">地图结构正常</div>'}</div>`;
  }

  private updateToolbar(): void {
    this.root.querySelectorAll<HTMLElement>('[data-layer]').forEach((button) => button.classList.toggle('active', button.dataset.layer === this.layer));
    this.root.querySelectorAll<HTMLElement>('[data-tool]').forEach((button) => button.classList.toggle('active', button.dataset.tool === this.tool));
    this.required<HTMLButtonElement>('[data-editor="play"]').hidden = this.playing;
    this.required<HTMLButtonElement>('[data-editor="stop"]').hidden = !this.playing;
    this.root.querySelectorAll<HTMLButtonElement>('[data-layer],[data-tool],[data-editor="undo"],[data-editor="redo"],[data-editor="import"],[data-editor="export"],[data-editor="share-play"],[data-editor="share-edit"],[data-editor="resize"]').forEach((button) => {
      button.disabled = this.playing;
    });
  }

  private refreshAll(): void {
    this.renderPalette();
    this.renderInspector();
    this.renderCanvas();
    this.updateToolbar();
  }

  private readonly onRootClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const palette = target.closest<HTMLElement>('[data-palette-id]');
    if (palette && !this.playing) {
      const id = Number(palette.dataset.paletteId);
      if (this.layer === 'terrain') this.selectedTerrain = id;
      else this.selectedObject = id;
      this.tool = 'pencil';
      this.renderPalette();
      this.updateToolbar();
      return;
    }

    const layer = target.closest<HTMLElement>('[data-layer]')?.dataset.layer as Layer | undefined;
    if (layer && !this.playing) {
      this.layer = layer;
      this.renderPalette();
      this.updateToolbar();
      return;
    }
    const tool = target.closest<HTMLElement>('[data-tool]')?.dataset.tool as Tool | undefined;
    if (tool && !this.playing) {
      this.tool = tool;
      this.updateToolbar();
      return;
    }

    const action = target.closest<HTMLElement>('[data-editor]')?.dataset.editor;
    if (!action) return;
    if (action === 'close') this.options.onClose?.();
    else if (action === 'undo') this.undo();
    else if (action === 'redo') this.redo();
    else if (action === 'resize') this.resizeFromInputs();
    else if (action === 'import') this.required<HTMLInputElement>('[data-editor-file]').click();
    else if (action === 'export') this.exportJson();
    else if (action === 'share-play') void this.share('play');
    else if (action === 'share-edit') void this.share('edit');
    else if (action === 'play') void this.startPlay();
    else if (action === 'stop') this.stopPlay();
  };

  private readonly onRootInput = (event: Event): void => {
    const input = event.target as HTMLInputElement;
    if (input.matches('[data-level-name]')) this.level.name = input.value;
    else if (input.matches('[data-level-author]')) {
      if (input.value) this.level.author = input.value;
      else delete this.level.author;
    } else if (input.matches('[data-editor-file]') && input.files?.[0]) {
      void input.files[0].text().then((text) => {
        try {
          this.pushHistory();
          this.level = parseEditorLevel(text);
          this.redoStack.length = 0;
          this.selectedCell = null;
          this.setStatus('已导入 JSON 地图');
          this.refreshAll();
        } catch (error) {
          this.setStatus(`导入失败：${error instanceof Error ? error.message : String(error)}`, true);
        } finally {
          input.value = '';
        }
      });
    }
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (this.playing || event.button > 2) return;
    const cell = this.cellFromPointer(event);
    if (!cell) return;
    this.canvas.setPointerCapture(event.pointerId);
    this.pointerDown = true;
    this.strokeStarted = false;
    if (event.button === 2) {
      this.selectedCell = cell;
      this.pick(cell);
      return;
    }
    this.applyTool(cell, true);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.playing || !this.pointerDown || this.tool === 'eyedropper') return;
    const cell = this.cellFromPointer(event);
    if (cell) this.applyTool(cell, false);
  };

  private readonly onPointerUp = (): void => {
    this.pointerDown = false;
    this.strokeStarted = false;
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.playing) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'z') { event.preventDefault(); event.shiftKey ? this.redo() : this.undo(); return; }
    if ((event.ctrlKey || event.metaKey) && key === 'y') { event.preventDefault(); this.redo(); return; }
    if (key === 'b') this.tool = 'pencil';
    else if (key === 'e') this.tool = 'erase';
    else if (key === 'i') this.tool = 'eyedropper';
    else return;
    this.updateToolbar();
  };

  private applyTool(cell: Cell, beginStroke: boolean): void {
    this.selectedCell = cell;
    if (this.tool === 'eyedropper') {
      this.pick(cell);
      this.renderInspector();
      this.renderCanvas();
      return;
    }
    if (beginStroke || !this.strokeStarted) {
      this.pushHistory();
      this.redoStack.length = 0;
      this.strokeStarted = true;
    }
    if (this.tool === 'erase') {
      if (this.layer === 'terrain') this.level.terrain[cell.y]![cell.x] = 0x90;
      else this.removeObject(cell.x, cell.y);
    } else if (this.layer === 'terrain') {
      this.level.terrain[cell.y]![cell.x] = this.selectedTerrain;
    } else {
      this.setObject(cell.x, cell.y, this.selectedObject);
    }
    this.renderInspector();
    this.renderCanvas();
  }

  private pick(cell: Cell): void {
    if (this.layer === 'terrain') this.selectedTerrain = this.level.terrain[cell.y]![cell.x]!;
    else this.selectedObject = this.objectAt(cell.x, cell.y)?.id ?? 0xff;
    this.tool = 'pencil';
    this.renderPalette();
    this.updateToolbar();
  }

  private objectAt(x: number, y: number): { id: number; x: number; y: number } | undefined {
    return this.level.objects.find((object) => object.x === x && object.y === y);
  }

  private setObject(x: number, y: number, id: number): void {
    this.removeObject(x, y);
    if (id !== 0xff) this.level.objects.push({ id, x, y });
  }

  private removeObject(x: number, y: number): void {
    const index = this.level.objects.findIndex((object) => object.x === x && object.y === y);
    if (index >= 0) this.level.objects.splice(index, 1);
  }

  private pushHistory(): void {
    this.undoStack.push(serializeEditorLevel(this.level));
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
  }

  private undo(): void {
    const snapshot = this.undoStack.pop();
    if (!snapshot || this.playing) return;
    this.redoStack.push(serializeEditorLevel(this.level));
    this.level = parseEditorLevel(snapshot);
    this.selectedCell = null;
    this.refreshAll();
  }

  private redo(): void {
    const snapshot = this.redoStack.pop();
    if (!snapshot || this.playing) return;
    this.undoStack.push(serializeEditorLevel(this.level));
    this.level = parseEditorLevel(snapshot);
    this.selectedCell = null;
    this.refreshAll();
  }

  private resizeFromInputs(): void {
    if (this.playing) return;
    const width = Number(this.required<HTMLInputElement>('[data-level-width]').value);
    const height = Number(this.required<HTMLInputElement>('[data-level-height]').value);
    if (width === this.level.width && height === this.level.height) return;
    this.pushHistory();
    this.redoStack.length = 0;
    this.level = resizeEditorLevel(this.level, width, height);
    this.selectedCell = null;
    this.refreshAll();
  }

  private exportJson(): void {
    const blob = new Blob([serializeEditorLevel(this.level)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slug(this.level.name) || 'bobby-level'}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    this.setStatus('已导出 JSON');
  }

  private async share(kind: 'play' | 'edit'): Promise<void> {
    try {
      const encoded = await encodeShareLevel(this.level);
      const origin = this.options.shareOrigin ?? location.origin;
      const path = kind === 'play' ? '/play' : '/edit';
      const url = `${origin}${path}#map=${encodeURIComponent(encoded)}`;
      if (url.length > 8000) {
        this.setStatus(`分享链接约 ${Math.round(url.length / 1024)} KB，建议改用 Export JSON。`, true);
        return;
      }
      await copyText(url);
      this.setStatus(kind === 'play' ? '已复制“直接游玩”链接' : '已复制“继续编辑”链接');
    } catch (error) {
      this.setStatus(`生成分享链接失败：${error instanceof Error ? error.message : String(error)}`, true);
    }
  }

  private async startPlay(): Promise<void> {
    if (this.playing) return;
    this.playing = true;
    this.updateToolbar();
    this.canvasShell.classList.add('playing');
    this.status.textContent = '正在载入测试…';
    const audio = this.options.audio ?? new NullAudioBackend();
    this.game = new Game({
      canvas: this.canvas,
      audio,
      assets: {
        atlasUrl: this.options.atlasUrl,
        ...(this.options.animationAtlasUrl ? { animationAtlasUrl: this.options.animationAtlasUrl } : {}),
        bobbyUrls: this.options.bobbyUrls,
        ...(this.options.mowerBobbyUrl ? { mowerBobbyUrl: this.options.mowerBobbyUrl } : {}),
        ...(this.options.kiteUrl ? { kiteUrl: this.options.kiteUrl } : {}),
        sourceTileSize: TILE_SOURCE_SIZE
      }
    });
    this.gameInput = new InputController(this.game);
    await this.game.loadLevel(toLevelData(structuredClone(this.level)));
    this.game.on('change', () => {
      if (!this.game?.hasLevel) return;
      const world = this.game.world;
      const objective = `${world.objectiveTotal - world.objectiveRemaining}/${world.objectiveTotal}`;
      this.status.textContent = world.completed
        ? `✓ 测试通关 · 目标 ${objective}`
        : world.dead
          ? `✕ ${world.state.deathReason ?? '测试失败'}`
          : `Play Test · Bobby ${world.player.x},${world.player.y} · 目标 ${objective}`;
    });
    this.status.textContent = 'Play Test · WASD / 方向键 / Swipe · Stop 返回编辑';
  }

  private stopPlay(): void {
    if (!this.playing && !this.game) return;
    this.gameInput?.destroy();
    this.gameInput = null;
    this.game?.destroy();
    this.game = null;
    this.playing = false;
    this.canvasShell?.classList.remove('playing');
    if (this.status) this.status.textContent = '';
    if (this.canvas) this.renderCanvas();
    if (this.root.isConnected) this.updateToolbar();
  }

  private cellFromPointer(event: PointerEvent): Cell | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / EDIT_TILE_SIZE);
    const y = Math.floor((event.clientY - rect.top) / EDIT_TILE_SIZE);
    if (x < 0 || y < 0 || x >= this.level.width || y >= this.level.height) return null;
    return { x, y };
  }

  private setStatus(message: string, error = false): void {
    this.status.textContent = message;
    this.status.classList.toggle('error', error);
    if (!this.playing) setTimeout(() => {
      if (!this.playing && this.status.textContent === message) this.status.textContent = '';
    }, 2600);
  }

  private required<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Editor 缺少 DOM：${selector}`);
    return element;
  }
}

function idNameMap(values: Record<string, number>): Map<number, string> {
  const map = new Map<number, string>();
  for (const [name, id] of Object.entries(values)) if (!map.has(id)) map.set(id, name);
  return map;
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' })[char] ?? char);
}
function escapeAttribute(value: string): string { return escapeHtml(value).replaceAll("'", '&#39;'); }

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}
