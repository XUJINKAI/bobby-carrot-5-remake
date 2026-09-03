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
    </div>
    <div class="result-overlay" data-result-overlay hidden>
      <div class="result-card" data-result-card />
    </div>
  </section>
</template>

<style scoped>
/* Debug UI is owned entirely by Engine and mounts into game-canvas-layer. */
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
</style>
