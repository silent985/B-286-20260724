export type FileNodeType = 'file' | 'directory'

export type CloseDecision = 'save' | 'discard' | 'cancel'

export interface FileNode {
  path: string
  name: string
  type: FileNodeType
  children?: FileNode[]
}
