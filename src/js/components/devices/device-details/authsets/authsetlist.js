// Copyright 2018 Northern.tech AS
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

import { makeStyles } from 'tss-react/mui';

import { canAccess } from '../../../../constants/appConstants';
import { DEVICE_STATES } from '../../../../constants/deviceConstants';
import { customSort } from '../../../../helpers';
import AuthsetListItem from './authsetlistitem';
const useStyles = makeStyles()(theme => ({
  authsets: {
    '.action-buttons': {
      'div, a': {
        marginBottom: theme.spacing(2)
      }
    }
  },
  accordion: {
    background: 'none'
  },
  divider: { marginTop: theme.spacing(), marginBottom: theme.spacing() },
  header: {},
  status: {
    borderRadius: 2,
    backgroundColor: 'rgba(252, 195, 53, 0.20)',
    padding: '4px 6px'
  },
  twoColumns: {
    '&.two-columns': {
      rowGap: theme.spacing(1.5),
      borderBottom: `1px solid ${theme.palette.grey[550]}`,
      gridTemplateColumns: '1fr 1.6fr'
    }
  }
}));

export const defaultColumns = {
  status: { title: 'Status', canAccess },
  publicKey: { title: 'Public key', canAccess },
  timeOfRequest: { title: 'Time of request', canAccess },
  actions: { title: 'Actions', canAccess: ({ userCapabilities: { canManageDevices } }) => canManageDevices }
};

export const AuthsetList = ({ device, userCapabilities, ...remainingProps }) => {
  const [expandRow, setExpandRow] = useState();
  const { classes } = useStyles();
  const { auth_sets: authsets = [], status = DEVICE_STATES.accepted } = device;

  const availableColumns = Object.fromEntries(Object.entries(defaultColumns).filter(([, column]) => column.canAccess({ userCapabilities })));

  let groupedAuthsets = authsets.reduce(
    // for each authset compare the device status and if it matches authset status, put it in correct list
    (accu, authset) => {
      if (authset.status === status) {
        accu.active.push(authset);
      } else if (authset.status === DEVICE_STATES.pending) {
        accu.pending.push(authset);
      } else {
        accu.inactive.push(authset);
      }
      return accu;
    },
    { active: [], inactive: [], pending: [] }
  );

  const orderedAuthsets = [
    ...groupedAuthsets.pending.sort(customSort(true, 'ts')),
    ...groupedAuthsets.active.sort(customSort(true, 'ts')),
    ...groupedAuthsets.inactive.sort(customSort(true, 'ts'))
  ];

  return (
    <div className={`authsets ${classes.authsets}`}>
      {orderedAuthsets.map(authset => (
        <AuthsetListItem
          authset={authset}
          classes={classes}
          columns={availableColumns}
          device={device}
          isExpanded={expandRow === authset.id}
          key={`authset-${authset.id}`}
          onExpand={setExpandRow}
          userCapabilities={userCapabilities}
          {...remainingProps}
        />
      ))}
    </div>
  );
};

export default AuthsetList;
