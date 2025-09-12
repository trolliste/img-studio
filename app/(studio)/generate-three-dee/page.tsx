'use client'

import { useAppContext } from "@/app/context/app-context"

import theme from '../../theme'
import { Accordion, AccordionDetails, AccordionSummary, Alert, Avatar, Box, Button, Grid2 as Grid, IconButton, Stack, Typography } from "@mui/material"
import ImagesDropzone from "@/app/ui/generate-3d-components/ImagesDropzone"
import { Autorenew, Send as SendIcon, ArrowDownward as ArrowDownwardIcon } from "@mui/icons-material"
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedSendButton } from "@/app/ui/ux-components/Button-SX"
import { useEffect, useRef, useState } from "react"
import CustomTooltip from "@/app/ui/ux-components/Tooltip"
import { animation3DGenerationUtils, Generate3DFormData, ReferenceImage } from "@/app/api/generate-3d-utils"
import OutputVideosDisplay from "@/app/ui/transverse-components/VeoOutputVideosDisplay"
import { useForm } from "react-hook-form"
import Generate3DSettings from "@/app/ui/generate-3d-components/Generate3DSettings"
import { generate3DAnimation, getAnimation3DGenerationStatus } from "@/app/api/generate-3d/actions"
import { VideoI } from "@/app/api/generate-video-utils"
import { CustomizedAccordion, CustomizedAccordionSummary } from "@/app/ui/ux-components/Accordion-SX"
import FormInputChipGroup from "@/app/ui/ux-components/InputChipGroup"

const { palette } = theme

const INITIAL_POLLING_INTERVAL_MS = 6000 // Start polling after 6 seconds
const MAX_POLLING_INTERVAL_MS = 60000 // Max interval 60 seconds
const BACKOFF_FACTOR = 1.2 // Increase interval by 20% each time
const MAX_POLLING_ATTEMPTS = 30 // Max 30 attempts
const JITTER_FACTOR = 0.2 // Add up to 20% jitter

export default function Generate3DPage() {
  const { appContext, error: appContextError } = useAppContext()
  const pollingTimeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const [generatedVideos, setGeneratedVideos] = useState<VideoI[]>([])
  const pollingAttemptsRef = useRef<number>(0)
  const currentPollingIntervalRef = useRef<number>(INITIAL_POLLING_INTERVAL_MS)
  const [error, setError] = useState<string | undefined>(undefined)
  const [expanded, setExpanded] = useState<string | false>(false)
  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => () => {
    stopPolling()
  }, [])

  const { handleSubmit, control, setValue, watch, resetField } = useForm<Generate3DFormData>({
    defaultValues: {
      ...animation3DGenerationUtils.defaultValues,
      images: [],
    }
  })

  function imagesSelectedHandler(selectedFiles: ReferenceImage[]) {
    setValue('images', selectedFiles)
  }

  function onReset() {
    setValue('images', [])
    setGeneratedVideos([])
    setError(undefined)
    animation3DGenerationUtils.resetableFields.forEach((field) => resetField(field))
    stopPolling()
    setIsLoading(false)
  }

  function stopPolling() {
    if (pollingTimeoutIdRef.current) {
      clearTimeout(pollingTimeoutIdRef.current)
    }
  }

  async function startVideoPolling(operationName: string, formData: Generate3DFormData, prompt: string) {
    if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
      console.error(`Polling timeout for operation: ${operationName} after ${MAX_POLLING_ATTEMPTS} attempts.`)

      return
    }

    pollingAttemptsRef.current++

    try {
      const result = await getAnimation3DGenerationStatus(operationName, formData, prompt, appContext)

      if (result.done) {
        if (result.error) {
          console.error('Get generation status succeed but returned errors')
          setError('An error occurred, please try again.')
        } else if (result.videos && result.videos.length > 0) {
          setGeneratedVideos(result.videos)
        } else {
            console.warn(`Polling done, but no videos or error for ${operationName}. Videos array empty or undefined.`)
            setError('Generation succeed, but videos array empty or undefined')
        }
        setIsLoading(false)
      } else {
        const jitter = currentPollingIntervalRef.current * JITTER_FACTOR * (Math.random() - 0.5) // Symmetrical jitter
        const nextInterval = Math.round(currentPollingIntervalRef.current + jitter)

        pollingTimeoutIdRef.current = setTimeout(() => startVideoPolling(operationName, formData, prompt), nextInterval)
        // Increase interval for the subsequent attempt
        currentPollingIntervalRef.current = Math.min(
          currentPollingIntervalRef.current * BACKOFF_FACTOR,
          MAX_POLLING_INTERVAL_MS
        )
      }
    } catch {
      console.error('An unexpected error occurred.')
      stopPolling()
      setIsLoading(false)
    }
  }

  async function onSubmit(formData: Generate3DFormData) {
    setIsLoading(true)
    setError(undefined)
    try {
      const result = await generate3DAnimation(formData, appContext)
      if ('error' in result) {
        setError(result.error)
        setIsLoading(false)
      } else if ('operationName' in result && 'prompt' in result) {
        pollingAttemptsRef.current = 0
        await startVideoPolling(result.operationName, formData, result.prompt)
      } else {
        setError('Missing operationName in response, try again later.')
        setIsLoading(false)
      }
    } catch(error) {
      setError('An error has occurred, please try again later.')
      setIsLoading(false)
    }
  }

  const images = watch('images')

  if (appContext?.isLoading === true) {
    return (
      <Box p={5}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 400, color: appContextError === null ? palette.primary.main : palette.error.main }}
        >
          {appContextError === null
            ? 'Loading your profile content...'
            : 'Error while loading your profile content! Retry or contact you IT admin.'}
        </Typography>
      </Box>
    )
  }

  return (
      <Box p={5} sx={{ maxHeight: '100vh' }}>
        <Grid wrap="nowrap" container spacing={6} direction="row" columns={2}>
          <Grid size={1.1} flex={0} sx={{ maxWidth: 700, minWidth: 610 }}>
            <Box sx={{ pb: 2 }}>
              <Stack direction="column" spacing={2} justifyContent="flex-start" alignItems="start">
                <Typography variant="h1" color={palette.text.secondary} sx={{ fontSize: '1.8rem' }}>
                  Generate 3D animation from images
                </Typography>
                <Typography variant="body1" color={palette.text.primary} sx={{ fontSize: '0.9rem' }}>
                  From up to 3 images of an object, generate a 360-degree orbit shot 3D animation with customizable background.
                </Typography>
              </Stack>
            </Box>
            {error && (
              <Box sx={{ pb: 2 }}>
                <Alert severity="error">{error}</Alert>
              </Box>
            )}
            <form onSubmit={handleSubmit(onSubmit)}>
              <ImagesDropzone images={images} onImages={imagesSelectedHandler} />
              <Stack
                justifyContent="flex-end"
                direction="row"
                gap={0}
                pb={4}
              >
                  <CustomTooltip title="Reset all fields" size="small">
                    <IconButton
                      onClick={() => onReset()}
                      aria-label="Reset form"
                      disableRipple
                      sx={{ px: 0.5 }}
                    >
                      <Avatar sx={CustomizedAvatarButton}>
                        <Autorenew sx={CustomizedIconButton} />
                      </Avatar>
                    </IconButton>
                  </CustomTooltip>
                  <Generate3DSettings
                    control={control}
                    setValue={setValue}
                    generalSettings={animation3DGenerationUtils.settings}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={images.length === 0 || isLoading}
                    endIcon={<SendIcon />}
                    sx={CustomizedSendButton}
                  >
                    Generate
                  </Button>
              </Stack>
              <Accordion
                disableGutters
                expanded={expanded === 'attributes'}
                onChange={handleChange('attributes')}
                sx={CustomizedAccordion}
              >
                <AccordionSummary
                  expandIcon={<ArrowDownwardIcon sx={{ color: palette.primary.main }} />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                  sx={CustomizedAccordionSummary}
                >
                  <Typography display="inline" variant="body1" sx={{ fontWeight: 500 }}>
                    Animation attributes
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ py: 0 }}>
                  <Stack direction="row" spacing={0} sx={{ pt: 2, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    {Object.entries(animation3DGenerationUtils.compositionOptions).map(function ([param, field]) {
                      return (
                        <Box key={param} py={1} width="50%">
                          <FormInputChipGroup
                            name={param}
                            label={field.label}
                            key={param}
                            control={control}
                            setValue={setValue}
                            width="250px"
                            field={field}
                            required={'required' in field ? field.required : false}
                          />
                        </Box>
                      )
                    })}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </form>
          </Grid>
          <Grid size={0.9} flex={1} sx={{ pt: 14, maxWidth: 850, minWidth: 400 }}>
            <OutputVideosDisplay
              isLoading={isLoading}
              generatedVideosInGCS={generatedVideos}
              generatedCount={4}
            />
          </Grid>
        </Grid>
      </Box>
  )
}