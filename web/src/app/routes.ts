export interface ExploreMapRef {
  collection: string;
  id: string;
}

export function exploreCollectionPath(collection: string): string {
  return `/explore/${encodeURIComponent(collection)}`;
}

export function explorePlayPath(ref: ExploreMapRef): string {
  return `/explore/play/${encodeURIComponent(ref.collection)}/${encodeURIComponent(ref.id)}`;
}

export function editorMapPath(ref: ExploreMapRef): string {
  return `/edit/${encodeURIComponent(ref.collection)}/${encodeURIComponent(ref.id)}`;
}
