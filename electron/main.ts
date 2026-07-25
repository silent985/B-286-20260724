import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as fs from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileTreeNode[]
}

const IGNORED_DIRS = new Set<string>([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'out',
  'build',
  'release',
  '.next',
  '.nuxt',
  '.cache',
  '.parcel-cache',
  'coverage',
  '__pycache__',
  '.venv',
  'venv',
  'env',
  'target',
  '.idea',
  '.turbo',
  '.vercel',
  '.netlify',
  '.svelte-kit',
])

const TEXT_EXTENSIONS = new Set<string>([
  'txt', 'md', 'markdown', 'rst', 'adoc',
  'json', 'jsonc', 'json5', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'env',
  'xml', 'csv', 'tsv', 'plist',
  'html', 'htm', 'xhtml', 'vue', 'svelte', 'jsx', 'tsx',
  'css', 'scss', 'sass', 'less', 'styl', 'postcss',
  'js', 'mjs', 'cjs', 'ts', 'mts', 'cts',
  'py', 'rb', 'php', 'java', 'kt', 'kts', 'groovy', 'scala', 'clj', 'cljs',
  'c', 'h', 'cpp', 'hpp', 'cc', 'hh', 'cxx', 'hxx', 'cs', 'fs', 'fsx',
  'go', 'rs', 'swift', 'm', 'mm', 'dart', 'zig', 'v',
  'sh', 'bash', 'zsh', 'fish', 'bat', 'cmd', 'ps1', 'awk', 'sed',
  'sql', 'mysql', 'pgsql', 'pls', 'pkb',
  'r', 'jl', 'ex', 'exs', 'erl', 'hrl', 'hs', 'lhs', 'elm',
  'lua', 'pl', 'pm', 'tcl',
  'dockerfile', 'makefile', 'cmake', 'gradle', 'maven',
  'gitignore', 'gitattributes', 'editorconfig', 'eslintrc', 'prettierrc',
  'stylelintrc', 'babelrc', 'npmrc', 'nvmrc', 'node-version',
  'commitlintrc', 'huskyrc', 'lintstagedrc', 'browserslistrc',
  'trae', 'log',
  'svg',
  'wasm', 'wat',
  'properties', 'proto', 'thrift',
  'graphql', 'gql',
  'handlebars', 'hbs', 'mustache', 'ejs', 'pug', 'jade',
  'coffeescript', 'coffee',
  'tex', 'latex',
  'diff', 'patch',
])

const BINARY_EXTENSIONS = new Set<string>([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'tiff', 'tif', 'psd', 'ai', 'eps',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar', 'tgz',
  'exe', 'dll', 'so', 'dylib', 'a', 'lib', 'o', 'obj',
  'class', 'jar', 'war', 'ear',
  'pyc', 'pyo', 'pyd',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'mp3', 'mp4', 'wav', 'ogg', 'flac', 'aac', 'avi', 'mov', 'mkv', 'webm',
  'db', 'sqlite', 'sqlite3',
  'bin', 'dat', 'pak', 'pkg', 'dmg', 'iso', 'img',
  'lock',
])

const BINARY_MAGIC_NUMBERS: number[][] = [
  [0x00, 0x00, 0x01, 0x00],
  [0x00, 0x00, 0x02, 0x00],
  [0x89, 0x50, 0x4E, 0x47],
  [0xFF, 0xD8, 0xFF],
  [0x47, 0x49, 0x46, 0x38],
  [0x42, 0x4D],
  [0x50, 0x4B, 0x03, 0x04],
  [0x52, 0x61, 0x72, 0x21],
  [0x1F, 0x8B],
  [0x7F, 0x45, 0x4C, 0x46],
  [0x4D, 0x5A],
  [0x25, 0x50, 0x44, 0x46],
  [0x00, 0x01, 0x00, 0x00, 0x00],
  [0xCA, 0xFE, 0xBA, 0xBE],
  [0xFE, 0xED, 0xFA],
]

function isTextFile(name: string): boolean {
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex === -1) {
    const lower = name.toLowerCase()
    const noExtNames = ['makefile', 'dockerfile', 'rakefile', 'gemfile', 'procfile',
      'cmakelists.txt', 'vagrantfile', 'guardfile', 'rackup']
    if (noExtNames.includes(lower)) return true
    if (lower.startsWith('license') || lower.startsWith('readme') ||
        lower.startsWith('changelog') || lower.startsWith('authors') ||
        lower.startsWith('contributors') || lower.startsWith('todo') ||
        lower.startsWith('copying') || lower.startsWith('news')) return true
    return false
  }
  const ext = name.slice(dotIndex + 1).toLowerCase()
  if (TEXT_EXTENSIONS.has(ext)) return true
  if (BINARY_EXTENSIONS.has(ext)) return false
  return false
}

function isVisibleDotfile(name: string): boolean {
  if (!name.startsWith('.')) return false
  if (IGNORED_DIRS.has(name)) return false
  const prefixes = [
    '.gitignore', '.gitattributes', '.env', '.eslint', '.prettier', '.babel',
    '.editorconfig', '.npmrc', '.nvmrc', '.node-version',
    '.stylelint', '.commitlint', '.huskyrc', '.lintstagedrc',
    '.browserslistrc', '.trae', '.dockerignore', '.npmignore',
    '.gcloudignore', '.firebaserc', '.gitatributes',
  ]
  return prefixes.some((p) => name.startsWith(p))
}

async function readDirectoryRecursive(dirPath: string): Promise<FileTreeNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const nodes: FileTreeNode[] = []

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue
    if (entry.name.startsWith('.') && !isVisibleDotfile(entry.name)) continue

    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      try {
        const children = await readDirectoryRecursive(fullPath)
        nodes.push({ name: entry.name, path: fullPath, isDirectory: true, children })
      } catch {
        // skip unreadable directories
      }
    } else if (isTextFile(entry.name)) {
      nodes.push({ name: entry.name, path: fullPath, isDirectory: false })
    }
  }

  nodes.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return nodes
}

function matchesMagicNumber(buffer: Buffer): boolean {
  for (const magic of BINARY_MAGIC_NUMBERS) {
    if (buffer.length >= magic.length) {
      let matches = true
      for (let i = 0; i < magic.length; i++) {
        if (buffer[i] !== magic[i]) {
          matches = false
          break
        }
      }
      if (matches) return true
    }
  }
  return false
}

function looksLikeBinary(buffer: Buffer): boolean {
  const sampleSize = Math.min(buffer.length, 8192)

  if (sampleSize === 0) return false

  if (matchesMagicNumber(buffer)) return true

  let nullByteCount = 0
  let controlCharCount = 0

  for (let i = 0; i < sampleSize; i++) {
    const byte = buffer[i]
    if (byte === 0) {
      nullByteCount++
    } else if (byte < 9 || (byte > 13 && byte < 32) || byte === 127) {
      controlCharCount++
    }
  }

  if (nullByteCount >= 4) return true

  const controlRatio = controlCharCount / sampleSize
  if (controlRatio > 0.1 && sampleSize > 64) return true

  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    decoder.decode(buffer.subarray(0, sampleSize))
  } catch {
    return true
  }

  return false
}

function resolvePreloadPath(): string {
  return path.join(__dirname, 'preload.js')
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#1e1e1e',
    icon: path.join(process.env.VITE_PUBLIC as string, 'vite.svg'),
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
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
    if (win) {
      e.preventDefault()
      win.webContents.send('app-close-request')
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST as string, 'index.html'))
  }
}

ipcMain.handle('dialog:openFolder', async () => {
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('fs:readDirectory', async (_event, dirPath: string) => {
  try {
    return await readDirectoryRecursive(dirPath)
  } catch (err) {
    console.error('Failed to read directory:', err)
    return []
  }
})

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const buffer = await fs.readFile(filePath)
    if (looksLikeBinary(buffer)) {
      throw new Error('File appears to be binary and cannot be opened as text')
    }
    return buffer.toString('utf-8')
  } catch (err) {
    console.error('Failed to read file:', err)
    throw err
  }
})

ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8')
  } catch (err) {
    console.error('Failed to write file:', err)
    throw err
  }
})

ipcMain.on('app:confirmClose', () => {
  if (win) {
    win.destroy()
  }
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
