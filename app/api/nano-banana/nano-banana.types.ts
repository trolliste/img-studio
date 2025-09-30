import { Part } from '@google/genai'
import { ImageI } from '../generate-image-utils'

export enum ChatMessageRole {
  USER = 'user',
  MODEL = 'model',
}

export type ChatMessagePart = Part & {
  genImage?: ImageI
}

export type ChatMessageContent = {
  parts?: ChatMessagePart[]
  role?: ChatMessageRole
}

export type AssetImages = {
  id: string
  fileName: string
  base64: string
  fileType: string
  rawBase64: string
  genImage?: ImageI
}
