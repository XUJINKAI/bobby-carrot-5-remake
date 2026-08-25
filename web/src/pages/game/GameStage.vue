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
