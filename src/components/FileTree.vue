<template>
  <div class="file-tree-container">
    <div class="tree-header drag-region">
      <span class="header-label">EXPLORER</span>
      <el-button
        v-if="workspaceName"
        text
        size="small"
        class="open-folder-btn no-drag"
        @click="$emit('openFolder')"
        title="Open Folder"
      >
        <el-icon><FolderOpened /></el-icon>
      </el-button>
    </div>
    <div v-if="workspaceName" class="workspace-name">{{ workspaceName }}</div>
    <div v-if="!workspaceName" class="no-workspace" @click="$emit('openFolder')">
      <el-icon class="folder-icon"><FolderOpened /></el-icon>
      <span>Open Folder</span>
    </div>
    <el-tree
      v-else
      :data="fileTree"
      :props="{ children: 'children', label: 'name' }"
      node-key="path"
      :expand-on-click-node="false"
      @node-click="handleNodeClick"
      class="file-tree"
    >
      <template #default="{ data }">
        <span class="tree-node">
          <el-icon v-if="data.isDirectory" class="node-icon folder"><Folder /></el-icon>
          <el-icon v-else class="node-icon file"><Document /></el-icon>
          <span class="node-label">{{ data.name }}</span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { Folder, FolderOpened, Document } from '@element-plus/icons-vue'
import type { FileTreeNode } from '../types/workspace'

defineProps<{
  fileTree: FileTreeNode[]
  workspaceName: string
}>()

const emit = defineEmits<{
  (e: 'fileClick', node: FileTreeNode): void
  (e: 'openFolder'): void
}>()

const handleNodeClick = (data: FileTreeNode) => {
  if (!data.isDirectory) {
    emit('fileClick', data)
  }
}
</script>

<style scoped>
.file-tree-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: bold;
  color: #bbbbbb;
  background-color: #252526;
  flex-shrink: 0;
}

.header-label {
  letter-spacing: 0.5px;
}

.open-folder-btn {
  padding: 2px;
  color: #bbbbbb;
}

.open-folder-btn:hover {
  color: #ffffff;
}

.workspace-name {
  padding: 4px 10px;
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
  background-color: #252526;
  text-transform: uppercase;
  flex-shrink: 0;
}

.no-workspace {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 10px;
  color: #888;
  cursor: pointer;
  font-size: 13px;
}

.no-workspace:hover {
  color: #cccccc;
}

.folder-icon {
  font-size: 32px;
}

.file-tree {
  flex: 1;
  overflow-y: auto;
  background-color: transparent;
  color: #cccccc;
  padding: 0;
}

.file-tree :deep(.el-tree-node__content) {
  height: 24px;
  padding: 0 8px !important;
}

:deep(.el-tree-node__content:hover) {
  background-color: #2a2d2e !important;
}

:deep(.el-tree-node:focus > .el-tree-node__content) {
  background-color: #37373d !important;
}

:deep(.el-tree-node__expand-icon) {
  color: #cccccc;
  font-size: 12px;
  padding: 0;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  overflow: hidden;
}

.node-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.node-icon.folder {
  color: #dcb67a;
}

.node-icon.file {
  color: #858585;
}

.node-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
