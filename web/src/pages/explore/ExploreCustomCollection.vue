<script setup lang="ts">
import type { MapCollectionIndex } from "../../services/catalog/catalog.js";
import ExploreMapCard from "./ExploreMapCard.vue";

defineProps<{
  collection: MapCollectionIndex;
  completedIds: Set<string>;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <section class="explore-custom-collection">
    <div class="explore-map-grid">
      <ExploreMapCard
        v-for="map in collection.maps"
        :key="map.id"
        :collection-id="collection.id"
        :map="map"
        :completed="completedIds.has(map.id)"
        @navigate="emit('navigate', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.explore-map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 7px;
}

@media (max-width: 700px) {
  .explore-map-grid {
    grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  }
}
</style>
