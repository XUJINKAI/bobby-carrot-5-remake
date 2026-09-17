<script setup lang="ts">
import AppIcon from "../../shared/icons/AppIcon.vue";

defineProps<{ html: string }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <section class="global-dialog help-dialog" role="dialog" aria-label="帮助">
    <header>
      操作说明
      <button type="button" aria-label="关闭" @click="emit('close')">
        <AppIcon name="close" />
      </button>
    </header>
    <div class="help-dialog-content" v-html="html" />
  </section>
</template>

<style>
.global-dialog > .help-dialog-content {
  display: block;
}

.help-dialog-content h2 {
  margin: 0 0 8px;
  font-size: 1.05rem;
}

.help-dialog-content h2:not(:first-child) {
  margin-top: 18px;
}

.help-dialog-content ul {
  margin: 0;
  padding-left: 1.4em;
}

.help-dialog-content li + li {
  margin-top: 5px;
}
</style>
