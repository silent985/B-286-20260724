<template>
  <div class="editor-header drag-region">
    <div
      v-for="tab in tabs"
      :key="tab.path"
      class="tab no-drag"
      :class="{ active: tab.path === activePath, dirty: tab.isDirty }"
      :title="tab.path"
      @click="emit('activate', tab.path)"
    >
      <span class="tab-label">{{ tab.name }}</span>
      <span class="tab-indicator" @click.stop="emit('close', tab.path)">
        <span class="dot"></span>
        <span class="close">×</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EditorTab } from '../composables/useEditorTabs'

defineProps<{
  tabs: EditorTab[]
  activePath: string | null
}>()

const emit = defineEmits<{
  (event: 'activate', path: string): void
  (event: 'close', path: string): void
}>()
</script>

<style scoped>
.editor-header {
  height: 35px;
  background-color: #252526;
  display: flex;
  padding: 0;
  border-bottom: 1px solid #1e1e1e;
  overflow-x: auto;
}

.tab {
  padding: 0 15px;
  height: 35px;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #969696;
  cursor: pointer;
  border-right: 1px solid #1e1e1e;
  background-color: #2d2d2d;
  min-width: 100px;
  justify-content: space-between;
}

.tab.active {
  background-color: #1e1e1e;
  color: #ffffff;
  border-top: 1px solid #007acc; /* VSCode active tab indicator */
}

.tab-label {
  white-space: nowrap;
}

.tab-indicator {
  margin-left: 8px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

/* The unsaved dot shows by default; hovering swaps it for the close icon. */
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #cccccc;
  display: none;
}

.close {
  font-size: 14px;
  opacity: 0;
}

.tab.dirty .dot {
  display: block;
}

.tab:hover .dot {
  display: none;
}

.tab:hover .close {
  opacity: 1;
}

.tab-indicator:hover {
  background-color: #4e4e4e;
  color: white;
}
</style>
