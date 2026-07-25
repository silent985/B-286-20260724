import { contextBridge, ipcRenderer } from 'electron'
import type { DirEntry, ElectronAPI, OpenedFolder } from '../src/types/ipc'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other apts you need here.
  // ...
})

// --------- Typed workspace/filesystem bridge ---------
const electronAPI: ElectronAPI = {
  openFolder: (): Promise<OpenedFolder | null> => ipcRenderer.invoke('dialog:open-folder'),
  readDirectory: (dirPath: string): Promise<DirEntry[]> =>
    ipcRenderer.invoke('fs:read-directory', dirPath),
  readFile: (filePath: string): Promise<string> => ipcRenderer.invoke('fs:read-file', filePath),
  writeFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('fs:write-file', filePath, content),
  onCloseRequest: (callback: () => void): (() => void) => {
    const listener = () => callback()
    ipcRenderer.on('window:close-request', listener)
    return () => ipcRenderer.off('window:close-request', listener)
  },
  confirmClose: (): void => ipcRenderer.send('window:confirm-close'),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
