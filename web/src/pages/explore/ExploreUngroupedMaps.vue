<script setup lang="ts">
import type { MapCollectionMap } from "../../services/catalog/catalog.js";
import type { ResolvedMapCollection } from "../../app/pageContracts.js";
import ExploreMapGrid from "./ExploreMapGrid.vue";

defineProps<{
  collection: ResolvedMapCollection;
  maps: MapCollectionMap[];
  completedIds: Set<string>;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <section class="explore-ungrouped-maps">
    <ExploreMapGrid
      :collection-id="collection.id"
      :maps="maps"
      :completed-ids="completedIds"
      :card-size="collection.cardSize"
      @navigate="emit('navigate', $event)"
    />
  </section>
</template>
