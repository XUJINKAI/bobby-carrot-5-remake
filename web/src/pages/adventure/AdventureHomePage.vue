<script setup lang="ts">
import type { AdventureHomeView } from "./types.js";
import OriginalFlightScene from "../../shared/original-scenes/OriginalFlightScene.vue";
import AdventureFrame from "./AdventureFrame.vue";

defineProps<{ view: AdventureHomeView }>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <AdventureFrame>
    <div class="adventure-home">
      <OriginalFlightScene compact class="adventure-flight" />
      <nav class="adventure-menu">
        <a
          class="adventure-menu-primary"
          :href="view.nextLevelId ? '/adventure/play/' + view.nextLevelId : '/adventure/chapters'"
          @click.prevent="emit('navigate', view.nextLevelId ? '/adventure/play/' + view.nextLevelId : '/adventure/chapters')"
        >
          <span>{{ view.nextLevelId ? "继续冒险" : "开始冒险" }}</span>
          <strong>{{ view.nextLevelId ? view.nextLevelId.toUpperCase() : "选择章节" }}</strong>
          <b>→</b>
        </a>
        <div class="adventure-menu-secondary">
          <a
            href="/adventure/chapters"
            @click.prevent="emit('navigate', '/adventure/chapters')"
          >章节选择</a>
          <a
            href="/explore"
            @click.prevent="emit('navigate', '/explore')"
          >自由探索</a>
          <button type="button" data-action="settings">存档 / 设置</button>
        </div>
      </nav>
      <section class="adventure-wallet">
        <span><small>BONUS</small><strong>{{ view.bonusCoins }}</strong></span>
        <span><small>GOLDEN CARROT</small><strong>{{ view.goldenCarrots }}</strong></span>
        <span><small>KEY</small><strong>{{ view.goldenKey ? "★" : "—" }}</strong></span>
      </section>
    </div>
  </AdventureFrame>
</template>

<style scoped>
.adventure-home {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #143678;
  color: #f5f8ff;
}

.adventure-flight {
  min-height: 0;
  flex: 1 1 auto;
}

.adventure-flight :deep(.flight-title) {
  top: 3%;
  width: 88%;
}

.adventure-flight :deep(.flight-bobby) {
  width: min(42%, 190px);
  bottom: 3%;
}

.adventure-menu {
  flex: 0 0 auto;
  display: grid;
  gap: 8px;
  padding: 10px 18px 12px;
}

.adventure-menu-primary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 12px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid #6dc3b8;
  border-radius: 11px;
  background: #20786f;
  color: #f7fffd;
  text-decoration: none;
  box-shadow: 0 8px 22px rgb(0 15 52 / 20%);
}

.adventure-menu-primary span {
  font-size: 0.68rem;
  color: #d6eeea;
}

.adventure-menu-primary strong {
  font-size: 0.9rem;
}

.adventure-menu-primary b {
  grid-column: 2;
  grid-row: 1 / span 2;
  font-size: 1.15rem;
}

.adventure-menu-secondary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.adventure-menu-secondary a,
.adventure-menu-secondary button {
  min-width: 0;
  padding: 8px 5px;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 13%);
  border-radius: 8px;
  background: #172231;
  color: #dfe7f2;
  font-size: 0.65rem;
  text-align: center;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.adventure-wallet {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  border-top: 1px solid rgb(255 255 255 / 9%);
  background: rgb(255 255 255 / 8%);
  text-align: center;
}

.adventure-wallet span {
  min-width: 0;
  display: grid;
  gap: 2px;
  padding: 8px 4px 9px;
  background: #101923;
}

.adventure-wallet small {
  overflow: hidden;
  color: #7f92a7;
  font-size: 0.5rem;
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.adventure-wallet strong {
  color: #f0f4f7;
  font-size: 0.9rem;
}

:global(html[data-theme="retro"]) .adventure-menu-primary,
:global(html[data-theme="retro"]) .adventure-menu-secondary a,
:global(html[data-theme="retro"]) .adventure-menu-secondary button {
  border-radius: 5px;
}

:global(html[data-theme="retro"]) .adventure-menu-primary {
  border-color: var(--bc-panel-border);
  background: var(--bc-active);
}

:global(html[data-theme="retro"]) .adventure-menu-secondary a,
:global(html[data-theme="retro"]) .adventure-menu-secondary button {
  background: var(--bc-control);
}

@media (max-height: 650px) {
  .adventure-flight :deep(.flight-title) {
    width: 78%;
  }

  .adventure-flight :deep(.flight-bobby) {
    width: 34%;
  }

  .adventure-menu {
    padding-block: 7px 8px;
  }
}
</style>
