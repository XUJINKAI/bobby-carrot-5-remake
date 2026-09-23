import { siteUrl } from "../assets/gameAssets.js";
import {
  fetchJson,
  type AdventureIndex,
  type MapCollectionIndex,
  type MapCollectionsIndex,
} from "./catalog.js";

export interface ResolvedMapCollection extends MapCollectionIndex {
  id: string;
}

const EMPTY_COLLECTIONS_INDEX: MapCollectionsIndex = {
  schemaVersion: 2,
  collections: [],
};

const EMPTY_ADVENTURE_INDEX: AdventureIndex = {
  schemaVersion: 1,
  name: "Bobby Carrot 5 Remake",
  chapters: [],
  specialScenes: [],
};

/** 按产品路由分别缓存 discovery、collection 与 Adventure 索引。 */
export class CatalogRuntime {
  private collectionsIndexValue = EMPTY_COLLECTIONS_INDEX;
  private adventureValue = EMPTY_ADVENTURE_INDEX;
  private readonly collectionValues = new Map<string, ResolvedMapCollection>();
  private collectionsIndexRequest: Promise<MapCollectionsIndex> | null = null;
  private adventureRequest: Promise<AdventureIndex> | null = null;
  private readonly collectionRequests = new Map<
    string,
    Promise<ResolvedMapCollection>
  >();

  get collectionsIndex(): MapCollectionsIndex {
    return this.collectionsIndexValue;
  }

  get collections(): ResolvedMapCollection[] {
    return [...this.collectionValues.values()];
  }

  get adventure(): AdventureIndex {
    return this.adventureValue;
  }

  async loadCollectionsIndex(): Promise<MapCollectionsIndex> {
    if (this.collectionsIndexValue.collections.length > 0)
      return this.collectionsIndexValue;
    if (this.collectionsIndexRequest) return this.collectionsIndexRequest;
    const request = fetchJson<MapCollectionsIndex>(
      siteUrl("assets/maps/index.json"),
    ).then((index) => {
      if (index.schemaVersion !== 2)
        throw new Error("maps/index.json schemaVersion 必须为 2");
      this.collectionsIndexValue = index;
      return index;
    });
    this.collectionsIndexRequest = request;
    try {
      return await request;
    } catch (error) {
      this.collectionsIndexRequest = null;
      throw error;
    }
  }

  async loadCollection(id: string): Promise<ResolvedMapCollection> {
    const normalized = id.toLowerCase();
    const loaded = this.collectionValues.get(normalized);
    if (loaded) return loaded;
    const pending = this.collectionRequests.get(normalized);
    if (pending) return pending;
    const request = fetchJson<MapCollectionIndex>(
      siteUrl(`assets/maps/${normalized}/index.json`),
    ).then((index) => {
      if (index.schemaVersion !== 2)
        throw new Error(`${normalized}: collection schemaVersion 必须为 2`);
      const collection = { id: normalized, ...index };
      this.collectionValues.set(normalized, collection);
      return collection;
    });
    this.collectionRequests.set(normalized, request);
    try {
      return await request;
    } catch (error) {
      this.collectionRequests.delete(normalized);
      throw error;
    }
  }

  async loadAdventure(): Promise<AdventureIndex> {
    if (this.adventureValue.chapters.length > 0) return this.adventureValue;
    if (this.adventureRequest) return this.adventureRequest;
    const request = fetchJson<AdventureIndex>(
      siteUrl("assets/adventure/index.json"),
    ).then((index) => {
      if (index.schemaVersion !== 1)
        throw new Error("adventure/index.json schemaVersion 必须为 1");
      this.adventureValue = index;
      return index;
    });
    this.adventureRequest = request;
    try {
      return await request;
    } catch (error) {
      this.adventureRequest = null;
      throw error;
    }
  }
}
