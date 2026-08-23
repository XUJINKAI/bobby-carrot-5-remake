import {
  Game,
  InputController,
  NullAudioBackend,
  ObjectId,
  Terrain,
  inspectObjectDefinition,
  inspectTerrainDefinition,
  objectAtlasCell,
  terrainAtlasCell,
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
  /** 返回玩家 Web；Editor 自身不负责路由。 */
  onClose?: () => void;
  /** 生成游玩链接时使用，默认 location.origin。 */
  shareOrigin?: string;
}

interface Cell { x: number; y: number; }
interface StampCell { dx: number; dy: number; type: ObjectType; }
interface TerrainPaletteItem { kind: 'terrain'; type: TerrainType; }
interface ObjectPaletteItem { kind: 'object'; type: ObjectType; }
interface StampPaletteItem { kind: 'stamp'; id: string; name: string; cells: readonly StampCell[]; }
type PaletteItem = TerrainPaletteItem | ObjectPaletteItem | StampPaletteItem;

type PointerButton = 0 | 2 | null;

const TILE_SOURCE_SIZE = 48;
const EDIT_TILE_SIZE = 38;
const HISTORY_LIMIT = 100;
const PALETTE_SIZES = [32, 40, 48, 56, 64] as const;
const DEFAULT_PALETTE_SIZE = 48;
const PALETTE_SIZE_KEY = 'bobby.editor.paletteSize';

const terrainNames = semanticNameMap(Terrain);
const objectNames = semanticNameMap(ObjectId);

const STAMPS: readonly StampPaletteItem[] = [
  {
    kind: 'stamp', id: 'dragon', name: 'Dragon',
    cells: [
      { dx: -1, dy: 0, type: ObjectId.DRAGON_HEAD_BASE },
      { dx: 0, dy: 0, type: ObjectId.DRAGON_BODY },
      { dx: 1, dy: 0, type: ObjectId.DRAGON_TAIL }
    ]
  },
  {
    kind: 'stamp', id: 'sandman', name: 'Sandman',
    cells: [{ dx: 0, dy: 0, type: ObjectId.SANDMAN }, { dx: 0, dy: 1, type: ObjectId.SANDMAN_BODY }]
  },
  {
    kind: 'stamp', id: 'dream-machine', name: 'Dream Machine',
    cells: [{ dx: 0, dy: 0, type: ObjectId.DREAM_MACHINE }, { dx: 0, dy: 1, type: ObjectId.DREAM_MACHINE_BODY }]
  },
  {
    kind: 'stamp', id: 'beaver', name: 'Beaver',
    cells: [{ dx: 0, dy: 0, type: ObjectId.BEAVER_BASE }, { dx: 0, dy: 1, type: ObjectId.BEAVER_BODY }]
  }
];

const STAMP_COMPONENTS = new Set<ObjectType>(STAMPS.flatMap((stamp) => stamp.cells.map((cell) => cell.type)));
const GROUP_ORDER = ['地面', '水域', '障碍物', '机关', '目标与标记', '道具', '载具与动态', '角色与大型对象', '其他'] as const;

export class BobbyEditor {
  private readonly root: HTMLElement;
  private readonly options: BobbyEditorOptions;
  private level: EditorLevel;
  private selection: PaletteItem = { kind: 'terrain', type: Terrain.GROUND_C };
  private selectedCell: Cell | null = null;
  private hoverCell: Cell | null = null;
  private pointerButton: PointerButton = null;
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
            <p class="editor-muted">链接使用 bc5r metadata + 原版 DAT level record，再压缩为 base64url；同一链接也可以重新进入编辑器。</p>
          </div>
          <div class="editor-dialog-actions">
            <button class="editor-btn" data-editor="import">导入 JSON</button>
            <button class="editor-btn" data-editor="export">导出 JSON</button>
          </div>
        </dialog>

        <dialog class="editor-dialog editor-help-dialog" data-editor-help-dialog>
          <header><strong>操作帮助</strong><button class="editor-mini-btn" data-dialog-close>×</button></header>
          <div class="editor-help-list">
            <p><strong>左键 / 左键拖动</strong><span>放置当前选择的 Terrain、Object 或大型素材 Stamp。</span></p>
            <p><strong>右键 / 右键拖动</strong><span>只删除 Object；Terrain 永远不会被“擦空”。</span></p>
            <p><strong>鼠标移动</strong><span>地图格上会显示当前素材的半透明预览；擦除时改为红色橡皮标记。</span></p>
            <p><strong>素材 − / +</strong><span>缩小或放大素材格，选择会保存在本机。</span></p>
            <p><strong>Ctrl/Cmd + Z</strong><span>撤销；Ctrl/Cmd + Y 或 Ctrl/Cmd + Shift + Z 重做。</span></p>
            <p><strong>大型素材</strong><span>Dragon 等只在“放置瞬间”批量写入多个普通 Object Tile；之后各格互不关联，可自然覆盖或逐格擦除。</span></p>
            <p><strong>右栏</strong><span>查看地图尺寸、校验、当前素材 Definition，以及鼠标所在格的 Terrain/Object inspect 信息。</span></p>
          </div>
        </dialog>
      </div>`;

    this.canvas = this.required<HTMLCanvasElement>('[data-editor-canvas]');
    this.canvasShell = this.required<HTMLElement>('[data-editor-map-shell]');
    this.status = this.required<HTMLElement>('[data-editor-status]');
    this.inspector = this.required<HTMLElement>('[data-editor-inspector]');
    this.palette = this.required<HTMLElement>('[data-editor-palette]');

    this.root.addEventListener('click', this.onRootClick);
    this.root.addEventListener('input', this.onRootInput);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.addEventListener('lostpointercapture', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
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
    for (const object of this.level.objects) {
      const terrain = this.level.terrain[object.y]?.[object.x];
      if (terrain === Terrain.HIGH_GRASS || terrain === Terrain.HIGH_GRASS_OBJECTIVE) continue;
      this.drawObjectTile(context, object.type, object.x, object.y);
    }

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

  private drawPointerPreview(context: CanvasRenderingContext2D, cell: Cell): void {
    context.save();
    if (this.pointerButton === 2) {
      context.fillStyle = 'rgba(190,58,50,.34)';
      context.fillRect(cell.x * EDIT_TILE_SIZE, cell.y * EDIT_TILE_SIZE, EDIT_TILE_SIZE, EDIT_TILE_SIZE);
      context.strokeStyle = 'rgba(255,175,165,.95)';
      context.lineWidth = 3;
      const pad = 10;
      const left = cell.x * EDIT_TILE_SIZE + pad;
      const top = cell.y * EDIT_TILE_SIZE + pad;
      const right = (cell.x + 1) * EDIT_TILE_SIZE - pad;
      const bottom = (cell.y + 1) * EDIT_TILE_SIZE - pad;
      context.beginPath(); context.moveTo(left, top); context.lineTo(right, bottom); context.moveTo(right, top); context.lineTo(left, bottom); context.stroke();
      context.restore();
      return;
    }

    context.globalAlpha = .58;
    if (this.selection.kind === 'terrain') this.drawTerrainTile(context, this.selection.type, cell.x, cell.y);
    else if (this.selection.kind === 'object') this.drawObjectTile(context, this.selection.type, cell.x, cell.y);
    else {
      for (const part of this.selection.cells) {
        const x = cell.x + part.dx;
        const y = cell.y + part.dy;
        if (this.inBounds(x, y)) this.drawObjectTile(context, part.type, x, y);
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
      .filter((type) => type !== ObjectId.EMPTY && !STAMP_COMPONENTS.has(type))
      .map((type): ObjectPaletteItem => ({ kind: 'object', type }));
    return [...terrain, ...objects, ...STAMPS];
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
    if (item.kind === 'stamp') {
      return `<button class="editor-palette-tile editor-stamp-tile${active}" data-palette-key="${escapeAttribute(key)}" title="${escapeAttribute(name)} · Editor Stamp">${this.renderStampThumbnail(item)}</button>`;
    }
    const source = item.kind === 'terrain' ? terrainAtlasCell(item.type) : objectAtlasCell(item.type);
    return `<button class="editor-palette-tile${active}" data-palette-key="${escapeAttribute(key)}" title="${escapeAttribute(name)} · ${escapeAttribute(item.type)}" style="${atlasBackgroundStyle(source, this.paletteSize, this.options.atlasUrl)}"></button>`;
  }

  private renderStampThumbnail(stamp: StampPaletteItem): string {
    const minX = Math.min(...stamp.cells.map((cell) => cell.dx));
    const maxX = Math.max(...stamp.cells.map((cell) => cell.dx));
    const minY = Math.min(...stamp.cells.map((cell) => cell.dy));
    const maxY = Math.max(...stamp.cells.map((cell) => cell.dy));
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const cellSize = Math.max(8, Math.floor((this.paletteSize - 8) / Math.max(width, height)));
    const totalWidth = width * cellSize;
    const totalHeight = height * cellSize;
    const leftBase = Math.floor((this.paletteSize - totalWidth) / 2);
    const topBase = Math.floor((this.paletteSize - totalHeight) / 2);
    return stamp.cells.map((cell) => {
      const source = objectAtlasCell(cell.type);
      const left = leftBase + (cell.dx - minX) * cellSize;
      const top = topBase + (cell.dy - minY) * cellSize;
      return `<span class="editor-stamp-sprite" style="left:${left}px;top:${top}px;width:${cellSize}px;height:${cellSize}px;${atlasBackgroundStyle(source, cellSize, this.options.atlasUrl)}"></span>`;
    }).join('');
  }

  private renderSelectedTile(): void {
    const target = this.required<HTMLElement>('[data-editor-selected]');
    const name = paletteItemName(this.selection);
    const kind = this.selection.kind === 'terrain' ? 'Terrain' : this.selection.kind === 'object' ? 'Object' : 'Stamp';
    const id = this.selection.kind === 'stamp' ? this.selection.id : this.selection.type;
    target.innerHTML = `<strong>${escapeHtml(name)}</strong><span>${kind} · ${escapeHtml(id)}</span>`;
  }

  private renderInspector(): void {
    const issues = validateEditorLevel(this.level);
    const cell = this.selectedCell;
    const terrain = cell ? this.level.terrain[cell.y]?.[cell.x] ?? null : null;
    const object = cell ? this.objectAt(cell.x, cell.y)?.type ?? ObjectId.EMPTY : null;
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
        ${cell && terrain && object ? `${this.renderDefinition('Terrain', inspectTerrainDefinition(terrain))}${this.renderDefinition('Object', inspectObjectDefinition(object))}` : '<p class="editor-muted">把鼠标移到地图格上查看 Terrain / Object Definition。</p>'}
      </section>`;
  }

  private renderSelectionInspection(): string {
    if (this.selection.kind === 'terrain') return this.renderDefinition('Terrain', inspectTerrainDefinition(this.selection.type));
    if (this.selection.kind === 'object') return this.renderDefinition('Object', inspectObjectDefinition(this.selection.type));
    const parts = this.selection.cells.map((cell) => `${cell.dx >= 0 ? '+' : ''}${cell.dx},${cell.dy >= 0 ? '+' : ''}${cell.dy} · ${cell.type}`).join('<br>');
    return `<article class="editor-definition editor-stamp-definition">
      <header><strong>${escapeHtml(this.selection.name)}</strong><span>Editor Stamp</span></header>
      <p>一次左键写入 ${this.selection.cells.length} 个普通 Object Tile；写入后不保存组合关系。</p>
      <div class="editor-definition-row"><span>cells</span><code>${parts}</code></div>
      ${this.renderDefinition('Anchor Object', inspectObjectDefinition(this.selection.cells.find((cell) => cell.dx === 0 && cell.dy === 0)?.type ?? this.selection.cells[0]!.type))}
    </article>`;
  }

  private renderDefinition(label: string, definition: TileDefinitionInspection): string {
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
    if (this.playing || (event.button !== 0 && event.button !== 2)) return;
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
    if (this.pointerButton !== null) return;
    this.hoverCell = null;
    this.renderCanvas();
  };

  private readonly onPointerUp = (): void => {
    this.pointerButton = null;
    this.lastStrokeCell = null;
    this.canvas?.classList.remove('erasing');
    if (!this.playing) this.renderCanvas();
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (this.playing) return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'z') { event.preventDefault(); event.shiftKey ? this.redo() : this.undo(); return; }
    if ((event.ctrlKey || event.metaKey) && key === 'y') { event.preventDefault(); this.redo(); }
  };

  private applyPointerAction(cell: Cell): void {
    const key = `${cell.x},${cell.y}`;
    if (key === this.lastStrokeCell) return;
    this.lastStrokeCell = key;
    this.selectedCell = cell;
    if (this.pointerButton === 2) this.removeObject(cell.x, cell.y);
    else if (this.selection.kind === 'terrain') this.level.terrain[cell.y]![cell.x] = this.selection.type;
    else if (this.selection.kind === 'object') this.setObject(cell.x, cell.y, this.selection.type);
    else {
      for (const part of this.selection.cells) {
        const x = cell.x + part.dx;
        const y = cell.y + part.dy;
        if (this.inBounds(x, y)) this.setObject(x, y, part.type);
      }
    }
    this.renderInspector();
    this.renderCanvas();
  }

  private objectAt(x: number, y: number): EditorObject | undefined {
    return this.level.objects.find((object) => object.x === x && object.y === y);
  }

  private setObject(x: number, y: number, type: ObjectType): void {
    this.removeObject(x, y);
    if (type !== ObjectId.EMPTY) this.level.objects.push({ type, x, y });
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
    const name = this.required<HTMLInputElement>('[data-share-name]');
    const author = this.required<HTMLInputElement>('[data-share-author]');
    const description = this.required<HTMLTextAreaElement>('[data-share-description]');
    name.value = this.level.name;
    author.value = this.level.author ?? '';
    description.value = this.level.description ?? '';
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
      this.setStatus('已复制游玩链接；该链接也可从游戏页重新打开编辑器');
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
    this.status.textContent = 'Play Test · WASD / 方向键 / Swipe · 点击 Stop 返回编辑';
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
  if (item.kind === 'stamp') return '角色与大型对象';
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
  if (traits.has('windmill')) return '机关';
  if (traits.has('objective-carrot') || traits.has('objective-nest') || traits.has('collectible')) return '目标与标记';
  if (traits.has('pickup') || id.includes('bean')) return '道具';
  if (traits.has('dynamic') || definition.presentation.category === 'vehicle' || definition.presentation.category === 'flight' || definition.presentation.category === 'overlay') return '载具与动态';
  if (traits.has('blocking') || definition.presentation.category === 'gate' || id.startsWith('fence-') || id.includes('rock')) return '障碍物';
  return '其他';
}

function paletteKey(item: PaletteItem): string {
  return item.kind === 'stamp' ? `stamp:${item.id}` : `${item.kind}:${item.type}`;
}

function paletteItemName(item: PaletteItem): string {
  if (item.kind === 'stamp') return item.name;
  const definition = item.kind === 'terrain' ? inspectTerrainDefinition(item.type) : inspectObjectDefinition(item.type);
  return definition.presentation.name || (item.kind === 'terrain' ? terrainNames : objectNames).get(item.type) || item.type;
}

function atlasBackgroundStyle(source: { column: number; row: number }, size: number, atlasUrl: string): string {
  return `background-image:url('${escapeAttribute(atlasUrl)}');background-size:${16 * size}px ${16 * size}px;background-position:${-source.column * size}px ${-source.row * size}px;background-repeat:no-repeat;image-rendering:pixelated;`;
}

function readPaletteSize(): number {
  const value = Number(localStorage.getItem(PALETTE_SIZE_KEY));
  return PALETTE_SIZES.includes(value as typeof PALETTE_SIZES[number]) ? value : DEFAULT_PALETTE_SIZE;
}

function sameCell(a: Cell | null, b: Cell | null): boolean {
  return a?.x === b?.x && a?.y === b?.y;
}

function semanticNameMap(values: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [name, type] of Object.entries(values)) if (!map.has(type)) map.set(type, name);
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
