<script setup lang="ts">
import { completedAdventureLevelCount } from "@bobby/adventure";
import { computed } from "vue";
import type { ImportedSaveData } from "../../services/import/importPipeline.js";

const props = defineProps<{ data: ImportedSaveData }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();

const exploreCompletedCount = computed(() =>
  props.data.type === "explore-save"
    ? Object.values(props.data.value.collections).reduce(
        (total, save) => total + save.completedMaps.length,
        0,
      )
    : 0,
);
const exploreCollectionCount = computed(() =>
  props.data.type === "explore-save"
    ? Object.keys(props.data.value.collections).length
    : 0,
);
</script>

<template>
  <section class="import-save-confirmation">
    <template v-if="data.type === 'adventure-save'">
      <h1>Adventure Save</h1>
      <p>即将导入冒险进度：</p>
      <dl>
        <div><dt>已完成</dt><dd>{{ completedAdventureLevelCount(data.value) }}</dd></div>
        <div><dt>Bonus Coin</dt><dd>{{ data.value.economy.bonusCoins }}</dd></div>
        <div><dt>Golden Carrot</dt><dd>{{ data.value.economy.goldenCarrots }}</dd></div>
      </dl>
      <p>导入会覆盖当前 Adventure Save。</p>
    </template>
    <template v-else>
      <h1>Explore Save</h1>
      <p>即将导入自由探索进度：</p>
      <dl>
        <div><dt>地图集合</dt><dd>{{ exploreCollectionCount }}</dd></div>
        <div><dt>已完成</dt><dd>{{ exploreCompletedCount }}</dd></div>
      </dl>
      <p>导入会覆盖当前 Explore Save。</p>
    </template>
    <div class="import-save-actions">
      <button type="button" @click="emit('cancel')">取消</button>
      <button type="button" @click="emit('confirm')">导入并覆盖</button>
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
