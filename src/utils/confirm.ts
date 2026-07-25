import { ElMessage, ElMessageBox } from 'element-plus'

/** The user's decision when prompted about unsaved changes. */
export type UnsavedAction = 'save' | 'discard' | 'cancel'

/**
 * Shared 3-way prompt built on top of {@link ElMessageBox}. With
 * `distinguishCancelAndClose`, the confirm button means "save", the cancel
 * button means "discard", and dismissing the dialog (ESC / close icon) means
 * "cancel" — i.e. abort whatever action triggered the prompt.
 */
async function promptUnsaved(message: string, options: {
  title: string
  confirmButtonText: string
  cancelButtonText: string
}): Promise<UnsavedAction> {
  try {
    await ElMessageBox.confirm(message, options.title, {
      confirmButtonText: options.confirmButtonText,
      cancelButtonText: options.cancelButtonText,
      distinguishCancelAndClose: true,
      type: 'warning',
    })
    return 'save'
  } catch (action) {
    return action === 'cancel' ? 'discard' : 'cancel'
  }
}

/** Prompt before closing a single tab with unsaved changes. */
export function confirmUnsavedClose(name: string): Promise<UnsavedAction> {
  return promptUnsaved(`是否保存对 “${name}” 的更改？`, {
    title: '未保存的更改',
    confirmButtonText: '保存',
    cancelButtonText: '不保存',
  })
}

/** Prompt before quitting the app while some tabs have unsaved changes. */
export function confirmUnsavedQuit(count: number): Promise<UnsavedAction> {
  return promptUnsaved(`有 ${count} 个文件未保存，是否在退出前保存？`, {
    title: '退出确认',
    confirmButtonText: '保存并退出',
    cancelButtonText: '不保存直接退出',
  })
}

/** Map a main-process error code to a user-facing message. */
function describeFsError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('UNSUPPORTED_ENCODING')) {
    return '无法以文本方式打开：该文件可能是二进制或使用了不支持的编码。'
  }
  if (message.includes('PATH_OUTSIDE_WORKSPACE')) {
    return '操作被拒绝：目标路径不在当前工作区目录内。'
  }
  if (message.includes('WORKSPACE_NOT_OPEN')) {
    return '请先打开一个工作区文件夹。'
  }
  return '文件操作失败，请重试。'
}

/** Surface a filesystem error to the user as a toast. */
export function notifyFsError(error: unknown): void {
  ElMessage.error(describeFsError(error))
}
