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
      href="/levels"
      @click.prevent="emit('navigate', '/levels')"
    >
      <strong>自由探索模式</strong><span>全部官方关卡开放浏览</span><b>→</b>
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
