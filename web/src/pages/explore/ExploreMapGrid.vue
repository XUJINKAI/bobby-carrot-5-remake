<script setup lang="ts">
import type {
  MapCollectionCardSize,
  MapCollectionMap,
} from "../../services/catalog/catalog.js";
import ExploreMapCard from "./ExploreMapCard.vue";

defineProps<{
  collectionId: string;
  maps: MapCollectionMap[];
  completedIds: Set<string>;
  cardSize: MapCollectionCardSize;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <div
    class="explore-map-grid"
    :class="`card-size-${cardSize}`"
    :data-card-size="cardSize"
  >
    <ExploreMapCard
      v-for="map in maps"
      :key="map.id"
      :collection-id="collectionId"
      :map="map"
      :completed="completedIds.has(map.id)"
      :card-size="cardSize"
      @navigate="emit('navigate', $event)"
    />
  </div>
</template>

<style scoped>
.explore-map-grid {
  display: grid;
}

.explore-map-grid.card-size-small {
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 7px;
}

.explore-map-grid.card-size-medium {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.explore-map-grid.card-size-big {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

@media (max-width: 700px) {
  .explore-map-grid.card-size-small {
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  }

  .explore-map-grid.card-size-medium {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .explore-map-grid.card-size-big {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}
</style>
