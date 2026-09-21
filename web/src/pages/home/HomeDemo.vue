<script setup lang="ts">
import type { HomeViewState } from "./types.js";
import AppIcon from "../../shared/icons/AppIcon.vue";
import { webT } from "../../i18n/webI18n.js";

defineProps<{ state: HomeViewState; repositoryUrl: string }>();
const emit = defineEmits<{
  ready: [canvas: HTMLCanvasElement];
  restart: [];
  screenControl: [];
}>();

function reportCanvas(element: unknown): void {
  if (element instanceof HTMLCanvasElement) emit("ready", element);
}
</script>

<template>
  <article class="home-demo-panel">
    <div class="home-demo-toolbar">
      <span>{{ webT("home.demoWelcome") }}</span>
      <button
        class="home-demo-restart"
        type="button"
        :title="webT('shell.restart')"
        :aria-label="webT('shell.restart')"
        @click="emit('restart')"
      >
        <AppIcon name="restart" />
      </button>
    </div>
    <div class="home-demo-stage">
      <section class="game-stage">
        <div class="game-canvas-layer">
          <canvas :ref="reportCanvas" />
        </div>
        <div v-if="state.demoResult" class="result-overlay">
          <div class="result-card">
            <h2>
              {{ state.demoResult === "complete"
                ? webT("home.demoComplete")
                : webT("home.demoTryAgain") }}
            </h2>
            <p v-if="state.demoResult === 'death'">{{ state.deathReason }}</p>
            <div v-if="state.demoResult === 'complete'" class="result-actions">
              <a
                class="ghost-btn"
                :href="repositoryUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ webT("home.demoRepository") }}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
    <footer class="home-demo-footer">
      <p class="home-demo-status">{{ state.demoStatus }}</p>
      <button
        class="home-demo-screen-control"
        type="button"
        :title="webT('shell.screenJoystick')"
        :aria-label="webT('shell.screenJoystick')"
        :aria-pressed="state.screenControlEnabled"
        @click="emit('screenControl')"
      >
        <AppIcon name="joystick" />
      </button>
    </footer>
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

.home-demo-restart {
  box-sizing: border-box;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  padding: 4px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: inherit;
  line-height: 1;
}

.home-demo-restart:hover {
  background: rgb(255 255 255 / 14%);
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

.home-demo-footer {
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-top: 1px solid var(--bc-panel-border);
}

.home-demo-status {
  min-width: 0;
  margin: 0;
  flex: 1 1 auto;
  color: var(--bc-text-muted);
  font-size: 0.72rem;
  line-height: 1.35;
}

.home-demo-screen-control {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid var(--bc-panel-border);
  border-radius: var(--bc-control-radius);
  background: var(--bc-control);
  color: var(--bc-text);
  font-size: 1rem;
  line-height: 1;
}

.home-demo-screen-control:hover {
  background: var(--bc-control-hover);
}

.home-demo-screen-control[aria-pressed="true"] {
  background: var(--bc-control-selected);
  color: var(--bc-control-selected-text);
}

.result-card {
  border-radius: var(--bc-panel-radius);
  font-size: 0.92rem;
}

.result-card h2 {
  font-size: 0.92rem;
}

@media (max-width: 900px) {
  .home-demo-panel {
    width: min(88vw, 378px);
  }
}
</style>
