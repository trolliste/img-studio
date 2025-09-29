import { Part } from '@google/genai'

export enum ChatMessageRole {
  USER = 'user',
  MODEL = 'model',
}

export type ChatMessageContent = {
  parts?: Part[]
  role?: ChatMessageRole
}

export type AssetImages = {
  id: string
  fileName: string
  base64: string
  fileType: string
  rawBase64: string
}
