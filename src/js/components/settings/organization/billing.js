// Copyright 2022 Northern.tech AS
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
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

// material ui
import { Error as ErrorIcon } from '@mui/icons-material';
import { Button, LinearProgress, List } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import moment from 'moment';

import { getUserList } from '../../../actions/userActions.js';
import { PLANS } from '../../../constants/appConstants';
import { getAcceptedDevices, getDeviceLimit, getIsEnterprise, getOrganization, getUsersById, getUsersLimit } from '../../../selectors';
import Alert from '../../common/alert';
import OrganizationPaymentSettings from './organizationpaymentsettings';
import OrganizationSettingsItem, { maxWidth } from './organizationsettingsitem';

const useStyles = makeStyles()(theme => ({
  deviceLimitBar: { backgroundColor: theme.palette.grey[500], margin: '15px 0' },
  wrapper: {
    backgroundColor: theme.palette.background.lightgrey,
    marginTop: theme.spacing(6),
    padding: theme.spacing(2),
    '&>h5': { marginTop: 0, marginBottom: 0 }
  }
}));

export const TrialExpirationNote = ({ trial_expiration }) => (
  <div className="flexbox centered muted">
    <ErrorIcon fontSize="small" />
    <span className="margin-left-small">
      Your trial expires in {moment().from(moment(trial_expiration), true)}. <Link to="/settings/upgrade">Upgrade to a paid plan</Link>
    </span>
  </div>
);

export const LimitExpansionNotification = ({ type }) => (
  <div className="flexbox centered">
    <ErrorIcon className="muted margin-right-small" fontSize="small" />
    <div className="muted" style={{ marginRight: 4 }}>
      To add more {type},{' '}
    </div>
    <Link to="/settings/upgrade">upgrade to a paid plan</Link>
    <div className="muted">.</div>
  </div>
);

export const CancelSubscriptionAlert = () => (
  <Alert className="margin-top-large" severity="error" style={{ maxWidth }}>
    <p>We&#39;ve started the process to cancel your plan and deactivate your account.</p>
    <p>
      We&#39;ll send you an email confirming your deactivation. If you have any question at all, contact us at{' '}
      <strong>
        <a href="mailto:support@mender.io">support@mender.io</a>
      </strong>
    </p>
  </Alert>
);

export const CancelSubscriptionButton = ({ handleCancelSubscription, isTrial }) => (
  <p className="margin-left-small margin-right-small" style={{ maxWidth }}>
    <Button variant="contained" color="secondary" onClick={handleCancelSubscription}>
      {isTrial ? 'End trial' : 'Cancel subscription'} and deactivate account
    </Button>
  </p>
);

export const Billing = () => {
  const { total: acceptedDevices = 0 } = useSelector(getAcceptedDevices);
  const registeredUsersCount = Object.keys(useSelector(getUsersById)).length;
  const deviceLimit = useSelector(getDeviceLimit);
  const usersLimit = useSelector(getUsersLimit);
  const isEnterprise = useSelector(getIsEnterprise);
  const organization = useSelector(getOrganization);
  const { plan: currentPlan = 'os' } = organization;
  const dispatch = useDispatch();
  const { classes } = useStyles();

  useEffect(() => {
    dispatch(getUserList());
  }, []);

  const planName = PLANS[currentPlan].name;

  return (
    <div className={classes.wrapper}>
      <h5>Billing</h5>
      <List>
        <OrganizationSettingsItem
          title="Current plan"
          content={{
            action: { title: 'Compare product plans', internal: false, target: 'https://alvaldi.com/pricing' },
            description: organization.trial ? 'Trial' : planName
          }}
          notification={organization.trial ? <TrialExpirationNote trial_expiration={organization.trial_expiration} /> : null}
        />
        {deviceLimit > 0 && (
          <OrganizationSettingsItem
            title={`Devices: ${acceptedDevices}/${deviceLimit}`}
            content={{}}
            secondary={<LinearProgress className={classes.deviceLimitBar} variant="determinate" value={(acceptedDevices * 100) / deviceLimit} />}
            notification={<LimitExpansionNotification type="devices" />}
          />
        )}
        {usersLimit > 0 && (
          <OrganizationSettingsItem
            title={`Users: ${registeredUsersCount}/${usersLimit}`}
            content={{}}
            secondary={<LinearProgress className={classes.deviceLimitBar} variant="determinate" value={(registeredUsersCount * 100) / usersLimit} />}
            notification={<LimitExpansionNotification type="users" />}
          />
        )}
        {!organization.trial && !isEnterprise && <OrganizationPaymentSettings />}
      </List>
    </div>
  );
};

export default Billing;
