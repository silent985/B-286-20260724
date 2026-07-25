import { contextBridge, ipcRenderer } from 'electron'

interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileTreeNode[]
}

contextBridge.exposeInMainWorld('workspace', {
  openFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFolder'),
  readDirectory: (dirPath: string): Promise<FileTreeNode[]> => ipcRenderer.invoke('fs:readDirectory', dirPath),
  readFile: (filePath: string): Promise<string> => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string): Promise<void> => ipcRenderer.invoke('fs:writeFile', filePath, content),
  confirmClose: (): void => ipcRenderer.send('app:confirmClose'),
  onCloseRequest: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('app-close-request', handler)
    return () => ipcRenderer.off('app-close-request', handler)
  },
})
