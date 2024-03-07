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
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import docker from '../../../../assets/img/docker.png';
import iotHub from '../../../../assets/img/iot-hub.png';
import raspberryPi from '../../../../assets/img/raspberrypi.png';

import { getDeviceCountsByStatus, getDocsVersion, getOnboardingState, getTenantCapabilities } from '../../../selectors';
import PhysicalDeviceOnboarding from './physicaldeviceonboarding';
import VirtualDeviceOnboarding from './virtualdeviceonboarding';
import { Close as CloseIcon } from '@mui/icons-material';

const useStyles = makeStyles()(theme => ({
  rpiQuickstart: {
    backgroundColor: theme.palette.grey[50]
  },
  virtualLogo: { marginRight: theme.spacing(2) },
  card: {
    '&:hover': {
      boxShadow: '0px 4px 12px 3px rgba(0, 0, 0, 0.30)',
      cursor: 'pointer'
    },
    h3: {
      fontSize: 14
    }
  },
  code: {
    background: theme.palette.grey[50],
    borderRadius: 4,
    fontWeight: 500,
    padding: 4
  },
  azureLink: {
    fontWeight: 400,
    textDecoration: 'underline',
    color: theme.palette.text.primary
  }
}));

const DeviceConnectionExplainer = ({ setOnDevice, setVirtualDevice, onCancel }) => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  return (
    <>
      <p>You can use Alvaldi on almost any Linux device, but to make things simple during evaluation we recommend you use a Raspberry Pi as a test device.</p>
      <div className={`margin-top-xs padding padding-top-none rpi-quickstart ${classes.rpiQuickstart} ${classes.card}`} onClick={() => setOnDevice(true)}>
        <h3 className="flexbox center-aligned">
          <img height="30" src={raspberryPi} alt="raspberryPi icon" />
          <Box className="margin-left-small">Raspberry Pi quick start</Box>
        </h3>
        <p>We&apos;ll walk you through the steps to add a Raspberry Pi and connect to the terminal with Alvaldi.</p>
        <div className="flexbox column centered"></div>
      </div>
      <div className="two-columns margin-top">
        <div className={`padding-small padding-top-none ${classes.card}`} onClick={() => setVirtualDevice(true)}>
          <div className="flexbox center-aligned">
            <img src={docker} className={classes.virtualLogo} alt="docker icon" />
            <h3>Use a virtual device</h3>
          </div>
          <p>
            You can use our <code className={classes.code}>docker run</code> virtual device to test the features of Alvaldi.
          </p>
        </div>
        <div className={`padding-small padding-top-none ${classes.card}`} onClick={() => onCancel() && navigate('/settings/integrations')}>
          <div className="flexbox center-aligned">
            <img src={iotHub} className={classes.virtualLogo} alt="iot hub icon" />
            <h3>Use Azure IoT Edge</h3>
          </div>
          <div>
            If you&apos;re using Azure IoT Edge, you can install the Alvaldi client as a module. Read the tutorial <i className={classes.azureLink}>here</i>.
          </div>
        </div>
      </div>
    </>
  );
};

export const DeviceConnectionDialog = ({ onCancel }) => {
  const [onDevice, setOnDevice] = useState(false);
  const [progress, setProgress] = useState(1);
  const [virtualDevice, setVirtualDevice] = useState(false);
  const { pending: pendingCount } = useSelector(getDeviceCountsByStatus);
  const [pendingDevicesCount] = useState(pendingCount);
  const [hasMoreDevices, setHasMoreDevices] = useState(false);
  const docsVersion = useSelector(getDocsVersion);
  const { hasMonitor } = useSelector(getTenantCapabilities);
  const { complete: onboardingComplete } = useSelector(getOnboardingState);

  useEffect(() => {
    setHasMoreDevices(pendingCount > pendingDevicesCount);
  }, [pendingDevicesCount, pendingCount]);

  const onBackClick = () => {
    let updatedProgress = progress - 1;
    if (!updatedProgress) {
      updatedProgress = 1;
      setOnDevice(false);
      setVirtualDevice(false);
    }
    setProgress(updatedProgress);
  };

  let content = (
    <DeviceConnectionExplainer
      docsVersion={docsVersion}
      hasMonitor={hasMonitor}
      onCancel={onCancel}
      setOnDevice={setOnDevice}
      setVirtualDevice={setVirtualDevice}
    />
  );
  if (onDevice) {
    content = <PhysicalDeviceOnboarding progress={progress} />;
  } else if (virtualDevice) {
    content = <VirtualDeviceOnboarding />;
  }

  const dialogTitle = !(onDevice || virtualDevice) ? 'Add a device' : onDevice ? 'Rasberry Pi quick start' : 'Use a virtual device';
  return (
    <Dialog open={true} onClose={onCancel} PaperProps={{ sx: { maxWidth: '600px' } }}>
      <DialogTitle className="flexbox space-between center-aligned">
        <Box>{dialogTitle}</Box>
        <IconButton onClick={onCancel}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent className="onboard-dialog">{content}</DialogContent>
      <DialogActions>
        {(onDevice || virtualDevice) && (
          <div className="flexbox space-between flexbox-grow">
            <Button onClick={onBackClick}>Back</Button>
            <Button disabled={!onboardingComplete && !hasMoreDevices} onClick={onCancel}>
              {onboardingComplete ? 'Close' : hasMoreDevices ? 'Show device' : 'Waiting for device'}
            </Button>
          </div>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeviceConnectionDialog;
