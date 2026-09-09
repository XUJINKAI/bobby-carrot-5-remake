<script setup lang="ts">
import type { GamePageMode } from "./mountGamePage.js";
import AdventureViewport from "../adventure/AdventureViewport.vue";
import GameStage from "./GameStage.vue";

defineProps<{ mode: GamePageMode }>();
</script>

<template>
  <AdventureViewport v-if="mode === 'adventure'" class="adventure-game-viewport">
    <div class="game-page original-adventure-game">
      <GameStage :show-product-stats="false" :show-replay-panel="false" />
    </div>
  </AdventureViewport>
  <div v-else class="game-page">
    <GameStage :show-product-stats="true" :show-replay-panel="true" />
  </div>
</template>

<style>
.game-page,
.game-page .game-stage {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.game-page {
  display: block;
}

.original-adventure-game {
  min-height: 0;
}

.original-adventure-game .game-stage {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.original-adventure-game #game {
  width: 100%;
  height: 100%;
  display: block;
}

.adventure-game-viewport .debug-panel {
  display: none !important;
}
</style>
