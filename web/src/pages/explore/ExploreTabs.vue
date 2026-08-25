<script setup lang="ts">
import type { CustomMapCollection } from "../../services/catalog/catalog.js";
import { exploreCollectionPath } from "../../app/routes.js";

defineProps<{
  activeCollection: string;
  collections: CustomMapCollection[];
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <nav class="explore-tabs" aria-label="自由探索地图集合">
    <a
      href="/explore/original"
      :class="{ active: activeCollection === 'original' }"
      @click.prevent="emit('navigate', '/explore/original')"
    >原版关卡</a>
    <a
      v-for="collection in collections"
      :key="collection.id"
      :href="exploreCollectionPath(collection.id)"
      :class="{ active: activeCollection === collection.id }"
      @click.prevent="emit('navigate', exploreCollectionPath(collection.id))"
    >{{ collection.name }}</a>
  </nav>
</template>
