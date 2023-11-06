// Copyright 2023 Northern.tech AS
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
import { Link } from 'react-router-dom';

import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import ConnectToAzureDiagramImage from '../../../assets/img/connect-to-azure-diagram.svg';
import MarketplaceImage from '../../../assets/img/iot-module-marketplace.svg';
import { EDGE_MODULE_LINK } from '../../constants/appConstants.js';

const useStyles = makeStyles()(theme => ({
  Dialog: {
    position: 'absolute',
    width: 480
  },
  DialogTitle: {
    fontSize: 16
  },
  DiagramContainer: {
    padding: '40px 0 26px 0',
    borderRadius: 4,
    backgroundColor: theme.palette.surface.primary,
    textAlign: 'center',
    marginTop: theme.spacing(3)
  }
}));

export const EnableAzureIntegration = () => {
  const [showDialog, setShowDialog] = useState(true);
  const { classes } = useStyles();
  const closeHandler = () => setShowDialog(false);
  return (
    <Dialog classes={{ paper: classes.Dialog }} open={showDialog} onClose={closeHandler}>
      <DialogTitle className={classes.DialogTitle}>
        <b>Connecting a device</b>
      </DialogTitle>
      <DialogContent>
        <div>To connect a device, Alvaldi provides an easy device sync with Azure IoT hub. Go to the integration page to get started.</div>
        <div className={classes.DiagramContainer}>
          <ConnectToAzureDiagramImage />
          <Link to="/settings/integrations">
            <Button className="margin-top" variant="contained" color="primary" onClick={closeHandler}>
              Enable Azure integration
            </Button>
          </Link>
        </div>
        <Button className="margin-top" onClick={closeHandler}>
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export const IntegrationEnabled = () => {
  const [showDialog, setShowDialog] = useState(true);
  const { classes } = useStyles();
  const closeHandler = () => setShowDialog(false);
  return (
    <Dialog classes={{ paper: classes.Dialog }} open={showDialog} onClose={closeHandler}>
      <DialogTitle className={`${classes.DialogTitle} flexbox center-aligned`}>
        <CheckCircleIcon className="green margin-right-sx" />
        <b>Integration enabled successfully</b>
      </DialogTitle>
      <DialogContent>
        <div>You now need to install Alvaldi on your devices. Follow the instructions below to get started with the Alvaldi IoT Edge module.</div>
        <div className={classes.DiagramContainer}>
          <MarketplaceImage />
          <Link rel="noopener noreferrer" target="_blank" to={EDGE_MODULE_LINK}>
            <Button className="margin-top" variant="contained" color="primary" onClick={closeHandler}>
              Learn how
            </Button>
          </Link>
        </div>
        <Button className="margin-top" onClick={closeHandler}>
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
};
