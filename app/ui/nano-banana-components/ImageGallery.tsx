import { AssetImages } from '@/app/api/nano-banana/nano-banana.types'
import theme from '@/app/theme'
import { Add, Close, Download } from '@mui/icons-material'
import { Avatar, Box, Dialog, DialogContent, DialogTitle, IconButton, Stack } from '@mui/material'
import { useEffect, useState } from 'react'
import { CustomizedAvatarButton, CustomizedIconButton } from '../ux-components/Button-SX'
import { CustomWhiteTooltip } from '../ux-components/Tooltip'
import DownloadDialog from '../transverse-components/DownloadDialog'
import { ImageI } from '@/app/api/generate-image-utils'

export type ImageGalleryProps = {
  images: AssetImages[]
  clearable?: boolean
  onClear?: (image: AssetImages) => void
  openable?: boolean
  onImageOpen?: (image: AssetImages) => void
  displayActions?: boolean
  dense?: boolean
}

type ImageGalleryViewerDialogProps = {
  image: AssetImages
  open: boolean
  setOpen: (open: boolean) => void
  displayActions?: boolean
  onAction: (type: 'download' | 'export', image: AssetImages) => void
}

type ImageDimension = {
  width: number
  height: number
}

async function getImageDimension(base64: string): Promise<ImageDimension> {
  return new Promise((resolve, reject) => {
    const renderImage = new Image()
    renderImage.onload = () => {
      const { width, height } = renderImage
      resolve({ width, height })
    }
    renderImage.onerror = (error) => reject(error)
    renderImage.src = base64
  })
}

function ImageGalleryViewerDialog({
  image,
  open,
  setOpen,
  displayActions = false,
  onAction,
}: ImageGalleryViewerDialogProps) {
  const [dimension, setDimension] = useState<ImageDimension | undefined>(undefined)
  const [zoomed, setZoomed] = useState<boolean>(false)

  useEffect(() => {
    async function callGetImageDimension() {
      try {
        const response = await getImageDimension(image.base64)
        setDimension(response)
      } catch {
        // Silent fail
      }
    }
    callGetImageDimension()
  }, [image])

  function handleClose() {
    setZoomed(false)
    setOpen(false)
  }

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { sx: { maxHeight: '70vh', minHeight: '70vh' } } }}
      open={open}
      onClose={() => handleClose()}
    >
      {dimension && (
        <DialogTitle
          sx={{
            backgroundColor: 'white',
            fontSize: '0.95rem',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          Image dimension : {dimension.width} x {dimension.height}
          <Box sx={{ display: 'flex', flexDirection: 'row' }}>
            {displayActions && (
              <CustomWhiteTooltip title="Download locally" size="small">
                <IconButton
                  onClick={() => onAction('download', image)}
                  aria-label="Download image"
                  sx={{ pr: 1, pl: 0.2, zIndex: 10 }}
                  disableRipple
                >
                  <Avatar sx={CustomizedAvatarButton}>
                    <Download sx={CustomizedIconButton} />
                  </Avatar>
                </IconButton>
              </CustomWhiteTooltip>
            )}
            <CustomWhiteTooltip title="Close image" size="small">
              <IconButton
                onClick={() => handleClose()}
                aria-label="Close image"
                sx={{ pr: 1, pl: 0.2, zIndex: 10 }}
                disableRipple
              >
                <Avatar sx={CustomizedAvatarButton}>
                  <Close sx={CustomizedIconButton} />
                </Avatar>
              </IconButton>
            </CustomWhiteTooltip>
          </Box>
        </DialogTitle>
      )}
      <DialogContent sx={[{ backgroundColor: 'white', display: 'flex', justifyContent: 'center' }]}>
        <Box sx={{ maxHeight: '100%', maxWidth: '100%', textAlign: 'center' }}>
          <img
            src={image.base64}
            alt={`View image ${image.fileName}`}
            style={
              zoomed
                ? { cursor: 'zoom-out' }
                : { maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', cursor: 'zoom-in' }
            }
            onClick={() => setZoomed(!zoomed)}
          />
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default function ImageGallery({
  images,
  clearable = false,
  onClear = () => {},
  openable = false,
  displayActions = false,
  dense = false,
}: ImageGalleryProps) {
  const [openImageDialog, setOpenImageDialog] = useState<boolean>(false)
  const [openDownloadDialog, setOpenDownloadDialog] = useState<boolean>(false)
  const [selectedImage, setSelectedImage] = useState<AssetImages | undefined>(undefined)
  const [imageToDL, setImageToDL] = useState<ImageI | undefined>(undefined)

  function onClearHandler(image: AssetImages) {
    onClear && onClear(image)
  }

  function onOpenHandler(image: AssetImages) {
    setSelectedImage(image)
    setOpenImageDialog(true)
  }

  function handleImageAction(action: 'download' | 'export', image: AssetImages) {
    if (action === 'download') {
      setOpenDownloadDialog(true)
      setImageToDL(image.genImage)
    }
  }

  function handleCloseDownloadDialog() {
    setOpenDownloadDialog(false)
    setImageToDL(undefined)
  }

  const imageSize = dense ? '25vh' : '50vh'

  return (
    <Box
      sx={{
        maxWidth: '100%',
        display: 'flex',
        gap: 2,
      }}
    >
      {images.map((image) => (
        <Box
          key={image.id}
          tabIndex={0}
          sx={[
            {
              flex: 1,
              height: '100%',
              overflow: 'hidden',
            },
            (clearable || displayActions) && { position: 'relative' },
            displayActions && {
              '&:hover .image-actions': { visibility: 'visible' },
            },
          ]}
        >
          {!displayActions && clearable && (
            <IconButton
              sx={{
                position: 'absolute',
                right: '10px',
                top: '10px',
                backgroundColor: theme.palette.background.default,
                '&:hover': { backgroundColor: theme.palette.background.default },
              }}
              aria-label="remove image"
              size="small"
              onClick={() => onClearHandler(image)}
            >
              <Close sx={{ fontSize: '16px' }} />
            </IconButton>
          )}
          {!clearable && displayActions && (
            <Stack
              className="image-actions"
              sx={{
                position: 'absolute',
                right: '10px',
                top: '10px',
                visibility: 'hidden',
                display: 'flex',
                flexDirection: 'row',
                gap: 1,
              }}
            >
              <IconButton
                tabIndex={0}
                sx={{
                  backgroundColor: theme.palette.background.default,
                  '&:hover': { backgroundColor: theme.palette.background.default },
                }}
                onClick={() => handleImageAction('download', image)}
              >
                <Download sx={{ fontSize: '14px' }} />
              </IconButton>
            </Stack>
          )}
          {!openable && (
            <img
              alt={`Image ${image.fileName}`}
              src={image.base64}
              style={{ objectFit: 'contain', maxHeight: `min(${imageSize}, 358px)`, maxWidth: '100%' }}
            />
          )}
          {openable && (
            <img
              alt={`Image ${image.fileName}`}
              src={image.base64}
              style={{
                objectFit: 'contain',
                maxHeight: `min(${imageSize}, 358px)`,
                maxWidth: '100%',
                cursor: 'pointer',
              }}
              role="button"
              onClick={() => onOpenHandler(image)}
            />
          )}
        </Box>
      ))}
      {openable && selectedImage && (
        <ImageGalleryViewerDialog
          image={selectedImage}
          open={openImageDialog}
          setOpen={setOpenImageDialog}
          onAction={handleImageAction}
          displayActions={displayActions}
        />
      )}
      {displayActions && !clearable && imageToDL && (
        <DownloadDialog
          open={openDownloadDialog}
          mediaToDL={imageToDL}
          handleMediaDLClose={() => handleCloseDownloadDialog()}
        />
      )}
    </Box>
  )
}
