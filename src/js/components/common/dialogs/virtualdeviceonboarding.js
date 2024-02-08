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
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setOnboardingApproach } from '../../../actions/onboardingActions';
import { getFeatures, getOrganization } from '../../../selectors';
import CopyCode from '../copy-code';

import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()(theme => ({
  paragraph: {
    letterSpacing: 0.25,
    wordBreak: 'break-all',
    a: {
      color: theme.palette.text.primary,
      fontWeight: 400,
      textDecoration: 'underline'
    }
  },
  copyCode: {
    maxHeight: 221
  }
}));

export const getDemoDeviceCreationCommand = tenantToken =>
  tenantToken
    ? `docker run -it \\\n-e CONNECT_SERVER_URL='https://${window.location.hostname}' \\\n-e CONNECT_TENANT_TOKEN='${tenantToken}' \\\n--pull=always northerntech/nt-connect:latest`
    : './demo --client up';

export const VirtualDeviceOnboarding = () => {
  const dispatch = useDispatch();
  const { isHosted } = useSelector(getFeatures);
  const { tenant_token: tenantToken } = useSelector(getOrganization);
  const { classes } = useStyles();

  useEffect(() => {
    dispatch(setOnboardingApproach('virtual'));
  }, []);

  const codeToCopy = getDemoDeviceCreationCommand(tenantToken);

  return (
    <div>
      {isHosted ? (
        <div>
          <p className={classes.paragraph}>
            1. Get Docker Engine
            <br />
            If you do not have it already, please install Docker on your local machine. For example if you are using Ubuntu follow this tutorial:{' '}
            <a href="https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/" target="_blank" rel="noopener noreferrer">
              https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/
            </a>
          </p>
        </div>
      ) : (
        <div>
          <p className={classes.paragraph}>
            1. Get Docker Engine <br />
            If you do not have it already, please install Docker on your local machine. For example if you are using Ubuntu follow this tutorial:
            https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/
          </p>
          <p>To start a virtual device, change directory into the folder where you cloned Mender integration.</p>
        </div>
      )}
      <p className={classes.paragraph}>2. Copy & paste and run the following command to start the virtual device:</p>
      <CopyCode code={codeToCopy} withDescription={true} className={classes.copyCode} />
      <p>The device should appear in the Pending devices view in a couple of minutes.</p>
    </div>
  );
};

export default VirtualDeviceOnboarding;
