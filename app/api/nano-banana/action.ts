'use server'

import { GoogleGenAI, Part } from '@google/genai'
import { ChatMessageContent, ChatMessagePart, ChatMessageRole } from './nano-banana.types'
import { apiKeyManager } from './api-key-manager'
import { appContextDataI } from '@/app/context/app-context'
import { uploadBase64Image } from '../cloud-storage/action'
import { imageSize } from 'image-size'
import { ImageI } from '../generate-image-utils'

const modelId = 'gemini-2.5-flash-image-preview'

type GenerateError = {
  error: string
}

type ImageDimension = {
  width: number
  height: number
}

function getImageDimensionFromBase64(base64: string): ImageDimension {
  const imageBuffer = Buffer.from(base64, 'base64')
  const { width, height } = imageSize(Uint8Array.from(imageBuffer))
  return { width, height }
}

function generateUniqueFolderId() {
  let number = Math.floor(Math.random() * 9) + 1
  for (let i = 0; i < 12; i++) number = number * 10 + Math.floor(Math.random() * 10)
  return number
}

export async function generateImage(
  history: ChatMessageContent[],
  appContext: appContextDataI | null
): Promise<ChatMessageContent | GenerateError> {
  let generationGcsURI = ''
  if (
    appContext === undefined ||
    appContext === null ||
    appContext.gcsURI === undefined ||
    appContext.userID === undefined
  )
    throw Error('No provided app context')
  else {
    generationGcsURI = `${appContext.gcsURI}/${appContext.userID}/nano-banana-images`
  }

  const bucketName = generationGcsURI.replace('gs://', '').split('/')[0]
  let uniqueFolderId = generateUniqueFolderId()
  const folderName = generationGcsURI.split(bucketName + '/')[1] + '/' + uniqueFolderId

  try {
    const apiKey = await apiKeyManager.getApiKey()

    const ai = new GoogleGenAI({ apiKey })

    const historyRequest = history.map((message) => {
      const parts: Part[] =
        message.parts?.map((part) => ({
          text: part.text,
          inlineData: part.inlineData,
        })) ?? []

      return { role: message.role, parts }
    })

    const response = await ai.models.generateContent({
      model: modelId,
      contents: historyRequest,
    })

    const content = response.candidates?.[0].content
    if (content?.parts) {
      const prompt = history[history.length - 1]?.parts?.[0].text ?? ''
      const contentPartsPromises: Promise<ChatMessagePart>[] = content.parts.map(async (part) => {
        if (part.text !== undefined && part.text !== null && part.text !== '') {
          return { text: part.text }
        }
        if (part.inlineData?.data && part.inlineData?.mimeType) {
          const today = new Date()
          const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          const now = today.getTime()
          const extension = part.inlineData.mimeType.replace('image/', '').toLocaleLowerCase()
          const fileName = `img-${now}.${extension}`
          const fullObjectName = `${folderName}/${fileName}`
          const uploadResult = await uploadBase64Image(part.inlineData.data, bucketName, fullObjectName)
          const dimensions = getImageDimensionFromBase64(part.inlineData.data)
          const genImage: ImageI = {
            src: '', // We don't need yet this field, the image is displayed with the base64 string
            gcsUri: uploadResult.fileUrl ?? '',
            format: extension,
            prompt,
            altText: `Generated image with Nano Banana: ${fileName}`,
            key: crypto.randomUUID(),
            width: dimensions.width,
            height: dimensions.height,
            date: formattedDate,
            modelVersion: modelId,
            mode: 'Generated',
            author: appContext.userID ?? '',
            ratio: '', // Not needed for the moment.
          }
          const newPart: ChatMessagePart = {
            inlineData: part.inlineData,
            genImage,
          }
          return newPart
        }

        return part
      })

      const results = await Promise.allSettled(contentPartsPromises)
      const errors = results.filter((res) => res.status === 'rejected').map((error) => error.reason)
      if (errors.length > 0) {
        return { error: errors.join(',') }
      }
      const mappedParts = results.filter((res) => res.status === 'fulfilled').map((res) => res.value)

      return {
        role: ChatMessageRole.MODEL,
        parts: mappedParts,
      }
    }

    return { error: 'Generated content cannot be found.' }
  } catch (error) {
    return { error: 'An error occurred while trying to generate content from prompt and/or images' }
  }
}
