import { ElMessageBox, ElMessage } from 'element-plus'
import { useEditorTabs } from './useEditorTabs'
import type { CloseDecision } from '../types/workspace'

const SAVE_FAILED_MSG = 'Save failed, changes kept unsaved:'

export function useCloseGuard() {
  const { hasUnsaved, dirtyTabs, isDirty, getTab, saveTab, saveAllDirty } = useEditorTabs()

  async function confirmTabClose(path: string): Promise<boolean> {
    if (!isDirty(path)) return true

    const tab = getTab(path)
    const name = tab?.name ?? path

    try {
      await ElMessageBox.confirm(
        `"${name}" has unsaved changes. Do you want to save before closing?`,
        'Unsaved Changes',
        {
          confirmButtonText: 'Save',
          cancelButtonText: "Don't Save",
          distinguishCancelAndClose: true,
          type: 'warning',
          closeOnClickModal: false,
        },
      )
      await saveTab(path)
      return true
    } catch (action) {
      if (action === 'cancel') return true
      if (action === 'close') return false
      const msg = action instanceof Error ? action.message : String(action)
      ElMessage.error(`${SAVE_FAILED_MSG} ${msg}`)
      return false
    }
  }

  async function confirmAppClose(): Promise<CloseDecision> {
    if (!hasUnsaved.value) return 'discard'

    const fileList = dirtyTabs.value.map((t) => t.name).join(', ')

    try {
      await ElMessageBox.confirm(
        `There are unsaved changes in: ${fileList}. Save all before closing?`,
        'Unsaved Changes',
        {
          confirmButtonText: 'Save All',
          cancelButtonText: "Don't Save",
          distinguishCancelAndClose: true,
          type: 'warning',
          closeOnClickModal: false,
        },
      )
      await saveAllDirty()
      return 'discard'
    } catch (action) {
      if (action === 'cancel') return 'discard'
      if (action === 'close') return 'cancel'
      const msg = action instanceof Error ? action.message : String(action)
      ElMessage.error(`${SAVE_FAILED_MSG} ${msg}`)
      return 'cancel'
    }
  }

  async function confirmSwitchWorkspace(): Promise<boolean> {
    if (!hasUnsaved.value) return true

    const fileList = dirtyTabs.value.map((t) => t.name).join(', ')

    try {
      await ElMessageBox.confirm(
        `There are unsaved changes in: ${fileList}. Save all before switching workspace?`,
        'Unsaved Changes',
        {
          confirmButtonText: 'Save All',
          cancelButtonText: "Don't Save",
          distinguishCancelAndClose: true,
          type: 'warning',
          closeOnClickModal: false,
        },
      )
      await saveAllDirty()
      return true
    } catch (action) {
      if (action === 'cancel') return true
      if (action === 'close') return false
      const msg = action instanceof Error ? action.message : String(action)
      ElMessage.error(`${SAVE_FAILED_MSG} ${msg}`)
      return false
    }
  }

  return {
    confirmTabClose,
    confirmAppClose,
    confirmSwitchWorkspace,
  }
}
