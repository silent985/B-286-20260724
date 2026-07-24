<template>
  <div ref="editorContainer" class="editor-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  model: monaco.editor.ITextModel | null
}>()

const emit = defineEmits<{
  (e: 'cursor-change', position: { lineNumber: number; column: number }): void
}>()

const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let cursorDisposable: monaco.IDisposable | null = null

onMounted(() => {
  if (!editorContainer.value) return

  editor = monaco.editor.create(editorContainer.value, {
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    fontSize: 14,
    fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
    padding: { top: 10 },
    model: props.model ?? undefined,
  })

  cursorDisposable = editor.onDidChangeCursorPosition((e) => {
    emit('cursor-change', { lineNumber: e.position.lineNumber, column: e.position.column })
  })

  const pos = editor.getPosition()
  if (pos) {
    emit('cursor-change', { lineNumber: pos.lineNumber, column: pos.column })
  }
})

watch(
  () => props.model,
  (newModel) => {
    if (!editor) return
    const current = editor.getModel()
    if (current === newModel) return
    editor.setModel(newModel)
    const pos = editor.getPosition()
    if (pos) {
      emit('cursor-change', { lineNumber: pos.lineNumber, column: pos.column })
    }
  },
)

onBeforeUnmount(() => {
  cursorDisposable?.dispose()
  editor?.dispose()
  editor = null
})

defineExpose({
  getEditor: () => editor,
})
</script>

<style scoped>
.editor-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
