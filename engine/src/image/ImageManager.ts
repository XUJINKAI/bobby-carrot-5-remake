export interface ImageSliceDefinition {
  source: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LoadedImageSlice extends ImageSliceDefinition {
  image: HTMLImageElement;
}

export interface ImageManagerOptions {
  atlas: string;
  sources: Readonly<Record<string, string>>;
  slices?: Readonly<Record<string, ImageSliceDefinition>>;
  sourceTileSize?: number;
}

/**
 * Browser image runtime shared by Engine, Web and Editor.
 * It is the only component allowed to create/load HTMLImageElement instances.
 * The creator owns its lifecycle; Game only consumes the injected instance.
 */
export class ImageManager {
  readonly atlasId: string;
  readonly sourceTileSize: number;
  private readonly sources = new Map<string, string>();
  private readonly slices: Readonly<Record<string, ImageSliceDefinition>>;
  private readonly pending = new Map<string, Promise<HTMLImageElement>>();
  private readonly loaded = new Map<string, HTMLImageElement>();
  private destroyed = false;

  constructor(options: ImageManagerOptions) {
    this.atlasId = options.atlas;
    this.sourceTileSize = options.sourceTileSize ?? 48;
    for (const [id, url] of Object.entries(options.sources)) this.sources.set(id, url);
    this.slices = { ...(options.slices ?? {}) };
    if (!this.sources.has(this.atlasId))
      throw new Error(`ImageManager 缺少主图集资源：${this.atlasId}`);
  }

  get sourceIds(): readonly string[] {
    return [...this.sources.keys()];
  }

  source(id: string): string | undefined {
    return this.sources.get(id);
  }

  url(id: string): string {
    const url = this.source(id);
    if (!url) throw new Error(`未知图片资源：${id}`);
    return url;
  }

  registerSource(id: string, url: string): void {
    if (this.destroyed) throw new Error("ImageManager 已销毁");
    const existing = this.sources.get(id);
    if (existing && existing !== url)
      throw new Error(`图片资源 ${id} 已注册为其他 URL`);
    this.sources.set(id, url);
  }

  image(id: string): HTMLImageElement | null {
    return this.loaded.get(id) ?? null;
  }

  async load(id: string): Promise<HTMLImageElement> {
    if (this.destroyed) throw new Error("ImageManager 已销毁");
    const ready = this.loaded.get(id);
    if (ready) return ready;
    const existing = this.pending.get(id);
    if (existing) return existing;

    const url = this.url(id);
    const pending = loadBrowserImage(url)
      .then((image) => {
        if (!this.destroyed) this.loaded.set(id, image);
        return image;
      })
      .finally(() => this.pending.delete(id));
    this.pending.set(id, pending);
    return pending;
  }

  async preload(ids: readonly string[] = this.sourceIds): Promise<void> {
    await Promise.all(ids.map((id) => this.load(id)));
  }

  sliceDefinition(id: string): Readonly<ImageSliceDefinition> {
    const definition = this.slices[id];
    if (!definition) throw new Error(`未知图片切片：${id}`);
    return definition;
  }

  slice(id: string): LoadedImageSlice | null {
    const definition = this.sliceDefinition(id);
    const image = this.image(definition.source);
    return image ? { ...definition, image } : null;
  }

  async loadSlice(id: string): Promise<LoadedImageSlice> {
    const definition = this.sliceDefinition(id);
    const image = await this.load(definition.source);
    return { ...definition, image };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.pending.clear();
    this.loaded.clear();
    this.sources.clear();
  }
}

function loadBrowserImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  return image.decode().then(() => image);
}
