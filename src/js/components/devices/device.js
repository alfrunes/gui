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
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

import { ArrowCircleLeftOutlined as ArrowCircleLeftIcon } from '@mui/icons-material';
import { Button, Tab, Tabs } from '@mui/material';

import { setSnackbar } from '../../actions/appActions.js';
import { getDeviceInfo, setDeviceTags } from '../../actions/deviceActions.js';
import { saveGlobalSettings } from '../../actions/userActions.js';
import { TIMEOUTS, yes } from '../../constants/appConstants.js';
import { DEVICE_STATES } from '../../constants/deviceConstants.js';
import {
  getDeviceTwinIntegrations,
  getDocsVersion,
  getIdAttribute,
  getShowHelptips,
  getTenantCapabilities,
  getUserCapabilities
} from '../../selectors/index.js';
import DeviceIdentityDisplay from '../common/deviceidentity.js';
import { RelativeTime } from '../common/time.js';
import DeviceInventory from './device-details/deviceinventory.js';
import { IdentityTab } from './device-details/identity.js';
import DeviceNotifications from './device-details/notifications.js';
import Troubleshoot from './device-details/troubleshoot.js';

const deviceStatusCheck = ({ device: { status = DEVICE_STATES.accepted } }, states = [DEVICE_STATES.accepted]) => states.includes(status);

const tabs = [
  { component: IdentityTab, title: () => 'Identity', value: 'identity', isApplicable: yes },
  {
    component: DeviceInventory,
    title: () => 'Inventory',
    value: 'inventory',
    isApplicable: deviceStatusCheck
  }
];

const refreshDeviceLength = TIMEOUTS.refreshDefault;

export const Device = () => {
  const { id: deviceId } = useParams();

  const device = useSelector(state => state.devices.byId[deviceId] || {});
  const docsVersion = useSelector(getDocsVersion);
  const idAttribute = useSelector(getIdAttribute);
  const integrations = useSelector(getDeviceTwinIntegrations);
  const showHelptips = useSelector(getShowHelptips);
  const tenantCapabilities = useSelector(getTenantCapabilities);
  const userCapabilities = useSelector(getUserCapabilities);
  const dispatch = useDispatch();
  const timer = useRef();

  const { hasAuditlogs } = tenantCapabilities;

  /**
   * Update device info on load and refresh periodically (refreshDeviceLength=10s)
   */
  useEffect(() => {
    clearInterval(timer.current);
    timer.current = setInterval(() => dispatch(getDeviceInfo(deviceId)), refreshDeviceLength);
    dispatch(getDeviceInfo(deviceId));
    return () => {
      clearInterval(timer.current);
    };
  }, [deviceId, device.status]);
  const { latest: latestAlerts = [] } = useSelector(state => state.monitor.alerts.byDeviceId[deviceId]) || {};
  const availableTabs = tabs.reduce((accu, tab) => {
    if (tab.isApplicable({ device, integrations, tenantCapabilities, userCapabilities })) {
      accu.push(tab);
    }
    return accu;
  }, []);

  const [tabSelection, setSelectedTab] = useState(tabs[0].value);
  const { component: SelectedTab, value: selectedTab } = availableTabs.find(tab => tab.value === tabSelection) ?? tabs[0];

  const commonProps = {
    device,
    docsVersion,
    latestAlerts,
    integrations,
    saveGlobalSettings: settings => dispatch(saveGlobalSettings(settings)),
    setDeviceTags: (...args) => dispatch(setDeviceTags(...args)),
    setSnackbar: (...args) => dispatch(setSnackbar(...args)),
    showHelptips,
    tenantCapabilities: { hasAuditlogs },
    userCapabilities
  };

  return (
    <div className="devicePage">
      <div className="flexbox devicePage-header padding-left">
        <Button component={Link} to="/devices">
          <ArrowCircleLeftIcon /> All devices
        </Button>
        <h2 className="flexbox center-aligned">
          Device information for&nbsp;
          {<DeviceIdentityDisplay device={device} idAttribute={idAttribute} isEditable={false} hasAdornment={false} />}
        </h2>
        <div className="flexbox center-aligned">
          <div className={`${device.isOffline ? 'red' : 'greyed'} margin-left margin-right flexbox`}>
            <div className="margin-right-small">Last check-in:</div>
            <RelativeTime updateTime={device.updated_ts} />
          </div>
        </div>
      </div>
      <div className="flexbox devicePage-content padding-left">
        <div className="devicePage-content_troubleshooting">
          <DeviceNotifications alerts={latestAlerts} device={device} isOffline={device.isOffline} isInactive={device.isInactive} />
          <Troubleshoot device={device} />
        </div>
        <div className="devicePage-content_info">
          <Tabs value={selectedTab} textColor="primary" onChange={(e, tab) => setSelectedTab(tab)}>
            {availableTabs.map(item => (
              <Tab key={item.value} label={item.title({ integrations })} value={item.value} />
            ))}
          </Tabs>
          <SelectedTab {...commonProps} />
        </div>
      </div>
    </div>
  );
};

export default Device;
