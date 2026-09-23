import type { CollectionTranslationKey } from "@bobby/i18n";
import { webHasTranslation, webT } from "./webI18n.js";

type CollectionTextField = "name" | "tag" | "description";

export function collectionName(collectionId: string): string {
  return webT(collectionKey(collectionId, "name"));
}

export function collectionTag(collectionId: string): string | null {
  const key = collectionKey(collectionId, "tag");
  return webHasTranslation(key) ? webT(key) : null;
}

export function collectionDescription(collectionId: string): string {
  return webT(collectionKey(collectionId, "description"));
}

function collectionKey(
  collectionId: string,
  field: CollectionTextField,
): CollectionTranslationKey {
  return `collections.${collectionId}.${field}` as CollectionTranslationKey;
}
