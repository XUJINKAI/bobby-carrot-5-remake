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
    <div class="home-demo-toolbar">
      <span>欢迎来到兔子波比的世界</span>
      <button type="button" @click="emit('restart')">重新开始</button>
    </div>
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
                ? "从这里继续进入完整冒险。"
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
    <p class="home-demo-status">{{ state.demoStatus }}</p>
  </article>
</template>

<style scoped>
.home-demo-panel {
  position: relative;
  width: min(100%, 378px);
  aspect-ratio: 5 / 8;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: var(--bc-panel-border-width) solid var(--bc-panel-border);
  border-radius: var(--bc-panel-radius);
  background: var(--bc-panel);
  box-shadow: var(--bc-panel-shadow);
}

.home-demo-toolbar {
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 14px;
  border-bottom: 1px solid var(--bc-panel-border);
  color: var(--bc-text-muted);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.home-demo-toolbar button {
  padding: 5px 8px;
  border: 1px solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: var(--bc-control);
  color: var(--bc-text);
  font-size: 0.7rem;
  letter-spacing: 0;
}

.home-demo-toolbar button:hover {
  background: var(--bc-control-hover);
}

.home-demo-stage {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: var(--bc-bg);
}

.home-demo-stage .game-stage,
.home-demo-stage .game-canvas-layer {
  position: absolute;
  inset: 0;
}

.home-demo-status {
  min-height: 42px;
  margin: 0;
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-top: 1px solid var(--bc-panel-border);
  color: var(--bc-text-muted);
  font-size: 0.72rem;
  line-height: 1.35;
}

.result-card {
  border-radius: var(--bc-panel-radius);
}

@media (max-width: 900px) {
  .home-demo-panel {
    width: min(88vw, 378px);
  }
}
</style>
