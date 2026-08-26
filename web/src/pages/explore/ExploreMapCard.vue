<script setup lang="ts">
import type { MapCollectionMap } from "../../services/catalog/catalog.js";
import { explorePlayPath } from "../../app/routes.js";

const props = defineProps<{
  collectionId: string;
  map: MapCollectionMap;
  completed?: boolean;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();

function primaryLabel(): string {
  const bonus = /-bonus-([12])$/.exec(props.map.id);
  if (bonus) return `BONUS ${bonus[1]}`;
  if (props.map.name.toLowerCase() !== props.map.id.toLowerCase())
    return props.map.name;
  return props.map.id.split("-").at(-1)?.toUpperCase() ?? props.map.id.toUpperCase();
}

function secondaryLabel(): string | null {
  return props.map.name.toLowerCase() !== props.map.id.toLowerCase()
    ? props.map.id.toUpperCase()
    : null;
}
</script>

<template>
  <a
    class="chapter-level explore-map-card"
    :class="{
      completed,
      'bonus-level': map.kind === 'bonus',
    }"
    :data-map-id="map.id"
    :href="explorePlayPath({ collection: collectionId, id: map.id })"
    :title="map.description || map.name"
    @click.prevent="emit('navigate', explorePlayPath({ collection: collectionId, id: map.id }))"
  >
    <span class="explore-map-card-label">{{ primaryLabel() }}</span>
    <span v-if="secondaryLabel()" class="explore-map-card-id">{{ secondaryLabel() }}</span>
    <span v-if="completed" class="done-mark" title="自由浏览中已通关">✓</span>
  </a>
</template>

<style scoped>
.explore-map-card {
  position: relative;
  min-height: 68px;
  border: 2px solid var(--bc-panel-border);
  border-radius: 4px;
  background: #064b8c;
  color: inherit;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 7px;
  text-align: center;
  transition:
    transform 0.12s ease,
    border-color 0.12s ease,
    background 0.12s ease;
}

.explore-map-card:hover,
.explore-map-card:focus-visible {
  transform: translateY(-2px);
  border-color: var(--bc-panel-border);
  background: var(--bc-active);
}

.explore-map-card.completed {
  border-color: var(--bc-highlight);
  background: #07518f;
}

.explore-map-card.bonus-level {
  outline: 1px solid rgba(247, 212, 95, 0.2);
}

.explore-map-card-label {
  max-width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 0.92rem;
  font-weight: 750;
  line-height: 1.15;
}

.explore-map-card-id {
  color: var(--muted);
  font-size: 0.62rem;
  letter-spacing: 0.04em;
}

.done-mark {
  position: absolute;
  right: 6px;
  top: 4px;
  color: var(--bc-highlight);
  font-size: 0.72rem;
}

@media (max-width: 700px) {
  .explore-map-card {
    min-height: 62px;
  }
}
</style>
