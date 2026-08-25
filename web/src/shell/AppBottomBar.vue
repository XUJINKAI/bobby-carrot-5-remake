<script setup lang="ts">
defineProps<{
  contextInfo: string;
  showScreenControl: boolean;
  screenControlEnabled: boolean;
}>();
const emit = defineEmits<{ toggleScreenControl: [] }>();
</script>

<template>
  <footer class="app-bottom-bar">
    <span>{{ contextInfo }}</span>
    <button
      v-if="showScreenControl"
      type="button"
      :aria-pressed="screenControlEnabled"
      @click="emit('toggleScreenControl')"
    >
      屏幕摇杆：{{ screenControlEnabled ? "开" : "关" }}
    </button>
  </footer>
</template>
