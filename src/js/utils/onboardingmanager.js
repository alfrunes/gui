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
import React from 'react';

import BaseOnboardingTip from '../components/helptips/baseonboardingtip';
import {
  DashboardOnboardingState,
  DevicesAcceptedOnboarding,
  OnboardingStart,
  DeviceAuthOnboarding,
  DeviceInventoryOnboarding,
  DeviceTerminalOnboarding,
  DeviceFilesTransferringOnboarding
} from '../components/helptips/onboardingtips';
import { onboardingSteps as stepNames } from '../constants/onboardingConstants';

export const onboardingSteps = {
  [stepNames.ONBOARDING_START]: {
    condition: { min: stepNames.ONBOARDING_START },
    component: OnboardingStart
  },
  [stepNames.DEVICES_PENDING_ONBOARDING]: {
    condition: { min: stepNames.ONBOARDING_START },
    component: DashboardOnboardingState,
    dismissText: 'Dismiss the tutorial'
  },
  [stepNames.DEVICES_ACCEPTED_ONBOARDING]: {
    condition: { min: stepNames.ONBOARDING_START },
    component: DevicesAcceptedOnboarding
  },
  [stepNames.DEVICE_AUTH]: {
    condition: { min: stepNames.DEVICES_ACCEPTED_ONBOARDING },
    component: DeviceAuthOnboarding,
    progress: 1
  },
  [stepNames.DEVICE_INVENTORY]: {
    condition: { min: stepNames.DEVICE_AUTH },
    component: DeviceInventoryOnboarding,
    progress: 2
  },
  [stepNames.DEVICE_TERMINAL]: {
    condition: { min: stepNames.DEVICE_INVENTORY },
    component: DeviceTerminalOnboarding,
    progress: 3
  },
  [stepNames.DEVICE_FILES_TRANSFERRING]: {
    condition: { min: stepNames.DEVICE_TERMINAL },
    component: DeviceFilesTransferringOnboarding,
    progress: 4
  },
  [stepNames.ONBOARDING_FINISHED]: {
    condition: {},
    specialComponent: <div />
  }
};

const getOnboardingStepCompleted = (id, progress, complete, showHelptips) => {
  const keys = Object.keys(onboardingSteps);
  const {
    min = id,
    max = id,
    extra
  } = Object.entries(onboardingSteps).reduce((accu, [key, value]) => {
    if (key === id) {
      return value.condition;
    }
    return accu;
  }, {});
  const progressIndex = keys.findIndex(step => step === progress);
  return (
    id === progress &&
    !complete &&
    showHelptips &&
    progressIndex >= keys.findIndex(step => step === min) &&
    progressIndex <= keys.findIndex(step => step === max) &&
    (extra ? extra() : true)
  );
};

export const getOnboardingComponentFor = (id, componentProps, params = {}, previousComponent = null, actionButton = null) => {
  const step = onboardingSteps[id];
  if (!step) {
    return null;
  }
  const isValid = getOnboardingStepCompleted(id, componentProps.progress, componentProps.complete, componentProps.showHelptips);
  if (!isValid) {
    return previousComponent;
  }
  if (step.specialComponent) {
    return React.cloneElement(step.specialComponent, params);
  }
  const component = step.component(componentProps);
  return (
    <BaseOnboardingTip
      id={id}
      component={component}
      progress={step.progress || params.progress || null}
      actionButton={actionButton}
      dismissText={step?.dismissText}
      {...params}
    />
  );
};

export const applyOnboardingFallbacks = progress => {
  const step = onboardingSteps[progress];
  if (step && step.fallbackStep) {
    return step.fallbackStep;
  }
  return progress;
};
