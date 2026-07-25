import type { FileNode, CloseDecision } from './file'

export type { FileNode, CloseDecision }

export interface OpenTab {
  path: string
  name: string
  language: string
  model: import('monaco-editor').editor.ITextModel
}

export interface WorkspaceApi {
  openFolder(): Promise<string | null>
  readDir(dirPath: string): Promise<FileNode[]>
  readFile(filePath: string): Promise<string>
  writeFile(filePath: string, content: string): Promise<void>
  onCloseQuery(callback: () => void | Promise<void>): () => void
  respondCloseDecision(decision: CloseDecision): void
}

declare global {
  interface Window {
    workspace: WorkspaceApi
  }
}
