import { computed, markRaw, ref } from 'vue'
import * as monaco from 'monaco-editor'
import { detectLanguage } from '../utils/language'
import { confirmUnsavedClose, notifyFsError } from '../utils/confirm'

/** Cursor position surfaced to the status bar. */
export interface CursorPosition {
  line: number
  column: number
}

/**
 * A single open file. Each tab owns its own Monaco text model so switching
 * tabs is a cheap `editor.setModel` swap that preserves undo history, language
 * and per-file view state (cursor + scroll).
 */
export interface EditorTab {
  /** Absolute path; unique identity of the tab. */
  path: string
  /** Base name shown on the tab. */
  name: string
  /** Monaco language id, derived from the file extension. */
  language: string
  /** The backing text model (raw — never made reactive). */
  model: monaco.editor.ITextModel
  /** Alternative version id captured at the last save; used for dirty checks. */
  savedVersionId: number
  /** Whether the buffer differs from what is on disk. */
  isDirty: boolean
  /** Editor view state (cursor/scroll) saved when this tab loses focus. */
  viewState: monaco.editor.ICodeEditorViewState | null
}

/**
 * Central store for open editor tabs: opening/closing files, per-tab Monaco
 * models, dirty tracking and persistence. UI components read the reactive
 * state and call the returned actions; all model bookkeeping lives here.
 */
export function useEditorTabs() {
  const tabs = ref<EditorTab[]>([])
  const activePath = ref<string | null>(null)
  const cursor = ref<CursorPosition>({ line: 1, column: 1 })
  /**
   * Paths whose `openFile` is currently awaiting disk I/O. Guards against a
   * second click on the same file racing in before the first tab is pushed,
   * which would otherwise create a duplicate tab sharing one Monaco model.
   */
  const opening = new Set<string>()
  /**
   * Paths with a write currently in flight. Prevents overlapping saves of the
   * same file from finishing out of order and marking a stale version saved.
   */
  const saving = new Set<string>()

  const activeTab = computed<EditorTab | null>(
    () => tabs.value.find((tab) => tab.path === activePath.value) ?? null,
  )
  const hasUnsaved = computed(() => tabs.value.some((tab) => tab.isDirty))

  function findTab(path: string): EditorTab | undefined {
    return tabs.value.find((tab) => tab.path === path)
  }

  /** Obtain (or lazily create) the Monaco model for a file path. */
  function acquireModel(path: string, content: string, language: string): monaco.editor.ITextModel {
    const uri = monaco.Uri.file(path)
    const existing = monaco.editor.getModel(uri)
    if (existing) {
      if (existing.getValue() !== content) {
        existing.setValue(content)
      }
      return existing
    }
    return monaco.editor.createModel(content, language, uri)
  }

  /**
   * Open a file in a tab. If it is already open (or an open is already in
   * flight for the same path), just activate it; otherwise read it from disk,
   * build a model and register dirty tracking.
   */
  async function openFile(file: { path: string; name: string }): Promise<void> {
    const existing = findTab(file.path)
    if (existing) {
      activePath.value = existing.path
      return
    }
    // A concurrent open for this exact path is already loading — don't start a
    // second one that would duplicate the tab / share the model.
    if (opening.has(file.path)) {
      return
    }
    opening.add(file.path)

    let content: string
    try {
      content = await window.electronAPI.readFile(file.path)
    } catch (error) {
      notifyFsError(error)
      return
    } finally {
      opening.delete(file.path)
    }

    // The world may have changed while awaiting I/O: another call could have
    // opened the same path. Re-check so we never create a duplicate tab.
    const raced = findTab(file.path)
    if (raced) {
      activePath.value = raced.path
      return
    }

    const language = detectLanguage(file.name)
    const model = acquireModel(file.path, content, language)

    const tab: EditorTab = {
      path: file.path,
      name: file.name,
      language,
      model: markRaw(model),
      savedVersionId: model.getAlternativeVersionId(),
      isDirty: false,
      viewState: null,
    }

    tabs.value.push(tab)
    activePath.value = tab.path

    // Recompute dirty state against the last-saved snapshot on every edit.
    // The mutation goes through the reactive tab (via `findTab`) rather than
    // the raw `tab` object above, so the tab bar / `hasUnsaved` stay reactive.
    model.onDidChangeContent(() => {
      const reactiveTab = findTab(file.path)
      if (reactiveTab) {
        reactiveTab.isDirty = model.getAlternativeVersionId() !== reactiveTab.savedVersionId
      }
    })
  }

  /** Activate an already-open tab. */
  function activateTab(path: string): void {
    if (findTab(path)) {
      activePath.value = path
    }
  }

  /**
   * Persist a single tab's buffer to disk and reset its dirty baseline.
   *
   * The version id and content are snapshotted *before* the async write so that
   * edits made while the write is in flight are never counted as saved: only
   * the exact version written to disk becomes the new saved baseline, and the
   * tab stays dirty if it has since moved on. A per-path guard prevents two
   * overlapping writes from completing out of order and marking a stale version
   * as saved.
   */
  async function saveTab(path: string): Promise<void> {
    const tab = findTab(path)
    if (!tab || saving.has(path)) return
    saving.add(path)

    const versionToSave = tab.model.getAlternativeVersionId()
    const contentToSave = tab.model.getValue()
    try {
      await window.electronAPI.writeFile(tab.path, contentToSave)
    } catch (error) {
      notifyFsError(error)
      return
    } finally {
      saving.delete(path)
    }

    // The tab may have been closed (model disposed) while writing; if so there
    // is nothing left to update.
    const current = findTab(path)
    if (!current) return
    current.savedVersionId = versionToSave
    current.isDirty = current.model.getAlternativeVersionId() !== versionToSave
  }

  /** Persist the currently active tab, if any. */
  async function saveActive(): Promise<void> {
    if (activePath.value) {
      await saveTab(activePath.value)
    }
  }

  /** Persist every dirty tab. */
  async function saveAll(): Promise<void> {
    await Promise.all(tabs.value.filter((tab) => tab.isDirty).map((tab) => saveTab(tab.path)))
  }

  /** Remove a tab, disposing its model and picking a sensible next active tab. */
  function removeTab(path: string): void {
    const index = tabs.value.findIndex((tab) => tab.path === path)
    if (index === -1) return

    const [removed] = tabs.value.splice(index, 1)
    removed?.model.dispose()

    if (activePath.value === path) {
      const next = tabs.value[index] ?? tabs.value[index - 1] ?? null
      activePath.value = next ? next.path : null
    }
  }

  /**
   * Close a tab, prompting to save when it has unsaved changes.
   * Returns `false` if the user cancelled the close.
   */
  async function closeTab(path: string): Promise<boolean> {
    const tab = findTab(path)
    if (!tab) return true

    if (tab.isDirty) {
      const action = await confirmUnsavedClose(tab.name)
      if (action === 'cancel') return false
      if (action === 'save') await saveTab(path)
    }

    removeTab(path)
    return true
  }

  return {
    tabs,
    activePath,
    activeTab,
    cursor,
    hasUnsaved,
    openFile,
    activateTab,
    closeTab,
    saveTab,
    saveActive,
    saveAll,
  }
}
