<template>
  <el-container class="layout-container">
    <el-aside width="250px" class="sidebar">
      <FileTree
        :file-tree="fileTree"
        :workspace-name="workspaceDisplayName"
        @file-click="handleFileClick"
        @open-folder="handleOpenFolder"
      />
    </el-aside>

    <el-container class="editor-area">
      <div v-if="tabs.length > 0" class="tabs-header drag-region">
        <EditorTabs
          :tabs="tabs"
          :active-tab-id="activeTabId"
          @activate="activateTab"
          @close="handleCloseTab"
        />
      </div>
      <div v-else class="tabs-header-empty drag-region"></div>

      <el-main class="editor-main">
        <CodeEditor
          :has-model="!!activeTab?.model"
          @container-ready="handleEditorReady"
        />
      </el-main>

      <el-footer height="25px" class="status-bar">
        <div class="status-item">{{ workspaceDisplayName || 'No workspace' }}</div>
        <div class="status-item">{{ activeTab?.language || 'Plain Text' }}</div>
        <div class="status-item right">Ln {{ cursorPosition.line }}, Col {{ cursorPosition.column }}</div>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import * as monaco from 'monaco-editor'
import FileTree from './components/FileTree.vue'
import EditorTabs from './components/EditorTabs.vue'
import CodeEditor from './components/CodeEditor.vue'
import { useWorkspace } from './composables/useWorkspace'
import { useEditorTabs } from './composables/useEditorTabs'
import { useMonacoEditor } from './composables/useMonacoEditor'
import type { FileTreeNode } from './types/workspace'

const { workspacePath, fileTree, openFolder, getWorkspaceName } = useWorkspace()

const {
  tabs,
  activeTabId,
  activeTab,
  hasDirtyTabs,
  getDirtyTabNames,
  openFile,
  activateTab,
  removeTab,
  saveTab,
  saveActiveTab,
  saveAllDirty,
  markDirty,
  getTab,
  closeAllTabs,
} = useEditorTabs()

const { cursorPosition, initEditor, addAction, disposeEditor } = useMonacoEditor(
  () => activeTab.value,
  (tabId: string) => markDirty(tabId),
)

const workspaceDisplayName = computed(() => {
  if (!workspacePath.value) return ''
  return getWorkspaceName()
})

const handleOpenFolder = async () => {
  await openFolder()
}

const handleFileClick = async (node: FileTreeNode) => {
  if (node.isDirectory) return
  const tab = await openFile(node.path, node.name)
  if (!tab) {
    ElMessage.error(`Failed to open "${node.name}" — it may be a binary file.`)
  }
}

const handleEditorReady = (el: HTMLElement) => {
  initEditor(el)
}

const handleCloseTab = async (tabId: string) => {
  const tab = getTab(tabId)
  if (!tab) return

  if (!tab.isDirty) {
    removeTab(tabId)
    return
  }

  try {
    const action = await ElMessageBox.confirm(
      `"${tab.fileName}" has unsaved changes. Do you want to save?`,
      'Unsaved Changes',
      {
        confirmButtonText: 'Save',
        cancelButtonText: "Don't Save",
        distinguishCancelAndClose: true,
        type: 'warning',
        closeOnClickModal: false,
      },
    )

    if (action === 'confirm') {
      const saved = await saveTab(tabId)
      if (saved) {
        removeTab(tabId)
      } else {
        ElMessage.error(`Failed to save "${tab.fileName}". The file may be read-only or locked.`)
      }
    }
  } catch (action) {
    if (action === 'cancel') {
      removeTab(tabId)
    }
  }
}

const handleWindowClose = async () => {
  if (!hasDirtyTabs.value) {
    window.workspace.confirmClose()
    return
  }

  const dirtyNames = getDirtyTabNames()
  const message = dirtyNames.length === 1
    ? `"${dirtyNames[0]}" has unsaved changes. Save before exiting?`
    : `${dirtyNames.length} files have unsaved changes:\n${dirtyNames.map(n => `• ${n}`).join('\n')}\n\nSave all before exiting?`

  try {
    const action = await ElMessageBox.confirm(
      message,
      'Unsaved Changes',
      {
        confirmButtonText: 'Save All',
        cancelButtonText: "Don't Save",
        distinguishCancelAndClose: true,
        type: 'warning',
        closeOnClickModal: false,
      },
    )

    if (action === 'confirm') {
      const result = await saveAllDirty()
      if (result.success) {
        window.workspace.confirmClose()
      } else {
        ElMessage.error(
          `Failed to save: ${result.failedFiles.join(', ')}. Files may be read-only or locked.`,
        )
      }
    }
  } catch (action) {
    if (action === 'cancel') {
      window.workspace.confirmClose()
    }
  }
}

let closeListener: (() => void) | null = null

onMounted(() => {
  addAction({
    id: 'save-file',
    label: 'Save File',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
    run: async () => {
      const saved = await saveActiveTab()
      if (!saved && activeTabId.value) {
        const tab = getTab(activeTabId.value)
        if (tab) {
          ElMessage.error(`Failed to save "${tab.fileName}". The file may be read-only or locked.`)
        }
      }
    },
  })

  closeListener = window.workspace.onCloseRequest(() => {
    handleWindowClose()
  })
})

onBeforeUnmount(() => {
  closeListener?.()
  closeAllTabs()
  disposeEditor()
})
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

.editor-area {
  display: flex;
  flex-direction: column;
}

.tabs-header {
  flex-shrink: 0;
}

.tabs-header-empty {
  height: 35px;
  background-color: #252526;
  border-bottom: 1px solid #1e1e1e;
}

.editor-main {
  padding: 0;
  overflow: hidden;
  background-color: #1e1e1e;
  position: relative;
  flex: 1;
}

.status-bar {
  background-color: #007acc;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 12px;
  flex-shrink: 0;
}

.status-item {
  margin-right: 15px;
  cursor: default;
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
