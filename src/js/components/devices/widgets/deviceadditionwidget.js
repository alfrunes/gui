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

import { ExpandMore as ArrowDropDownIcon, Launch as LaunchIcon } from '@mui/icons-material';
import { Button, ButtonGroup, Menu, MenuItem } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { canAccess } from '../../../constants/appConstants';

const useStyles = makeStyles()(theme => ({
  buttonStyle: {
    textTransform: 'none',
    color: `${theme.palette.primary.main} !important`,
    padding: 8,
    fontWeight: 500,
    '&:hover': {
      background: 'none'
    }
  },
  deviceAdditionWidget: {
    border: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 4,
    button: {
      padding: '5px 8px'
    },
    'button:last-child': {
      borderLeft: `1px solid ${theme.palette.primary.main}`
    }
  }
}));

export const DeviceAdditionWidget = ({ features, innerRef, onConnectClick, onPreauthClick, tenantCapabilities, className = '' }) => {
  const [anchorEl, setAnchorEl] = useState();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { classes } = useStyles();

  const options = [
    { action: onConnectClick, title: 'Add a new device', value: 'connect', canAccess },
    { action: onPreauthClick, title: 'Preauthorize a device', value: 'preauth', canAccess },
    {
      href: `https://docs.alvaldi.com/getting-started/setup/`,
      rel: 'noopener noreferrer',
      target: '_blank',
      title: 'Learn how to connect devices',
      value: 'learntoconnect',
      canAccess
    }
  ];

  const handleToggle = event => {
    const anchor = anchorEl ? null : event?.currentTarget.parentElement;
    setAnchorEl(anchor);
  };

  const handleSelection = index => {
    setSelectedIndex(index);
    handleToggle();
    options[index].action(true);
  };

  return (
    <>
      <ButtonGroup ref={innerRef} className={`${classes.deviceAdditionWidget} ${className}`}>
        <Button className={classes.buttonStyle} onClick={options[selectedIndex].action} variant="text">
          {options[selectedIndex].title}
        </Button>
        <Button className={classes.buttonStyle} size="small" onClick={handleToggle} variant="text">
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Menu id="device-connection-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleToggle} variant="menu">
        {options.reduce((accu, option, index) => {
          if (!option.canAccess({ features, tenantCapabilities })) {
            return accu;
          }
          // eslint-disable-next-line no-unused-vars
          const { canAccess, href, title, value, ...optionProps } = option;
          const item = href ? (
            <MenuItem {...optionProps} key={value} href={href} component="a">
              {title}
              <LaunchIcon style={{ fontSize: '10pt' }} />
            </MenuItem>
          ) : (
            <MenuItem key={value} component="a" onClick={() => handleSelection(index)}>
              {title}
            </MenuItem>
          );
          accu.push(item);
          return accu;
        }, [])}
      </Menu>
    </>
  );
};

export default DeviceAdditionWidget;
