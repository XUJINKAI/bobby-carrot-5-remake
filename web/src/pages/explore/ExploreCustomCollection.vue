<script setup lang="ts">
import type { CustomMapCollection } from "../../services/catalog/catalog.js";
import { editorMapPath, explorePlayPath } from "../../app/routes.js";

defineProps<{ collection: CustomMapCollection }>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <section class="explore-custom-collection">
    <header class="section-title">
      <div>
        <div class="eyebrow">{{ collection.id.toUpperCase() }}</div>
        <h1>{{ collection.name }}</h1>
        <p>{{ collection.description }}</p>
      </div>
      <span class="muted">{{ collection.maps.length }} 张地图</span>
    </header>
    <div class="explore-map-grid">
      <article v-for="map in collection.maps" :key="map.id" class="explore-map-card">
        <div>
          <span class="eyebrow">{{ map.id }}</span>
          <h2>{{ map.name }}</h2>
          <p>{{ map.description }}</p>
        </div>
        <div class="explore-map-actions">
          <button
            class="primary-btn"
            @click="emit('navigate', explorePlayPath({ collection: collection.id, id: map.id }))"
          >游玩</button>
          <button
            class="ghost-btn"
            @click="emit('navigate', editorMapPath({ collection: collection.id, id: map.id }))"
          >编辑副本</button>
        </div>
      </article>
    </div>
  </section>
</template>
