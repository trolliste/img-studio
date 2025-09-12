import { Avatar, IconButton, Menu, MenuItem } from "@mui/material";
import CustomTooltip from "../ux-components/Tooltip";
import { Settings } from "@mui/icons-material";
import React from "react";
import { CustomizedAvatarButton, CustomizedIconButton, CustomizedIconButtonOpen } from "../ux-components/Button-SX";

import theme from '../../theme'
import FormInputChipGroup from "../ux-components/InputChipGroup";
import { generalSettingsI } from "@/app/api/generate-image-utils";
const { palette } = theme

const CustomizedMenu = {
  '& .MuiPaper-root': {
    background: 'white',
    color: palette.text.primary,
    boxShadow: 5,
    p: 0.5,
    width: 250,
    '& .MuiMenuItem-root': {
      background: 'transparent',
      pb: 1,
    },
  },
}

export default function Generate3DSettings({
  control,
  setValue,
  generalSettings,
}: {
  control: any
  setValue: any
  generalSettings: generalSettingsI,
}) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const open = Boolean(anchorEl)

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <CustomTooltip title="Open settings" size="small">
        <IconButton onClick={handleClick} disableRipple sx={{ px: 0.5 }}>
          <Avatar sx={{ ...CustomizedAvatarButton, ...(open === true && CustomizedIconButtonOpen) }}>
            <Settings
              sx={{
                ...CustomizedIconButton,
                ...(open === true && CustomizedIconButtonOpen),
              }}
            />
          </Avatar>
        </IconButton>
      </CustomTooltip>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        open={open}
        onClose={handleClose}
        sx={CustomizedMenu}
      >
        {Object.entries(generalSettings).map(([param, field]) => {
          return (
            <MenuItem key={param}>
              <FormInputChipGroup
                name={param}
                label={field.label}
                key={param}
                control={control}
                setValue={setValue}
                width="260px"
                field={field}
                required={true}
              />
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}