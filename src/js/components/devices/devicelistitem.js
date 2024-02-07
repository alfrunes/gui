// Copyright 2019 Northern.tech AS
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
import React, { memo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material ui
import { Checkbox } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { DEVICE_STATES } from '../../constants/deviceConstants';
import { deepCompare } from '../../helpers';
import DeviceIdentityDisplay from '../common/deviceidentity';
import { DefaultAttributeRenderer } from './base-devices';
import { useDispatch } from 'react-redux';
import { advanceOnboarding } from '../../actions/onboardingActions.js';
import { onboardingSteps } from '../../constants/onboardingConstants.js';

const useStyles = makeStyles()(theme => ({
  active: {
    [`> *`]: {
      backgroundColor: theme.palette.background.light
    }
  },
  identityItem: {
    '.text-overflow': {
      maxWidth: 200,
      textOverflow: 'ellipsis'
    }
  }
}));

const DeviceListItem = ({ columnHeaders, device, idAttribute, index, onRowSelect, selectable, selected }) => {
  const [isHovering, setIsHovering] = useState(false);
  const { classes } = useStyles();
  const dispatch = useDispatch();

  const onMouseOut = () => setIsHovering(false);
  const onMouseOver = () => setIsHovering(true);
  const navigate = useNavigate();
  const handleOnClick = useCallback(
    event => {
      if (event && event.target.closest('input')?.hasOwnProperty('checked')) {
        return;
      }
      dispatch(advanceOnboarding(onboardingSteps.DEVICES_ACCEPTED_ONBOARDING));
      navigate(`/devices/${device.id}`);
    },
    [device.id]
  );

  const handleRowSelect = () => onRowSelect(index);

  return (
    <div
      onClick={handleOnClick}
      className={`deviceListRow deviceListItem clickable ${isHovering ? classes.active : ''} ${device.status === DEVICE_STATES.pending ? classes.active : ''}`}
      onMouseEnter={onMouseOver}
      onMouseLeave={onMouseOut}
    >
      {/*
        we need to wrap the checkbox into a div here to ensure the bottom border etc. works as intended since the outer div will
        not create an own box due to "display: contents" being needed until subgrid support lands in browsers
      */}
      {selectable && (
        <div>
          <Checkbox checked={selected} onChange={handleRowSelect} />
        </div>
      )}
      <DeviceIdentityDisplay className={classes.identityItem} device={device} isHovered={isHovering} />
      {/* we'll skip the first column, since this is the id and that gets resolved differently in the lines above */}
      {columnHeaders.slice(1).map((column, index) => {
        let Component = column.component ? column.component : DefaultAttributeRenderer;
        return <Component column={column} device={device} idAttribute={idAttribute} key={`column-${index}`} />;
      })}
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (
    prevProps.idAttribute != nextProps.idAttribute ||
    prevProps.selected != nextProps.selected ||
    !deepCompare(prevProps.columnHeaders, nextProps.columnHeaders) ||
    !deepCompare(prevProps.device, nextProps.device)
  ) {
    return false;
  }
  return deepCompare(prevProps.deviceListState, nextProps.deviceListState);
};

export default memo(DeviceListItem, areEqual);
