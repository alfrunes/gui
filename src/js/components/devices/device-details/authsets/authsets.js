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
import { useDispatch, useSelector } from 'react-redux';

// material ui
import { Accordion, AccordionDetails, AccordionSummary, Button } from '@mui/material';
import { accordionClasses } from '@mui/material/Accordion';
import { makeStyles } from 'tss-react/mui';

import pluralize from 'pluralize';

import { deleteAuthset, updateDeviceAuth } from '../../../../actions/deviceActions';
import { DEVICE_DISMISSAL_STATE, DEVICE_STATES } from '../../../../constants/deviceConstants';
import { getAcceptedDevices, getDeviceLimit, getLimitMaxed, getUserCapabilities } from '../../../../selectors';
import { DeviceLimitWarning } from '../../dialogs/preauth-dialog';
import Confirm from './../../../common/confirm';
import Authsetlist from './authsetlist';
import { ExpandMore as ExpandIcon } from '@mui/icons-material';

const useStyles = makeStyles()(theme => ({
  decommission: {
    '&.MuiButton-text': {
      color: theme.palette.red[600],
      border: `1px solid ${theme.palette.red[600]}`,
      padding: '6px 8px'
    }
  },
  wrapper: {
    borderColor: theme.palette.grey[550],
    background: theme.palette.grey[350],
    borderStyle: 'solid',
    borderWidth: 1,
    marginBottom: theme.spacing(2),
    maxWidth: 350,
    [`&.${accordionClasses.expanded}`]: {
      margin: `0 0 ${theme.spacing(2)} 0`
    }
  },
  accordionSummary: {
    justifyContent: 'space-between'
  }
}));

export const Authsets = ({ decommission, device, showHelptips }) => {
  const [confirmDecommission, setConfirmDecomission] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { total: acceptedDevices = 0 } = useSelector(getAcceptedDevices);
  const deviceLimit = useSelector(getDeviceLimit);
  const limitMaxed = useSelector(getLimitMaxed);
  const userCapabilities = useSelector(getUserCapabilities);

  const { auth_sets = [], status = DEVICE_STATES.accepted } = device;

  const updateDeviceAuthStatus = (device_id, auth_id, status) => {
    setLoading(auth_id);
    const postUpdateSteps = () => {
      setLoading(null);
    };

    if (status === DEVICE_DISMISSAL_STATE) {
      return (
        dispatch(deleteAuthset(device_id, auth_id))
          // on finish, change "loading" back to null
          .finally(postUpdateSteps)
      );
    } else {
      // call API to update authset
      return (
        dispatch(updateDeviceAuth(device_id, auth_id, status))
          // on finish, change "loading" back to null
          .finally(postUpdateSteps)
      );
    }
  };

  const { canManageDevices } = userCapabilities;
  const { classes } = useStyles();
  return (
    <Accordion defaultExpanded={true} className={classes.wrapper}>
      <AccordionSummary className={classes.accordionSummary} expandIcon={<ExpandIcon style={{ fontSize: 24 }} />}>
        {status === DEVICE_STATES.pending ? `Authorization ${pluralize('request', auth_sets.length)}` : 'Authorization sets'}
      </AccordionSummary>
      <AccordionDetails className="accordion-details">
        <Authsetlist
          limitMaxed={limitMaxed}
          total={auth_sets.length}
          confirm={updateDeviceAuthStatus}
          loading={loading}
          device={device}
          showHelptips={showHelptips}
          userCapabilities={userCapabilities}
        />

        {limitMaxed && <DeviceLimitWarning acceptedDevices={acceptedDevices} deviceLimit={deviceLimit} hasContactInfo />}
        {![DEVICE_STATES.preauth, DEVICE_STATES.pending].includes(device.status) && canManageDevices && (
          <div className="flexbox">
            {confirmDecommission ? (
              <Confirm action={() => decommission(device.id)} cancel={() => setConfirmDecomission(false)} type="decommissioning" />
            ) : (
              <Button className={classes.decommission} onClick={setConfirmDecomission}>
                Decommission device
              </Button>
            )}
          </div>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default Authsets;
