// Copyright 2020 Northern.tech AS
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
import Cookies from 'universal-cookie';

import { DEVICE_STATES } from '../constants/deviceConstants';
import {
  SET_DEMO_ARTIFACT_PORT,
  SET_ONBOARDING_APPROACH,
  SET_ONBOARDING_COMPLETE,
  SET_ONBOARDING_DEVICE_TYPE,
  SET_ONBOARDING_PROGRESS,
  SET_SHOW_ONBOARDING_HELP,
  SET_SHOW_ONBOARDING_HELP_DIALOG,
  onboardingSteps as onboardingStepNames
} from '../constants/onboardingConstants';

import { getOnboardingState as getCurrentOnboardingState, getUserCapabilities, getUserSettings } from '../selectors';
import Tracking from '../tracking';
import { onboardingSteps } from '../utils/onboardingmanager';
import { saveUserSettings, getUserSettings as getUserSettingsAction } from './userActions';
import { SET_SHOW_HELP } from '../constants/userConstants.js';

const cookies = new Cookies();

const deductOnboardingState = ({ devicesByStatus, onboardingState, userCapabilities, userId }) => {
  const { canManageDevices, canReadDevices } = userCapabilities;
  const userCookie = cookies.get(`${userId}-onboarded`);
  const acceptedDevicesCount = devicesByStatus[DEVICE_STATES.accepted].total;
  const pendingDevicesCount = devicesByStatus[DEVICE_STATES.pending].total;
  let deviceType = onboardingState.deviceType ?? [];

  let progress = onboardingState.progress;
  const progressIndex = Object.keys(onboardingSteps).findIndex(key => progress === key);
  const pendingIndex = Object.keys(onboardingSteps).findIndex(key => onboardingStepNames.DEVICES_PENDING_ONBOARDING === key);
  const acceptedIndex = Object.keys(onboardingSteps).findIndex(key => onboardingStepNames.DEVICES_ACCEPTED_ONBOARDING === key);

  // if accepted devices exists and no progress or progress lower than accepted onboarding then set onboarding progress to accepted onboarding
  if (acceptedDevicesCount > 0 && (!progress || progressIndex <= acceptedIndex)) {
    progress = onboardingStepNames.DEVICES_ACCEPTED_ONBOARDING;
  } // if no accepted devices and pending exists and no progress or progress lower than pending onboarding then set onboarding progress to pending onboarding
  else if (pendingDevicesCount > 0 && acceptedDevicesCount === 0 && (!progress || progressIndex <= pendingIndex)) {
    progress = onboardingStepNames.DEVICES_PENDING_ONBOARDING;
  } // if no accepted and pending devices and no progress then set onboarding to the starting point
  else if (!progress) {
    progress = onboardingStepNames.ONBOARDING_START;
  }

  const { complete = false, disable = false } = onboardingState; // applyOnboardingFallbacks(onboardingState.progress || determineProgress(acceptedDevices, pendingDevices, releases, pastDeployments));
  return {
    ...onboardingState,
    complete: !!(
      Boolean(userCookie) ||
      complete ||
      Object.keys(onboardingSteps).findIndex(step => step === progress) >= Object.keys(onboardingSteps).length - 1 ||
      disable ||
      ![canManageDevices, canReadDevices].every(i => i)
    ),
    showTips: onboardingState.showTips != null ? onboardingState.showTips : true,
    deviceType,
    approach: onboardingState.approach,
    progress
  };
};

export const getOnboardingState = () => async (dispatch, getState) => {
  await dispatch(getUserSettingsAction());
  const store = getState();
  let onboardingState = getCurrentOnboardingState(store);

  if (!onboardingState.complete) {
    const userId = getState().users.currentUser;
    onboardingState = deductOnboardingState({
      devicesById: store.devices.byId,
      devicesByStatus: store.devices.byStatus,
      onboardingState,
      userCapabilities: getUserCapabilities(store),
      userId
    });
  }
  onboardingState.progress = onboardingState.progress || onboardingStepNames.ONBOARDING_START;
  return Promise.resolve(dispatch(setOnboardingState(onboardingState)));
};

export const setShowOnboardingHelp =
  (show, update = true) =>
  (dispatch, getState) => {
    let tasks = [dispatch({ type: SET_SHOW_ONBOARDING_HELP, show })];
    if (update) {
      const { onboarding = {} } = getUserSettings(getState());
      tasks.push(dispatch(saveUserSettings({ onboarding: { ...onboarding, showTips: show }, showHelptips: show })));
      tasks.push(dispatch({ type: SET_SHOW_HELP, show }));
    }
    return Promise.all(tasks);
  };

const setOnboardingProgress = value => dispatch => dispatch({ type: SET_ONBOARDING_PROGRESS, value });

export const setOnboardingDeviceType =
  (value, update = true) =>
  (dispatch, getState) => {
    let tasks = [dispatch({ type: SET_ONBOARDING_DEVICE_TYPE, value })];
    if (update) {
      const { onboarding = {} } = getUserSettings(getState());
      tasks.push(dispatch(saveUserSettings({ onboarding: { ...onboarding, deviceType: value } })));
    }
    return Promise.all(tasks);
  };

export const setOnboardingApproach =
  (value, update = true) =>
  (dispatch, getState) => {
    let tasks = [dispatch({ type: SET_ONBOARDING_APPROACH, value })];
    if (update) {
      const { onboarding = {} } = getUserSettings(getState());
      tasks.push(dispatch(saveUserSettings({ onboarding: { ...onboarding, approach: value } })));
    }
    return Promise.all(tasks);
  };

export const setShowDismissOnboardingTipsDialog = show => dispatch => dispatch({ type: SET_SHOW_ONBOARDING_HELP_DIALOG, show });

export const setDemoArtifactPort = port => dispatch => dispatch({ type: SET_DEMO_ARTIFACT_PORT, value: port });

export const setOnboardingComplete = val => dispatch => {
  let tasks = [Promise.resolve(dispatch({ type: SET_ONBOARDING_COMPLETE, complete: val }))];
  if (val) {
    tasks.push(Promise.resolve(dispatch({ type: SET_SHOW_ONBOARDING_HELP, show: false })));
    tasks.push(Promise.resolve(dispatch(advanceOnboarding(onboardingStepNames.DEVICE_FILES_TRANSFERRING))));
  }
  return Promise.all(tasks);
};

export const setOnboardingCanceled = () => dispatch =>
  Promise.all([
    Promise.resolve(dispatch(setShowOnboardingHelp(false))),
    Promise.resolve(dispatch(setShowDismissOnboardingTipsDialog(false))),
    Promise.resolve(dispatch({ type: SET_ONBOARDING_COMPLETE, complete: true }))
  ])
    // since we can't advance after ONBOARDING_CANCELED, track the step manually here
    .then(() => Tracking.event({ category: 'onboarding', action: onboardingSteps.ONBOARDING_CANCELED }));

const setOnboardingState = state => dispatch =>
  Promise.all([
    dispatch(setOnboardingComplete(state.complete)),
    dispatch(setOnboardingDeviceType(state.deviceType, false)),
    dispatch(setOnboardingApproach(state.approach, false)),
    dispatch(setShowOnboardingHelp(state.showTips, false)),
    dispatch(setOnboardingProgress(state.progress)),
    dispatch(saveUserSettings({ onboarding: state }))
  ]);

export const advanceOnboarding = stepId => (dispatch, getState) => {
  const steps = Object.keys(onboardingSteps);
  const progress = steps.findIndex(step => step === getState().onboarding.progress);
  const stepIndex = steps.findIndex(step => step === stepId);
  // if there is no progress set yet, the onboarding state deduction hasn't happened
  // and the subsequent settings persistence would overwrite what we stored
  if (progress > stepIndex || getState().onboarding.progress === null) {
    return;
  }
  const madeProgress = steps[stepIndex + 1];
  const state = { ...getCurrentOnboardingState(getState()), progress: madeProgress };
  state.complete = stepIndex + 1 >= Object.keys(onboardingSteps).findIndex(step => step === onboardingStepNames.ONBOARDING_FINISHED) ? true : state.complete;
  Tracking.event({ category: 'onboarding', action: stepId });
  return Promise.all([dispatch(setOnboardingProgress(madeProgress)), dispatch(saveUserSettings({ onboarding: state }))]);
};

export const setOnboardingStep = stepId => (dispatch, getState) => {
  const state = { ...getCurrentOnboardingState(getState()), progress: stepId };
  Tracking.event({ category: 'onboarding', action: stepId });
  return dispatch(setOnboardingState(state));
};
