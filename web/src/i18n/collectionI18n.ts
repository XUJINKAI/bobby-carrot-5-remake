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

export function collectionFilterName(
  collectionId: string,
  filterId: string,
): string {
  return collectionTextOrId(
    `collections.${collectionId}.filters.${filterId}.name`,
    filterId,
  );
}

export function collectionFilterOptionName(
  collectionId: string,
  filterId: string,
  optionId: string,
): string {
  return collectionTextOrId(
    `collections.${collectionId}.filters.${filterId}.options.${optionId}`,
    optionId,
  );
}

function collectionKey(
  collectionId: string,
  field: CollectionTextField,
): CollectionTranslationKey {
  return `collections.${collectionId}.${field}` as CollectionTranslationKey;
}

function collectionTextOrId(key: string, fallback: string): string {
  const translationKey = key as CollectionTranslationKey;
  return webHasTranslation(translationKey) ? webT(translationKey) : fallback;
}
