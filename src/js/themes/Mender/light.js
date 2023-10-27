// Copyright 2022 Northern.tech AS
//
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
//
//        http://www.apache.org/licenses/LICENSE-2.0
//
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
import { accordionClasses } from '@mui/material/Accordion';
import { buttonClasses } from '@mui/material/Button';
import { formLabelClasses } from '@mui/material/FormLabel';

import { LIGHT_MODE } from '../../constants/appConstants.js';
import { palette as commonPalette, overrides, typography } from './common';

const grey = {
  '900': '#969696',
  '800': '#424242',
  '700': '#bcbcbc',
  '600': '#cfcfcf',
  '500': '#e9e9e9',
  '400': '#f7f7f7',
  '300': '#e6f2f1',
  '200': '#ddedec',
  '100': '#d8ebe9',
  '50': '#d4e9e7'
};

const green = {
  '50': '#E4F4E9',
  '100': '#E4F1E8',
  '200': 'rgba(154, 217, 173, 0.20)',
  '300': '#9AD9AD',
  '800': '#00813B'
};

const blue = {
  '700': '#1D71D3'
};

const palette = {
  ...commonPalette,
  mode: LIGHT_MODE,
  grey,
  blue,
  green,
  orange: '#E27E00',
  greySecondary: {
    '600': '#616161'
  },
  background: {
    ...commonPalette.background,
    light: '#fdfdfd',
    lightgrey: grey[400],
    default: '#fff',
    dark: 'rgb(50, 50, 50)',
    darkBlue: '#284d68'
  },
  secondary: {
    ...commonPalette.secondary,
    lighter: '#ececec',
    main: '#fff'
  },
  tooltip: {
    ...commonPalette.tooltip,
    text: grey[50]
  },
  text: {
    ...commonPalette.text,
    primary: '#212121',
    entryLink: '#DEFFF1',
    secondary: '#424242',
    inactive: '#616161'
  },
  border: {
    colors: {
      primary: '#E0E0E0',
      button: '#9E9E9E'
    }
  }
};

export const light = {
  palette,
  typography,
  components: {
    ...overrides,
    MuiSnackbarContent: {
      styleOverrides: {
        action: {
          color: palette.green[300]
        }
      }
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: palette.text.primary
        }
      }
    },
    MuiAccordion: {
      ...overrides.MuiAccordion,
      styleOverrides: {
        root: {
          ...overrides.MuiAccordion.styleOverrides.root,
          [`&.${accordionClasses.expanded}`]: {
            ...overrides.MuiAccordion.styleOverrides.root[`&.${accordionClasses.expanded}`]
          }
        }
      }
    },
    MuiButton: {
      ...overrides.MuiButton,
      styleOverrides: {
        ...overrides.MuiButton.styleOverrides,
        root: {
          ...overrides.MuiButton.styleOverrides.root,
          [`&.${buttonClasses.text}`]: {
            ...overrides.MuiButton.styleOverrides.root[`&.${buttonClasses.text}`],
            color: palette.text.primary
          }
        }
      }
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: palette.text.hint,
          [`&.${formLabelClasses.focused}`]: {
            color: palette.primary.main
          }
        }
      }
    },
    MuiIconButton: {
      ...overrides.MuiIconButton,
      styleOverrides: {
        ...overrides.MuiIconButton.styleOverrides,
        root: {
          ...overrides.MuiIconButton.styleOverrides.root,
          color: palette.text.hint
        }
      }
    },
    MuiListItem: {
      ...overrides.MuiListItem,
      styleOverrides: {
        ...overrides.MuiListItem.styleOverrides,
        root: {
          ...overrides.MuiListItem.styleOverrides.root,
          [`&.active`]: {
            backgroundColor: palette.background.default
          },
          [`&.leftNav.active`]: {
            borderTop: `1px solid ${palette.grey[50]}`,
            borderBottom: `1px solid ${palette.grey[50]}`
          }
        }
      }
    },
    MuiListItemText: {
      ...overrides.MuiListItemText,
      styleOverrides: {
        ...overrides.MuiListItemText.styleOverrides,
        root: {
          ...overrides.MuiListItemText.styleOverrides.root,
          color: palette.text.primary
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.background.dark
        },
        arrow: {
          color: palette.background.dark
        }
      }
    }
  }
};
