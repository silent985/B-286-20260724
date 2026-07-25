<template>
  <div ref="editorContainer" class="editor-container"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import type { EditorTab } from '../composables/useEditorTabs'

/**
 * Thin wrapper around a single Monaco editor instance. Tabs are represented by
 * their own `ITextModel`; this component simply swaps the active model in and
 * out, preserving each tab's view state (cursor + scroll) across switches.
 */
const props = defineProps<{
  /** The tab whose model should currently be displayed, or `null` for none. */
  tab: EditorTab | null
}>()

const emit = defineEmits<{
  (event: 'cursor-change', position: { line: number; column: number }): void
  (event: 'save'): void
}>()

const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
/** The tab currently bound to the editor, so we can persist its view state. */
let boundTab: EditorTab | null = null

/** Detach the current model, saving its view state back onto the tab. */
function detachCurrent(): void {
  if (editor && boundTab) {
    boundTab.viewState = editor.saveViewState()
  }
  boundTab = null
}

/** Bind a tab's model to the editor and restore its saved view state. */
function attach(tab: EditorTab | null): void {
  if (!editor) return
  detachCurrent()

  if (!tab) {
    editor.setModel(null)
    return
  }

  editor.setModel(tab.model)
  if (tab.viewState) {
    editor.restoreViewState(tab.viewState)
  }
  editor.focus()
  boundTab = tab
}

onMounted(() => {
  if (!editorContainer.value) return

  editor = monaco.editor.create(editorContainer.value, {
    model: null,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
    padding: { top: 10 },
  })

  editor.onDidChangeCursorPosition((event) => {
    emit('cursor-change', {
      line: event.position.lineNumber,
      column: event.position.column,
    })
  })

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    emit('save')
  })

  attach(props.tab)
})

watch(
  () => props.tab,
  (tab) => attach(tab),
)

onBeforeUnmount(() => {
  detachCurrent()
  editor?.dispose()
  editor = null
})
</script>

<style scoped>
.editor-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
