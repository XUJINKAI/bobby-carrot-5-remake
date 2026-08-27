import type { EntityDefinition, EntityRegistry } from "@bobby/engine/authoring";
import type { EntityType } from "@bobby/model";

export interface PaletteItem {
  type: EntityType;
}

export function paletteItems(registry: EntityRegistry): PaletteItem[] {
  return registry
    .all()
    .filter((definition) => definition.authoring?.palette !== false)
    .map((definition) => ({ type: definition.type }));
}

export function paletteGroups(registry: EntityRegistry): string[] {
  return [
    ...new Set(
      registry
        .all()
        .filter((definition) => definition.authoring?.palette !== false)
        .map(groupForDefinition),
    ),
  ];
}

export function paletteGroup(
  registry: EntityRegistry,
  item: PaletteItem,
): string {
  return groupForDefinition(registry.require(item.type));
}

export function paletteLabel(
  registry: EntityRegistry,
  item: PaletteItem,
): string {
  return registry.require(item.type).presentation.name;
}

function groupForDefinition(definition: EntityDefinition): string {
  return (
    definition.authoring?.category ??
    definition.presentation.category ??
    "其他"
  );
}
