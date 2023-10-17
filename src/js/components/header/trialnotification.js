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
import React from 'react';
import { Link } from 'react-router-dom';

import { makeStyles } from 'tss-react/mui';

import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import pluralize from 'pluralize';

import { MenderTooltipClickable } from '../common/mendertooltip';

momentDurationFormatSetup(moment);

const today = new Date();

const useStyles = makeStyles()(theme => ({
  trialChip: {
    color: theme.palette.green[800],
    background: theme.palette.green[200],
    fontSize: '12px',
    lineHeight: '16px',
    padding: '4px 6px',
    borderRadius: 2
  }
}));

const TrialInformation = () => (
  <>
    <h3>Free trial</h3>
    <p>You&apos;re using the trial version of Alvaldi – it&apos;s free for up to 10 devices for 6 months.</p>
    <p>
      <Link to="/settings/upgrade">Upgrade to a plan</Link> to add more devices and continue using Alvaldi after the trial expires.
    </p>
    <p>
      Or compare the plans at{' '}
      <a href={`https://alvaldi.com/pricing`} target="_blank" rel="noopener noreferrer">
        alvaldi.com/pricing
      </a>
    </p>
  </>
);

const TrialNotification = ({ sectionClassName, expiration }) => {
  const expirationDate = moment().add(59, 'days');
  const duration = moment.duration(expirationDate.diff(moment(today)));
  const daysLeft = Math.floor(duration.asDays());
  const { classes } = useStyles();
  return (
    <div className={`flexbox centered ${sectionClassName}`}>
      <MenderTooltipClickable
        className={`flexbox center-aligned margin-right-small ${classes.trialChip}`}
        disableHoverListener={false}
        title={<TrialInformation />}
      >
        <>
          Free trial{' '}
          {expiration && daysLeft < 60 && daysLeft >= 0 && (
            <span>
              : {daysLeft} {pluralize('day', daysLeft)} left
            </span>
          )}
        </>
      </MenderTooltipClickable>
    </div>
  );
};

export default TrialNotification;
