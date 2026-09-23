<script setup lang="ts">
import type { MapCollectionSummary } from "../../services/catalog/catalog.js";
import { exploreCollectionPath } from "../../app/routes.js";
import { webT } from "../../i18n/webI18n.js";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  collectionName,
  collectionTag,
} from "../../i18n/collectionI18n.js";

const props = defineProps<{
  activeCollection: string;
  collections: MapCollectionSummary[];
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
const tabsElement = ref<HTMLElement | null>(null);

const localizedCollections = computed(() =>
  props.collections.map((collection) => ({
    id: collection.id,
    name: collectionName(collection.id),
    tag: collectionTag(collection.id),
  })),
);

function revealActiveCollection(): void {
  const tabs = tabsElement.value;
  const activeTab = tabs?.querySelector<HTMLElement>('[aria-current="page"]');
  if (!tabs || !activeTab) return;

  const tabsRect = tabs.getBoundingClientRect();
  const activeRect = activeTab.getBoundingClientRect();
  const fullyVisible =
    activeRect.left >= tabsRect.left && activeRect.right <= tabsRect.right;
  if (fullyVisible) return;

  tabs.scrollLeft +=
    activeRect.left -
    tabsRect.left -
    (tabsRect.width - activeRect.width) / 2;
}

async function revealActiveCollectionAfterRender(): Promise<void> {
  await nextTick();
  revealActiveCollection();
}

onMounted(() => {
  void revealActiveCollectionAfterRender();
});

watch(
  () => props.activeCollection,
  () => {
    void revealActiveCollectionAfterRender();
  },
);
</script>

<template>
  <nav
    ref="tabsElement"
    class="explore-tabs"
    :aria-label="webT('explore.tabsAria')"
  >
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
  gap: 10px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding: 4px 0;
}

.explore-tabs a {
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 3px solid var(--bc-panel-border);
  border-radius: 7px;
  background: var(--bc-panel);
  color: #fff;
  flex: 0 0 auto;
  min-width: 132px;
  min-height: 65px;
  padding: 10px 20px;
  text-decoration: none;
}

.explore-tab-name {
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.1;
}

.explore-tab-tag {
  margin-top: 6px;
  color: color-mix(in srgb, currentColor 72%, transparent);
  font-size: 0.74rem;
  font-weight: 700;
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
