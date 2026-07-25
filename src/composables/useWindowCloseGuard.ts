import { onBeforeUnmount, onMounted } from 'vue'
import { confirmUnsavedQuit } from '../utils/confirm'

/** Dependencies the guard needs from the editor-tabs store. */
export interface CloseGuardOptions {
  /** How many tabs currently have unsaved changes. */
  unsavedCount: () => number
  /** Persist every dirty tab. */
  saveAll: () => Promise<void>
}

/**
 * Intercepts the window close request from the main process and prompts about
 * unsaved changes before allowing the window to close. The main process holds
 * the close until the renderer calls `confirmClose()`.
 */
export function useWindowCloseGuard(options: CloseGuardOptions): void {
  let unsubscribe: (() => void) | null = null

  async function handleCloseRequest(): Promise<void> {
    const count = options.unsavedCount()
    if (count === 0) {
      window.electronAPI.confirmClose()
      return
    }

    const action = await confirmUnsavedQuit(count)
    if (action === 'cancel') return
    if (action === 'save') await options.saveAll()
    window.electronAPI.confirmClose()
  }

  onMounted(() => {
    unsubscribe = window.electronAPI.onCloseRequest(() => {
      void handleCloseRequest()
    })
  })

  onBeforeUnmount(() => {
    unsubscribe?.()
    unsubscribe = null
  })
}
