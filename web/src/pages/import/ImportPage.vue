<script setup lang="ts">
import {
  completedAdventureLevelCount,
  type AdventureSave,
} from "@bobby/adventure";

defineProps<{
  status: "profile" | "error" | "unknown";
  profile?: AdventureSave;
  message?: string;
  rawText?: string;
}>();
const emit = defineEmits<{ confirm: []; cancel: []; home: [] }>();
</script>

<template>
  <main class="import-page">
    <section class="import-card">
      <template v-if="status === 'profile' && profile">
        <h1>Adventure Profile</h1>
        <p>来自分享链接的冒险进度：</p>
        <dl>
          <div><dt>已完成</dt><dd>{{ completedAdventureLevelCount(profile) }}</dd></div>
          <div><dt>Bonus Coin</dt><dd>{{ profile.economy.bonusCoins }}</dd></div>
          <div><dt>Golden Carrot</dt><dd>{{ profile.economy.goldenCarrots }}</dd></div>
        </dl>
        <p>导入将覆盖当前 Adventure Profile。</p>
        <div class="import-actions">
          <button type="button" @click="emit('cancel')">取消</button>
          <button type="button" @click="emit('confirm')">导入并覆盖</button>
        </div>
      </template>
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
.import-page { display: grid; place-items: center; min-height: 100%; padding: 24px; }
.import-card { width: min(480px, 100%); padding: 24px; border: 3px solid var(--bc-panel-border); border-radius: 7px; background: var(--bc-panel); box-shadow: 8px 8px 0 #001b5b99; }
.import-card h1 { margin-top: 0; }
.import-card dl { display: grid; gap: 8px; }
.import-card dl div { display: flex; justify-content: space-between; }
.import-card dd { margin: 0; }
.import-card pre { max-height: 180px; overflow: auto; white-space: pre-wrap; }
.import-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
.import-actions button { padding: 8px 12px; }
</style>
