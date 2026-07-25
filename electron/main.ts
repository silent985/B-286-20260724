import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { DirEntry, OpenedFolder } from '../src/types/ipc'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')


let win: BrowserWindow | null = null
/** Set once the renderer has approved the pending close request. */
let allowClose = false
/**
 * Absolute, symlink-resolved path of the folder the user opened. All filesystem
 * access is confined to this root; it is `null` until a folder is chosen.
 */
let workspaceRoot: string | null = null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

/**
 * Resolve `target` and assert it stays within the current workspace root,
 * following symlinks so links cannot escape the sandbox. Throws a coded error
 * the renderer can translate. Returns the resolved absolute path to operate on.
 */
async function resolveInsideWorkspace(target: string): Promise<string> {
  if (!workspaceRoot) {
    throw new Error('WORKSPACE_NOT_OPEN')
  }
  let resolved = path.resolve(target)
  try {
    // Follow symlinks where the path exists so links can't point outside root.
    resolved = await fs.realpath(resolved)
  } catch {
    // Path may not exist yet; fall back to the lexically-resolved path, which
    // still blocks `..` traversal below.
  }
  const rel = path.relative(workspaceRoot, resolved)
  const inside = rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel))
  if (!inside) {
    throw new Error('PATH_OUTSIDE_WORKSPACE')
  }
  return resolved
}

/**
 * Heuristic guard against opening binary (or non-UTF-8) files as text: a NUL
 * byte almost never appears in real UTF-8 text, and a strict decode/re-encode
 * round-trip catches invalid byte sequences. This keeps binaries from being
 * shown as mojibake and then silently overwritten as UTF-8 on save.
 */
function isProbablyUtf8Text(buffer: Buffer): boolean {
  // Inspect a bounded prefix so huge files stay cheap to screen.
  const sample = buffer.subarray(0, 8192)
  if (sample.includes(0)) {
    return false
  }
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    decoder.decode(sample)
    return true
  } catch {
    return false
  }
}

function createWindow() {
  // A rebuilt window starts fresh: the previous window's approved-close state
  // must not carry over, or the new window would close without prompting.
  allowClose = false
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    backgroundColor: '#1e1e1e', // Dark background
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    webPreferences: {
      // `package.json` uses `"type": "module"`, so vite-plugin-electron emits
      // the preload bundle as `preload.mjs`.
      preload: path.join(__dirname, 'preload.mjs'),
    },
    // autoHideMenuBar: true, // Optional: hide menu bar for cleaner look
    titleBarStyle: 'hidden', // Custom title bar style if we want to implement one later, or just use native
    titleBarOverlay: {
        color: '#1e1e1e',
        symbolColor: '#ffffff',
        height: 30
    }
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Route the OS/user close request through the renderer so it can prompt about
  // unsaved changes. The renderer replies via the `window:confirm-close` channel.
  win.on('close', (event) => {
    if (allowClose) return
    event.preventDefault()
    win?.webContents.send('window:close-request')
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST as string, 'index.html'))
  }
}

/** Register the filesystem/workspace IPC handlers used by the renderer. */
function registerIpcHandlers() {
  ipcMain.handle('dialog:open-folder', async (): Promise<OpenedFolder | null> => {
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    // Resolve symlinks up front so the sandbox root matches what realpath()
    // will later report for files inside it.
    const folderPath = await fs.realpath(result.filePaths[0])
    workspaceRoot = folderPath
    return { path: folderPath, name: path.basename(folderPath) }
  })

  ipcMain.handle('fs:read-directory', async (_event, dirPath: string): Promise<DirEntry[]> => {
    const safePath = await resolveInsideWorkspace(dirPath)
    const dirents = await fs.readdir(safePath, { withFileTypes: true })
    return dirents
      .map((dirent): DirEntry => ({
        name: dirent.name,
        path: path.join(safePath, dirent.name),
        isDirectory: dirent.isDirectory(),
      }))
      // Directories first, then files, each alphabetically (case-insensitive).
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      })
  })

  ipcMain.handle('fs:read-file', async (_event, filePath: string): Promise<string> => {
    const safePath = await resolveInsideWorkspace(filePath)
    const buffer = await fs.readFile(safePath)
    if (!isProbablyUtf8Text(buffer)) {
      throw new Error('UNSUPPORTED_ENCODING')
    }
    return buffer.toString('utf-8')
  })

  ipcMain.handle('fs:write-file', async (_event, filePath: string, content: string): Promise<void> => {
    const safePath = await resolveInsideWorkspace(filePath)
    await fs.writeFile(safePath, content, 'utf-8')
  })

  // The renderer approved the close; drop the guard and close for real.
  ipcMain.on('window:confirm-close', () => {
    allowClose = true
    win?.close()
  })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
})
