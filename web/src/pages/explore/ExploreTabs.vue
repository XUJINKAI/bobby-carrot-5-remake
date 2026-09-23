<script setup lang="ts">
import type { MapCollectionSummary } from "../../services/catalog/catalog.js";
import { exploreCollectionPath } from "../../app/routes.js";
import { webT } from "../../i18n/webI18n.js";
import { computed } from "vue";
import {
  collectionName,
  collectionTag,
} from "../../i18n/collectionI18n.js";

const props = defineProps<{
  activeCollection: string;
  collections: MapCollectionSummary[];
}>();
const emit = defineEmits<{ navigate: [path: string] }>();

const localizedCollections = computed(() =>
  props.collections.map((collection) => ({
    id: collection.id,
    name: collectionName(collection.id),
    tag: collectionTag(collection.id),
  })),
);
</script>

<template>
  <nav class="explore-tabs" :aria-label="webT('explore.tabsAria')">
    <a
      v-for="collection in localizedCollections"
      :key="collection.id"
      :href="exploreCollectionPath(collection.id)"
      :class="{
        active: activeCollection === collection.id,
      }"
      :aria-current="activeCollection === collection.id ? 'page' : undefined"
      @click.prevent="emit('navigate', exploreCollectionPath(collection.id))"
    >
      <span class="explore-tab-name">{{ collection.name }}</span>
      <span v-if="collection.tag" class="explore-tab-tag">
        {{ collection.tag }}
      </span>
    </a>
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 3px solid var(--bc-panel-border);
  border-radius: 5px;
  background: var(--bc-panel);
  color: #fff;
  flex: 0 0 auto;
  min-height: 58px;
  padding: 7px 16px;
  text-decoration: none;
}

.explore-tab-name {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.15;
}

.explore-tab-tag {
  margin-top: 3px;
  color: color-mix(in srgb, currentColor 72%, transparent);
  font-size: 0.68rem;
  font-weight: 650;
  line-height: 1.1;
}

.explore-tabs a.active {
  background: var(--bc-active);
  border-color: var(--bc-panel-border);
  color: #fff;
}

.explore-tabs a.active .explore-tab-tag {
  color: color-mix(in srgb, currentColor 82%, transparent);
}
</style>
