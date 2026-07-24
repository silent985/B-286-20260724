import { ref } from 'vue'
import type { FileTreeNode } from '../types/workspace'

const workspacePath = ref<string | null>(null)
const fileTree = ref<FileTreeNode[]>([])
const isLoading = ref(false)

export function useWorkspace() {
  const openFolder = async (): Promise<boolean> => {
    isLoading.value = true
    try {
      const selectedPath = await window.workspace.openFolder()
      if (!selectedPath) {
        isLoading.value = false
        return false
      }
      workspacePath.value = selectedPath
      const tree = await window.workspace.readDirectory(selectedPath)
      fileTree.value = tree
      isLoading.value = false
      return true
    } catch (err) {
      console.error('Failed to open folder:', err)
      isLoading.value = false
      return false
    }
  }

  const closeWorkspace = () => {
    workspacePath.value = null
    fileTree.value = []
  }

  const getWorkspaceName = (): string => {
    if (!workspacePath.value) return ''
    const parts = workspacePath.value.split(/[\\/]/)
    return parts[parts.length - 1] || workspacePath.value
  }

  return {
    workspacePath,
    fileTree,
    isLoading,
    openFolder,
    closeWorkspace,
    getWorkspaceName,
  }
}
