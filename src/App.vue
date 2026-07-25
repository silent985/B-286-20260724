<template>
  <el-container class="layout-container">
    <el-aside width="250px" class="sidebar">
      <div class="sidebar-header drag-region">EXPLORER</div>
      <el-tree :data="fileTree" :props="defaultProps" @node-click="handleNodeClick" class="file-tree" />
    </el-aside>
    
    <el-container>
      <el-header height="35px" class="editor-header drag-region">
        <div v-for="file in openFiles" :key="file.id" 
             class="tab no-drag" :class="{ active: currentFile?.id === file.id }"
             @click="loadFile(file)">
          {{ file.label }}
          <span class="close-icon" @click.stop="closeFile(file)">×</span>
        </div>
      </el-header>
      
      <el-main class="editor-main">
        <CodeEditor v-if="currentFile" v-model="currentFile.content" :language="currentFile.language" />
        <div v-else class="empty-state">Select a file to edit</div>
      </el-main>
      
      <el-footer height="25px" class="status-bar">
        <div class="status-item">main*</div>
        <div class="status-item">{{ currentFile?.language || 'Plain Text' }}</div>
        <div class="status-item right">Ln 1, Col 1</div>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CodeEditor from './components/CodeEditor.vue'

interface FileNode {
  id: number
  label: string
  children?: FileNode[]
  content?: string
  language?: string
}

const fileTree = ref<FileNode[]>([
  {
    id: 1,
    label: 'src',
    children: [
      { id: 2, label: 'App.vue', language: 'html', content: '<template>\n  <div>Hello World</div>\n</template>' },
      { id: 3, label: 'main.ts', language: 'typescript', content: "import { createApp } from 'vue'\nimport App from './App.vue'\n\ncreateApp(App).mount('#app')" },
      { id: 4, label: 'style.css', language: 'css', content: 'body { background: #000; }' },
    ]
  },
  {
    id: 5,
    label: 'package.json',
    language: 'json',
    content: '{\n  "name": "monaco-editor-app"\n}'
  }
])

const defaultProps = {
  children: 'children',
  label: 'label',
}

const openFiles = ref<FileNode[]>([])
const currentFile = ref<FileNode | null>(null)

const handleNodeClick = (data: FileNode) => {
  if (!data.children) {
    loadFile(data)
  }
}

const loadFile = (file: FileNode) => {
  if (!openFiles.value.find(f => f.id === file.id)) {
    openFiles.value.push(file)
  }
  currentFile.value = file
}

const closeFile = (file: FileNode) => {
  const index = openFiles.value.findIndex(f => f.id === file.id)
  if (index !== -1) {
    openFiles.value.splice(index, 1)
    if (currentFile.value?.id === file.id) {
      currentFile.value = openFiles.value[openFiles.value.length - 1] || null
    }
  }
}
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
}

.sidebar-header {
  padding: 10px;
  font-size: 11px;
  font-weight: bold;
  color: #bbbbbb;
  background-color: #252526;
}

.file-tree {
  background-color: transparent;
  color: #cccccc;
}

:deep(.el-tree-node__content:hover) {
  background-color: #2a2d2e;
}

:deep(.el-tree-node:focus > .el-tree-node__content) {
  background-color: #37373d;
}

.editor-header {
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

.close-icon {
  margin-left: 8px;
  font-size: 14px;
  opacity: 0;
  border-radius: 3px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab:hover .close-icon {
  opacity: 1;
}

.close-icon:hover {
  background-color: #4e4e4e;
  color: white;
}

.editor-main {
  padding: 0;
  overflow: hidden;
  background-color: #1e1e1e;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
}

.status-bar {
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

.drag-region {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}
</style>
