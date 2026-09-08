<script setup lang="ts">
import AppIcon from "../../shared/icons/AppIcon.vue";
</script>

<template>
  <div class="difficulty-legend muted">
    <span><i class="difficulty-dot easy" />简单</span>
    <span><i class="difficulty-dot medium" />中等</span>
    <span><i class="difficulty-dot hard" />困难</span>
    <span>
      章节标题旁的
      <AppIcon name="star" weight="fill" />
      是原版章节选择界面的 1～3 星难度；关卡 A～F 难度用于筛选。
    </span>
  </div>
</template>

<style scoped>
.difficulty-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin: 18px 2px 0;
  font-size: 0.76rem;
}

.difficulty-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.difficulty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.difficulty-dot.easy {
  background: #79a864;
}

.difficulty-dot.medium {
  background: #d5aa4d;
}

.difficulty-dot.hard {
  background: #d76d5f;
}
</style>
