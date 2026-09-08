<script setup lang="ts">
import type {
  MapCollectionCardSize,
  MapCollectionMap,
} from "../../services/catalog/catalog.js";
import { explorePlayPath } from "../../app/routes.js";
import AppIcon from "../../shared/icons/AppIcon.vue";

defineProps<{
  collectionId: string;
  map: MapCollectionMap;
  completed?: boolean;
  cardSize: MapCollectionCardSize;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <a
    class="chapter-level explore-map-card"
    :class="[
      `card-size-${cardSize}`,
      { completed },
    ]"
    :data-map-id="map.id"
    :href="explorePlayPath({ collection: collectionId, id: map.id })"
    :title="map.description || map.name"
    @click.prevent="emit('navigate', explorePlayPath({ collection: collectionId, id: map.id }))"
  >
    <span class="explore-map-card-label">{{ map.name }}</span>
    <span v-if="completed" class="done-mark" title="自由浏览中已通关">
      <AppIcon name="check" />
    </span>
  </a>
</template>

<style scoped>
.explore-map-card {
  position: relative;
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
  text-align: center;
  transition:
    transform 0.12s ease,
    border-color 0.12s ease,
    background 0.12s ease;
}

.explore-map-card.card-size-small {
  min-height: 68px;
  padding: 7px;
}

.explore-map-card.card-size-medium {
  min-height: 96px;
  padding: 12px;
}

.explore-map-card.card-size-big {
  min-height: 148px;
  padding: 16px;
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

.card-size-medium .explore-map-card-label {
  font-size: 1rem;
}

.card-size-big .explore-map-card-label {
  font-size: 1.08rem;
}

.done-mark {
  position: absolute;
  right: 6px;
  top: 4px;
  color: var(--bc-highlight);
  font-size: 0.72rem;
}

@media (max-width: 700px) {
  .explore-map-card.card-size-small {
    min-height: 62px;
  }

  .explore-map-card.card-size-medium {
    min-height: 88px;
  }

  .explore-map-card.card-size-big {
    min-height: 128px;
  }
}
</style>
