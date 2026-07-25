<template>
  <div class="layout-container">
    <aside class="sidebar-pane">
      <WorkspaceExplorer @open-file="handleOpenFile" />
    </aside>

    <div class="main-pane">
      <EditorTabs
        :tabs="tabs"
        :active-path="activePath"
        @activate="activateTab"
        @close="closeTab"
      />

      <main class="editor-main">
        <CodeEditor
          v-if="activeTab"
          :tab="activeTab"
          @cursor-change="cursor = $event"
          @save="saveActive"
        />
        <div v-else class="empty-state">Select a file to edit</div>
      </main>

      <StatusBar :language="activeTab?.language ?? 'Plain Text'" :cursor="cursor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import CodeEditor from './components/CodeEditor.vue'
import WorkspaceExplorer from './components/WorkspaceExplorer.vue'
import EditorTabs from './components/EditorTabs.vue'
import StatusBar from './components/StatusBar.vue'
import { useEditorTabs } from './composables/useEditorTabs'
import { useWindowCloseGuard } from './composables/useWindowCloseGuard'

const {
  tabs,
  activePath,
  activeTab,
  cursor,
  openFile,
  activateTab,
  closeTab,
  saveActive,
  saveAll,
} = useEditorTabs()

function handleOpenFile(file: { path: string; name: string }): void {
  void openFile(file)
}

useWindowCloseGuard({
  unsavedCount: () => tabs.value.filter((tab) => tab.isDirty).length,
  saveAll,
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  background-color: #1e1e1e;
}

.sidebar-pane {
  width: 250px;
  flex-shrink: 0;
  height: 100%;
}

.main-pane {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-main {
  flex: 1;
  min-height: 0;
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
</style>
