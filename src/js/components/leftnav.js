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
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink } from 'react-router-dom';

import { ListAlt as AuditLogIcon, DeveloperBoard as DeveloperBoardIcon, OpenInNew as OpenInNewIcon, Settings as SettingsIcon } from '@mui/icons-material';
// material ui
import { List, ListItem, ListItemText } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import copy from 'copy-to-clipboard';

import AlvaldiLogo from '../../assets/img/alvaldi-logo.svg';
import { setSnackbar } from '../actions/appActions';
import { FEEDBACK_LINK_DATA } from '../constants/appConstants';
import { onboardingSteps } from '../constants/onboardingConstants';
import { getCurrentUser, getOnboardingState, getTenantCapabilities, getUserCapabilities, getVersionInformation } from '../selectors';
import { getOnboardingComponentFor } from '../utils/onboardingmanager';

const listItems = [
  {
    route: '/devices',
    text: 'Devices',
    canAccess: ({ userCapabilities: { canReadDevices } }) => canReadDevices,
    icon: <DeveloperBoardIcon />
  },
  {
    route: '/auditlog',
    text: 'Audit log',
    canAccess: ({ userCapabilities: { canAuditlog } }) => canAuditlog,
    icon: <AuditLogIcon />
  },
  {
    route: '/settings',
    text: 'Settings',
    // as long as settings is not the part of RBAC and everyone can access it we set canAccess to true by default
    canAccess: () => true,
    icon: <SettingsIcon />
  }
];

const VersionInfo = () => {
  const timer = useRef();

  const dispatch = useDispatch();
  const { AlvaldiVersion = '' } = useSelector(getVersionInformation);

  useEffect(() => {
    return () => {
      clearTimeout(timer.current);
    };
  }, []);

  const onVersionClick = () => {
    copy(AlvaldiVersion);
    dispatch(setSnackbar('Version information copied to clipboard'));
  };

  return (
    <div className="clickable" onClick={onVersionClick}>
      Version: {AlvaldiVersion}
    </div>
  );
};

const useStyles = makeStyles()(theme => ({
  feedbackLink: {
    color: `${theme.palette.primary.main}`
  },
  feedbackIcon: {
    fontSize: 20,
    marginLeft: 4
  }
}));

const FeedbackLink = () => {
  const { email } = useSelector(getCurrentUser);
  const { classes } = useStyles();

  return (
    <a
      className={`${classes.feedbackLink} flexbox center-aligned padding-none`}
      target="_blank"
      rel="noreferrer"
      href={encodeURI(`mailto:${FEEDBACK_LINK_DATA.mailTo}?subject=${FEEDBACK_LINK_DATA.subject}&body=${FEEDBACK_LINK_DATA.body(email)}`)}
    >
      Feedback <OpenInNewIcon color="primary" className={classes.feedbackIcon} />
    </a>
  );
};

export const LeftNav = () => {
  const releasesRef = useRef();

  const onboardingState = useSelector(getOnboardingState);
  const tenantCapabilities = useSelector(getTenantCapabilities);
  const userCapabilities = useSelector(getUserCapabilities);

  let onboardingComponent;
  if (releasesRef.current) {
    onboardingComponent = getOnboardingComponentFor(onboardingSteps.APPLICATION_UPDATE_REMINDER_TIP, onboardingState, {
      anchor: {
        left: releasesRef.current.offsetWidth - 48,
        top: releasesRef.current.offsetTop + releasesRef.current.offsetHeight / 2
      },
      place: 'right'
    });
  }
  return (
    <div className={`leftFixed leftNav`}>
      <Link id="logo" to="/">
        <AlvaldiLogo alt="Alvaldi logo" />
      </Link>
      <List className={'leftNav-main'} style={{ padding: 0 }}>
        {listItems.reduce((accu, item, index) => {
          if (!item.canAccess({ tenantCapabilities, userCapabilities })) {
            return accu;
          }
          accu.push(
            <ListItem
              className={`navLink leftNav`}
              component={NavLink}
              end={item.route === '/'}
              key={index}
              ref={item.route === '/releases' ? releasesRef : null}
              to={item.route}
            >
              {item.icon}
              <ListItemText primary={item.text} />
            </ListItem>
          );
          return accu;
        }, [])}
      </List>
      {onboardingComponent ? onboardingComponent : null}
      <List className="leftNav-bottom">
        <ListItem className={`navLink leftNav`} component={Link} to="/help">
          <ListItemText primary="Help & support" />
        </ListItem>
        <ListItem>
          <ListItemText primary={<VersionInfo />} />
        </ListItem>
        <FeedbackLink />
      </List>
    </div>
  );
};

export default LeftNav;
