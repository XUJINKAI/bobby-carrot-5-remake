<script setup lang="ts">
import type { ImageManager } from "@bobby/engine";
import NightTrainScene from "../../shared/original-scenes/NightTrainScene.vue";
import AdventureViewport from "./AdventureViewport.vue";
import type { AdventureNightTrainDestination } from "./types.js";
import AppIcon from "../../shared/icons/AppIcon.vue";

defineProps<{
  images: ImageManager;
  destinations: AdventureNightTrainDestination[];
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <AdventureViewport>
    <div class="night-train-page">
      <NightTrainScene :images="images" class="night-train-hero" />
      <nav class="night-train-menu" aria-label="夜间列车">
        <template v-for="destination in destinations" :key="destination.id">
          <a
            v-if="destination.href"
            :href="destination.href"
            @click.prevent="emit('navigate', destination.href)"
          >
            <strong>{{ destination.label }}</strong>
            <AppIcon name="next" />
          </a>
          <div v-else class="night-train-map-row">
            <strong>{{ destination.label }}</strong>
            <span>{{ destination.note ?? "" }}</span>
          </div>
        </template>
      </nav>
    </div>
  </AdventureViewport>
</template>

<style scoped>
.night-train-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #13367a;
  color: #f4f7ff;
}

.night-train-hero {
  flex: 0 0 auto;
}

.night-train-menu {
  width: min(430px, calc(100% - 28px));
  margin: 40px auto 0;
  display: grid;
  gap: 9px;
}

.night-train-menu a,
.night-train-map-row {
  min-height: 62px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border: var(--bc-control-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: color-mix(in srgb, var(--bc-panel) 92%, transparent);
  color: var(--bc-text);
  text-decoration: none;
  box-shadow: var(--bc-panel-shadow);
  transition: transform 120ms ease, border-color 120ms ease, background 120ms ease;
}

.night-train-menu a:hover {
  transform: translateY(-1px);
  border-color: var(--bc-text-muted);
  background: var(--bc-control-hover);
}

.night-train-map-row {
  background: rgb(55 45 20 / 88%);
  border-color: rgb(247 212 95 / 34%);
}

.night-train-map-row span {
  color: #d9bd68;
  font-size: 0.64rem;
}

.night-train-menu strong {
  font-size: 0.9rem;
  letter-spacing: 0.05em;
}
</style>
