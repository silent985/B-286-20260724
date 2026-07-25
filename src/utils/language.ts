/**
 * Maps a file name to a Monaco language id based on its extension. Falls back
 * to `plaintext` for unknown types so the editor always has a valid language.
 */

const EXTENSION_LANGUAGE: Readonly<Record<string, string>> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  vue: 'html',
  json: 'json',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  md: 'markdown',
  markdown: 'markdown',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  svg: 'xml',
  py: 'python',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
  sh: 'shell',
  bash: 'shell',
  sql: 'sql',
  toml: 'ini',
  ini: 'ini',
}

/** Detect the Monaco language id for a given file name. */
export function detectLanguage(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0 || dot === fileName.length - 1) {
    return 'plaintext'
  }
  const ext = fileName.slice(dot + 1).toLowerCase()
  return EXTENSION_LANGUAGE[ext] ?? 'plaintext'
}
