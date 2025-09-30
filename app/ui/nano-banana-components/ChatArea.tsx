import { Alert, Box, CircularProgress, SxProps, Theme, Typography } from '@mui/material'
import { ChatMessageContent } from '@/app/api/nano-banana/nano-banana.types'
import ChatMessageItem from './ChatMessageItem'
import { Construction } from '@mui/icons-material'
import { useEffect, useRef } from 'react'

export type ChatAreaProps = {
  sx?: SxProps<Theme>
  contents: ChatMessageContent[]
  generating?: boolean
  error?: string
}

export default function ChatArea({ sx = [], generating = false, contents, error }: ChatAreaProps) {
  const chatAreaEndRef = useRef<HTMLDivElement | null>(null)

  function scollBottom() {
    if (chatAreaEndRef.current) {
      chatAreaEndRef.current.scrollIntoView()
    }
  }

  useEffect(() => {
    scollBottom()
  }, [contents, error])

  useEffect(() => {
    if (generating) {
      scollBottom()
    }
  }, [generating])

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', gap: 2, display: 'flex', flexDirection: 'column' }}>
      {contents.length === 0 && (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ fontSize: '128px', display: 'flex', alignItems: 'center' }}>
            <Construction fontSize="inherit" color="disabled" />
          </Box>
          <Typography color="textDisabled" variant="body1">
            Start typing a prompt to build an awesome image with Nano Banana !
          </Typography>
        </Box>
      )}
      {contents.map((content, index) => (
        <ChatMessageItem key={index} item={content} />
      ))}
      {generating && <CircularProgress size="20px" color="secondary" />}
      {error && <Alert severity="error">{error}</Alert>}
      <div ref={chatAreaEndRef}></div>
    </Box>
  )
}
