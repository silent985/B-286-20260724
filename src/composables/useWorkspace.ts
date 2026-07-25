import { ref, shallowRef } from 'vue'
import type { LoadFunction } from 'element-plus'
import type { DirEntry, OpenedFolder } from '../types/ipc'

/**
 * Owns the currently opened workspace folder and lazily feeds its directory
 * tree to `<el-tree lazy :load="loadNode">`. Directory children are fetched
 * on demand as nodes expand, so large trees stay cheap.
 */
export function useWorkspace() {
  const folder = shallowRef<OpenedFolder | null>(null)
  /** Bumped whenever a new folder opens so the tree can be re-keyed/re-mounted. */
  const treeVersion = ref(0)

  /** Prompt for a folder and, if chosen, make it the active workspace. */
  async function openFolder(): Promise<void> {
    const chosen = await window.electronAPI.openFolder()
    if (chosen) {
      folder.value = chosen
      treeVersion.value += 1
    }
  }

  /** Lazy loader for el-tree: root level yields the folder's entries. */
  const loadNode: LoadFunction = (node, resolve) => {
    const dirPath = node.level === 0 ? folder.value?.path : (node.data as DirEntry).path
    if (!dirPath) {
      resolve([])
      return
    }
    window.electronAPI
      .readDirectory(dirPath)
      .then((entries) => resolve(entries))
      .catch(() => resolve([]))
  }

  return { folder, treeVersion, openFolder, loadNode }
}
