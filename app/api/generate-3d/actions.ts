'use server'

import { AuthClient, GoogleAuth } from "google-auth-library";
import { ErrorResult, GenerateVideoInitiationResult, VideoGenerationStatusResult, VideoRatioToPixel } from "../generate-video-utils";
import { animation3DGenerationUtils, Generate3DFormData, PollingDataType, ReferenceImage } from "../generate-3d-utils";
import { buildVideoListFromURI } from "../veo/action";
import { appContextDataI } from "@/app/context/app-context";

type GaxiosMethod = "POST" | "GET" | "HEAD" | "DELETE" | "PUT" | "CONNECT" | "OPTIONS" | "TRACE" | "PATCH" | undefined

const customRateLimitMessage = 'Oops, too many incoming access right now, please try again later!'
const modelVersion = 'veo-2.0-generate-exp' // For now only this model is compatible with image references
const basePrompt = 'A slow, 360-degree orbit shot of this object'

function generatePrompt(formData: Generate3DFormData) {
  const additionalPromptFields = animation3DGenerationUtils.fullPromptFields.reduce<string>((acc, field) => {
    if (formData[field] !== '') {
      return `${acc}, ${formData[field]} ${field.replaceAll('_', ' ')}`
    }

    return acc
  }, '')

  const fullPrompt = `${basePrompt}${additionalPromptFields}`

  console.log('generated propmt', fullPrompt)

  return fullPrompt
}

export async function generate3DAnimation(
  formData: Generate3DFormData,
  appContext: appContextDataI | null,
): Promise<GenerateVideoInitiationResult | ErrorResult> {
  console.log(`Generate 3D animation with ${formData.images.length} reference images`)
  const client = await getGoogleCloudClient()
  if (isErrorResult(client)) {
    return client
  }

  const location = 'us-central1'
  const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

  // const videoAPIUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}:predictLongRunning`
  const videoAPIUrl = `http://localhost:5000/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelVersion}/predictLongRunning`

  const fullPrompt = generatePrompt(formData)

  // 3 - Validate App Context and determine GCS URI
  if (!appContext?.gcsURI || !appContext?.userID) {
    console.error('Application context error: Missing GCS URI or User ID.')
    return { error: 'Application context is missing required information (GCS URI or User ID).' }
  }
  const generationGcsURI = `${appContext.gcsURI}/${appContext.userID}/generated-videos`

  // TODO: Some parameters must be taken from formData
  const parameters = {
    sampleCount: parseInt(formData.sampleCount, 10),
    aspectRatio: formData.aspectRatio,
    durationSeconds: 8,
    storageUri: generationGcsURI,
    personGeneration: 'dont_allow',
    addWatermark: false,
    resolution: formData.resolution,
    enhancePrompt: true,
  }

  console.log('Parameters are', JSON.stringify(parameters, null, 2))

  const reqData = {
    instances: [
      {
        prompt: fullPrompt,
        referenceImages: formData.images.map((img) => ({
          image: {
            bytesBase64Encoded: img.rawBase64,
            mimeType: img.fileType,
          },
          referenceType: 'asset',
        }))
      }
    ],
    parameters,
  }

  const method: GaxiosMethod = 'POST'

  const opts = {
    url: videoAPIUrl,
    method,
    data: reqData,
  }

  try {
    const result = await client.request<{name: string}>(opts)

    console.log('result', result)

    if (result.data?.name) {
      return { operationName: result.data?.name, prompt: fullPrompt }
    }
    return { error: 'Video initiation failed: Unknown error structure in response data.' }
  } catch (error) {
    console.error('An error occured : ', error)
    return { error: 'An unexpected error occurred while initiating video generation.' }
  }
}

export async function getAnimation3DGenerationStatus(
  operationName: string,
  formData: Generate3DFormData,
  passedPrompt: string,
  appContext: appContextDataI | null,
): Promise<VideoGenerationStatusResult> {
  const client = await getGoogleCloudClient()
  if (isErrorResult(client)) {
    return { done: true, error: 'Unable to authentication for polling status.' }
  }

  const parts = operationName.split('/')
  if (parts.length < 8) {
    console.error(`Invalid operationName format: ${operationName}`)
    return { done: true, error: 'Invalid operation name format.' }
  }
  const projectId = parts[1]
  const location = parts[3]
  const modelId = parts[7]

  // const pollingAPIUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:fetchPredictOperation`
  const pollingAPIUrl = `http://localhost:5000/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}/fetchPredictOperation`

  const method: GaxiosMethod = 'POST'

  const opts = {
    url: pollingAPIUrl,
    method,
    data: {
      operationName: operationName,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  }

  try {
    const res = await client.request<PollingDataType>(opts)

    const pollingData: PollingDataType = res.data // Assuming PollingResponse matches LRO Get response

    if (!pollingData.done) {
      return { done: false, name: operationName }
    }
    if (pollingData.error) {
      console.error(`Operation ${operationName} failed:`, pollingData.error)
      if (
        pollingData.error.code === 8 &&
        typeof pollingData.error.message === 'string' &&
        pollingData.error.message.toLowerCase().includes('resource exhausted')
      )
        return { done: true, error: customRateLimitMessage }

      if (
        typeof pollingData.error.message === 'string' &&
        pollingData.error.message.includes("{ code: 8, message: 'Resource exhausted.' }")
      )
        return { done: true, error: customRateLimitMessage }

      return { done: true, error: pollingData.error.message || 'Video generation failed.' }
    }
    if (pollingData.response?.videos) {
      const rawVideoResults = pollingData.response.videos.map((video) => {
        console.log('------ Generated video -----', video)
        return {
          gcsUri: video.gcsUri,
          mimeType: video.mimeType,
        }
      })

      const usedRatio = VideoRatioToPixel.find((item) => item.ratio === formData.aspectRatio)

      const enhancedVideoList = await buildVideoListFromURI({
          videosInGCS: rawVideoResults,
          aspectRatio: formData.aspectRatio,
          resolution: formData.resolution,
          duration: 8,
          width: usedRatio?.width ?? 1280,
          height: usedRatio?.height ?? 720,
          usedPrompt: passedPrompt,
          userID: appContext?.userID ?? '',
          modelVersion,
          mode: 'Generated',
      })
      return { done: true, videos: enhancedVideoList }
    }

    console.error(`Operation ${operationName} finished, but response format is unexpected.`, pollingData)
    return { done: true, error: 'Operation finished, but the response was not in the expected format.' }
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error(`Polling Error 404 for ${operationName}: Operation not found at ${pollingAPIUrl}`)
      return { done: true, error: `Operation ${operationName} not found. It might have expired or never existed.` }
    }
    if (error.response?.status === 429 || error.response?.status === 503)
      return { done: true, error: customRateLimitMessage }

    console.error(`Polling Error for ${operationName}:`, error.response?.data || error.message)
    let errorMessage = 'An error occurred while polling the video generation status.'
    const nestedError = error.response?.data?.error
    if (nestedError) {
      if (
        nestedError.code === 8 &&
        typeof nestedError.message === 'string' &&
        nestedError.message.toLowerCase().includes('resource exhausted')
      )
        return { done: true, error: customRateLimitMessage }

      if (
        typeof nestedError.message === 'string' &&
        nestedError.message.includes("{ code: 8, message: 'Resource exhausted.' }")
      )
        return { done: true, error: customRateLimitMessage }

      if (nestedError.message) errorMessage = nestedError.message
    } else if (error instanceof Error && error.message) {
      // Check error.message directly
      errorMessage = error.message
      // More robust check for resource exhausted in generic error message
      if (errorMessage.toLowerCase().includes('resource exhausted') && errorMessage.includes('code: 8')) {
        return { done: true, error: customRateLimitMessage }
      }
    }
    return { done: true, error: errorMessage }
  }
}

async function getGoogleCloudClient(): Promise<AuthClient | ErrorResult> {
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    })
    return auth.getClient()
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Unable to authenticate your account to access video generation.' }
  }
}

function isErrorResult(error: any): error is ErrorResult {
  return 'error' in error
}
