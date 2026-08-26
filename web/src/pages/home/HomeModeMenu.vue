<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  navigate: [path: string];
  importMap: [file: File];
}>();
const fileInput = ref<HTMLInputElement | null>(null);

function importFile(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit("importMap", file);
  input.value = "";
}
</script>

<template>
  <nav class="home-mode-panel" aria-label="选择模式">
    <header>
      <span class="eyebrow">PLAY YOUR WAY</span>
      <h2>选择模式</h2>
    </header>
    <a
      class="home-mode-card primary"
      href="/adventure"
      @click.prevent="emit('navigate', '/adventure')"
    >
      <strong>冒险模式</strong><span>按章节推进原版 Campaign</span><b>→</b>
    </a>
    <a
      class="home-mode-card"
      href="/explore"
      @click.prevent="emit('navigate', '/explore')"
    >
      <strong>自由探索模式</strong><span>浏览原版关卡与内置地图集合</span><b>→</b>
    </a>
    <a
      class="home-mode-card"
      href="/edit"
      @click.prevent="emit('navigate', '/edit')"
    >
      <strong>编辑器模式</strong><span>创建地图并随时 Play Test</span><b>→</b>
    </a>
    <button
      class="home-mode-card"
      type="button"
      @click="fileInput?.click()"
    >
      <strong>导入自定义地图</strong><span>打开语义 JSON Draft</span><b>＋</b>
    </button>
    <input
      ref="fileInput"
      type="file"
      accept="application/json,.json"
      hidden
      @change="importFile"
    >
    <slot />
  </nav>
</template>

<style scoped>
.home-mode-panel {
  display: grid;
  gap: 10px;
  padding: 20px;
  border: 4px solid var(--bc-panel-border);
  border-radius: 7px;
  background: var(--bc-panel);
  box-shadow: 8px 8px 0 #001b5b88;
}

.home-mode-panel > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.home-mode-panel h2 {
  margin: 3px 0 0;
}

.home-mode-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  width: 100%;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 5px;
  background: #07518f;
  color: inherit;
  text-align: left;
  text-decoration: none;
}

.home-mode-card.primary {
  border-color: var(--bc-panel-border);
  background: var(--bc-active);
}

.home-mode-card strong {
  font-size: 1rem;
}

.home-mode-card span {
  color: var(--muted);
  font-size: 0.76rem;
}

.home-mode-card b {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: center;
  font-size: 1.2rem;
}
</style>
