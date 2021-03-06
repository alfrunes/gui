import React from 'react';
import { Button, Dialog, DialogActions, DialogTitle, DialogContent } from '@material-ui/core';

const RemoveGroup = ({ onRemove, onClose }) => (
  <Dialog open={true}>
    <DialogTitle>Remove this group?</DialogTitle>
    <DialogContent>
      <p>This will remove the group from the list. Are you sure you want to continue?</p>
    </DialogContent>
    <DialogActions>
      <Button key="remove-action-button-1" onClick={onClose} style={{ marginRight: '10px' }}>
        Cancel
      </Button>
      <Button variant="contained" key="remove-action-button-2" color="primary" onClick={onRemove}>
        Remove group
      </Button>
    </DialogActions>
  </Dialog>
);

export default RemoveGroup;
