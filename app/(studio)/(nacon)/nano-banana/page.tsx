'use client'

import { useAppContext } from '@/app/context/app-context'
import { Alert, Box, Button, Typography } from '@mui/material'

import theme from '../../../theme'
import ChatArea from '@/app/ui/nano-banana-components/ChatArea'
import ChatPromptInput from '@/app/ui/nano-banana-components/ChatPromptInput'
import { AssetImages, ChatMessageContent, ChatMessageRole } from '@/app/api/nano-banana/nano-banana.types'
import { useState } from 'react'
import { Part } from '@google/genai'
import { generateImage } from '@/app/api/nano-banana/action'
import { CustomizedSendButton } from '@/app/ui/ux-components/Button-SX'
import { Refresh } from '@mui/icons-material'

const { palette } = theme

export default function Page() {
  const { appContext, error: appContextError } = useAppContext()
  const [messages, setMessages] = useState<ChatMessageContent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  if (appContext?.isLoading) {
    return (
      <Box p={5}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 400, color: appContextError ? palette.error.main : palette.primary.main }}
        >
          {appContextError
            ? 'Error loading your profile content! Retry or contact you IT admin.'
            : 'Loading your profile content...'}
        </Typography>
      </Box>
    )
  }

  async function generateContent(fullMessages: ChatMessageContent[]) {
    try {
      setLoading(true)
      setError(undefined)
      const response = await generateImage(fullMessages, appContext)
      if ('error' in response) {
        setError(response.error)
      } else {
        setMessages((prev) => [...prev, response])
      }
    } catch {
      setError('An unexpected server error occurred, please try again later')
    } finally {
      setLoading(false)
    }
  }

  async function onPromptHandler(prompt?: string, images?: AssetImages[]) {
    const parts: Part[] = []
    if (prompt) {
      parts.push({ text: prompt })
    }

    const imageParts =
      images?.map((image) => ({
        inlineData: {
          mimeType: image.fileType,
          data: image.rawBase64,
        },
      })) ?? []

    if (imageParts.length > 0) {
      parts.push(...imageParts)
    }

    const message: ChatMessageContent = { role: ChatMessageRole.USER, parts }
    const fullMessages = [...messages, message]
    setMessages(fullMessages)
    await generateContent(fullMessages)
  }

  function handleNewGeneration() {
    setMessages([])
    setError(undefined)
  }

  return (
    <Box
      p={2}
      sx={{
        maxHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box
        sx={{
          py: 2,
          borderBottom: 1,
          borderColor: theme.palette.secondary.light,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography display="inline" variant="h1" color={palette.text.secondary} sx={{ fontSize: '1.8rem' }}>
            Generate Images with
          </Typography>
          <Typography
            display="inline"
            variant="h1"
            color={palette.primary.main}
            sx={{ fontWeight: 500, fontSize: '2rem', pl: 1 }}
          >
            Nano Banana
          </Typography>
        </Box>
        <Button
          sx={[CustomizedSendButton, { m: 0 }]}
          startIcon={<Refresh />}
          size="small"
          variant="contained"
          onClick={handleNewGeneration}
        >
          Start a new generation
        </Button>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <ChatArea contents={messages} generating={loading} error={error} />
        </Box>
      </Box>
      <ChatPromptInput onPrompt={onPromptHandler} />
    </Box>
  )
}
