<script setup lang="ts">
import type { ImportedSaveData } from "../../services/import/importPipeline.js";
import ImportSaveConfirmation from "./ImportSaveConfirmation.vue";

defineProps<{
  status: "save" | "error" | "unknown";
  data?: ImportedSaveData;
  message?: string;
  rawText?: string;
}>();
const emit = defineEmits<{ confirm: []; cancel: []; home: [] }>();
</script>

<template>
  <main class="import-page">
    <section class="import-card">
      <ImportSaveConfirmation
        v-if="status === 'save' && data"
        :data="data"
        @confirm="emit('confirm')"
        @cancel="emit('cancel')"
      />
      <template v-else>
        <h1>数据导入</h1>
        <p>{{ message }}</p>
        <details v-if="rawText"><summary>查看原始数据</summary><pre>{{ rawText }}</pre></details>
        <div class="import-actions"><button type="button" @click="emit('home')">返回首页</button></div>
      </template>
    </section>
  </main>
</template>

<style scoped>
.import-page {
  display: grid;
  place-items: center;
  min-height: 100%;
  padding: 24px;
}

.import-card {
  width: min(480px, 100%);
  padding: 24px;
  border: 3px solid var(--bc-panel-border);
  border-radius: 7px;
  background: var(--bc-panel);
  box-shadow: 8px 8px 0 #001b5b99;
}

.import-card h1 {
  margin-top: 0;
}

.import-card pre {
  max-height: 180px;
  overflow: auto;
  white-space: pre-wrap;
}

.import-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.import-actions button {
  padding: 8px 12px;
}
</style>
