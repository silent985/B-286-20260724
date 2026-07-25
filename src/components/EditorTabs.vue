<template>
  <div class="tabs-bar no-drag">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="tab"
      :class="{ active: activeTabId === tab.id }"
      @click="$emit('activate', tab.id)"
    >
      <span class="tab-name">{{ tab.fileName }}</span>
      <span class="tab-action">
        <span v-if="tab.isDirty" class="dirty-dot" title="Unsaved changes">●</span>
        <span class="close-icon" @click.stop="$emit('close', tab.id)" title="Close">×</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EditorTab } from '../types/workspace'

defineProps<{
  tabs: EditorTab[]
  activeTabId: string | null
}>()

defineEmits<{
  (e: 'activate', tabId: string): void
  (e: 'close', tabId: string): void
}>()
</script>

<style scoped>
.tabs-bar {
  display: flex;
  background-color: #252526;
  border-bottom: 1px solid #1e1e1e;
  overflow-x: auto;
  overflow-y: hidden;
  height: 35px;
  flex-shrink: 0;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 35px;
  font-size: 13px;
  color: #969696;
  cursor: pointer;
  border-right: 1px solid #1e1e1e;
  background-color: #2d2d2d;
  min-width: 80px;
  max-width: 180px;
  flex-shrink: 0;
  user-select: none;
}

.tab.active {
  background-color: #1e1e1e;
  color: #ffffff;
  border-top: 1px solid #007acc;
}

.tab-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-action {
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dirty-dot {
  font-size: 10px;
  color: #cccccc;
  position: absolute;
}

.close-icon {
  font-size: 16px;
  line-height: 1;
  border-radius: 3px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  opacity: 0;
  color: #cccccc;
}

.tab:hover .close-icon {
  opacity: 1;
}

.tab:hover .dirty-dot {
  opacity: 0;
}

.close-icon:hover {
  background-color: #4e4e4e;
  color: white;
}

.tab.active .dirty-dot {
  color: #ffffff;
}
</style>
