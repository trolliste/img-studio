import { Alert, Box, Typography } from "@mui/material";

import theme from '../../theme'
import { FileRejection, useDropzone } from "react-dropzone";
import { useState } from "react";

import { fileToBase64 } from '../edit-components/EditForm'
import Image from "next/image";
import { ReferenceImage } from "@/app/api/generate-3d-utils";

const { palette } = theme

export type ImagesDropzoneProps = {
  images: ReferenceImage[]
  onImages: (files: ReferenceImage[]) => void
  max?: number
}

export default function ImagesDropzone({ images, onImages, max = 3 }: ImagesDropzoneProps) {
  const [dropError, setDropError] = useState<string | undefined>(undefined)
  
  const onDrop = async (acceptedFiles: File[], fileRejected: FileRejection[]) => {
    setDropError(undefined)
    if (fileRejected.length > 0) {
      const error = fileRejected.at(0)?.errors?.at(0)?.message ?? 'Unknown error'
      console.error(error)
      setDropError(error)
      return
    }

    const base64Files: ReferenceImage[] = await Promise.all(acceptedFiles.map(async (file) => {
      const base64 = await fileToBase64(file)
      const newImage = `data:${file.type};base64,${base64}`
      return { fileType: file.type, fileName: file.name, base64: newImage, rawBase64: base64 }
    }))
    onImages(base64Files)
  }

  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    onDrop,
    maxFiles: max,
    accept: {
      'image/png': [],
      'image/webp': [],
      'image/jpeg': [],
    }
  })
  
  return (
    <Box
      id="ImagesDropContainer"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {dropError && <Alert severity="error">{dropError}</Alert>}
      <Box
        id="DropzoneContainer"
        sx={{
          width: '100%',
          height: 300,
          position: 'relative',
          m: 0,
          p: 0,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {images.length === 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'gray',
              border: '1px dotted gray',
              '&:hover': {
                border: '1px solid',
                borderColor: palette.primary.main,
                '& .MuiTypography-root': {
                  color: palette.primary.main,
                  fontWeight: 500,
                },
              },
            }}
            {...getRootProps({ className: 'dropzone' })}
          >
            <input {...getInputProps()} />
            <Typography variant="body1">{`Drop or select up to ${max} images`}</Typography>
          </Box>
        )}
        {images.length > 0 && (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              gap: 4,
            }}
          >
            {images.map((image) => (
              <Box
                key={image.fileName}
                sx={{
                  flex: 1,
                  position: 'relative',
                  height: '100%',
                  overflow: 'hidden',
                }}
              >
                <Image
                  alt={`Image ${image.fileName}`}
                  src={image.base64}
                  style={{ objectFit: 'contain' }}
                  fill
                  sizes="(max-width: 600px) 100vw, 33vw"
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
