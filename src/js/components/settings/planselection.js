// Copyright 2021 Northern.tech AS
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

import {
  Check as CheckIcon,
  DeveloperBoard as DeveloperBoardIcon,
  HelpOutline as HelpOutlineIcon,
  InfoOutlined as InfoOutlineIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { PLANS } from '../../constants/appConstants';

export const useStyles = makeStyles()(theme => ({
  planNote: { marginBottom: -11, fontSize: 'smaller' },
  planPanel: {
    '&.planPanel': {
      padding: 0,
      maxWidth: 205,
      marginRight: 18
    },
    borderColor: theme.palette.grey[300],
    '&.trial .title': {
      background: theme.palette.text.inactive
    }
  },
  price: {
    display: 'flex',
    alignItems: 'center',
    'b': {
      fontSize: 18,
      letterSpacing: '0.15px'
    },
    'span': {
      fontSize: 12,
      color: theme.palette.greySecondary[600],
      letterSpacing: '0.5px',
      marginRight: theme.spacing(1)
    }
  },
  title: {
    background: theme.palette.primary.main,
    color: theme.palette.surface.primary,
    textAlign: 'center',
    margin: 0,
    padding: '11px 0px',
    fontSize: 14,
    fontWeight: 700,
    borderRadius: '5px 5px 0px 0px'
  },
  body: {
    padding: '11px 23px 25px 23px'
  },
  icons: {
    color: theme.palette.primary.main,
    fontSize: 16,
    marginRight: 4
  },
  center: {
    margin: '0 auto',
    width: 'fit-content'
  },
  feature: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: 8
  },
  info: {
    display: 'flex',
    alignItems: 'baseline',
    color: theme.palette.grey[900]
  }
}));

export const PlanSelection = ({ currentPlanName = '', isTrial, offerValid, offerTag }) => {
  const { classes } = useStyles();
  return (
    <>
      <h2 className="margin-top-xl margin-bottom">Our plans</h2>
      <div className="margin-bottom-small">Your current plan: {currentPlanName}</div>
      <div className="flexbox" style={{ paddingBottom: 15 }}>
        {Object.values(PLANS)
          .filter(item => isTrial || !item.isTrial)
          .map(item => (
            <div key={item.value} className={`planPanel ${classes.planPanel} ${item.isTrial ? 'trial' : ''}`}>
              <h4 className={`${classes.title} title`}>
                {item.name} {item.offer && isTrial && offerValid ? offerTag : null}
              </h4>
              <div className={classes.body}>
                <div>
                  <div className={`${classes.center} ${classes.price}`}>
                    {!item.isTrial && <span>From</span>} <b className="price">{item.price}</b>
                  </div>
                  <div className={classes.center} style={{ marginTop: 17, marginBottom: 30 }}>
                    <div className="flexbox center-aligned">
                      <PersonIcon className={classes.icons} />
                      {item.usersCount}
                    </div>
                    <div className="margin-top-xs flexbox center-aligned">
                      <DeveloperBoardIcon className={classes.icons} /> {item.deviceCount}
                    </div>
                  </div>
                </div>
                <ul className="unstyled">
                  {item.features.map((item, index) => (
                    <li key={`${item.value}-feature-${index}`}>
                      <div className={classes.feature}>
                        <CheckIcon className={classes.icons} />
                        {item.feature}
                        {item?.explanation && (
                          <Tooltip arrow placement="bottom" title={item.explanation}>
                            <HelpOutlineIcon className="margin-left-small muted" fontSize="16" />
                          </Tooltip>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <div>
                  <b>{item?.additionalFeatures}</b>
                </div>
                {item?.info && (
                  <div className={classes.info}>
                    <InfoOutlineIcon style={{ fontSize: 16, marginRight: 4 }} />
                    {item.info}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default PlanSelection;
