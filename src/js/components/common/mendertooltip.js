// Copyright 2021 Northern.tech AS
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
import React, { useState } from 'react';

import { ClickAwayListener, Tooltip } from '@mui/material';
import { withStyles } from 'tss-react/mui';

import { toggle } from '../../helpers';

export const MenderTooltip = withStyles(Tooltip, ({ palette, shadows }) => ({
  arrow: {
    color: palette.text.secondary
  },
  tooltip: {
    backgroundColor: palette.text.secondary,
    boxShadow: shadows[1],
    color: palette.white,
    fontSize: 12,
    maxWidth: 600,
    info: {
      maxWidth: 300,
      color: palette.text.hint,
      backgroundColor: palette.grey[500]
    },
    'a, a:hover': {
      fontSize: 12,
      color: palette.white,
      borderBottom: `1px solid ${palette.white}`
    }
  }
}));

export const MenderTooltipClickable = ({ children, onboarding, startOpen = false, ...remainingProps }) => {
  const [open, setOpen] = useState(startOpen || false);

  const toggleVisibility = () => setOpen(toggle);

  const hide = () => setOpen(false);

  const Component = onboarding ? OnboardingTooltip : MenderTooltip;
  const extraProps = onboarding
    ? {
        PopperProps: {
          disablePortal: true,
          popperOptions: {
            strategy: 'fixed',
            modifiers: [
              { name: 'flip', enabled: false },
              { name: 'preventOverflow', enabled: true, options: { boundary: window, altBoundary: false } }
            ]
          }
        }
      }
    : {};
  return (
    <ClickAwayListener onClickAway={hide}>
      <Component
        arrow={!onboarding}
        open={open}
        disableFocusListener
        disableHoverListener
        disableTouchListener
        onOpen={() => setOpen(true)}
        {...extraProps}
        {...remainingProps}
      >
        <div onClick={toggleVisibility}>{children}</div>
      </Component>
    </ClickAwayListener>
  );
};

const iconWidth = 34;

export const OnboardingTooltip = withStyles(Tooltip, theme => ({
  arrow: {
    color: theme.palette.primary.main
  },
  tooltip: {
    backgroundColor: theme.palette.green[850],
    boxShadow: theme.shadows[1],
    color: theme.palette.grey[50],
    fontSize: 14,
    maxWidth: 330,
    padding: '21px 16px',
    width: 330,
    h3: {
      fontSize: 22,
      marginTop: 0
    },
    'a, a:hover': {
      color: theme.palette.grey[50],
      fontWeight: 500
    },
    '&.MuiTooltip-tooltipPlacementTop': { marginLeft: iconWidth, marginBottom: 0, transform: `translateY(${iconWidth}px) !important` },
    '&.MuiTooltip-tooltipPlacementRight': { marginTop: iconWidth / 2 },
    '&.MuiTooltip-tooltipPlacementBottom': { marginLeft: iconWidth },
    '&.MuiTooltip-tooltipPlacementLeft': { marginTop: iconWidth, transform: `translateX(${iconWidth}px) !important`, paddingRight: 20 }
  }
}));
export default MenderTooltip;
