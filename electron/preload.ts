import { contextBridge, ipcRenderer } from 'electron'
import type { FileNode, CloseDecision } from '../src/types/file'

contextBridge.exposeInMainWorld('workspace', {
  openFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog:openFolder'),

  readDir: (dirPath: string): Promise<FileNode[]> =>
    ipcRenderer.invoke('workspace:readDir', dirPath),

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('workspace:readFile', filePath),

  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('workspace:writeFile', filePath, content),

  onCloseQuery: (callback: () => void | Promise<void>): (() => void) => {
    const listener = () => callback()
    ipcRenderer.on('workspace:closeQuery', listener)
    return () => ipcRenderer.off('workspace:closeQuery', listener)
  },

  respondCloseDecision: (decision: CloseDecision): void => {
    ipcRenderer.send('workspace:closeResponse', decision)
  },
})
