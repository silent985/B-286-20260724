import { ref, shallowRef } from 'vue'
import type { FileNode } from '../types/workspace'

const workspaceRoot = ref<string | null>(null)
const fileTree = shallowRef<FileNode[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

export function useWorkspace() {
  async function selectFolder(): Promise<string | null> {
    return window.workspace.openFolder()
  }

  async function loadFolder(folderPath: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const tree = await window.workspace.readDir(folderPath)
      workspaceRoot.value = folderPath
      fileTree.value = tree
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      error.value = message
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  function reset(): void {
    workspaceRoot.value = null
    fileTree.value = []
    error.value = null
  }

  return {
    workspaceRoot,
    fileTree,
    loading,
    error,
    selectFolder,
    loadFolder,
    reset,
  }
}
