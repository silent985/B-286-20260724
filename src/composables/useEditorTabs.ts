import { ref, computed, shallowRef } from 'vue'
import * as monaco from 'monaco-editor'
import type { OpenTab } from '../types/workspace'
import { getLanguageFromFilename } from '../utils/language'

const tabs = shallowRef<OpenTab[]>([])
const activePath = ref<string | null>(null)
const dirtyPaths = ref<Set<string>>(new Set())

export function useEditorTabs() {
  const activeTab = computed<OpenTab | null>(() => {
    if (!activePath.value) return null
    return tabs.value.find((t) => t.path === activePath.value) ?? null
  })

  const hasUnsaved = computed(() => dirtyPaths.value.size > 0)

  const dirtyTabs = computed(() =>
    tabs.value.filter((t) => dirtyPaths.value.has(t.path)),
  )

  function isDirty(path: string): boolean {
    return dirtyPaths.value.has(path)
  }

  function getTab(path: string): OpenTab | undefined {
    return tabs.value.find((t) => t.path === path)
  }

  function markDirty(path: string): void {
    if (!dirtyPaths.value.has(path)) {
      dirtyPaths.value = new Set([...dirtyPaths.value, path])
    }
  }

  function clearDirty(path: string): void {
    if (dirtyPaths.value.has(path)) {
      const next = new Set(dirtyPaths.value)
      next.delete(path)
      dirtyPaths.value = next
    }
  }

  function getExistingModel(path: string): monaco.editor.ITextModel | null {
    const uri = monaco.Uri.file(path)
    return monaco.editor.getModel(uri)
  }

  async function openFile(filePath: string, name: string): Promise<void> {
    const existing = tabs.value.find((t) => t.path === filePath)
    if (existing) {
      activePath.value = filePath
      return
    }

    const language = getLanguageFromFilename(name)
    let model = getExistingModel(filePath)

    if (!model) {
      const content = await window.workspace.readFile(filePath)
      const uri = monaco.Uri.file(filePath)
      model = monaco.editor.createModel(content, language, uri)
    } else if (model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(model, language)
    }

    const tab: OpenTab = {
      path: filePath,
      name,
      language,
      model,
    }

    const changeDisposable = model.onDidChangeContent(() => {
      markDirty(filePath)
    })

    tabs.value = [...tabs.value, tab]
    activePath.value = filePath

    model.onWillDispose(() => changeDisposable.dispose())
  }

  function activateTab(path: string): void {
    if (tabs.value.some((t) => t.path === path)) {
      activePath.value = path
    }
  }

  async function saveTab(path: string): Promise<void> {
    const tab = tabs.value.find((t) => t.path === path)
    if (!tab) throw new Error(`No open tab for path: ${path}`)
    const content = tab.model.getValue()
    await window.workspace.writeFile(path, content)
    clearDirty(path)
  }

  async function saveActiveTab(): Promise<boolean> {
    if (!activePath.value) return false
    await saveTab(activePath.value)
    return true
  }

  async function saveAllDirty(): Promise<void> {
    const dirty = [...dirtyPaths.value]
    await Promise.all(dirty.map((p) => saveTab(p)))
  }

  function closeTab(path: string): void {
    const idx = tabs.value.findIndex((t) => t.path === path)
    if (idx === -1) return

    const tab = tabs.value[idx]
    tab.model.dispose()
    clearDirty(path)

    const next = tabs.value.filter((t) => t.path !== path)
    tabs.value = next

    if (activePath.value === path) {
      if (next.length > 0) {
        const newIdx = Math.min(idx, next.length - 1)
        activePath.value = next[newIdx].path
      } else {
        activePath.value = null
      }
    }
  }

  function disposeAll(): void {
    for (const tab of tabs.value) {
      tab.model.dispose()
    }
    tabs.value = []
    dirtyPaths.value = new Set()
    activePath.value = null
  }

  return {
    tabs,
    activePath,
    activeTab,
    hasUnsaved,
    dirtyTabs,
    isDirty,
    getTab,
    openFile,
    activateTab,
    closeTab,
    saveTab,
    saveActiveTab,
    saveAllDirty,
    disposeAll,
  }
}
