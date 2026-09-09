export interface ExploreMapRef {
  collection: string;
  id: string;
}

export function mapAssetUrl(collection: string, id: string): string {
  return `/assets/maps/${encodeURIComponent(collection)}/${encodeURIComponent(id)}.json`;
}

export function replayAssetUrl(collection: string, id: string): string {
  return `/assets/replays/${encodeURIComponent(collection)}/${encodeURIComponent(id)}.json`;
}

export function parseMapPlayUrl(
  pathname: string,
): ExploreMapRef | null {
  const match = pathname.match(/^\/explore\/play\/([^/]+)\/([^/]+)\/?$/);
  if (!match) return null;
  const collection = decodeURIComponent(match[1] ?? "");
  const id = decodeURIComponent(match[2] ?? "");
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(collection)) return null;
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(id)) return null;
  return { collection, id };
}

export function parseEditorMapHash(hash: string): ExploreMapRef | null {
  const value = new URLSearchParams(hash.replace(/^#/, "")).get("map");
  if (!value) return null;
  const [collectionPart, idPart, extra] = value.split("/");
  if (!collectionPart || !idPart || extra !== undefined) return null;
  const collection = decodeURIComponent(collectionPart);
  const id = decodeURIComponent(idPart);
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(collection)) return null;
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(id)) return null;
  return { collection, id };
}

export function exploreCollectionPath(collection: string): string {
  return collection.toLowerCase() === "original"
    ? "/explore"
    : `/explore/${encodeURIComponent(collection)}`;
}

export function explorePlayPath(ref: ExploreMapRef): string {
  return `/explore/play/${encodeURIComponent(ref.collection)}/${encodeURIComponent(ref.id)}`;
}

export function editorMapPath(ref: ExploreMapRef): string {
  return `/edit#map=${encodeURIComponent(ref.collection)}/${encodeURIComponent(ref.id)}`;
}
