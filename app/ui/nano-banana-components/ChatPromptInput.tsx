import theme from '@/app/theme'
import { Avatar, Box, Button, IconButton, Stack, SxProps, TextField, Theme } from '@mui/material'
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedSendButton } from '../ux-components/Button-SX'
import { useState } from 'react'
import CustomTooltip from '../ux-components/Tooltip'
import { Add, Send as SendIcon } from '@mui/icons-material'
import { AssetImages } from '@/app/api/nano-banana/nano-banana.types'
import ImageGallery from './ImageGallery'
import { FileRejection, useDropzone } from 'react-dropzone'
import { fileToBase64 } from '../edit-components/EditForm'

export type ChatPromptInputProps = {
  sx?: SxProps<Theme>
  onPrompt: (prompt?: string, images?: AssetImages[]) => void
}

const fooImage1 =
  'data:image/png;base64,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'

const fooImage2 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAEACAIAAABK8lkwAAAJe0lEQVR4nOzd/bPQc97H8Q6nQ07RRZe7cMmFLpRra3NPZ/Y0aWcrpNizbndDrJtdltqpzG5SbnIzhNnc7ZK1xRZFbqYam5uVotKyKyGmQQaHlLWSsn/Fa2Zn3o/HH/D6NJ1z5jmfX76fxp6rLu2QNPnNo6L794+bEt0fuLAluv/UgtOj+yt27xPd32X+NtH996/+MLq/+Lp3o/sf73t8dP/Vjauj+991PTu632dRdL7DXcvbovv7fDA1uv/5hE7R/exfLwD/sQQAoCgBAChKAACKEgCAogQAoCgBAChKAACKEgCAogQAoCgBAChKAACKEgCAogQAoCgBACiqcdlXZ0QP2Nj5rej+tp3XR/ff+Onj0f17m2dF90dcMSK6/2WPX0b3l21+J7p/9FH7RPcn9jgvuv+DXbP//o7DZkb3Ozz44+j8h+uXRPdvWrk2uv/8lC3RfTcAgKIEAKAoAQAoSgAAihIAgKIEAKAoAQAoSgAAihIAgKIEAKAoAQAoSgAAihIAgKIEAKAoAQAoqmHBOS3RA2Z0+ia6P3vM7Oj+c1Ofie7f8fcu0f3X9m+N7jd9uG10v8e8jdH995qujO6feMy/ovs33HZLdP+o5kei+wN2XBrdf/TCv0X3m147NLo/rcPQ6L4bAEBRAgBQlAAAFCUAAEUJAEBRAgBQlAAAFCUAAEUJAEBRAgBQlAAAFCUAAEUJAEBRAgBQlAAAFNV4YvOA6AEfvP94dP/n816N7r9y/ZnR/YtbRkb3+2w4Jrr/+X2do/s77/Or6P7Ty66I7k+fd290/+YNA6P7xw3oGd2fddrb0f2Jd0+P7l91Vt/o/oq7F0T33QAAihIAgKIEAKAoAQAoSgAAihIAgKIEAKAoAQAoSgAAihIAgKIEAKAoAQAoSgAAihIAgKIEAKCohgEt3aMHnLPzuuj+gbtvju5/77P26H6XI5+N7j+y/cHR/SNvviq6f/2M7HsJ418/Mrp/ZttJ0f0uM5qi+zO3vBTd3/rtzOj++JP3iO5/PvJn0f2/tj8a3XcDAChKAACKEgCAogQAoCgBAChKAACKEgCAogQAoCgBAChKAACKEgCAogQAoCgBAChKAACKEgCAohr+t2VD9IDec5qj+9tPy35PfO/jzorujz11UHS//8hDovtbWj+L7vc/cER0f+eub0T3B7UOje6/2P2U6H7zt9n/n+nf/zS6/8WTh0b3Nz2cfe/hqbUTovtuAABFCQBAUQIAUJQAABQlAABFCQBAUQIAUJQAABQlAABFCQBAUQIAUJQAABQlAABFCQBAUQIAUFTDy+fdEz1gxPyW6P5fFp4b3Z97WI/o/gPn/TO633/zQ9H952/pH91fv2ZrdP+CUUOi+++1tkf3u7UMjO4vPP6L6H63hT2j+xfeNjq632V09j2Ak0f+X3TfDQCgKAEAKEoAAIoSAICiBACgKAEAKEoAAIoSAICiBACgKAEAKEoAAIoSAICiBACgKAEAKEoAAIpq+Grlg9EDPp32UXT/hzt9Hd1f8uV+0f0xw/4U3b/v1EHR/XEDh0f3u3fZK7r/P0+eEd2/f/+26P6th/0huv/MCeuj+1Mvy74HsPyCWdH985+eGd3vuqhjdN8NAKAoAQAoSgAAihIAgKIEAKAoAQAoSgAAihIAgKIEAKAoAQAoSgAAihIAgKIEAKAoAQAoSgAAimpsWPty9IDH774jur94zPnR/a+nZL9HP6Ut2+CuE56N7p/dlv1e+eim7HsGF78xLbp/QecZ0f3BfZZG99cvyX7vfvrAsdH97rv2iO4f8Naq6P77HU6M7rsBABQlAABFCQBAUQIAUJQAABQlAABFCQBAUQIAUJQAABQlAABFCQBAUQIAUJQAABQlAABFCQBAUY23rHohekC3zu9E9w/vuF10f9n5w6P7n+y1KLr/+95t0f3Wx1ZH9y//x+XR/UVjLo7u91+0fXR/26aHovuNv/souj/2pMei++MnXhTd79Rrj+j+ZUeMjO67AQAUJQAARQkAQFECAFCUAAAUJQAARQkAQFECAFCUAAAUJQAARQkAQFECAFCUAAAUJQAARQkAQFGNlzY1RA/Y79hh0f3eo/tF9w/ffU10f88r947uT+33SnS/beud0f3Tl78a3R93UPb3f/KdE6P7fY84Oro/p+8h0f1d3psS3R/e4ZLo/kO9/xjdnzTk0ui+GwBAUQIAUJQAABQlAABFCQBAUQIAUJQAABQlAABFCQBAUQIAUJQAABQlAABFCQBAUQIAUJQAABTVsGSXtugBx3zzdHT/8q9mR/eHDB4R3R+0enF0/54+2e/pr980NLo/+PX/iu6f0rw0ur//ZXOj+5f897jofr8VL0T3O64bE92/avMJ0f0No1qi+7cOvii67wYAUJQAABQlAABFCQBAUQIAUJQAABQlAABFCQBAUQIAUJQAABQlAABFCQBAUQIAUJQAABQlAABFNX7S6yfRA/actGN0f7ex10b356yJzne4sbV3dH/1L/aM7nea++fo/ri1L0b3V83eN7q/w/wDo/vjJ02J7u86N/sew8GtG6L7x7YPju7/tuGa6P7Gg5ZE990AAIoSAICiBACgKAEAKEoAAIoSAICiBACgKAEAKEoAAIoSAICiBACgKAEAKEoAAIoSAICiBACgqIZRg5uiB0zp+HZ0/9oVD0f3J1+zPLrf44lp0f32lxZH99fc3Bbd39TcK7q/uPvV0f2F7zZE97cc8HV0f0S3IdH9j6cPj+6/1X52dH/8tAXR/aXnZn++bgAARQkAQFECAFCUAAAUJQAARQkAQFECAFCUAAAUJQAARQkAQFECAFCUAAAUJQAARQkAQFECAFBU4059BkcPWPf2ouj+qOumR/dnjfv/6P70oXOi+zdt/U10v31yz+j+XbNeiu5v0+uO6P6KTTtE90976rro/vwfXRLd323OzOj+r/suje7f9+a86P7tn/SN7rsBABQlAABFCQBAUQIAUJQAABQlAABFCQBAUQIAUJQAABQlAABFCQBAUQIAUJQAABQlAABFCQBAUQ0rV62KHvDtpO+i+1NvGhbdP/XG5uj+O9s9F92/8sbbovs3PHBadH/f1d2i+4f0eyK6P+/aGdn9IQ3R/dv3eC26P+/lldH9tRM+ju6vGrkuur+59fnovhsAQFECAFCUAAAUJQAARQkAQFECAFCUAAAUJQAARQkAQFECAFCUAAAUJQAARQkAQFECAFCUAAAU9e8AAAD//xqueWSdbeneAAAAAElFTkSuQmCC'

export default function ChatPromptInput({ onPrompt, sx = [] }: ChatPromptInputProps) {
  const [images, setImages] = useState<AssetImages[]>([])
  const [prompt, setPrompt] = useState<string>()

  const hasImages = images.length > 0

  const onDrop = async (acceptedFiles: File[], fileRejected: FileRejection[]) => {
    if (fileRejected.length > 0) {
      const error = fileRejected.at(0)?.errors?.at(0)?.message ?? 'Unknown error'
      console.error(error)
      return
    }

    const base64Files: AssetImages[] = await Promise.all(
      acceptedFiles.map(async (file) => {
        const base64 = await fileToBase64(file)
        const newImage = `data:${file.type};base64,${base64}`
        return {
          id: crypto.randomUUID(),
          fileType: file.type,
          fileName: file.name,
          base64: newImage,
          rawBase64: base64,
        }
      })
    )
    setImages((prev) => [...prev, ...base64Files])
  }

  const disableSubmit = images.length === 0 && !prompt

  const { getRootProps, getInputProps, acceptedFiles, isDragAccept, isDragReject, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      'image/png': [],
      'image/webp': [],
      'image/jpeg': [],
    },
  })

  function onSubmit() {
    console.log('subimter')
    !disableSubmit && onPrompt(prompt, images)
    setPrompt('')
    setImages([])
  }

  function onClearClicked(image: AssetImages) {
    const filtered = images.filter((img) => img.id !== image.id)
    setImages(filtered)
  }

  return (
    <Box
      sx={[
        {
          display: 'flex',
          border: 1,
          borderColor: theme.palette.secondary.light,
          borderRadius: '10px',
          padding: '1rem',
        },
        hasImages && { flexDirection: 'column' },
        !hasImages && { flexDirection: 'row' },
        isDragAccept && { borderColor: theme.palette.success.light, borderStyle: 'dashed' },
        isDragReject && { borderColor: theme.palette.error.light, borderStyle: 'dashed' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...getRootProps({
        className: 'dropzone',
      })}
    >
      <input {...getInputProps()} />
      <TextField
        id="chat-prompt-text-field"
        fullWidth
        multiline
        value={prompt}
        onChange={(event) => setPrompt(event.currentTarget.value)}
        placeholder="Start typing your prompt"
        maxRows={5}
        size="small"
        variant="standard"
        slotProps={{
          input: {
            disableUnderline: true,
          },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <ImageGallery images={images} clearable onClear={onClearClicked} dense />
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'end' }}>
          <Stack sx={{ display: 'flex', flexDirection: 'row' }}>
            <CustomTooltip title="Add assets (photos)" size="small">
              <IconButton onClick={() => open()} aria-label="Add assets" disableRipple sx={{ px: 0.5 }}>
                <Avatar sx={CustomizedAvatarButton}>
                  <Add sx={CustomizedIconButton} />
                </Avatar>
              </IconButton>
            </CustomTooltip>
            <Button
              size="small"
              variant="contained"
              sx={CustomizedSendButton}
              onClick={onSubmit}
              endIcon={<SendIcon />}
              disabled={disableSubmit}
            >
              Run
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
