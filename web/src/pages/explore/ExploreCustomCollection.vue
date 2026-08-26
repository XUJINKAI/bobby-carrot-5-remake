<script setup lang="ts">
import type { MapCollectionIndex } from "../../services/catalog/catalog.js";
import ExploreMapGrid from "./ExploreMapGrid.vue";

defineProps<{
  collection: MapCollectionIndex;
  completedIds: Set<string>;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <section class="explore-custom-collection">
    <ExploreMapGrid
      :collection-id="collection.id"
      :maps="collection.maps"
      :completed-ids="completedIds"
      :card-size="collection.cardSize"
      @navigate="emit('navigate', $event)"
    />
  </section>
</template>
