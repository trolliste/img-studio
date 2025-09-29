'use server'

import { GoogleGenAI } from '@google/genai'
import { ChatMessageContent, ChatMessageRole } from './nano-banana.types'
import { apiKeyManager } from './api-key-manager'

const modelId = 'gemini-2.5-flash-image-preview'

type GenerateError = {
  error: string
}

export async function generateImage(history: ChatMessageContent[]): Promise<ChatMessageContent | GenerateError> {
  try {
    const apiKey = await apiKeyManager.getApiKey()

    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: modelId,
      contents: history,
    })
    const content = response.candidates?.[0].content
    if (content) {
      return {
        role: ChatMessageRole.MODEL,
        parts: content.parts,
      }
    }

    return { error: 'Generated content cannot be found.' }
  } catch (error) {
    // TODO handleError
    console.error(error)
    return { error: 'An error occurred while trying to generate content from prompt and/or images' }
  }
}
