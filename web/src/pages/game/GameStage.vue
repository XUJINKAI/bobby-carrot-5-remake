<script setup lang="ts">
defineProps<{ showProductStats: boolean }>();
</script>

<template>
  <section class="game-stage" data-game-stage>
    <div class="game-canvas-layer">
      <canvas id="game" />
      <div
        v-if="showProductStats"
        class="product-game-statistics"
        data-product-stats
      />
      <aside data-debug-panel class="debug-panel" aria-live="polite">
        <div class="debug-engine" />
        <pre class="debug-inspector" />
      </aside>
    </div>
    <div class="result-overlay" data-result-overlay hidden>
      <div class="result-card" data-result-card />
    </div>
  </section>
</template>

<style scoped>
.product-game-statistics {
  position: absolute;
  left: 12px;
  top: 52px;
  z-index: 6;
  min-height: 32px;
  padding: 7px 10px;
  border: 1px solid #ffffff29;
  border-radius: 999px;
  background: #06100abd;
  color: #dce8de;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

.debug-panel {
  position: absolute;
  top: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 6;
  display: none;
  flex-direction: column;
  width: min(320px, calc(100% - 24px));
  max-height: none;
  overflow: hidden;
  padding: 0;
  border: 1px solid #ffffff20;
  border-radius: 10px;
  background: #08100bcc;
  font-size: 0.72rem;
  line-height: 1.45;
  white-space: normal;
}

.debug-panel.visible {
  display: flex;
}

.debug-engine {
  flex: 0 0 auto;
  padding: 10px 12px;
  border-bottom: 1px solid #ffffff20;
  background: #0d1811e8;
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  color: #e5f5d7;
}

.debug-inspector {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  margin: 0;
  padding: 10px 12px;
  white-space: pre-wrap;
  font: inherit;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  color: inherit;
}

@media (max-width: 700px) {
  .debug-panel {
    left: 12px;
    right: 12px;
    top: 12px;
    bottom: 12px;
    width: auto;
    max-height: 46%;
  }
}
</style>
