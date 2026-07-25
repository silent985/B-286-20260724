import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { FileNode, CloseDecision } from '../src/types/file'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  '.vite',
  '.cache',
  'dist',
  'build',
  'out',
  '.DS_Store',
])

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'svg', 'tiff', 'tif',
  'exe', 'dll', 'so', 'dylib', 'bin', 'obj', 'o', 'a', 'lib',
  'zip', 'tar', 'gz', '7z', 'rar', 'bz2', 'xz',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'mp3', 'mp4', 'wav', 'flac', 'ogg', 'avi', 'mov', 'mkv', 'webm',
  'ttf', 'otf', 'woff', 'woff2', 'eot',
  'wasm', 'class', 'jar', 'pyc',
  'db', 'sqlite', 'sqlite3', 'mdb',
])

let win: BrowserWindow | null
let isQuitting = false

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function isBinaryPath(name: string): boolean {
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex === -1) return false
  const ext = name.slice(dotIndex + 1).toLowerCase()
  return BINARY_EXTENSIONS.has(ext)
}

async function readDirRecursive(dirPath: string): Promise<FileNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const nodes: FileNode[] = []

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      const children = await readDirRecursive(fullPath)
      nodes.push({ path: fullPath, name: entry.name, type: 'directory', children })
    } else if (entry.isFile()) {
      if (isBinaryPath(entry.name)) continue
      nodes.push({ path: fullPath, name: entry.name, type: 'file' })
    }
  }

  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return nodes
}

async function readTextFile(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath)
  const sampleLen = Math.min(buf.length, 8192)
  for (let i = 0; i < sampleLen; i++) {
    if (buf[i] === 0) {
      throw new Error('Cannot open binary file as text')
    }
  }
  return buf.toString('utf-8')
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#1e1e1e',
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1e1e1e',
      symbolColor: '#ffffff',
      height: 30,
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  win.on('close', (e) => {
    if (isQuitting) return
    e.preventDefault()
    if (!win) return
    win.webContents.send('workspace:closeQuery')
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST as string, 'index.html'))
  }
}

ipcMain.handle('dialog:openFolder', async (): Promise<string | null> => {
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('workspace:readDir', async (_e, dirPath: string): Promise<FileNode[]> => {
  return readDirRecursive(dirPath)
})

ipcMain.handle('workspace:readFile', async (_e, filePath: string): Promise<string> => {
  return readTextFile(filePath)
})

ipcMain.handle('workspace:writeFile', async (_e, filePath: string, content: string): Promise<void> => {
  await fs.writeFile(filePath, content, 'utf-8')
})

ipcMain.on('workspace:closeResponse', (_e, decision: CloseDecision) => {
  if (decision === 'cancel' || !win) return
  isQuitting = true
  win.close()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
