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
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { deleteAuthset } from '../../../actions/deviceActions.js';

const RemoveDeviceDialog = ({ close, open, submit }) => (
  <Dialog open={open} onClose={close}>
    <DialogTitle>Remove device</DialogTitle>
    <DialogContent>Are you sure you want to remove this device?</DialogContent>
    <DialogActions>
      <Button className="margin-right-small" onClick={close}>
        Cancel
      </Button>
      <Button variant="contained" color="error" onClick={submit}>
        Remove
      </Button>
    </DialogActions>
  </Dialog>
);

export const RemoveDevice = ({ device, navigateToOnRemove = '/devices', className = '' }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [openDialog, setOpenDialog] = useState(false);

  const removeDevice = device => {
    if (device.auth_sets?.length) {
      dispatch(deleteAuthset(device.id, device.auth_sets[0].id)).then(() => navigateToOnRemove && navigate(navigateToOnRemove));
    }
  };

  return (
    <>
      <RemoveDeviceDialog open={openDialog} close={() => setOpenDialog(false)} submit={() => removeDevice(device)} />
      <Button className={className} onClick={() => setOpenDialog(true)}>
        Remove device
      </Button>
    </>
  );
};

export default RemoveDevice;
