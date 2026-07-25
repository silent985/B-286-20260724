<template>
  <el-container class="layout-container">
    <el-aside width="250px" class="sidebar">
      <FileTree
        :data="fileTree"
        :loading="loading"
        :workspace-root="workspaceRoot"
        @file-click="handleFileClick"
        @open-folder="handleOpenFolder"
      />
    </el-aside>

    <el-container class="editor-column">
      <TabBar
        :tabs="tabs"
        :active-path="activePath"
        :is-dirty="isDirty"
        @activate="handleActivateTab"
        @close="handleTabClose"
      />

      <EditorArea
        :active-tab="activeTab"
        :workspace-root="workspaceRoot"
        @cursor-change="handleCursorChange"
      />

      <el-footer height="25px" class="status-bar drag-region">
        <div class="status-item">{{ workspaceName }}</div>
        <div class="status-item">{{ activeTab?.language ?? 'Plain Text' }}</div>
        <div class="status-item right">Ln {{ cursor.lineNumber }}, Col {{ cursor.column }}</div>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import FileTree from './components/FileTree.vue'
import TabBar from './components/TabBar.vue'
import EditorArea from './components/EditorArea.vue'
import { useAppController } from './composables/useAppController'

const {
  fileTree,
  loading,
  workspaceRoot,
  tabs,
  activePath,
  activeTab,
  isDirty,
  cursor,
  workspaceName,
  handleFileClick,
  handleTabClose,
  handleOpenFolder,
  handleActivateTab,
  handleCursorChange,
} = useAppController()
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background-color: #1e1e1e;
}

.sidebar {
  background-color: #252526;
  border-right: 1px solid #1e1e1e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-column {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.status-bar {
  background-color: #007acc;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  justify-content: flex-start;
  gap: 15px;
  flex-shrink: 0;
}

.status-item {
  cursor: default;
  white-space: nowrap;
}

.status-item.right {
  margin-left: auto;
}

.drag-region {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}
</style>
