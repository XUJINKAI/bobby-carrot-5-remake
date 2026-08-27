import type { EntityCatalog, EntityCatalogEntry } from "@bobby/engine/authoring";
import type { EntityType } from "@bobby/model";

export interface PaletteItem { type: EntityType; }

export function paletteItems(catalog: EntityCatalog): PaletteItem[] {
  return catalog.all().filter((definition) => definition.authoring?.palette !== false).map((definition) => ({ type: definition.type }));
}

export function paletteGroups(catalog: EntityCatalog): string[] {
  return [...new Set(catalog.all().filter((definition) => definition.authoring?.palette !== false).map(groupForDefinition))];
}

export function paletteGroup(catalog: EntityCatalog, item: PaletteItem): string {
  return groupForDefinition(catalog.require(item.type));
}

export function paletteLabel(catalog: EntityCatalog, item: PaletteItem): string {
  return catalog.require(item.type).presentation.name;
}

function groupForDefinition(definition: EntityCatalogEntry): string {
  return definition.authoring?.category ?? definition.presentation.category ?? "其他";
}
