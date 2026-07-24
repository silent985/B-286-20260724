<template>
  <div class="file-tree-wrapper">
    <div class="sidebar-header drag-region">
      <span>EXPLORER</span>
      <el-icon class="open-folder-btn no-drag" title="Open Folder" @click="emit('open-folder')">
        <FolderOpened />
      </el-icon>
    </div>
    <div class="workspace-name no-drag" v-if="workspaceName">{{ workspaceName }}</div>
    <div v-if="loading" class="tree-loading">Loading...</div>
    <el-tree
      v-else-if="data.length > 0"
      :data="data"
      :props="treeProps"
      node-key="path"
      class="file-tree no-drag"
      :expand-on-click-node="false"
      :default-expanded-keys="defaultExpanded"
      @node-click="handleNodeClick"
    >
      <template #default="{ data: node }">
        <span class="tree-node">
          <span class="node-icon">
            <el-icon v-if="node.type === 'directory'"><Folder /></el-icon>
            <el-icon v-else><Document /></el-icon>
          </span>
          <span class="node-label">{{ node.name }}</span>
        </span>
      </template>
    </el-tree>
    <div v-else class="empty-tree no-drag" @click="emit('open-folder')">
      <p>No folder opened</p>
      <el-button size="small" type="primary" plain>Open Folder</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Folder, FolderOpened, Document } from '@element-plus/icons-vue'
import type { FileNode } from '../types/workspace'

const props = defineProps<{
  data: FileNode[]
  loading: boolean
  workspaceRoot: string | null
}>()

const emit = defineEmits<{
  (e: 'file-click', node: FileNode): void
  (e: 'open-folder'): void
}>()

const treeProps = {
  children: 'children',
  label: 'name',
}

const defaultExpanded = computed(() => {
  if (props.data.length > 0 && props.data[0].type === 'directory') {
    return [props.data[0].path]
  }
  return []
})

const workspaceName = computed(() => {
  if (!props.workspaceRoot) return ''
  const parts = props.workspaceRoot.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || props.workspaceRoot
})

function handleNodeClick(node: FileNode): void {
  if (node.type === 'file') {
    emit('file-click', node)
  }
}
</script>

<style scoped>
.file-tree-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sidebar-header {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #bbbbbb;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #252526;
  flex-shrink: 0;
}

.open-folder-btn {
  cursor: pointer;
  font-size: 15px;
  padding: 2px;
  border-radius: 3px;
  color: #cccccc;
}

.open-folder-btn:hover {
  background-color: #3a3d3e;
}

.workspace-name {
  padding: 4px 12px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: #252526;
  flex-shrink: 0;
}

.tree-loading {
  padding: 12px;
  font-size: 12px;
  color: #888;
}

.file-tree {
  flex: 1;
  overflow-y: auto;
  background-color: transparent;
  color: #cccccc;
  padding: 2px 0;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.node-icon {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #c5c5c5;
  flex-shrink: 0;
}

.node-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px 15px;
  color: #666;
  font-size: 13px;
  cursor: default;
}

.empty-tree p {
  margin: 0;
}

:deep(.el-tree-node__content) {
  height: 24px;
  padding: 0 4px;
}

:deep(.el-tree-node__content:hover) {
  background-color: #2a2d2e;
}

:deep(.el-tree-node:focus > .el-tree-node__content) {
  background-color: #37373d;
}

:deep(.el-tree-node__expand-icon) {
  color: #cccccc;
  font-size: 12px;
  padding: 2px;
}

:deep(.el-tree-node__expand-icon.expanded) {
  transform: rotate(90deg);
}

:deep(.el-tree-node__children) {
  overflow: hidden;
}
</style>
