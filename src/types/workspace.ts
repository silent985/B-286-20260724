import type * as monaco from 'monaco-editor'

export interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileTreeNode[]
}

export interface EditorTab {
  id: string
  filePath: string
  fileName: string
  language: string
  isDirty: boolean
  model: monaco.editor.ITextModel | null
}

export interface WorkspaceAPI {
  openFolder: () => Promise<string | null>
  readDirectory: (dirPath: string) => Promise<FileTreeNode[]>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<void>
  confirmClose: () => void
  onCloseRequest: (callback: () => void) => () => void
}

declare global {
  interface Window {
    workspace: WorkspaceAPI
  }
}

export function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    vue: 'html',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    md: 'markdown',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    txt: 'plaintext',
    ini: 'ini',
    toml: 'ini',
    cfg: 'ini',
    env: 'ini',
  }
  return map[ext] ?? 'plaintext'
}
