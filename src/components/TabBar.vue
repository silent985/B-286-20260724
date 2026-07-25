<template>
  <div class="tab-bar no-drag">
    <div
      v-for="tab in tabs"
      :key="tab.path"
      class="tab"
      :class="{ active: tab.path === activePath }"
      @click="emit('activate', tab.path)"
      @mousedown.middle.prevent="emit('close', tab.path)"
    >
      <span class="tab-name" :title="tab.path">{{ tab.name }}</span>
      <span
        class="tab-close"
        :class="{ 'is-hovered': hoveredPath === tab.path, 'is-dirty': isDirty(tab.path) }"
        @click.stop="emit('close', tab.path)"
        @mouseenter="hoveredPath = tab.path"
        @mouseleave="hoveredPath = null"
      >
        <span v-if="isDirty(tab.path) && hoveredPath !== tab.path" class="dirty-dot"></span>
        <span v-else class="close-x">×</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { OpenTab } from '../types/workspace'

defineProps<{
  tabs: OpenTab[]
  activePath: string | null
  isDirty: (path: string) => boolean
}>()

const emit = defineEmits<{
  (e: 'activate', path: string): void
  (e: 'close', path: string): void
}>()

const hoveredPath = ref<string | null>(null)
</script>

<style scoped>
.tab-bar {
  display: flex;
  height: 35px;
  background-color: #252526;
  border-bottom: 1px solid #1e1e1e;
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
}

.tab-bar::-webkit-scrollbar {
  height: 3px;
}

.tab {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 100%;
  font-size: 13px;
  color: #969696;
  cursor: pointer;
  border-right: 1px solid #1e1e1e;
  background-color: #2d2d2d;
  min-width: 120px;
  max-width: 220px;
  gap: 8px;
  user-select: none;
  position: relative;
}

.tab.active {
  background-color: #1e1e1e;
  color: #ffffff;
}

.tab.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #007acc;
}

.tab-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  flex-shrink: 0;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.1s, background-color 0.1s;
}

.tab.active .tab-close,
.tab:hover .tab-close,
.tab-close.is-dirty {
  opacity: 1;
}

.tab-close.is-hovered {
  background-color: #4e4e4e;
}

.close-x {
  color: #cccccc;
  font-size: 15px;
  line-height: 14px;
}

.tab.active .close-x {
  color: #ffffff;
}

.dirty-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #cccccc;
}

.tab.active .dirty-dot {
  background-color: #ffffff;
}
</style>
