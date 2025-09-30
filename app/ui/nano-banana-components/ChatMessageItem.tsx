import { ChatMessageContent, ChatMessageRole } from '@/app/api/nano-banana/nano-banana.types'
import theme from '@/app/theme'
import { Blob, Part } from '@google/genai'
import { Box, Typography } from '@mui/material'
import ImageGallery from './ImageGallery'

export type ChatMessageItemProps = {
  item: ChatMessageContent
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp']

export default function ChatMessageItem({ item }: ChatMessageItemProps) {
  function toBase64Image(image: Blob) {
    return `data:${image.mimeType};base64,${image.data}`
  }

  return (
    <Box
      sx={[
        {
          display: 'flex',
        },
        item.role === ChatMessageRole.USER ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
      ]}
    >
      <Box
        sx={[
          {
            display: 'flex',
            maxWidth: '80%',
            flexDirection: 'column',
          },
          item.role === ChatMessageRole.USER ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' },
        ]}
      >
        <Box
          sx={[
            {
              border: 1,
              borderColor: theme.palette.secondary.light,
              borderRadius: '5px',
              boxShadow: 2,
              p: 2,
            },
            item.role === ChatMessageRole.USER && { backgroundColor: '#f6f6f6ff' },
          ]}
        >
          {item.parts?.map((part, index) => {
            if (part.text !== undefined && part.text !== null && part.text !== '') {
              return (
                <Typography key={index} pb={2} sx={{ whiteSpace: 'pre-wrap' }} fontSize="14px">
                  {part.text}
                </Typography>
              )
            }
            if (part.inlineData && ALLOWED_IMAGE_TYPES.includes(part.inlineData.mimeType ?? 'unknown')) {
              const image = {
                id: crypto.randomUUID(),
                fileName: '',
                base64: toBase64Image(part.inlineData as Blob),
                rawBase64: part.inlineData.data ?? '',
                fileType: part.inlineData.mimeType ?? '',
                genImage: part.genImage,
              }
              return (
                <ImageGallery
                  key={image.id}
                  images={[image]}
                  openable
                  displayActions={item.role === ChatMessageRole.MODEL}
                />
              )
            }
          })}
        </Box>
      </Box>
    </Box>
  )
}
