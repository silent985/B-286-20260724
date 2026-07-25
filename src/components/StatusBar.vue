<template>
  <div class="status-bar">
    <div class="status-item">main*</div>
    <div class="status-item">{{ language }}</div>
    <div class="status-item right">Ln {{ cursor.line }}, Col {{ cursor.column }}</div>
  </div>
</template>

<script setup lang="ts">
import type { CursorPosition } from '../composables/useEditorTabs'

defineProps<{
  language: string
  cursor: CursorPosition
}>()
</script>

<style scoped>
.status-bar {
  height: 25px;
  background-color: #007acc;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  justify-content: space-between;
}

.status-item {
  margin-right: 15px;
  cursor: pointer;
}

.status-item.right {
  margin-left: auto;
  margin-right: 0;
}
</style>
