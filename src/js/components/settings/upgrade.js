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
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { InfoOutlined as InfoOutlinedIcon, LocalOffer as LocalOfferIcon } from '@mui/icons-material';

import moment from 'moment';

import { getUserOrganization } from '../../actions/organizationActions';
import { getCurrentPlanName, getOrganization } from '../../selectors';
import InfoText from '../common/infotext';
import Loader from '../common/loader';
import PlanSelection from './planselection';

const offerTag = (
  <span className="offerTag">
    <LocalOfferIcon /> End of year offer
  </span>
);

export const PostUpgradeNote = ({ newPlan }) => (
  <div style={{ maxWidth: 750 }} className="margin-top-small">
    <h2 style={{ marginTop: 15 }}>Upgrade now</h2>
    <div>
      <p>
        <b>Your upgrade was successful! </b>You are now signed up to the <b>{newPlan}</b> plan.
      </p>
      <p>Redirecting you to your organization page...</p>
      <Loader show={true} />
    </div>
  </div>
);

export const PricingContactNote = () => (
  <InfoText>
    <InfoOutlinedIcon style={{ fontSize: '14px', margin: '0 4px 4px 0', verticalAlign: 'middle' }} />
    If you have any questions about the plan pricing or device limits,{' '}
    <a href="mailto:contact@mender.io" target="_blank" rel="noopener noreferrer">
      contact our team
    </a>
    .
  </InfoText>
);

export const Upgrade = () => {
  const offerValid = moment().isBefore('2021-01-01');
  const [updatedPlan, setUpdatedPlan] = useState('os');
  const dispatch = useDispatch();
  const org = useSelector(getOrganization);
  const currentPlanName = useSelector(getCurrentPlanName);

  useEffect(() => {
    dispatch(getUserOrganization());
  }, []);

  const { trial: isTrial = true } = org;
  return (
    <div style={{ maxWidth: 750 }} className="margin-top-small">
      <h2 style={{ marginTop: 15 }}>Upgrade now</h2>
      <p>
        To get access to support, continue using Alvaldi, and add more users or devices, upgrade to one of our paid plans. Learn more about the different plans
        at{' '}
        <a href="https://alvaldi.com/pricing" target="_blank" rel="noopener noreferrer">
          alvaldi.com/pricing
        </a>
        . Prices change according to the number of users and devices, please see our{' '}
        <a href="https://alvaldi.com/pricing#calculator" target="_blank" rel="noopener noreferrer">
          price calculator
        </a>{' '}
        for more information.
      </p>
      <PlanSelection
        currentPlanName={currentPlanName}
        isTrial={isTrial}
        offerValid={offerValid}
        offerTag={offerTag}
        setUpdatedPlan={setUpdatedPlan}
        updatedPlan={updatedPlan}
      />
      <div className="margin-top">
        <span>Want to change your plan or simply have questions?</span>{' '}
        <a className="margin-left-xs" href="https://alvaldi.com/contact" target="_blank" rel="noopener noreferrer">
          Contact us
        </a>
      </div>
    </div>
  );
};

export default Upgrade;
