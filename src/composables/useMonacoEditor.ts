import { ref, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'
import type { EditorTab } from '../types/workspace'

export function useMonacoEditor(
  getActiveTab: () => EditorTab | null,
  onContentChange: (tabId: string) => void,
) {
  const editor = ref<monaco.editor.IStandaloneCodeEditor | null>(null)
  const cursorPosition = ref({ line: 1, column: 1 })

  let contentChangeListener: monaco.IDisposable | null = null
  let cursorPositionListener: monaco.IDisposable | null = null

  const initEditor = (container: HTMLElement) => {
    if (editor.value) return

    editor.value = monaco.editor.create(container, {
      value: '',
      language: 'plaintext',
      theme: 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: true },
      fontSize: 14,
      fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
      padding: { top: 10 },
    })

    contentChangeListener = editor.value.onDidChangeModelContent(() => {
      const current = getActiveTab()
      if (current) {
        onContentChange(current.id)
      }
    })

    cursorPositionListener = editor.value.onDidChangeCursorPosition((e) => {
      cursorPosition.value = { line: e.position.lineNumber, column: e.position.column }
    })

    const activeTab = getActiveTab()
    if (activeTab?.model) {
      editor.value.setModel(activeTab.model)
    }
  }

  watch(getActiveTab, (tab) => {
    if (!editor.value) return
    if (tab?.model) {
      if (editor.value.getModel() !== tab.model) {
        editor.value.setModel(tab.model)
      }
    } else {
      editor.value.setModel(null)
    }
  })

  const focusEditor = () => {
    editor.value?.focus()
  }

  const addAction = (descriptor: monaco.editor.IActionDescriptor) => {
    editor.value?.addAction(descriptor)
  }

  const disposeEditor = () => {
    contentChangeListener?.dispose()
    cursorPositionListener?.dispose()
    editor.value?.dispose()
    editor.value = null
  }

  onBeforeUnmount(() => {
    disposeEditor()
  })

  return {
    editor,
    cursorPosition,
    initEditor,
    focusEditor,
    addAction,
    disposeEditor,
  }
}
