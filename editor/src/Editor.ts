import {
  Game,
  InputController,
  NullAudioBackend,
  ObjectId,
  Terrain,
  inspectObjectDefinition,
  inspectTerrainDefinition,
  isMultiCellObject,
  isObjectLayoutPart,
  objectAtlasCell,
  objectLayoutFor,
  objectVariantCycle,
  terrainAtlasCell,
  transformObjectVariant,
  type AudioBackend,
  type ObjectType,
  type TerrainType,
  type TileDefinitionInspection
} from '@bobby/engine';
import {
  createBlankLevel,
  normalizeEditorLevel,
  parseEditorLevel,
  resizeEditorLevel,
  serializeEditorLevel,
  toLevelData,
  validateEditorLevel,
  type EditorLevel,
  type EditorObject
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
  onClose?: () => void;
  shareOrigin?: string;
}

interface Cell { x: number; y: number; }
interface OccupiedCell extends Cell { type: ObjectType; }
interface ResolvedObject {
  object: EditorObject;
  cells: OccupiedCell[];
  partType: ObjectType;
}
interface TerrainPaletteItem { kind: 'terrain'; type: TerrainType; }
interface ObjectPaletteItem { kind: 'object'; type: ObjectType; }
interface MapPanState { pointerId: number; lastX: number; lastY: number; }
type PaletteItem = TerrainPaletteItem | ObjectPaletteItem;
type PointerButton = 0 | 2 | null;

const TILE_SOURCE_SIZE = 48;
const EDIT_TILE_SIZE = 38;
const HISTORY_LIMIT = 100;
const PALETTE_SIZES = [32, 40, 48, 56, 64] as const;
const DEFAULT_PALETTE_SIZE = 48;
const PALETTE_SIZE_KEY = 'bobby.editor.paletteSize';
const MAP_ZOOM_MIN = 0.35;
const MAP_ZOOM_MAX = 2.75;
const MAP_ZOOM_STEP = 1.08;
const MAP_MARGIN = 28;

const HIDDEN_AUTHORING_OBJECTS = new Set<ObjectType>([
  ObjectId.CONSUMED_CARROT,
  ObjectId.PLANK_CRUMBLING,
  ObjectId.PLANK_FRAGMENT,
  ObjectId.ICE_MELT_1,
  ObjectId.ICE_MELT_2,
  ObjectId.ICE_MELT_3,
  ObjectId.DRAGON_ANIM_1,
  ObjectId.DRAGON_ANIM_2,
  ObjectId.BEAN_SPROUT
]);

const GROUP_ORDER = ['地面', '水域', '障碍物', '机关', '目标与标记', '道具', '载具与动态', '角色与大型对象', '其他'] as const;

export class BobbyEditor {
  private readonly root: HTMLElement;
  private readonly options: BobbyEditorOptions;
  private level: EditorLevel;
  private selection: PaletteItem = { kind: 'terrain', type: Terrain.GROUND_C };
  private selectedCell: Cell | null = null;
  private hoverCell: Cell | null = null;
  private pointerButton: PointerButton = null;
  private middlePan: MapPanState | null = null;
  private lastStrokeCell: string | null = null;
  private readonly undoStack: string[] = [];
  private readonly redoStack: string[] = [];
  private atlas: HTMLImageElement | null = null;
  private canvas!: HTMLCanvasElement;
  private canvasShell!: HTMLElement;
  private status!: HTMLElement;
  private inspector!: HTMLElement;
  private palette!: HTMLElement;
  private game: Game | null = null;
  private gameInput: InputController | null = null;
  private playing = false;
  private destroyed = false;
  private paletteSize = readPaletteSize();
  private mapZoom = 1;
  private mapPanX = 0;
  private mapPanY = 0;

  constructor(options: BobbyEditorOptions) {
    this.options = options;
    this.root = options.root;
    this.level = normalizeEditorLevel(options.level ?? createBlankLevel());
    this.mount();
    void this.loadAtlas();
  }

  getLevel(): EditorLevel { return structuredClone(this.level); }

  setLevel(level: EditorLevel): void {
    this.stopPlay();
    this.level = normalizeEditorLevel(level);
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.selectedCell = null;
    this.hoverCell = null;
    this.resetMapView();
    this.refreshAll();
  }

  destroy(): void {
    this.destroyed = true;
    this.stopPlay();
    window.removeEventListener('keydown', this.onKeyDown);
    this.canvas?.removeEventListener('wheel', this.onWheel);
    this.root.replaceChildren();
  }

  private mount(): void {
    this.root.innerHTML = `
      <div class="bobby-editor">
        <header class="editor-toolbar">
          <button class="editor-btn editor-back" data-editor="close">← 返回</button>
          <strong class="editor-title">Bobby Editor</strong>
          <span class="editor-spacer"></span>
          <button class="editor-btn editor-play" data-editor="play-toggle">▶ Play</button>
          <button class="editor-btn" data-editor="share">分享</button>
          <button class="editor-btn editor-help" data-editor="help" title="操作帮助" aria-label="操作帮助">?</button>
          <input type="file" accept="application/json,.json" data-editor-file hidden>
        </header>
        <main class="editor-body">
          <aside class="editor-palette">
            <div class="editor-palette-head">
              <div class="editor-panel-title">素材</div>
              <div class="editor-palette-zoom" aria-label="素材缩放">
                <button class="editor-mini-btn" data-editor="palette-smaller" title="缩小素材">−</button>
                <span data-editor-palette-size>${this.paletteSize}</span>
                <button class="editor-mini-btn" data-editor="palette-larger" title="放大素材">+</button>
              </div>
            </div>
            <div class="editor-selected-tile" data-editor-selected></div>
            <div class="editor-palette-groups" data-editor-palette></div>
          </aside>
          <section class="editor-map-shell" data-editor-map-shell>
            <canvas class="editor-canvas" data-editor-canvas></canvas>
            <div class="editor-play-status" data-editor-status></div>
          </section>
          <aside class="editor-inspector" data-editor-inspector></aside>
        </main>

        <dialog class="editor-dialog" data-editor-share-dialog>
          <header><strong>分享地图</strong><button class="editor-mini-btn" data-dialog-close>×</button></header>
          <label class="editor-field"><span>名称</span><input data-share-name maxlength="120"></label>
          <label class="editor-field"><span>作者</span><input data-share-author maxlength="80" placeholder="可选"></label>
          <label class="editor-field"><span>描述</span><textarea data-share-description maxlength="500" rows="3" placeholder="可选"></textarea></label>
          <div class="editor-dialog-section">
            <button class="editor-btn editor-primary" data-editor="copy-share">复制游玩链接</button>
            <p class="editor-muted">链接保存 metadata + 原版 DAT anchor record，再 deflate/base64url；从游玩页可直接重新进入本地图编辑器。</p>
          </div>
          <div class="editor-dialog-actions">
            <button class="editor-btn" data-editor="import">导入 JSON</button>
            <button class="editor-btn" data-editor="export">导出 JSON</button>
          </div>
        </dialog>

        <dialog class="editor-dialog editor-help-dialog" data-editor-help-dialog>
          <header><strong>操作帮助</strong><button class="editor-mini-btn" data-dialog-close>×</button></header>
          <div class="editor-help-list">
            <p><strong>左键 / 左键拖动</strong><span>放置当前 Terrain 或 Object。大型 Object 会按 footprint 整体预览和放置。</span></p>
            <p><strong>右键 / 右键拖动</strong><span>删除鼠标指向的完整 Object；Terrain 不受影响。</span></p>
            <p><strong>中键拖动</strong><span>拖动地图视图；Play 与 Edit 使用同一种中键平移逻辑。</span></p>
            <p><strong>鼠标滚轮</strong><span>以鼠标所在位置为中心放大 / 缩小地图。</span></p>
            <p><strong>Del</strong><span>等同右键：删除鼠标当前指向的完整 Object。</span></p>
            <p><strong>Q / E</strong><span>鼠标指向可变化 Object 时循环旋转 / 翻转 / 变体。</span></p>
            <p><strong>泛蓝高亮</strong><span>表示当前鼠标操作会删除或替换的完整 Object；指着 Dragon 尾巴也会高亮整条 Dragon。</span></p>
            <p><strong>鼠标移动</strong><span>半透明显示当前待放素材；大型 Object 的鼠标落点按定义的 cursor anchor 对齐。</span></p>
            <p><strong>素材 − / +</strong><span>缩小或放大素材格，选择保存在浏览器本机。</span></p>
            <p><strong>Ctrl/Cmd + Z</strong><span>撤销；Ctrl/Cmd + Y 或 Ctrl/Cmd + Shift + Z 重做。</span></p>
            <p><strong>右栏</strong><span>查看地图尺寸、校验、当前素材 Definition，以及鼠标格对应 Object owner 的 inspect 信息。</span></p>
          </div>
        </dialog>
      </div>`;

    this.canvas = this.required<HTMLCanvasElement>('[data-editor-canvas]');
    this.canvasShell = this.required<HTMLElement>('[data-editor-map-shell]');
    this.status = this.required<HTMLElement>('[data-editor-status]');
    this.inspector = this.required<HTMLElement>('[data-editor-inspector]');
    this.palette = this.required<HTMLElement>('[data-editor-palette]');
    this.configureEditMapCanvas();

    this.root.addEventListener('click', this.onRootClick);
    this.root.addEventListener('input', this.onRootInput);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('lostpointercapture', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    this.canvas.addEventListener('auxclick', (event) => { if (event.button === 1) event.preventDefault(); });
    window.addEventListener('keydown', this.onKeyDown);

    this.root.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
      dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    });

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
    this.applyMapView();
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
      for (let x = 0; x < this.level.width; x += 1) this.drawTerrainTile(context, this.level.terrain[y]![x]!, x, y);
    }
    for (const object of this.level.objects) this.drawPlacedObject(context, object);

    for (const object of this.affectedObjectsForHover()) this.drawBlueObjectHighlight(context, object);

    context.strokeStyle = 'rgba(255,255,255,.12)';
    context.lineWidth = 1;
    for (let x = 0; x <= this.level.width; x += 1) {
      context.beginPath(); context.moveTo(x * EDIT_TILE_SIZE + .5, 0); context.lineTo(x * EDIT_TILE_SIZE + .5, cssHeight); context.stroke();
    }
    for (let y = 0; y <= this.level.height; y += 1) {
      context.beginPath(); context.moveTo(0, y * EDIT_TILE_SIZE + .5); context.lineTo(cssWidth, y * EDIT_TILE_SIZE + .5); context.stroke();
    }

    if (this.hoverCell) this.drawPointerPreview(context, this.hoverCell);
    if (this.selectedCell) {
      context.strokeStyle = '#d8f5a6';
      context.lineWidth = 2;
      context.strokeRect(this.selectedCell.x * EDIT_TILE_SIZE + 1, this.selectedCell.y * EDIT_TILE_SIZE + 1, EDIT_TILE_SIZE - 2, EDIT_TILE_SIZE - 2);
    }
  }

  private drawPlacedObject(context: CanvasRenderingContext2D, object: EditorObject): void {
    for (const cell of this.occupiedCells(object)) {
      const terrain = this.level.terrain[cell.y]?.[cell.x];
      if (terrain === Terrain.HIGH_GRASS || terrain === Terrain.HIGH_GRASS_OBJECTIVE) continue;
      this.drawObjectTile(context, cell.type, cell.x, cell.y);
    }
  }

  private drawBlueObjectHighlight(context: CanvasRenderingContext2D, object: EditorObject): void {
    context.save();
    for (const cell of this.occupiedCells(object)) {
      context.fillStyle = 'rgba(74,151,235,.38)';
      context.fillRect(cell.x * EDIT_TILE_SIZE, cell.y * EDIT_TILE_SIZE, EDIT_TILE_SIZE, EDIT_TILE_SIZE);
      context.strokeStyle = 'rgba(145,205,255,.94)';
      context.lineWidth = 2;
      context.strokeRect(cell.x * EDIT_TILE_SIZE + 1, cell.y * EDIT_TILE_SIZE + 1, EDIT_TILE_SIZE - 2, EDIT_TILE_SIZE - 2);
    }
    context.restore();
  }

  private drawPointerPreview(context: CanvasRenderingContext2D, cell: Cell): void {
    if (this.pointerButton === 2 || this.middlePan) return;
    context.save();
    context.globalAlpha = .58;
    if (this.selection.kind === 'terrain') {
      this.drawTerrainTile(context, this.selection.type, cell.x, cell.y);
    } else {
      const anchor = this.anchorFromCursor(this.selection.type, cell);
      for (const part of this.layoutCellsAt(this.selection.type, anchor.x, anchor.y)) {
        if (this.inBounds(part.x, part.y)) this.drawObjectTile(context, part.type, part.x, part.y);
      }
      if (!this.objectFits(this.selection.type, anchor.x, anchor.y)) {
        context.globalAlpha = 1;
        context.strokeStyle = 'rgba(255,128,117,.95)';
        context.lineWidth = 3;
        for (const part of this.layoutCellsAt(this.selection.type, anchor.x, anchor.y)) {
          if (this.inBounds(part.x, part.y)) context.strokeRect(part.x * EDIT_TILE_SIZE + 2, part.y * EDIT_TILE_SIZE + 2, EDIT_TILE_SIZE - 4, EDIT_TILE_SIZE - 4);
        }
      }
    }
    context.restore();
  }

  private drawTerrainTile(context: CanvasRenderingContext2D, type: TerrainType, x: number, y: number): void {
    this.drawAtlasCell(context, terrainAtlasCell(type), x, y);
  }

  private drawObjectTile(context: CanvasRenderingContext2D, type: ObjectType, x: number, y: number): void {
    this.drawAtlasCell(context, objectAtlasCell(type), x, y);
  }

  private drawAtlasCell(context: CanvasRenderingContext2D, source: { column: number; row: number }, x: number, y: number): void {
    if (!this.atlas) return;
    context.drawImage(
      this.atlas,
      source.column * TILE_SOURCE_SIZE,
      source.row * TILE_SOURCE_SIZE,
      TILE_SOURCE_SIZE,
      TILE_SOURCE_SIZE,
      x * EDIT_TILE_SIZE,
      y * EDIT_TILE_SIZE,
      EDIT_TILE_SIZE,
      EDIT_TILE_SIZE
    );
  }

  private paletteItems(): PaletteItem[] {
    const terrain = [...new Set<TerrainType>([...Object.values(Terrain), ...this.level.terrain.flat()])]
      .map((type): TerrainPaletteItem => ({ kind: 'terrain', type }));
    const objects = [...new Set<ObjectType>([...Object.values(ObjectId), ...this.level.objects.map((object) => object.type)])]
      .filter((type) => type !== ObjectId.EMPTY && !isObjectLayoutPart(type) && !HIDDEN_AUTHORING_OBJECTS.has(type))
      .map((type): ObjectPaletteItem => ({ kind: 'object', type }));
    return [...terrain, ...objects];
  }

  private renderPalette(): void {
    const groups = new Map<string, PaletteItem[]>();
    for (const item of this.paletteItems()) {
      const group = paletteGroup(item);
      const items = groups.get(group) ?? [];
      items.push(item);
      groups.set(group, items);
    }
    this.palette.innerHTML = GROUP_ORDER
      .filter((group) => (groups.get(group)?.length ?? 0) > 0)
      .map((group) => `<section class="editor-palette-group"><h3>${group}</h3><div class="editor-palette-grid" style="--palette-size:${this.paletteSize}px">${groups.get(group)!.map((item) => this.renderPaletteItem(item)).join('')}</div></section>`)
      .join('');
    this.renderSelectedTile();
    const size = this.root.querySelector<HTMLElement>('[data-editor-palette-size]');
    if (size) size.textContent = String(this.paletteSize);
  }

  private renderPaletteItem(item: PaletteItem): string {
    const key = paletteKey(item);
    const active = key === paletteKey(this.selection) ? ' active' : '';
    const name = paletteItemName(item);
    if (item.kind === 'object' && isMultiCellObject(item.type)) {
      return `<button class="editor-palette-tile editor-multicell-tile${active}" data-palette-key="${escapeAttribute(key)}" title="${escapeAttribute(name)} · multi-cell Object">${this.renderObjectThumbnail(item.type)}</button>`;
    }
    const source = item.kind === 'terrain' ? terrainAtlasCell(item.type) : objectAtlasCell(item.type);
    return `<button class="editor-palette-tile${active}" data-palette-key="${escapeAttribute(key)}" title="${escapeAttribute(name)} · ${escapeAttribute(item.type)}" style="${atlasBackgroundStyle(source, this.paletteSize, this.options.atlasUrl)}"></button>`;
  }

  private renderObjectThumbnail(type: ObjectType): string {
    const cells = objectLayoutFor(type).cells;
    const minX = Math.min(...cells.map((cell) => cell.dx));
    const maxX = Math.max(...cells.map((cell) => cell.dx));
    const minY = Math.min(...cells.map((cell) => cell.dy));
    const maxY = Math.max(...cells.map((cell) => cell.dy));
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const cellSize = Math.max(8, Math.floor((this.paletteSize - 8) / Math.max(width, height)));
    const leftBase = Math.floor((this.paletteSize - width * cellSize) / 2);
    const topBase = Math.floor((this.paletteSize - height * cellSize) / 2);
    return cells.map((cell) => {
      const source = objectAtlasCell(cell.type);
      const left = leftBase + (cell.dx - minX) * cellSize;
      const top = topBase + (cell.dy - minY) * cellSize;
      return `<span class="editor-multicell-sprite" style="left:${left}px;top:${top}px;width:${cellSize}px;height:${cellSize}px;${atlasBackgroundStyle(source, cellSize, this.options.atlasUrl)}"></span>`;
    }).join('');
  }

  private renderSelectedTile(): void {
    const target = this.required<HTMLElement>('[data-editor-selected]');
    const name = paletteItemName(this.selection);
    const id = this.selection.type;
    const detail = this.selection.kind === 'terrain' ? 'Terrain' : isMultiCellObject(this.selection.type) ? 'Multi-cell Object' : 'Object';
    target.innerHTML = `<strong>${escapeHtml(name)}</strong><span>${detail} · ${escapeHtml(id)}</span>`;
  }

  private renderInspector(): void {
    const issues = validateEditorLevel(this.level);
    const cell = this.selectedCell;
    const terrain = cell ? this.level.terrain[cell.y]?.[cell.x] ?? null : null;
    const resolved = cell ? this.resolveObjectOwner(cell.x, cell.y) : undefined;
    this.inspector.innerHTML = `
      <section class="editor-inspector-section">
        <div class="editor-panel-title">地图</div>
        <div class="editor-size-row">
          <label class="editor-field"><span>宽</span><input data-level-width type="number" min="3" max="128" value="${this.level.width}"></label>
          <label class="editor-field"><span>高</span><input data-level-height type="number" min="3" max="128" value="${this.level.height}"></label>
          <button class="editor-btn" data-editor="resize">应用</button>
        </div>
      </section>
      <section class="editor-inspector-section">
        <div class="editor-panel-title">校验</div>
        <div class="editor-issues">${issues.length ? issues.map((issue) => `<div class="editor-issue ${issue.level}">${escapeHtml(issue.message)}</div>`).join('') : '<div class="editor-ok">地图结构正常</div>'}</div>
      </section>
      <section class="editor-inspector-section">
        <div class="editor-panel-title">当前素材</div>
        ${this.renderSelectionInspection()}
      </section>
      <section class="editor-inspector-section">
        <div class="editor-panel-title">当前格${cell ? ` · ${cell.x}, ${cell.y}` : ''}</div>
        ${cell && terrain ? `${this.renderDefinition('Terrain', inspectTerrainDefinition(terrain))}${resolved ? this.renderResolvedObject(resolved) : this.renderDefinition('Object', inspectObjectDefinition(ObjectId.EMPTY))}` : '<p class="editor-muted">把鼠标移到地图格上查看 Terrain / Object Definition。</p>'}
      </section>`;
  }

  private renderSelectionInspection(): string {
    if (this.selection.kind === 'terrain') return this.renderDefinition('Terrain', inspectTerrainDefinition(this.selection.type));
    const type = this.selection.type;
    const layout = objectLayoutFor(type);
    const variants = objectVariantCycle(type);
    const extra = `<div class="editor-definition-block"><span>layout</span><div class="editor-layout-info">${layout.cells.map((cell) => `<code>${formatOffset(cell.dx, cell.dy)} ${escapeHtml(cell.type)}</code>`).join(' ')}</div></div>
      ${isMultiCellObject(type) ? `<div class="editor-definition-row"><span>cursor</span><code>${formatOffset(layout.cursor.dx, layout.cursor.dy)}</code></div>` : ''}
      ${variants ? `<div class="editor-definition-row"><span>variants</span><code>${variants.map(escapeHtml).join(' → ')}</code></div>` : ''}`;
    return this.renderDefinition('Object', inspectObjectDefinition(type), extra);
  }

  private renderResolvedObject(resolved: ResolvedObject): string {
    const layout = objectLayoutFor(resolved.object.type);
    const variants = objectVariantCycle(resolved.object.type);
    const extra = `<div class="editor-definition-row"><span>anchor</span><code>${resolved.object.x}, ${resolved.object.y}</code></div>
      <div class="editor-definition-row"><span>part</span><code>${escapeHtml(resolved.partType)}</code></div>
      ${isMultiCellObject(resolved.object.type) ? `<div class="editor-definition-block"><span>footprint</span><div class="editor-layout-info">${layout.cells.map((cell) => `<code>${formatOffset(cell.dx, cell.dy)} ${escapeHtml(cell.type)}</code>`).join(' ')}</div></div>` : ''}
      ${variants ? '<div class="editor-definition-row"><span>edit</span><code>Q / E</code></div>' : ''}`;
    return this.renderDefinition('Object owner', inspectObjectDefinition(resolved.object.type), extra);
  }

  private renderDefinition(label: string, definition: TileDefinitionInspection, extra = ''): string {
    const source = definition.source;
    const dat = source?.datHexIds?.join(', ') ?? '—';
    const traits = definition.traits.length ? definition.traits.map((trait) => `<code>${escapeHtml(trait)}</code>`).join(' ') : '<span class="editor-muted">none</span>';
    const behaviors = definition.behaviors.length
      ? definition.behaviors.map((behavior) => {
          const config = behavior.config && Object.keys(behavior.config).length
            ? `<div class="editor-behavior-config">${Object.entries(behavior.config).map(([key, value]) => `<span>${escapeHtml(key)}=${escapeHtml(Array.isArray(value) ? value.join('|') : String(value))}</span>`).join('')}</div>`
            : '';
          return `<div class="editor-behavior"><strong>${escapeHtml(behavior.id)}</strong><span>${escapeHtml(behavior.summary)}</span>${config}</div>`;
        }).join('')
      : '<div class="editor-muted">无 Behavior</div>';
    return `<article class="editor-definition">
      <header><strong>${escapeHtml(definition.presentation.name)}</strong><span>${escapeHtml(label)}</span></header>
      <div class="editor-definition-row"><span>id</span><code>${escapeHtml(definition.id)}</code></div>
      <div class="editor-definition-row"><span>category</span><code>${escapeHtml(definition.presentation.category)}</code></div>
      <div class="editor-definition-row"><span>source</span><code>${escapeHtml(dat)}${source ? ` · ${source.confidence}` : ''}</code></div>
      ${extra}
      <div class="editor-definition-block"><span>traits</span><div class="editor-traits">${traits}</div></div>
      <div class="editor-definition-block"><span>behaviors</span><div>${behaviors}</div></div>
    </article>`;
  }

  private updateToolbar(): void {
    const play = this.required<HTMLButtonElement>('[data-editor="play-toggle"]');
    play.textContent = this.playing ? '■ Stop' : '▶ Play';
    play.classList.toggle('editor-stop', this.playing);
    this.root.querySelectorAll<HTMLButtonElement>('[data-editor="resize"],[data-palette-key],[data-editor="palette-smaller"],[data-editor="palette-larger"]').forEach((button) => {
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
    const dialogClose = target.closest<HTMLElement>('[data-dialog-close]');
    if (dialogClose) { dialogClose.closest<HTMLDialogElement>('dialog')?.close(); return; }

    const palette = target.closest<HTMLElement>('[data-palette-key]');
    if (palette && !this.playing) {
      const item = this.paletteItems().find((candidate) => paletteKey(candidate) === palette.dataset.paletteKey);
      if (!item) return;
      this.selection = item;
      this.renderPalette();
      this.renderInspector();
      this.renderCanvas();
      return;
    }

    const action = target.closest<HTMLElement>('[data-editor]')?.dataset.editor;
    if (!action) return;
    if (action === 'close') this.options.onClose?.();
    else if (action === 'play-toggle') this.playing ? this.stopPlay() : void this.startPlay();
    else if (action === 'share') { this.syncShareDialog(); this.required<HTMLDialogElement>('[data-editor-share-dialog]').showModal(); }
    else if (action === 'help') this.required<HTMLDialogElement>('[data-editor-help-dialog]').showModal();
    else if (action === 'resize') this.resizeFromInputs();
    else if (action === 'palette-smaller') this.zoomPalette(-1);
    else if (action === 'palette-larger') this.zoomPalette(1);
    else if (action === 'import') this.required<HTMLInputElement>('[data-editor-file]').click();
    else if (action === 'export') this.exportJson();
    else if (action === 'copy-share') void this.copyShareLink();
  };

  private readonly onRootInput = (event: Event): void => {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (input.matches('[data-share-name]')) this.level.name = input.value.slice(0, 120) || 'Untitled Bobby Level';
    else if (input.matches('[data-share-author]')) {
      if (input.value) this.level.author = input.value.slice(0, 80); else delete this.level.author;
    } else if (input.matches('[data-share-description]')) {
      if (input.value) this.level.description = input.value.slice(0, 500); else delete this.level.description;
    } else if (input instanceof HTMLInputElement && input.matches('[data-editor-file]') && input.files?.[0]) {
      void input.files[0].text().then((text) => {
        try {
          this.pushHistory();
          this.level = parseEditorLevel(text);
          this.redoStack.length = 0;
          this.selectedCell = null;
          this.hoverCell = null;
          this.resetMapView();
          this.setStatus('已导入语义 JSON 地图');
          this.syncShareDialog();
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
    if (this.playing) return;
    if (event.button === 1) {
      event.preventDefault();
      this.canvas.setPointerCapture(event.pointerId);
      this.middlePan = { pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    if (event.button !== 0 && event.button !== 2) return;
    const cell = this.cellFromPointer(event);
    if (!cell) return;
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    this.pointerButton = event.button as 0 | 2;
    this.lastStrokeCell = null;
    this.hoverCell = cell;
    this.selectedCell = cell;
    this.canvas.classList.toggle('erasing', this.pointerButton === 2);
    this.pushHistory();
    this.redoStack.length = 0;
    this.applyPointerAction(cell);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.playing) return;
    if (this.middlePan?.pointerId === event.pointerId) {
      const dx = event.clientX - this.middlePan.lastX;
      const dy = event.clientY - this.middlePan.lastY;
      this.middlePan.lastX = event.clientX;
      this.middlePan.lastY = event.clientY;
      if (dx !== 0 || dy !== 0) {
        this.mapPanX += dx;
        this.mapPanY += dy;
        this.applyMapView();
      }
      return;
    }
    const cell = this.cellFromPointer(event);
    const changed = !sameCell(cell, this.hoverCell);
    this.hoverCell = cell;
    if (cell && !sameCell(cell, this.selectedCell)) this.selectedCell = cell;
    if (this.pointerButton !== null && cell) this.applyPointerAction(cell);
    else if (changed) {
      this.renderInspector();
      this.renderCanvas();
    }
  };

  private readonly onPointerLeave = (): void => {
    if (this.pointerButton !== null || this.middlePan) return;
    this.hoverCell = null;
    this.renderCanvas();
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (this.middlePan?.pointerId === event.pointerId) {
      this.middlePan = null;
      this.canvas.style.cursor = '';
      const cell = this.cellFromPointer(event);
      this.hoverCell = cell;
      if (cell) this.selectedCell = cell;
      if (!this.playing) {
        this.renderInspector();
        this.renderCanvas();
      }
      return;
    }
    this.pointerButton = null;
    this.lastStrokeCell = null;
    this.canvas?.classList.remove('erasing');
    if (!this.playing) this.renderCanvas();
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (this.playing || event.deltaY === 0) return;
    event.preventDefault();
    this.zoomMapAt(event.clientX, event.clientY, event.deltaY < 0 ? MAP_ZOOM_STEP : 1 / MAP_ZOOM_STEP);
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.playing) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'z') { event.preventDefault(); event.shiftKey ? this.redo() : this.undo(); return; }
    if ((event.ctrlKey || event.metaKey) && key === 'y') { event.preventDefault(); this.redo(); return; }
    if (event.key === 'Delete' && this.deleteHoveredObject()) { event.preventDefault(); return; }
    if (key === 'q' && this.transformHoveredObject(-1)) { event.preventDefault(); return; }
    if (key === 'e' && this.transformHoveredObject(1)) event.preventDefault();
  };

  private applyPointerAction(cell: Cell): void {
    const key = `${cell.x},${cell.y}`;
    if (key === this.lastStrokeCell) return;
    this.lastStrokeCell = key;
    this.selectedCell = cell;
    if (this.pointerButton === 2) {
      this.removeOwnerAt(cell.x, cell.y);
    } else if (this.selection.kind === 'terrain') {
      this.level.terrain[cell.y]![cell.x] = this.selection.type;
    } else {
      this.placeObjectAtCursor(this.selection.type, cell);
    }
    this.renderInspector();
    this.renderCanvas();
  }

  private placeObjectAtCursor(type: ObjectType, cell: Cell): boolean {
    const anchor = this.anchorFromCursor(type, cell);
    if (!this.objectFits(type, anchor.x, anchor.y)) {
      this.setStatus('该 Object 的 footprint 超出地图边界', true);
      return false;
    }
    const affected = this.objectsIntersecting(this.layoutCellsAt(type, anchor.x, anchor.y));
    this.removeObjects(affected);
    this.level.objects.push({ type, x: anchor.x, y: anchor.y });
    return true;
  }

  private deleteHoveredObject(): boolean {
    if (!this.hoverCell) return false;
    const resolved = this.resolveObjectOwner(this.hoverCell.x, this.hoverCell.y);
    if (!resolved) return false;
    this.pushHistory();
    this.redoStack.length = 0;
    this.removeObjects([resolved.object]);
    this.renderInspector();
    this.renderCanvas();
    return true;
  }

  private transformHoveredObject(step: -1 | 1): boolean {
    if (!this.hoverCell) return false;
    const resolved = this.resolveObjectOwner(this.hoverCell.x, this.hoverCell.y);
    if (!resolved) return false;
    const next = transformObjectVariant(resolved.object.type, step);
    if (!next) return false;

    const anchor = { x: resolved.object.x, y: resolved.object.y };
    if (!this.objectFits(next, anchor.x, anchor.y)) return false;
    const placement = this.layoutCellsAt(next, anchor.x, anchor.y);
    const affected = this.objectsIntersecting(placement).filter((object) => object !== resolved.object);

    this.pushHistory();
    this.redoStack.length = 0;
    this.removeObjects([resolved.object, ...affected]);
    this.level.objects.push({ type: next, x: anchor.x, y: anchor.y });
    this.renderInspector();
    this.renderCanvas();
    return true;
  }

  private removeOwnerAt(x: number, y: number): boolean {
    const resolved = this.resolveObjectOwner(x, y);
    if (!resolved) return false;
    this.removeObjects([resolved.object]);
    return true;
  }

  private removeObjects(objects: readonly EditorObject[]): void {
    if (!objects.length) return;
    const remove = new Set(objects);
    this.level.objects = this.level.objects.filter((object) => !remove.has(object));
  }

  private resolveObjectOwner(x: number, y: number): ResolvedObject | undefined {
    for (const object of this.level.objects) {
      const cells = this.occupiedCells(object);
      const part = cells.find((cell) => cell.x === x && cell.y === y);
      if (part) return { object, cells, partType: part.type };
    }
    return undefined;
  }

  private occupiedCells(object: EditorObject): OccupiedCell[] {
    return this.layoutCellsAt(object.type, object.x, object.y);
  }

  private layoutCellsAt(type: ObjectType, anchorX: number, anchorY: number): OccupiedCell[] {
    return objectLayoutFor(type).cells.map((cell) => ({ x: anchorX + cell.dx, y: anchorY + cell.dy, type: cell.type }));
  }

  private anchorFromCursor(type: ObjectType, cursor: Cell): Cell {
    const { cursor: offset } = objectLayoutFor(type);
    return { x: cursor.x - offset.dx, y: cursor.y - offset.dy };
  }

  private objectFits(type: ObjectType, anchorX: number, anchorY: number): boolean {
    return this.layoutCellsAt(type, anchorX, anchorY).every((cell) => this.inBounds(cell.x, cell.y));
  }

  private objectsIntersecting(cells: readonly Cell[]): EditorObject[] {
    const keys = new Set(cells.map((cell) => `${cell.x},${cell.y}`));
    return this.level.objects.filter((object) => this.occupiedCells(object).some((cell) => keys.has(`${cell.x},${cell.y}`)));
  }

  private affectedObjectsForHover(): EditorObject[] {
    if (!this.hoverCell || this.middlePan) return [];
    const affected = new Set<EditorObject>();
    const direct = this.resolveObjectOwner(this.hoverCell.x, this.hoverCell.y);
    if (direct) affected.add(direct.object);
    if (this.pointerButton !== 2 && this.selection.kind === 'object') {
      const anchor = this.anchorFromCursor(this.selection.type, this.hoverCell);
      for (const object of this.objectsIntersecting(this.layoutCellsAt(this.selection.type, anchor.x, anchor.y))) affected.add(object);
    }
    return [...affected];
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
    this.hoverCell = null;
    this.refreshAll();
  }

  private redo(): void {
    const snapshot = this.redoStack.pop();
    if (!snapshot || this.playing) return;
    this.undoStack.push(serializeEditorLevel(this.level));
    this.level = parseEditorLevel(snapshot);
    this.selectedCell = null;
    this.hoverCell = null;
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
    this.hoverCell = null;
    this.refreshAll();
  }

  private zoomPalette(direction: -1 | 1): void {
    const index = PALETTE_SIZES.indexOf(this.paletteSize as typeof PALETTE_SIZES[number]);
    const current = index >= 0 ? index : PALETTE_SIZES.indexOf(DEFAULT_PALETTE_SIZE);
    const next = Math.max(0, Math.min(PALETTE_SIZES.length - 1, current + direction));
    this.paletteSize = PALETTE_SIZES[next]!;
    localStorage.setItem(PALETTE_SIZE_KEY, String(this.paletteSize));
    this.renderPalette();
  }

  private syncShareDialog(): void {
    this.required<HTMLInputElement>('[data-share-name]').value = this.level.name;
    this.required<HTMLInputElement>('[data-share-author]').value = this.level.author ?? '';
    this.required<HTMLTextAreaElement>('[data-share-description]').value = this.level.description ?? '';
  }

  private exportJson(): void {
    const blob = new Blob([serializeEditorLevel(this.level)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slug(this.level.name) || 'bobby-level'}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    this.setStatus('已导出语义 JSON');
  }

  private async copyShareLink(): Promise<void> {
    try {
      const encoded = await encodeShareLevel(this.level);
      const origin = (this.options.shareOrigin ?? location.origin).replace(/\/$/, '');
      const url = `${origin}/play#map=${encodeURIComponent(encoded)}`;
      if (url.length > 8000) {
        this.setStatus(`分享链接约 ${Math.round(url.length / 1024)} KB，建议改用导出 JSON。`, true);
        return;
      }
      await copyText(url);
      this.setStatus('已复制游玩链接；游戏页可直接重新打开编辑器');
    } catch (error) {
      this.setStatus(`生成分享链接失败：${error instanceof Error ? error.message : String(error)}`, true);
    }
  }

  private async startPlay(): Promise<void> {
    if (this.playing) return;
    this.playing = true;
    this.updateToolbar();
    this.clearEditMapCanvasStyles();
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
    this.status.textContent = 'Play Test · WASD / 方向键 / Swipe · 左键或中键拖动 · 滚轮缩放 · 点击 Stop 返回编辑';
  }

  private stopPlay(): void {
    if (!this.playing && !this.game) return;
    this.gameInput?.destroy();
    this.gameInput = null;
    this.game?.destroy();
    this.game = null;
    this.playing = false;
    this.canvasShell?.classList.remove('playing');
    this.configureEditMapCanvas();
    if (this.status) this.status.textContent = '';
    if (this.canvas) this.renderCanvas();
    if (this.root.isConnected) this.updateToolbar();
  }

  private configureEditMapCanvas(): void {
    this.canvasShell.style.overflow = 'hidden';
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${MAP_MARGIN}px`;
    this.canvas.style.top = `${MAP_MARGIN}px`;
    this.canvas.style.transformOrigin = '0 0';
    this.applyMapView();
  }

  private clearEditMapCanvasStyles(): void {
    this.middlePan = null;
    this.canvasShell.style.overflow = '';
    this.canvas.style.position = '';
    this.canvas.style.left = '';
    this.canvas.style.top = '';
    this.canvas.style.transform = '';
    this.canvas.style.transformOrigin = '';
    this.canvas.style.cursor = '';
  }

  private resetMapView(): void {
    this.mapZoom = 1;
    this.mapPanX = 0;
    this.mapPanY = 0;
    if (this.canvas && !this.playing) this.applyMapView();
  }

  private applyMapView(): void {
    if (!this.canvas || this.playing) return;
    this.canvas.style.transform = `translate3d(${this.mapPanX}px, ${this.mapPanY}px, 0) scale(${this.mapZoom})`;
  }

  private zoomMapAt(clientX: number, clientY: number, factor: number): void {
    const next = Math.min(MAP_ZOOM_MAX, Math.max(MAP_ZOOM_MIN, this.mapZoom * factor));
    if (Math.abs(next - this.mapZoom) < 0.0001) return;
    const rect = this.canvas.getBoundingClientRect();
    const localX = (clientX - rect.left) / this.mapZoom;
    const localY = (clientY - rect.top) / this.mapZoom;
    const baseLeft = rect.left - this.mapPanX;
    const baseTop = rect.top - this.mapPanY;
    this.mapPanX = clientX - baseLeft - localX * next;
    this.mapPanY = clientY - baseTop - localY * next;
    this.mapZoom = next;
    this.applyMapView();
  }

  private cellFromPointer(event: PointerEvent): Cell | null {
    const rect = this.canvas.getBoundingClientRect();
    const tileSize = EDIT_TILE_SIZE * this.mapZoom;
    const x = Math.floor((event.clientX - rect.left) / tileSize);
    const y = Math.floor((event.clientY - rect.top) / tileSize);
    return this.inBounds(x, y) ? { x, y } : null;
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.level.width && y < this.level.height;
  }

  private setStatus(message: string, error = false): void {
    this.status.textContent = message;
    this.status.classList.toggle('error', error);
    if (!this.playing) setTimeout(() => {
      if (!this.playing && this.status.textContent === message) this.status.textContent = '';
    }, 3200);
  }

  private required<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Editor 缺少 DOM：${selector}`);
    return element;
  }
}

function paletteGroup(item: PaletteItem): typeof GROUP_ORDER[number] {
  const definition = item.kind === 'terrain' ? inspectTerrainDefinition(item.type) : inspectObjectDefinition(item.type);
  const id = item.type;
  const traits = new Set(definition.traits);
  if (traits.has('water') || id.startsWith('tide-') || id.startsWith('water-')) return '水域';
  if (item.kind === 'terrain') {
    if (traits.has('switch') || traits.has('hazard') || traits.has('forced-movement') || traits.has('carousel') || traits.has('mirror')) return '机关';
    if (traits.has('start') || traits.has('exit') || id.startsWith('shop-')) return '目标与标记';
    if (traits.has('pickup')) return '道具';
    if (traits.has('blocking') || id.includes('high-grass') || id === Terrain.SNOW) return '障碍物';
    if (id.startsWith('ground-') || id.startsWith('walkable-variant-') || definition.presentation.category.includes('terrain')) return '地面';
    return '其他';
  }
  if (isMultiCellObject(item.type)) return '角色与大型对象';
  if (traits.has('windmill')) return '机关';
  if (traits.has('objective-carrot') || traits.has('objective-nest') || traits.has('collectible')) return '目标与标记';
  if (traits.has('pickup') || id.includes('bean')) return '道具';
  if (traits.has('dynamic') || definition.presentation.category === 'vehicle' || definition.presentation.category === 'flight' || definition.presentation.category === 'overlay') return '载具与动态';
  if (traits.has('blocking') || definition.presentation.category === 'gate' || id.startsWith('fence-') || id.includes('rock')) return '障碍物';
  return '其他';
}

function paletteKey(item: PaletteItem): string { return `${item.kind}:${item.type}`; }

function paletteItemName(item: PaletteItem): string {
  const definition = item.kind === 'terrain' ? inspectTerrainDefinition(item.type) : inspectObjectDefinition(item.type);
  return definition.presentation.name || item.type;
}

function atlasBackgroundStyle(source: { column: number; row: number }, size: number, atlasUrl: string): string {
  return `background-image:url('${escapeAttribute(atlasUrl)}');background-size:${16 * size}px ${16 * size}px;background-position:${-source.column * size}px ${-source.row * size}px;background-repeat:no-repeat;image-rendering:pixelated;`;
}

function readPaletteSize(): number {
  const value = Number(localStorage.getItem(PALETTE_SIZE_KEY));
  return PALETTE_SIZES.includes(value as typeof PALETTE_SIZES[number]) ? value : DEFAULT_PALETTE_SIZE;
}

function sameCell(a: Cell | null, b: Cell | null): boolean { return a?.x === b?.x && a?.y === b?.y; }
function formatOffset(dx: number, dy: number): string { return `${dx >= 0 ? '+' : ''}${dx},${dy >= 0 ? '+' : ''}${dy}`; }
function slug(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '').slice(0, 80); }
function escapeHtml(value: string): string { return value.replace(/[&<>\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' })[char] ?? char); }
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
