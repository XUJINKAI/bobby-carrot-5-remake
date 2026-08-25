<script setup lang="ts">
import type { HomeViewState } from "./types.js";

defineProps<{ state: HomeViewState }>();
const emit = defineEmits<{
  ready: [canvas: HTMLCanvasElement];
  restart: [];
  adventure: [];
}>();

function reportCanvas(element: unknown): void {
  if (element instanceof HTMLCanvasElement) emit("ready", element);
}
</script>

<template>
  <article class="home-demo-panel">
    <header>
      <div>
        <span class="eyebrow">WELCOME DEMO</span>
        <h1>先走两步</h1>
      </div>
      <button type="button" class="ghost-btn" @click="emit('restart')">
        重新开始
      </button>
    </header>
    <div class="home-demo-stage">
      <section class="game-stage">
        <div class="game-canvas-layer">
          <canvas :ref="reportCanvas" />
        </div>
        <div v-if="state.demoResult" class="result-overlay">
          <div class="result-card">
            <h2>{{ state.demoResult === "complete" ? "Demo 完成" : "再试一次" }}</h2>
            <p>
              {{ state.demoResult === "complete"
                ? "Engine 已完成这张语义地图。"
                : state.deathReason }}
            </p>
            <div class="result-actions">
              <button
                v-if="state.demoResult === 'complete'"
                class="primary-btn"
                @click="emit('adventure')"
              >
                开始冒险
              </button>
              <button class="ghost-btn" @click="emit('restart')">
                重新开始
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
    <p>{{ state.demoStatus }}</p>
  </article>
</template>
