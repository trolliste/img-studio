import { AssetImages, ChatMessageContent, ChatMessageRole } from '@/app/api/nano-banana/nano-banana.types'
import theme from '@/app/theme'
import { Blob, Part } from '@google/genai'
import { Box, Typography } from '@mui/material'
import Image from 'next/image'
import ImageGallery from './ImageGallery'

export type ChatMessageItemProps = {
  item: ChatMessageContent
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpg', 'image/jpeg']

export default function ChatMessageItem({ item }: ChatMessageItemProps) {
  function toBase64Image(image: Blob) {
    return `data:${image.mimeType};base64,${image.data}`
  }

  const imageParts = item.parts?.reduce<AssetImages[]>((acc, part) => {
    if (ALLOWED_IMAGE_TYPES.includes(part?.inlineData?.mimeType ?? 'unknown')) {
      console.log('part', part)
      return [
        ...acc,
        {
          id: crypto.randomUUID(),
          fileName: part.inlineData?.displayName ?? '',
          base64: toBase64Image(part.inlineData as Blob),
          rawBase64: part.inlineData?.data ?? '',
          fileType: part.inlineData?.mimeType ?? '',
        },
      ]
    }
    return acc
  }, [])

  const textParts = item.parts?.filter((part) => part.text !== undefined && part.text !== null && part.text !== '')

  return (
    <Box
      sx={[
        {
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          border: 1,
          borderColor: theme.palette.secondary.light,
          borderRadius: '5px',
          borderStyle: 'dashed',
        },
        item.role === ChatMessageRole.USER ? { alignItems: 'end' } : { alignItems: 'start' },
      ]}
    >
      {textParts?.map((part, index) => (
        <Typography
          key={index}
          pb={textParts.length === 1 && (imageParts?.length ?? 0) === 0 ? 0 : 2}
          sx={{ whiteSpace: 'pre-wrap' }}
          fontSize="14px"
        >
          {part.text}
        </Typography>
      ))}
      {((imageParts && imageParts.length) ?? 0) > 0 && <ImageGallery images={imageParts ?? []} openable />}
    </Box>
  )
}
