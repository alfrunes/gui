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
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { AddCircle as AddIcon } from '@mui/icons-material';
import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import pluralize from 'pluralize';

import { setOfflineThreshold, setSnackbar } from '../../actions/appActions';
import {
  addDynamicGroup,
  addStaticGroup,
  getAllDeviceCounts,
  preauthDevice,
  removeDevicesFromGroup,
  removeDynamicGroup,
  removeStaticGroup,
  selectGroup,
  setDeviceFilters,
  setDeviceListState,
  updateDynamicGroup
} from '../../actions/deviceActions';
import { SORTING_OPTIONS, TIMEOUTS } from '../../constants/appConstants';
import { DEVICE_FILTERING_OPTIONS, DEVICE_ISSUE_OPTIONS, DEVICE_STATES, emptyFilter } from '../../constants/deviceConstants';
import { toggle } from '../../helpers';
import {
  getAcceptedDevices,
  getDeviceCountsByStatus,
  getDeviceFilters,
  getDeviceLimit,
  getDocsVersion,
  getFeatures,
  getGroups as getGroupsSelector,
  getIsPreview,
  getLimitMaxed,
  getOnboardingState,
  getSelectedGroupInfo,
  getShowHelptips,
  getTenantCapabilities,
  getUserCapabilities
} from '../../selectors';
import { useLocationParams } from '../../utils/liststatehook';
import Global from '../settings/global';
import AuthorizedDevices from './authorized-devices';
import DeviceStatusNotification from './devicestatusnotification';
import MakeGatewayDialog from './dialogs/make-gateway-dialog';
import PreauthDialog, { DeviceLimitWarning } from './dialogs/preauth-dialog';
import CreateGroup from './group-management/create-group';
import CreateGroupExplainer from './group-management/create-group-explainer';
import RemoveGroup from './group-management/remove-group';
import Groups from './groups';
import DeviceAdditionWidget from './widgets/deviceadditionwidget.js';
import { setShowConnectingDialog } from '../../actions/userActions';
import { getOnboardingComponentFor } from '../../utils/onboardingmanager.js';
import { onboardingSteps } from '../../constants/onboardingConstants.js';
import { makeStyles } from 'tss-react/mui';
import { advanceOnboarding } from '../../actions/onboardingActions.js';

const refreshLength = TIMEOUTS.refreshDefault;

const useStyles = makeStyles()(theme => ({
  addDevice: {
    position: 'absolute',
    right: theme.spacing(3),
    top: 50
  }
}));

export const DeviceGroups = () => {
  const [createGroupExplanation, setCreateGroupExplanation] = useState(false);
  const [fromFilters, setFromFilters] = useState(false);
  const [modifyGroupDialog, setModifyGroupDialog] = useState(false);
  const [openIdDialog, setOpenIdDialog] = useState(false);
  const [openPreauth, setOpenPreauth] = useState(false);
  const [showMakeGateway, setShowMakeGateway] = useState(false);
  const [removeGroup, setRemoveGroup] = useState(false);
  const [tmpDevices, setTmpDevices] = useState([]);
  const deviceTimer = useRef();
  const { status: statusParam } = useParams();
  const deviceConnectionRef = useRef();
  const { classes } = useStyles();

  const { groupCount, selectedGroup, groupFilters = [] } = useSelector(getSelectedGroupInfo);
  const filteringAttributes = useSelector(state => ({
    ...state.devices.filteringAttributes,
    identityAttributes: [...state.devices.filteringAttributes.identityAttributes, 'id']
  }));
  const tenantCapabilities = useSelector(getTenantCapabilities);
  const { groupNames, ...groupsByType } = useSelector(getGroupsSelector);
  const groups = groupNames;
  const { total: acceptedCount = 0 } = useSelector(getAcceptedDevices);
  const authRequestCount = useSelector(state => state.monitor.issueCounts.byType[DEVICE_ISSUE_OPTIONS.authRequests.key].total);
  const canPreview = useSelector(getIsPreview);
  const { canManageDevices } = useSelector(getUserCapabilities);
  const deviceLimit = useSelector(getDeviceLimit);
  const deviceListState = useSelector(state => state.devices.deviceList);
  const docsVersion = useSelector(getDocsVersion);
  const features = useSelector(getFeatures);
  const { hasReporting } = features;
  const filters = useSelector(getDeviceFilters);
  const limitMaxed = useSelector(getLimitMaxed);
  const { pending: pendingCount } = useSelector(getDeviceCountsByStatus);
  const showDeviceConnectionDialog = useSelector(state => state.users.showConnectDeviceDialog);
  const showHelptips = useSelector(getShowHelptips);
  const dispatch = useDispatch();
  const onboardingState = useSelector(getOnboardingState);

  const [locationParams, setLocationParams] = useLocationParams('devices', {
    filteringAttributes,
    filters,
    defaults: { sort: { direction: SORTING_OPTIONS.desc } }
  });

  const { refreshTrigger, selectedId, state: selectedState } = deviceListState;

  useEffect(() => {
    if (!deviceTimer.current) {
      return;
    }
    setLocationParams({ pageState: deviceListState, filters, selectedGroup });
  }, [
    deviceListState.detailsTab,
    deviceListState.page,
    deviceListState.perPage,
    deviceListState.selectedIssues,
    JSON.stringify(deviceListState.sort),
    selectedId,
    filters,
    selectedGroup,
    selectedState
  ]);

  useEffect(() => {
    if (locationParams.groupName) {
      dispatch(selectGroup(locationParams.groupName));
    }
    let listState = { setOnly: true };
    if (locationParams.open && locationParams.id.length) {
      listState = { ...listState, selectedId: locationParams.id[0], detailsTab: locationParams.detailsTab };
    }
    if (!locationParams.id?.length && selectedId) {
      listState = { ...listState, detailsTab: 'identity' };
    }
    dispatch(setDeviceListState(listState));
  }, [locationParams.detailsTab, locationParams.groupName, JSON.stringify(locationParams.id), locationParams.open]);

  useEffect(() => {
    const { groupName, filters = [], id = [], ...remainder } = locationParams;
    const { hasFullFiltering } = tenantCapabilities;
    if (groupName) {
      dispatch(selectGroup(groupName, filters));
    } else if (filters.length) {
      dispatch(setDeviceFilters(filters));
    }
    const state = statusParam && Object.values(DEVICE_STATES).some(state => state === statusParam) ? statusParam : selectedState;
    let listState = { ...remainder, state, refreshTrigger: !refreshTrigger };
    if (id.length === 1 && Boolean(locationParams.open)) {
      listState.selectedId = id[0];
    } else if (id.length && hasFullFiltering) {
      dispatch(setDeviceFilters([...filters, { ...emptyFilter, key: 'id', operator: DEVICE_FILTERING_OPTIONS.$in.key, value: id }]));
    }
    dispatch(setDeviceListState(listState));
    clearInterval(deviceTimer.current);
    deviceTimer.current = setInterval(() => dispatch(getAllDeviceCounts()), refreshLength);
    dispatch(setOfflineThreshold());
    return () => {
      clearInterval(deviceTimer.current);
    };
  }, []);

  /*
   * Groups
   */
  const removeCurrentGroup = () => {
    const request = groupFilters.length ? dispatch(removeDynamicGroup(selectedGroup)) : dispatch(removeStaticGroup(selectedGroup));
    return request.then(toggleGroupRemoval).catch(console.log);
  };

  // Edit groups from device selection
  const addDevicesToGroup = tmpDevices => {
    // (save selected devices in state, open dialog)
    setTmpDevices(tmpDevices);
    setModifyGroupDialog(toggle);
  };

  const createGroupFromDialog = (devices, group) => {
    let request = fromFilters ? dispatch(addDynamicGroup(group, filters)) : dispatch(addStaticGroup(group, devices));
    return request.then(() => {
      // reached end of list
      setCreateGroupExplanation(false);
      setModifyGroupDialog(false);
      setFromFilters(false);
    });
  };

  const onGroupClick = () => {
    if (selectedGroup && groupFilters.length) {
      return dispatch(updateDynamicGroup(selectedGroup, filters));
    }
    setModifyGroupDialog(true);
    setFromFilters(true);
  };

  const onRemoveDevicesFromGroup = devices => {
    const isGroupRemoval = devices.length >= groupCount;
    let request;
    if (isGroupRemoval) {
      request = dispatch(removeStaticGroup(selectedGroup));
    } else {
      request = dispatch(removeDevicesFromGroup(selectedGroup, devices));
    }
    return request.catch(console.log);
  };

  const openSettingsDialog = e => {
    e.preventDefault();
    setOpenIdDialog(toggle);
  };

  const onCreateGroupClose = () => {
    setModifyGroupDialog(false);
    setFromFilters(false);
    setTmpDevices([]);
  };

  const onPreauthSaved = addMore => {
    setOpenPreauth(!addMore);
    dispatch(setDeviceListState({ page: 1, refreshTrigger: !refreshTrigger }));
  };

  const onShowDeviceStateClick = state => {
    dispatch(selectGroup());
    dispatch(setDeviceListState({ state }));
  };

  const onGroupSelect = groupName => {
    dispatch(selectGroup(groupName));
    dispatch(setDeviceListState({ page: 1, refreshTrigger: !refreshTrigger, selection: [] }));
  };

  const onShowAuthRequestDevicesClick = () => {
    dispatch(setDeviceFilters([]));
    dispatch(setDeviceListState({ selectedIssues: [DEVICE_ISSUE_OPTIONS.authRequests.key], page: 1 }));
  };

  const toggleGroupRemoval = () => setRemoveGroup(toggle);

  const toggleMakeGatewayClick = () => setShowMakeGateway(toggle);
  const theme = useTheme();

  let onboardingComponent;
  if (deviceConnectionRef.current && !(pendingCount || acceptedCount)) {
    const anchor = {
      top: deviceConnectionRef.current.offsetTop + deviceConnectionRef.current.offsetHeight / 2 + 22,
      left: deviceConnectionRef.current.offsetLeft + 20
    };
    onboardingComponent = getOnboardingComponentFor(
      onboardingSteps.ONBOARDING_START,
      onboardingState,
      { anchor, place: 'top' },
      null,
      <a onClick={() => Promise.all([dispatch(setShowConnectingDialog(true)), dispatch(advanceOnboarding(onboardingSteps.ONBOARDING_START))])}>Get started!</a>
    );
  }

  return (
    <>
      <div className="tab-container with-sub-panels" style={{ padding: 0, height: '100%' }}>
        <Groups
          className="leftFixed"
          acceptedCount={acceptedCount}
          changeGroup={onGroupSelect}
          groups={groupsByType}
          openGroupDialog={setCreateGroupExplanation}
          selectedGroup={selectedGroup}
          showHelptips={showHelptips}
        />
        <div className="rightFluid relative" style={{ paddingTop: theme.spacing(4) }}>
          <div className="tab-container margin-bottom with-sub-panels" style={{ padding: 0, minHeight: 'initial' }}>
            <div className="flexbox space-between">
              {hasReporting && !!authRequestCount && (
                <a className="flexbox center-aligned margin-right-large" onClick={onShowAuthRequestDevicesClick}>
                  <AddIcon fontSize="small" style={{ marginRight: 6 }} />
                  {authRequestCount} new device authentication {pluralize('request', authRequestCount)}
                </a>
              )}
              {!!pendingCount && !selectedGroup && selectedState !== DEVICE_STATES.pending ? (
                <DeviceStatusNotification deviceCount={pendingCount} state={DEVICE_STATES.pending} onClick={onShowDeviceStateClick} />
              ) : (
                <div />
              )}
            </div>
          </div>
          {canManageDevices && (
            <DeviceAdditionWidget
              className={classes.addDevice}
              features={features}
              onConnectClick={() => dispatch(setShowConnectingDialog(true))}
              onMakeGatewayClick={toggleMakeGatewayClick}
              onPreauthClick={setOpenPreauth}
              tenantCapabilities={tenantCapabilities}
              innerRef={deviceConnectionRef}
            />
          )}
          {onboardingComponent}
          {limitMaxed && <DeviceLimitWarning acceptedDevices={acceptedCount} deviceLimit={deviceLimit} />}
          <AuthorizedDevices
            addDevicesToGroup={addDevicesToGroup}
            onGroupClick={onGroupClick}
            onGroupRemoval={toggleGroupRemoval}
            onMakeGatewayClick={toggleMakeGatewayClick}
            onPreauthClick={setOpenPreauth}
            openSettingsDialog={openSettingsDialog}
            removeDevicesFromGroup={onRemoveDevicesFromGroup}
            showsDialog={showDeviceConnectionDialog || removeGroup || modifyGroupDialog || createGroupExplanation || openIdDialog || openPreauth}
          />
        </div>
        {removeGroup && <RemoveGroup onClose={toggleGroupRemoval} onRemove={removeCurrentGroup} />}
        {modifyGroupDialog && (
          <CreateGroup
            addListOfDevices={createGroupFromDialog}
            fromFilters={fromFilters}
            isCreation={fromFilters || !groups.length}
            selectedDevices={tmpDevices}
            onClose={onCreateGroupClose}
          />
        )}
        {createGroupExplanation && (
          <CreateGroupExplainer hasDynamicGroups={tenantCapabilities.hasDynamicGroups} onClose={() => setCreateGroupExplanation(false)} />
        )}
        {openIdDialog && (
          <Dialog open>
            <DialogTitle>Default device identity attribute</DialogTitle>
            <DialogContent style={{ overflow: 'hidden' }}>
              <Global dialog closeDialog={openSettingsDialog} />
            </DialogContent>
          </Dialog>
        )}
        {openPreauth && (
          <PreauthDialog
            acceptedDevices={acceptedCount}
            deviceLimit={deviceLimit}
            limitMaxed={limitMaxed}
            preauthDevice={authset => dispatch(preauthDevice(authset))}
            onSubmit={onPreauthSaved}
            onCancel={() => setOpenPreauth(false)}
            setSnackbar={message => dispatch(setSnackbar(message))}
          />
        )}
        {showMakeGateway && <MakeGatewayDialog docsVersion={docsVersion} isPreRelease={canPreview} onCancel={toggleMakeGatewayClick} />}
      </div>
    </>
  );
};

export default DeviceGroups;
