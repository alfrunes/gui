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
import React, { useRef } from 'react';

import { Block as BlockIcon, CheckCircle as CheckCircleIcon, Check as CheckIcon, Pending as PendingIcon } from '@mui/icons-material';
import { Chip } from '@mui/material';

import { DEVICE_STATES, IDENTITY_IOT_HUB_DEVICE_ID_KEY } from '../../../constants/deviceConstants';
import DeviceDataCollapse from './devicedatacollapse';
import Authsets from './authsets/authsets.js';
import { getOnboardingComponentFor } from '../../../utils/onboardingmanager.js';
import { onboardingSteps } from '../../../constants/onboardingConstants.js';
import { useDispatch, useSelector } from 'react-redux';
import { getOnboardingState } from '../../../selectors/index.js';
import { advanceOnboarding } from '../../../actions/onboardingActions.js';

const iconStyle = { margin: 12 };

const states = {
  default: <PendingIcon style={iconStyle} />,
  pending: <PendingIcon style={iconStyle} />,
  accepted: <CheckCircleIcon className="green" style={iconStyle} />,
  rejected: <BlockIcon className="red" style={iconStyle} />,
  preauthorized: <CheckIcon style={iconStyle} />
};

export const AuthStatus = ({ decommission, device }) => {
  const { auth_sets = [], status = DEVICE_STATES.accepted, identity_data = {} } = device;
  const onboardingState = useSelector(getOnboardingState);
  const authRef = useRef();
  const dispatch = useDispatch();

  let onboardingComponent;
  if (authRef.current) {
    const anchor = {
      top: authRef.current.offsetTop + authRef.current.offsetHeight / 2,
      left: authRef.current.offsetLeft - 40
    };

    onboardingComponent = getOnboardingComponentFor(
      onboardingSteps.DEVICE_AUTH,
      onboardingState,
      { anchor, place: 'left' },
      null,
      <a onClick={() => dispatch(advanceOnboarding(onboardingSteps.DEVICE_AUTH))}>Next</a>
    );
  }

  let hasPending = '';
  if (status === DEVICE_STATES.accepted && auth_sets.length > 1) {
    hasPending = auth_sets.reduce((accu, set) => {
      return set.status === DEVICE_STATES.pending ? 'This device has a pending authentication set' : accu;
    }, hasPending);
  }

  const statusIcon = states[status] ? states[status] : states.default;
  const requestNotification = !!hasPending && <Chip size="small" label="new request" color="primary" />;

  return (
    <DeviceDataCollapse
      title={
        <div ref={authRef} className="flexbox center-aligned auth-status">
          <h4>Authentication status</h4>
          <div className="flexbox center-aligned margin-left-large margin-right">
            <div className="capitalized">{status}</div>
            {statusIcon}
          </div>
          {requestNotification}
        </div>
      }
    >
      <Authsets decommission={decommission} device={device} />
      {identity_data[IDENTITY_IOT_HUB_DEVICE_ID_KEY] && <div className="greyed">This device is managed through Azure.</div>}
      {onboardingComponent}
    </DeviceDataCollapse>
  );
};

export default AuthStatus;
