import { generalSettingsI, GenerateFieldI1 } from "./generate-image-utils"

export interface RequiredGenerateFieldI extends GenerateFieldI1 {
  required: boolean
}

export interface Generate3DAnimationFormFieldsI {
  aspectRatio: GenerateFieldI1
  resolution: GenerateFieldI1
  background: RequiredGenerateFieldI
  spotlight: GenerateFieldI1
}

export const Generate3DAnimationFormFields = {
  aspectRatio: {
    label: 'Aspect ratio',
    type: 'chip-group',
    default: '16:9',
    options: ['16:9'],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  resolution: {
    label: 'Resolution',
    type: 'chip-group',
    default: '720p',
    options: ['720p'],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  sampleCount: {
    label: 'Quantity of outputs',
    type: 'chip-group',
    default: '4',
    options: ['1', '2', '3', '4'],
    isDataResetable: false,
    isFullPromptAdditionalField: false,
  },
  background: {
    label: 'Background',
    type: 'chip-group',
    default: 'White',
    options: ['White', 'Black', 'Flowery lauwn', 'Space starry sky'],
    required: true,
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  },
  spotlight: {
    label: 'Spotlight',
    type: 'chip-group',
    options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    isDataResetable: true,
    isFullPromptAdditionalField: true,
  }
}

export type ReferenceImage = {
  fileType: string
  fileName: string
  base64: string
  rawBase64: string
}

export type Generate3DFormData = {
  images: ReferenceImage[]
  aspectRatio: string
  resolution: string
  sampleCount: string
  background: string
  spotlight: string
}

export type GenerateVideoType = {
  gcsUri: string
  mimeType: string
}

export type PollingResponseType = {
  raiMediaFilteredCount: boolean
  "@type": string
  videos: GenerateVideoType[]
}

export type PollingDataType = {
  name: string
  done?: boolean
  response?: PollingResponseType
  error?: any
}

interface CompositionFieldsI {
  background: RequiredGenerateFieldI
  spotlight: GenerateFieldI1
}

export interface AnimationGenerationFieldsI {
  settings: generalSettingsI
  compositionOptions: CompositionFieldsI
}

// Set default values for Generate Form
const generateFieldList: [keyof Generate3DAnimationFormFieldsI] = Object.keys(Generate3DAnimationFormFields) as [
  keyof Generate3DAnimationFormFieldsI
]
let formDataDefaults: any
generateFieldList.forEach((field) => {
  const fieldParams: GenerateFieldI1 = Generate3DAnimationFormFields[field]
  const defaultValue = 'default' in fieldParams ? fieldParams.default : ''
  formDataDefaults = { ...formDataDefaults, [field]: defaultValue }
})

export const animation3DGenerationUtils = {
  settings: {
    aspectRatio: Generate3DAnimationFormFields.aspectRatio,
    resolution: Generate3DAnimationFormFields.resolution,
    sampleCount: Generate3DAnimationFormFields.sampleCount,
  },
  compositionOptions: {
    background: Generate3DAnimationFormFields.background,
    spotlight: Generate3DAnimationFormFields.spotlight,
  },
  resetableFields: generateFieldList.filter((field) => Generate3DAnimationFormFields[field].isDataResetable == true),
  fullPromptFields: generateFieldList.filter(
    (field) => Generate3DAnimationFormFields[field].isFullPromptAdditionalField == true
  ),
  defaultValues: formDataDefaults,
}
