const ALLOWED_VISIBILITY = new Set([true, false, "dev"]);

export function normalizeCollectionVisibility(value, collectionId) {
  const visibility = value ?? true;
  if (!ALLOWED_VISIBILITY.has(visibility))
    throw new Error(`${collectionId}: visible 必须是 true / false / "dev"`);
  return visibility;
}

export function isCollectionVisible(visibility, development) {
  return visibility === true || (visibility === "dev" && development);
}
