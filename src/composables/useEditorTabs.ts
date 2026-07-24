import { ref, computed } from 'vue'
import * as monaco from 'monaco-editor'
import type { EditorTab } from '../types/workspace'
import { getLanguageFromFileName } from '../types/workspace'

const tabs = ref<EditorTab[]>([])
const activeTabId = ref<string | null>(null)
const savingTabs = new Set<string>()

const activeTab = computed<EditorTab | null>(() => {
  if (!activeTabId.value) return null
  return tabs.value.find((t) => t.id === activeTabId.value) ?? null
})

const hasDirtyTabs = computed(() => tabs.value.some((t) => t.isDirty))

function generateTabId(filePath: string): string {
  return filePath
}

function disposeTabModel(tabId: string) {
  const tab = tabs.value.find((t) => t.id === tabId)
  if (tab?.model) {
    tab.model.dispose()
    tab.model = null
  }
}

export function useEditorTabs() {
  const openFile = async (filePath: string, fileName: string): Promise<EditorTab | null> => {
    const id = generateTabId(filePath)
    const existing = tabs.value.find((t) => t.id === id)
    if (existing) {
      activeTabId.value = id
      return existing
    }

    const language = getLanguageFromFileName(fileName)

    try {
      const content = await window.workspace.readFile(filePath)
      const uri = monaco.Uri.parse(`file:///${filePath.replace(/\\/g, '/')}`)
      const existingModel = monaco.editor.getModel(uri)
      if (existingModel) {
        existingModel.dispose()
      }
      const model = monaco.editor.createModel(content, language, uri)

      const tab: EditorTab = {
        id,
        filePath,
        fileName,
        language,
        isDirty: false,
        model,
      }

      tabs.value.push(tab)
      activeTabId.value = id
      return tab
    } catch (err) {
      console.error('Failed to open file:', err)
      return null
    }
  }

  const activateTab = (tabId: string) => {
    if (tabs.value.find((t) => t.id === tabId)) {
      activeTabId.value = tabId
    }
  }

  const removeTab = (tabId: string): { nextTabId: string | null } => {
    const index = tabs.value.findIndex((t) => t.id === tabId)
    if (index === -1) return { nextTabId: activeTabId.value }

    disposeTabModel(tabId)
    savingTabs.delete(tabId)
    tabs.value.splice(index, 1)

    if (activeTabId.value === tabId) {
      if (tabs.value.length === 0) {
        activeTabId.value = null
        return { nextTabId: null }
      }
      const nextIndex = Math.min(index, tabs.value.length - 1)
      activeTabId.value = tabs.value[nextIndex].id
      return { nextTabId: activeTabId.value }
    }

    return { nextTabId: activeTabId.value }
  }

  const saveTab = async (tabId: string): Promise<boolean> => {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (!tab || !tab.model) return false

    if (savingTabs.has(tabId)) {
      return false
    }

    savingTabs.add(tabId)

    try {
      const snapshotVersionId = tab.model.getVersionId()
      const content = tab.model.getValue()

      await window.workspace.writeFile(tab.filePath, content)

      const currentVersionId = tab.model.getVersionId()
      if (currentVersionId === snapshotVersionId) {
        tab.isDirty = false
      }

      return currentVersionId === snapshotVersionId
    } catch (err) {
      console.error('Failed to save file:', err)
      tab.isDirty = true
      return false
    } finally {
      savingTabs.delete(tabId)
    }
  }

  const saveActiveTab = (): Promise<boolean> => {
    if (!activeTabId.value) return Promise.resolve(false)
    return saveTab(activeTabId.value)
  }

  const saveAllDirty = async (): Promise<{ success: boolean; failedFiles: string[] }> => {
    const dirtyTabIds = tabs.value.filter((t) => t.isDirty && t.model).map((t) => t.id)
    const failedFiles: string[] = []
    let allClean = true

    for (const tabId of dirtyTabIds) {
      const saved = await saveTab(tabId)
      if (!saved) {
        const tab = tabs.value.find((t) => t.id === tabId)
        if (tab) {
          failedFiles.push(tab.fileName)
          allClean = false
        }
      }
    }

    const stillDirty = tabs.value.some((t) => t.isDirty)
    return { success: allClean && !stillDirty, failedFiles }
  }

  const markDirty = (tabId: string) => {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (tab) {
      tab.isDirty = true
    }
  }

  const isSaving = (tabId: string): boolean => {
    return savingTabs.has(tabId)
  }

  const getDirtyTabNames = (): string[] => {
    return tabs.value.filter((t) => t.isDirty).map((t) => t.fileName)
  }

  const getTab = (tabId: string): EditorTab | undefined => {
    return tabs.value.find((t) => t.id === tabId)
  }

  const closeAllTabs = () => {
    for (const tab of tabs.value) {
      if (tab.model) {
        tab.model.dispose()
        tab.model = null
      }
    }
    tabs.value = []
    activeTabId.value = null
    savingTabs.clear()
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    hasDirtyTabs,
    getDirtyTabNames,
    getTab,
    isSaving,
    openFile,
    activateTab,
    removeTab,
    saveTab,
    saveActiveTab,
    saveAllDirty,
    markDirty,
    closeAllTabs,
  }
}
