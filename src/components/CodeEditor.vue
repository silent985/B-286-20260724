<template>
  <div ref="containerRef" class="editor-container"></div>
  <div v-if="!hasModel" class="empty-state">
    <div class="empty-content">
      <el-icon class="empty-icon"><Document /></el-icon>
      <p>Select a file to edit</p>
      <p class="hint">Open a folder from the explorer to get started</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Document } from '@element-plus/icons-vue'

const props = defineProps<{
  hasModel: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)

const emit = defineEmits<{
  (e: 'containerReady', el: HTMLElement): void
}>()

onMounted(() => {
  if (containerRef.value) {
    emit('containerReady', containerRef.value)
  }
})

watch(() => containerRef.value, (el) => {
  if (el) {
    emit('containerReady', el)
  }
})
</script>

<style scoped>
.editor-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1e1e1e;
}

.empty-content {
  text-align: center;
  color: #555;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #444;
}

.empty-content p {
  margin: 4px 0;
  font-size: 14px;
}

.hint {
  font-size: 12px !important;
  color: #444 !important;
}
</style>
