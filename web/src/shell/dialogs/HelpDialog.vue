<script setup lang="ts">
import type { AppMode } from "../shellBridge.js";

defineProps<{ mode: AppMode }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <section class="global-dialog help-dialog" role="dialog" aria-label="帮助">
    <header>操作帮助 <button type="button" aria-label="关闭" @click="emit('close')">×</button></header>
    <div>
      <p>WASD / 方向键：移动</p>
      <p>拖动画面：查看地图</p>
      <p v-if="mode === 'editor'">右键 / Del：删除对象，Q / E：切换形态</p>
    </div>
  </section>
</template>
