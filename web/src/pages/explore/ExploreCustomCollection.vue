<script setup lang="ts">
import type { CustomMapCollection } from "../../services/catalog/catalog.js";
import { explorePlayPath } from "../../app/routes.js";

defineProps<{ collection: CustomMapCollection }>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <section class="explore-custom-collection">
    <div class="explore-map-grid">
      <a
        v-for="map in collection.maps"
        :key="map.id"
        class="explore-map-card"
        :href="explorePlayPath({ collection: collection.id, id: map.id })"
        @click.prevent="emit('navigate', explorePlayPath({ collection: collection.id, id: map.id }))"
      >
        <div>
          <span class="eyebrow">{{ map.id }}</span>
          <h2>{{ map.name }}</h2>
          <p>{{ map.description }}</p>
        </div>
      </a>
    </div>
  </section>
</template>

<style scoped>
.explore-map-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.explore-map-card {
  background: var(--panel);
  border: 3px solid var(--line);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 210px;
  padding: 20px;
  color: inherit;
  text-decoration: none;
  transition: border-color 120ms ease, transform 120ms ease;
}

.explore-map-card:hover,
.explore-map-card:focus-visible {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.explore-map-card h2 {
  margin: 6px 0 8px;
}

.explore-map-card p {
  color: var(--muted);
  line-height: 1.6;
}
</style>
