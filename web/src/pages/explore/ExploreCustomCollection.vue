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
