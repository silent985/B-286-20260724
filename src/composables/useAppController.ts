import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { useWorkspace } from './useWorkspace'
import { useEditorTabs } from './useEditorTabs'
import { useCloseGuard } from './useCloseGuard'
import type { FileNode } from '../types/workspace'

export function useAppController() {
  const workspace = useWorkspace()
  const tabs = useEditorTabs()
  const guard = useCloseGuard()

  const cursor = ref({ lineNumber: 1, column: 1 })

  const workspaceName = computed(() => {
    if (!workspace.workspaceRoot.value) return 'No folder opened'
    const parts = workspace.workspaceRoot.value.replace(/\\/g, '/').split('/')
    return parts[parts.length - 1] || workspace.workspaceRoot.value
  })

  async function handleFileClick(node: FileNode): Promise<void> {
    try {
      await tabs.openFile(node.path, node.name)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      ElMessage.error(`Failed to open "${node.name}": ${msg}`)
    }
  }

  async function handleTabClose(path: string): Promise<void> {
    const canClose = await guard.confirmTabClose(path)
    if (!canClose) return
    tabs.closeTab(path)
  }

  async function handleSaveActive(): Promise<void> {
    try {
      const saved = await tabs.saveActiveTab()
      if (saved) ElMessage.success('File saved')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      ElMessage.error(`Save failed: ${msg}`)
    }
  }

  function handleKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      void handleSaveActive()
    }
  }

  async function handleOpenFolder(): Promise<void> {
    const canSwitch = await guard.confirmSwitchWorkspace()
    if (!canSwitch) return

    const selected = await workspace.selectFolder()
    if (!selected) return

    try {
      await workspace.loadFolder(selected)
      tabs.disposeAll()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      ElMessage.error(`Failed to open folder: ${msg}`)
    }
  }

  function handleCursorChange(position: { lineNumber: number; column: number }): void {
    cursor.value = position
  }

  async function handleCloseQuery(): Promise<void> {
    const decision = await guard.confirmAppClose()
    window.workspace.respondCloseDecision(decision)
  }

  let unregisterCloseQuery: (() => void) | null = null

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
    unregisterCloseQuery = window.workspace.onCloseQuery(handleCloseQuery)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
    unregisterCloseQuery?.()
    tabs.disposeAll()
  })

  return {
    fileTree: workspace.fileTree,
    loading: workspace.loading,
    workspaceRoot: workspace.workspaceRoot,
    tabs: tabs.tabs,
    activePath: tabs.activePath,
    activeTab: tabs.activeTab,
    isDirty: tabs.isDirty,
    cursor,
    workspaceName,
    handleFileClick,
    handleTabClose,
    handleOpenFolder,
    handleActivateTab: tabs.activateTab,
    handleCursorChange,
  }
}
