// Copyright 2017 Northern.tech AS
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
import { useSelector } from 'react-redux';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { Launch as LaunchIcon } from '@mui/icons-material';
import { ListItemIcon, listItemTextClasses, useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { getDocsVersion, getFeatures } from '../../selectors';
import LeftNav from '../common/left-nav';
import GetStarted from './getting-started';
import Support from './support';

const components = {
  'get-started': {
    title: 'Getting started',
    component: GetStarted
  },
  support: {
    title: 'Contact support',
    component: Support
  },
  documentation: {
    title: 'Documentation',
    url: `https://docs.alvaldi.com/`
  }
};

const contentWidth = 780;

const LinkIcon = () => (
  <ListItemIcon style={{ 'verticalAlign': 'middle' }}>
    <LaunchIcon style={{ 'fontSize': '1rem' }} />
  </ListItemIcon>
);

// build array of link list components
const eachRecursive = (obj, path, level, accu, isHosted, spacing) =>
  Object.entries(obj).reduce((bag, [key, value]) => {
    if (!isHosted && value.hosted) {
      return bag;
    }
    if (typeof value == 'object' && value !== null && key !== 'component') {
      const this_path = `${path}/${key}`;
      bag.push({
        title: value.title,
        level,
        path: this_path,
        hosted: value.hosted,
        style: { paddingLeft: `calc(${level} * ${spacing})` },
        exact: true,
        secondaryAction: value.url ? <LinkIcon /> : null,
        url: value.url ? value.url : ''
      });
      bag = eachRecursive(value, this_path, level + 1, bag, isHosted, spacing);
    }
    return bag;
  }, accu);

export const useHelpStyles = makeStyles()(theme => ({
  container: {
    '.leftFixed': {
      color: theme.palette.text.secondary,
      'li': {
        fontSize: 14,
        fontWeight: 700
      },
      [`.${listItemTextClasses.primary}`]: {
        fontSize: 14,
        marginLeft: 10,
        color: theme.palette.primary.secondary,
        ['&:hover']: {
          color: theme.palette.primary.secondary
        }
      },
      '.active': {
        background: theme.palette.surface.primary,
        fontWeight: 700,
        [`.${listItemTextClasses.primary}`]: {
          fontWeight: 700
        }
      }
    },
    '.rightFluid': {
      paddingTop: 24
    }
  }
}));

const helpPath = 'help/';
export const Help = () => {
  const theme = useTheme();
  const [links, setLinks] = useState([]);
  const { pathname } = useLocation();
  const { section } = useParams();
  const { classes } = useHelpStyles();
  const docsVersion = useSelector(getDocsVersion);
  const { isHosted } = useSelector(getFeatures);

  useEffect(() => {
    // generate sidebar links
    setLinks(eachRecursive(components, '/help', 1, [], isHosted, theme.spacing(2)));
  }, []);

  if (!section) {
    return <Navigate replace to="/help/get-started" />;
  }

  let ComponentToShow = GetStarted;
  let routeParams = pathname.includes(helpPath) ? pathname.substring(pathname.indexOf(helpPath) + helpPath.length) : '';
  if (routeParams) {
    let splitsplat = routeParams.split('/');
    let copyOfComponents = components;

    for (let i = 0; i < splitsplat.length; i++) {
      if (i === splitsplat.length - 1) {
        ComponentToShow = copyOfComponents[splitsplat[i]].component;
      } else {
        copyOfComponents = copyOfComponents[splitsplat[i]];
      }
    }
  }

  return (
    <div className={`help-container ${classes.container}`}>
      <LeftNav sections={[{ itemClass: 'helpNav', items: links, title: 'Help & support' }]} />
      <div style={{ maxWidth: contentWidth }}>
        <div className="help-content relative margin-top-small">
          <ComponentToShow docsVersion={docsVersion} />
        </div>
      </div>
    </div>
  );
};

export default Help;
