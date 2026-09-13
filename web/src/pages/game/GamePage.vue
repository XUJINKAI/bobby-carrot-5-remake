<script setup lang="ts">
import type { GamePageMode } from "./gamePageCapabilities.js";
import AdventureViewport from "../adventure/AdventureViewport.vue";
import GameStage from "./GameStage.vue";

defineProps<{
  mode: GamePageMode;
  replayPanelEnabled: boolean;
}>();
</script>

<template>
  <AdventureViewport v-if="mode === 'adventure'" class="adventure-game-viewport">
    <div class="game-page original-adventure-game">
      <GameStage :show-replay-panel="replayPanelEnabled" />
    </div>
  </AdventureViewport>
  <div v-else class="game-page">
    <GameStage :show-replay-panel="replayPanelEnabled" />
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

.adventure-game-viewport.adventure-game-tools-open .adventure-viewport-stage {
  width: 100%;
  max-width: none;
  aspect-ratio: auto !important;
}
</style>
