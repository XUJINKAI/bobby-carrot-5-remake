<script setup lang="ts">
import type { MapCollectionSummary } from "../../services/catalog/catalog.js";
import { exploreCollectionPath } from "../../app/routes.js";

defineProps<{
  activeCollection: string;
  collections: MapCollectionSummary[];
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <nav class="explore-tabs" aria-label="自由探索地图集合">
    <a
      v-for="collection in collections"
      :key="collection.id"
      :href="exploreCollectionPath(collection.id)"
      :class="{ active: activeCollection === collection.id }"
      @click.prevent="emit('navigate', exploreCollectionPath(collection.id))"
    >{{ collection.name }}</a>
  </nav>
</template>

<style scoped>
.explore-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding: 4px 0;
}

.explore-tabs a {
  border: 3px solid var(--bc-panel-border);
  border-radius: 5px;
  background: var(--bc-panel);
  color: #fff;
  flex: 0 0 auto;
  padding: 9px 16px;
  text-decoration: none;
}

.explore-tabs a.active {
  background: var(--bc-active);
  border-color: var(--bc-panel-border);
  color: #fff;
}
</style>
