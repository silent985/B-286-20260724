<template>
  <div class="sidebar">
    <div class="sidebar-header drag-region">
      <span>EXPLORER</span>
      <el-button class="no-drag open-btn" text size="small" @click="openFolder">
        打开文件夹
      </el-button>
    </div>

    <div v-if="folder" class="workspace-name" :title="folder.path">
      {{ folder.name }}
    </div>

    <el-tree
      v-if="folder"
      :key="treeVersion"
      lazy
      :load="loadNode"
      :props="treeProps"
      node-key="path"
      class="file-tree no-drag"
      @node-click="handleNodeClick"
    />
    <div v-else class="empty-workspace no-drag">
      尚未打开文件夹
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TreeNodeData } from 'element-plus'
import { useWorkspace } from '../composables/useWorkspace'
import type { DirEntry } from '../types/ipc'

const emit = defineEmits<{
  (event: 'open-file', file: { path: string; name: string }): void
}>()

const { folder, treeVersion, openFolder, loadNode } = useWorkspace()

const treeProps = {
  label: 'name',
  children: 'children',
  isLeaf: (data: TreeNodeData) => !(data as DirEntry).isDirectory,
} as const

function handleNodeClick(data: TreeNodeData): void {
  const entry = data as DirEntry
  if (!entry.isDirectory) {
    emit('open-file', { path: entry.path, name: entry.name })
  }
}
</script>

<style scoped>
.sidebar {
  height: 100%;
  background-color: #252526;
  border-right: 1px solid #1e1e1e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 6px 10px;
  font-size: 11px;
  font-weight: bold;
  color: #bbbbbb;
  background-color: #252526;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.open-btn {
  color: #cccccc;
  font-size: 11px;
  padding: 0 6px;
  height: 22px;
}

.open-btn:hover {
  color: #ffffff;
}

.workspace-name {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  color: #cccccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-tree {
  flex: 1;
  overflow: auto;
  background-color: transparent;
  color: #cccccc;
}

.empty-workspace {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 12px;
  padding: 20px;
  text-align: center;
}

:deep(.el-tree-node__content:hover) {
  background-color: #2a2d2e;
}

:deep(.el-tree-node:focus > .el-tree-node__content) {
  background-color: #37373d;
}

.drag-region {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}
</style>
