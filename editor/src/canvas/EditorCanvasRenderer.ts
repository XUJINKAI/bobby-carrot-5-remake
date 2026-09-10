import {
  createBuiltinEntityCatalog,
  drawVisualComposition,
  prepareCanvas,
  resolveDevicePixelRatio,
  SpatialVisualQuery,
  visualRegistry as builtinVisualRegistry,
  type EntityCatalog,
  type ImageManager,
  type VisualRegistry,
  type VisualQuery,
  type VisualRenderPass,
} from "@bobby/engine";
import { resolveDeletionTarget } from "../authoring/deletion.js";
import { createPlacementPreview } from "../authoring/EditorPlacementPreview.js";
import {
  entityCells,
  resolvePlacement,
  type Cell,
} from "../authoring/entityPlacement.js";
import {
  EditorPreview,
  type EditorPresenceInspection,
} from "../authoring/EditorPreview.js";
import { selectionRect } from "../authoring/selection.js";
import { isSurfaceEntityType } from "../authoring/surfaceAuthoring.js";
import { builtinEditorDefinition } from "../definitions/builtin.js";
import type {
  EditorDefinition,
  EditorPlacementPreset,
  EditorSelection,
  EditorTool,
} from "../definitions/types.js";
import type { EditorMap } from "../level/types.js";
import type { EditorViewportState } from "./EditorViewport.js";

export const EDITOR_TILE_SIZE = 38;

export interface EditorCanvasRenderState {
  level: EditorMap;
  tool: EditorTool;
  placement: EditorPlacementPreset | null;
  selection: EditorSelection | null;
  hover: Cell | null;
  viewport: Readonly<EditorViewportState>;
}

interface EditorRenderItem {
  inspection: EditorPresenceInspection;
  x: number;
  y: number;
}

interface EditorStackBadge {
  x: number;
  y: number;
  count: number;
}

export class EditorCanvasRenderer {
  private preview: EditorPreview | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly images: ImageManager,
    private readonly catalog: EntityCatalog = createBuiltinEntityCatalog(),
    private readonly visuals: VisualRegistry = builtinVisualRegistry,
    private readonly editor: EditorDefinition = builtinEditorDefinition,
    private readonly interactionCanvas: HTMLCanvasElement = canvas,
  ) {}

  async load(): Promise<void> {
    await this.images.preload();
  }

  render(state: EditorCanvasRenderState): void {
    const { level } = state;
    const cssWidth = level.width * EDITOR_TILE_SIZE;
    const cssHeight = level.height * EDITOR_TILE_SIZE;
    const deviceScale = resolveDevicePixelRatio();
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
    this.canvas.style.cursor =
      state.tool === "select"
        ? "default"
        : state.tool === "erase"
          ? "crosshair"
          : "copy";
    const context = this.canvas.getContext("2d");
    if (!context) return;
    prepareCanvas(
      this.canvas,
      context,
      cssWidth,
      cssHeight,
      deviceScale,
    );
    context.fillStyle = "#09110c";
    context.fillRect(0, 0, cssWidth, cssHeight);

    const preview = new EditorPreview(level, this.catalog);
    this.preview = preview;
    const visualQuery = new SpatialVisualQuery(preview.entities, preview.spatial);
    const passes: Record<VisualRenderPass, EditorRenderItem[]> = {
      world: [],
      player: [],
      effect: [],
    };
    const stackBadges: EditorStackBadge[] = [];
    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const inspections = preview.inspectCell(x, y).presences;
        for (const inspection of inspections) {
          passes[this.visuals.renderPassFor(inspection.definition)].push({
            inspection,
            x,
            y,
          });
        }
        const paletteCount = new Set(
          inspections
            .filter((item) => !isSurfaceEntityType(item.entity.type))
            .map((item) => item.ref.index),
        ).size;
        if (paletteCount >= 2) stackBadges.push({ x, y, count: paletteCount });
      }
    }
    for (const pass of ["world", "player", "effect"] as const)
      for (const item of passes[pass])
        this.drawPresence(
          context,
          visualQuery,
          item.inspection,
          item.x,
          item.y,
          deviceScale,
        );
    this.drawStackBadges(context, stackBadges);

    if (this.interactionCanvas === this.canvas)
      this.drawInteraction(context, state, preview, deviceScale);
    else this.renderInteraction(state);
  }

  private drawStackBadges(
    context: CanvasRenderingContext2D,
    badges: readonly EditorStackBadge[],
  ): void {
    context.save();
    context.font = "700 10px ui-monospace, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (const badge of badges) {
      const label = String(badge.count);
      const width = Math.max(16, 8 + label.length * 7);
      const left = (badge.x + 1) * EDITOR_TILE_SIZE - width - 2;
      const top = badge.y * EDITOR_TILE_SIZE + 2;
      context.fillStyle = "#082f59";
      context.strokeStyle = "#8ee7ff";
      context.lineWidth = 1;
      context.fillRect(left, top, width, 16);
      context.strokeRect(left, top, width, 16);
      context.fillStyle = "#ffffff";
      context.fillText(label, left + width / 2, top + 8);
    }
    context.restore();
  }

  renderInteraction(state: EditorCanvasRenderState): void {
    const preview = this.preview;
    if (this.interactionCanvas === this.canvas || !preview || preview.level !== state.level) {
      this.render(state);
      return;
    }
    this.canvas.style.cursor = state.tool === "select"
      ? "default"
      : state.tool === "erase" ? "crosshair" : "copy";
    const context = this.interactionCanvas.getContext("2d");
    if (!context) return;
    const width = state.level.width * EDITOR_TILE_SIZE;
    const height = state.level.height * EDITOR_TILE_SIZE;
    const deviceScale = resolveDevicePixelRatio();
    this.interactionCanvas.style.width = `${width}px`;
    this.interactionCanvas.style.height = `${height}px`;
    prepareCanvas(this.interactionCanvas, context, width, height, deviceScale);
    context.clearRect(0, 0, width, height);
    this.drawInteraction(context, state, preview, deviceScale);
  }

  private drawInteraction(
    context: CanvasRenderingContext2D,
    state: EditorCanvasRenderState,
    preview: EditorPreview,
    deviceScale: number,
  ): void {
    if (state.selection) {
      const rect = selectionRect(state.selection);
      context.fillStyle = "rgba(20,105,185,.28)";
      context.fillRect(
        rect.left * EDITOR_TILE_SIZE,
        rect.top * EDITOR_TILE_SIZE,
        rect.width * EDITOR_TILE_SIZE,
        rect.height * EDITOR_TILE_SIZE,
      );
      context.strokeStyle = "#42b8ff";
      context.lineWidth = 3;
      context.strokeRect(
        rect.left * EDITOR_TILE_SIZE + 1.5,
        rect.top * EDITOR_TILE_SIZE + 1.5,
        rect.width * EDITOR_TILE_SIZE - 3,
        rect.height * EDITOR_TILE_SIZE - 3,
      );
    }
    const hover = state.hover;
    if (!hover) return;
    if (state.tool === "place" && state.placement) {
      this.drawPlacementGhost(context, state, preview, deviceScale);
      return;
    }
    if (state.tool === "erase") {
      const ref = resolveDeletionTarget(
        state.level,
        this.catalog,
        hover,
        this.editor,
        preview,
      );
      if (ref) {
        context.fillStyle = "rgba(90,170,255,.26)";
        for (const cell of entityCells(preview, ref))
          context.fillRect(
            cell.x * EDITOR_TILE_SIZE,
            cell.y * EDITOR_TILE_SIZE,
            EDITOR_TILE_SIZE,
            EDITOR_TILE_SIZE,
          );
      }
    }
    context.strokeStyle = "#99d6ff";
    context.lineWidth = 2;
    context.strokeRect(
      hover.x * EDITOR_TILE_SIZE + 1,
      hover.y * EDITOR_TILE_SIZE + 1,
      EDITOR_TILE_SIZE - 2,
      EDITOR_TILE_SIZE - 2,
    );
  }

  private drawPlacementGhost(
    context: CanvasRenderingContext2D,
    state: EditorCanvasRenderState,
    preview: EditorPreview,
    deviceScale: number,
  ): void {
    const hover = state.hover;
    const placement = state.placement;
    if (!hover || !placement) return;
    const plan = resolvePlacement(
      state.level,
      this.catalog,
      placement,
      hover,
      this.editor,
      preview,
    );
    if (plan.replace.length > 0) {
      context.fillStyle = "rgba(90,170,255,.26)";
      for (const ref of plan.replace)
        for (const cell of entityCells(preview, ref))
          context.fillRect(
            cell.x * EDITOR_TILE_SIZE,
            cell.y * EDITOR_TILE_SIZE,
            EDITOR_TILE_SIZE,
            EDITOR_TILE_SIZE,
          );
    }
    if (plan.valid) {
      const ghost = createPlacementPreview(preview, plan);
      context.globalAlpha = 0.55;
      for (const inspection of ghost.inspections)
        this.drawPresence(
          context,
          ghost.query,
          inspection,
          inspection.presence.cell.x,
          inspection.presence.cell.y,
          deviceScale,
        );
      context.globalAlpha = 1;
    }
    context.strokeStyle = !plan.valid
      ? "#ff8e8e"
      : plan.warnings.length > 0
        ? "#f5bd67"
        : "#99d6ff";
    context.lineWidth = 2;
    context.strokeRect(
      hover.x * EDITOR_TILE_SIZE + 1,
      hover.y * EDITOR_TILE_SIZE + 1,
      EDITOR_TILE_SIZE - 2,
      EDITOR_TILE_SIZE - 2,
    );
  }

  private drawPresence(
    context: CanvasRenderingContext2D,
    query: VisualQuery,
    inspection: EditorPresenceInspection,
    x: number,
    y: number,
    deviceScale: number,
  ): void {
    const entity = query.entity(inspection.presence.entityId);
    if (!entity) return;
    const resolveContext = { entity, presence: inspection.presence, query };
    const composition =
      this.editor.entities?.[inspection.entity.type]?.editorVisual?.(resolveContext) ??
      this.visuals.resolve(inspection.definition, resolveContext);
    drawVisualComposition(
      context,
      this.images,
      composition,
      x * EDITOR_TILE_SIZE,
      y * EDITOR_TILE_SIZE,
      EDITOR_TILE_SIZE,
      deviceScale,
    );
  }
}
