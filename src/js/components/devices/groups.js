import React from 'react';
import ReactTooltip from 'react-tooltip';

// material ui
import { List, ListItem, ListItemIcon, ListItemText, ListSubheader } from '@material-ui/core';
import { Help as HelpIcon, InfoOutlined as InfoIcon } from '@material-ui/icons';

import { AddGroup } from '../helptips/helptooltips';
import { UNGROUPED_GROUP } from '../../constants/deviceConstants';

const styles = {
  selectedGroup: { backgroundColor: '#e7e7e7' },
  subheader: { color: '#aaaaaa', height: 48 }
};

export const Groups = ({ acceptedCount, changeGroup, groups, openGroupDialog, selectedGroup, showHelptips }) => {
  const { dynamic: dynamicGroups, static: staticGroups, ungrouped } = Object.entries(groups)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .reduce(
      (accu, [groupname, group], index) => {
        const name = groupname === UNGROUPED_GROUP.id ? UNGROUPED_GROUP.name : groupname;
        const groupItem = (
          <ListItem
            classes={{ root: 'grouplist' }}
            button
            key={groupname + index}
            style={name === selectedGroup || groupname === selectedGroup ? styles.selectedGroup : {}}
            onClick={() => changeGroup(name)}
          >
            <ListItemText primary={decodeURIComponent(name)} />
          </ListItem>
        );
        if (group.filters.length > 0) {
          if (groupname !== UNGROUPED_GROUP.id) {
            accu.dynamic.push(groupItem);
          } else {
            accu.ungrouped.push(groupItem);
          }
        } else {
          accu.static.push(groupItem);
        }
        return accu;
      },
      { dynamic: [], static: [], ungrouped: [] }
    );

  return (
    <div>
      <div className="muted margin-bottom-small">Groups</div>
      <List>
        <ListItem classes={{ root: 'grouplist' }} button key="All" style={!selectedGroup ? styles.selectedGroup : {}} onClick={() => changeGroup()}>
          <ListItemText primary="All devices" />
        </ListItem>
        {!!dynamicGroups.length && (
          <ListSubheader classes={{ root: 'heading-lined' }} disableGutters disableSticky key="dynamic-groups-sub" style={styles.subheader}>
            <span>Dynamic</span>
            <div></div>
          </ListSubheader>
        )}
        {dynamicGroups}
        {!!staticGroups.length && (
          <ListSubheader classes={{ root: 'heading-lined' }} disableGutters disableSticky key="static-groups-sub" style={styles.subheader}>
            <span>Static</span>
            <div></div>
          </ListSubheader>
        )}
        {staticGroups}
        {!!staticGroups.length && ungrouped}
        <ListItem button classes={{ root: 'grouplist' }} style={{ marginTop: 30 }} onClick={openGroupDialog}>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary="Create a group" />
        </ListItem>
      </List>

      {showHelptips && acceptedCount && groups.length <= 1 ? (
        <div>
          <div id="onboard-5" className="tooltip help" data-tip data-for="groups-tip" data-event="click focus" style={{ bottom: '-10px' }}>
            <HelpIcon />
          </div>
          <ReactTooltip id="groups-tip" globalEventOff="click" place="bottom" type="light" effect="solid" className="react-tooltip">
            <AddGroup />
          </ReactTooltip>
        </div>
      ) : null}
    </div>
  );
};

export default Groups;
