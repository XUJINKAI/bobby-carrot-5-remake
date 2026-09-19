<script setup lang="ts">
import { completedAdventureLevelCount } from "@bobby/adventure";
import { computed } from "vue";
import type { ImportedSaveData } from "../../services/import/importPipeline.js";
import { webT } from "../../i18n/webI18n.js";

const props = defineProps<{ data: ImportedSaveData }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();

const exploreCompletedCount = computed(() =>
  props.data.type === "explore-save"
    ? props.data.value.completedMaps.length
    : 0,
);
</script>

<template>
  <section class="import-save-confirmation">
    <template v-if="data.type === 'adventure-save'">
      <h1>Adventure Save</h1>
      <p>{{ webT("import.adventureIncoming") }}</p>
      <dl>
        <div><dt>{{ webT("import.completed") }}</dt><dd>{{ completedAdventureLevelCount(data.value) }}</dd></div>
        <div><dt>Bonus Coin</dt><dd>{{ data.value.economy.bonusCoins }}</dd></div>
        <div><dt>Golden Carrot</dt><dd>{{ data.value.economy.goldenCarrots }}</dd></div>
      </dl>
      <p>{{ webT("import.adventureOverwrite") }}</p>
    </template>
    <template v-else>
      <h1>Explore Save</h1>
      <p>{{ webT("import.exploreIncoming") }}</p>
      <dl>
        <div><dt>{{ webT("import.collection") }}</dt><dd>{{ data.collection }}</dd></div>
        <div><dt>{{ webT("import.completed") }}</dt><dd>{{ exploreCompletedCount }}</dd></div>
      </dl>
      <p>{{ webT("import.exploreOverwrite") }}</p>
    </template>
    <div class="import-save-actions">
      <button type="button" @click="emit('cancel')">{{ webT("common.cancel") }}</button>
      <button type="button" @click="emit('confirm')">{{ webT("import.confirm") }}</button>
    </div>
  </section>
</template>

<style scoped>
.import-save-confirmation h1,
.import-save-confirmation p {
  margin-top: 0;
}

.import-save-confirmation dl {
  display: grid;
  gap: 8px;
}

.import-save-confirmation dl div {
  display: flex;
  justify-content: space-between;
}

.import-save-confirmation dd {
  margin: 0;
}

.import-save-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.import-save-actions button {
  padding: 8px 12px;
}
</style>
