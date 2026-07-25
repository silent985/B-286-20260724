/**
 * Shared IPC contract between the Electron main process, the preload bridge and
 * the Vue renderer. Keeping a single source of truth here avoids drift between
 * the three layers and lets the renderer be strictly typed against `window`.
 */

/** A single entry (file or directory) inside a workspace directory. */
export interface DirEntry {
  /** Base name shown in the tree, e.g. `main.ts`. */
  name: string
  /** Absolute path on disk, used as the stable node/tab identifier. */
  path: string
  /** Whether this entry is a directory (expandable) or a file (openable). */
  isDirectory: boolean
}

/** A workspace folder chosen by the user. */
export interface OpenedFolder {
  /** Absolute path of the folder. */
  path: string
  /** Base name of the folder, shown as the tree root label. */
  name: string
}

/**
 * The surface exposed on `window.electronAPI` by the preload script. All
 * filesystem access flows through these methods so the renderer never touches
 * Node APIs directly.
 */
export interface ElectronAPI {
  /** Open a native folder picker; resolves to the chosen folder or `null`. */
  openFolder(): Promise<OpenedFolder | null>
  /** List the immediate children of a directory (used for lazy tree loading). */
  readDirectory(dirPath: string): Promise<DirEntry[]>
  /** Read a text file as UTF-8. */
  readFile(filePath: string): Promise<string>
  /** Persist UTF-8 text to a file. */
  writeFile(filePath: string, content: string): Promise<void>
  /**
   * Register a handler invoked when the OS/user requests the window to close.
   * The renderer is responsible for calling {@link ElectronAPI.confirmClose}
   * once it has decided the window may close. Returns an unsubscribe function.
   */
  onCloseRequest(callback: () => void): () => void
  /** Tell the main process it is now safe to close the window. */
  confirmClose(): void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
