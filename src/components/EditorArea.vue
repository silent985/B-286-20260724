<template>
  <div class="editor-area">
    <CodeEditor
      v-if="activeTab"
      :model="activeTab.model"
      @cursor-change="onCursorChange"
    />
    <div v-else class="empty-state">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3a3d3e" stroke-width="1">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
      <p>{{ workspaceRoot ? 'Select a file from the explorer to start editing' : 'Open a folder to get started' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import CodeEditor from './CodeEditor.vue'
import type { OpenTab } from '../types/workspace'

defineProps<{
  activeTab: OpenTab | null
  workspaceRoot: string | null
}>()

const emit = defineEmits<{
  (e: 'cursor-change', position: { lineNumber: number; column: number }): void
}>()

function onCursorChange(position: { lineNumber: number; column: number }): void {
  emit('cursor-change', position)
}
</script>

<style scoped>
.editor-area {
  flex: 1;
  overflow: hidden;
  background-color: #1e1e1e;
  position: relative;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #555;
  font-size: 14px;
}

.empty-state p {
  margin: 0;
}

.empty-icon {
  opacity: 0.6;
}
</style>
