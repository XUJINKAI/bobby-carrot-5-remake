<script setup lang="ts">
defineProps<{ open: boolean; x: number; y: number; canPaste: boolean; entitySelected: boolean }>();
const emit = defineEmits<{
  close: [];
  copy: [];
  cut: [];
  paste: [];
  delete: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="editor-context-menu"
      :style="{ left: `${x}px`, top: `${y}px` }"
      @contextmenu.prevent
      @pointerdown.stop
    >
      <button type="button" :disabled="!entitySelected" @click="emit('cut'); emit('close')">
        剪切
      </button>
      <button type="button" :disabled="!entitySelected" @click="emit('copy'); emit('close')">
        复制
      </button>
      <button type="button" :disabled="!canPaste" @click="emit('paste'); emit('close')">
        粘贴
      </button>
      <div class="editor-context-separator" />
      <button type="button" :disabled="!entitySelected" @click="emit('delete'); emit('close')">
        删除
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.editor-context-menu {
  position: fixed;
  z-index: 11000;
  min-width: 150px;
  padding: 5px;
  border: 1px solid #3d88bb;
  border-radius: 7px;
  background: #072d54;
  box-shadow: 0 8px 28px rgb(0 0 0 / 45%);
}

.editor-context-menu button {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #fff;
  text-align: left;
}

.editor-context-menu button:hover:not(:disabled) {
  background: #0b689c;
}

.editor-context-menu button:disabled {
  opacity: 0.4;
}

.editor-context-separator {
  height: 1px;
  margin: 4px;
  background: rgb(255 255 255 / 15%);
}
</style>
