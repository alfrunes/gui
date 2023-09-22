'use strict';

// Copyright 2015 Northern.tech AS
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
import { apiUrl } from '../api/general-api';
import { ALL_DEVICES } from './deviceConstants';

export const useradmApiUrlv1 = `${apiUrl.v1}/useradm`;
export const useradmApiUrlv2 = `${apiUrl.v2}/useradm`;
export { useradmApiUrlv1 as useradmApiUrl };

export const SET_USER_LIMIT = 'SET_USER_LIMIT';

const staticRolesByName = {
  readOnly: 'RBAC_ROLE_OBSERVER',
  audit: 'RBAC_ROLE_AUDIT',
  terminalAccess: 'RBAC_ROLE_TERMINAL',
  fileTransferAccess: 'RBAC_ROLE_FILE_TRANSFER',
  admin: 'RBAC_ROLE_PERMIT_ALL'
};

export const PermissionTypes = {
  Any: 'any',
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Delete: 'DELETE',
  Patch: 'PATCH',
  DeviceGroup: 'DEVICE_GROUP',
  DeviceId: 'DEVICE_ID'
};

const permissionSetIds = {
  Basic: 'Basic',
  ConfigureDevices: 'ConfigureDevices',
  ConnectToDevices: 'RemoteTerminal',
  FileTransfer: 'FileTransfer',
  DeployToDevices: 'DeployToDevices',
  ManageDevices: 'ManageDevices',
  ManageUsers: 'ManageUsers',
  ReadAuditLogs: 'ReadAuditLogs',
  ReadDevices: 'ReadDevices',
  ReadUsers: 'ReadUsers',
  SuperUser: 'SuperUser',
  UploadArtifacts: 'UploadArtifacts'
};

export const uiPermissionsById = {
  connect: {
    explanations: { groups: `Troubleshooting access to the devices, requires Read.` },
    permissionLevel: 2,
    permissionSets: { groups: permissionSetIds.ConnectToDevices },
    title: 'Connect',
    value: 'connect',
    verbs: [PermissionTypes.Get, PermissionTypes.Put]
  },
  fileTransfer: {
    explanations: { groups: `Access to transfer files to / from devices, requires Read.` },
    permissionLevel: 2,
    permissionSets: { groups: permissionSetIds.FileTransfer },
    title: 'File transfer',
    value: 'fileTransfer',
    verbs: [PermissionTypes.Get, PermissionTypes.Post]
  },
  manage: {
    explanations: {
      groups: `Allows to edit device name. For 'All devices' it also allows the user to edit and create device groups, requires Read.`
    },
    permissionLevel: 2,
    permissionSets: {
      groups: permissionSetIds.ManageDevices,
      userManagement: permissionSetIds.ManageUsers
    },
    title: 'Manage',
    value: 'manage',
    verbs: [PermissionTypes.Post, PermissionTypes.Put, PermissionTypes.Patch]
  },
  read: {
    explanations: { groups: 'Access to see devices and information about them, but not make changes.' },
    permissionLevel: 1,
    permissionSets: {
      auditlog: permissionSetIds.ReadAuditLogs,
      groups: permissionSetIds.ReadDevices,
      userManagement: permissionSetIds.ReadUsers
    },
    title: 'Read',
    value: 'read',
    verbs: [PermissionTypes.Get, PermissionTypes.Post]
  }
};

export const defaultPermissionSets = {
  [permissionSetIds.Basic]: { name: permissionSetIds.Basic },
  [permissionSetIds.SuperUser]: { name: permissionSetIds.SuperUser },
  [permissionSetIds.ManageUsers]: {
    name: permissionSetIds.ManageUsers,
    result: {
      userManagement: [uiPermissionsById.manage.value]
    }
  },
  [permissionSetIds.ReadAuditLogs]: {
    name: permissionSetIds.ReadAuditLogs,
    result: {
      auditlog: [uiPermissionsById.read.value]
    }
  },
  [permissionSetIds.ReadUsers]: {
    name: permissionSetIds.ReadUsers,
    result: {
      userManagement: [uiPermissionsById.read.value]
    }
  },
  [permissionSetIds.ConnectToDevices]: {
    name: permissionSetIds.ConnectToDevices,
    result: {
      groups: { [ALL_DEVICES]: [uiPermissionsById.connect.value] }
    }
  },
  [permissionSetIds.ManageDevices]: {
    name: permissionSetIds.ManageDevices,
    result: {
      groups: { [ALL_DEVICES]: [uiPermissionsById.manage.value] }
    }
  },
  [permissionSetIds.ReadDevices]: {
    name: permissionSetIds.ReadDevices,
    result: {
      groups: { [ALL_DEVICES]: [uiPermissionsById.read.value] }
    }
  }
};
/**
 * _uiPermissions_ represent the possible permissions/ rights that can be given for the area
 * _endpoints_ represent the possible endpoints this definition might be affecting in the UI and what
 *              functionality might be affected
 *
 */
export const uiPermissionsByArea = {
  auditlog: {
    endpoints: [{ path: /\/(auditlog)/i, types: [PermissionTypes.Get], uiPermissions: [uiPermissionsById.read] }],
    explanation: 'Granting access to the audit log will allow tracing changes to devices and user accounts.',
    uiPermissions: [uiPermissionsById.read],
    title: 'System audit log'
  },
  groups: {
    endpoints: [
      {
        path: /\/(devauth|inventory|deviceconfig|devicemonitor|deviceconnect\/devices)/i,
        types: [PermissionTypes.Get],
        uiPermissions: [uiPermissionsById.read]
      },
      { path: /\/(devauth|inventory)/i, types: [PermissionTypes.Put, PermissionTypes.Post], uiPermissions: [uiPermissionsById.manage] },
      { path: /\/(deviceconfig)/i, types: [PermissionTypes.Get, PermissionTypes.Put, PermissionTypes.Post], uiPermissions: [uiPermissionsById.configure] },
      { path: /\/(deviceconnect\/devices)/i, types: [PermissionTypes.Get, PermissionTypes.Post], uiPermissions: [uiPermissionsById.connect] }
    ],
    explanation: 'Device group management permissions control the degree to which devices in a group can be accessed and moved to other groups.',
    scope: 'DeviceGroups',
    uiPermissions: [uiPermissionsById.read, uiPermissionsById.manage, uiPermissionsById.connect, uiPermissionsById.fileTransfer],
    title: 'Group Management'
  },
  userManagement: {
    endpoints: [
      { path: /\/(useradm)/i, types: [PermissionTypes.Get], uiPermissions: [uiPermissionsById.read] },
      { path: /\/(useradm)/i, types: [PermissionTypes.Post], uiPermissions: [uiPermissionsById.manage] }
    ],
    explanation:
      'User management permissions should be granted carefully, as these allow privilege increases for any users managed by a user with user management permissions',
    uiPermissions: [uiPermissionsById.read, uiPermissionsById.manage],
    title: 'User Management'
  }
};

export const emptyUiPermissions = Object.freeze({
  auditlog: [],
  groups: Object.freeze({}),
  userManagement: []
});

export const emptyRole = Object.freeze({
  name: undefined,
  description: '',
  permissions: [],
  uiPermissions: Object.freeze({ ...emptyUiPermissions })
});

const permissionMapper = permission => permission.value;
export const itemUiPermissionsReducer = (accu, { item, uiPermissions }) => (item ? { ...accu, [item]: uiPermissions } : accu);

const checkSinglePermission = (permission, requiredPermission) =>
  requiredPermission === permission || uiPermissionsById[permission].permissionLevel > uiPermissionsById[requiredPermission].permissionLevel;

export const checkPermissionsObject = (permissions, requiredPermission, scopedAccess, superAccess) =>
  permissions[superAccess]?.some(permission => checkSinglePermission(permission, requiredPermission)) ||
  permissions[scopedAccess]?.some(permission => checkSinglePermission(permission, requiredPermission));

export const rolesById = Object.freeze({
  [staticRolesByName.readOnly]: {
    name: 'Read',
    value: staticRolesByName.readOnly,
    description: 'See information about devices, including groups and inventory.',
    permissions: [],
    uiPermissions: {
      ...emptyUiPermissions,
      groups: { [ALL_DEVICES]: [uiPermissionsById.read.value] },
      userManagement: [uiPermissionsById.read.value]
    }
  },
  [staticRolesByName.audit]: {
    name: 'Audit',
    value: staticRolesByName.audit,
    description: 'Read access to audit logs, including session playback and CSV export. Intended for security / compliance teams.',
    permissions: [], // permissions refers to the values returned from the backend
    uiPermissions: {
      ...emptyUiPermissions,
      auditlog: uiPermissionsByArea.auditlog.uiPermissions.map(permissionMapper),
      groups: { [ALL_DEVICES]: [uiPermissionsById.read.value] },
      userManagement: [uiPermissionsById.read.value]
    }
  },
  [staticRolesByName.terminalAccess]: {
    name: 'Terminal',
    value: staticRolesByName.terminalAccess,
    description: 'Enables use of the terminal. Intended for engineers who need to troubleshoot and make changes to devices by running commands.',
    permissions: [],
    uiPermissions: {
      ...emptyUiPermissions,
      groups: { [ALL_DEVICES]: [uiPermissionsById.connect.value] }
    }
  },
  [staticRolesByName.fileTransferAccess]: {
    name: 'File transfer',
    value: staticRolesByName.terminalAccess,
    description: 'Commonly used together with the Terminal role, enabling file upload / download.',
    permissions: [],
    uiPermissions: {
      ...emptyUiPermissions,
      groups: { [ALL_DEVICES]: [uiPermissionsById.fileTransfer.value] }
    }
  },
  [staticRolesByName.admin]: {
    name: 'Admin',
    value: staticRolesByName.admin,
    description: 'Full administrative access. Allows managing users, integrations and various settings.',
    permissions: [], // permissions refers to the values returned from the backend
    uiPermissions: {
      ...emptyUiPermissions,
      auditlog: uiPermissionsByArea.auditlog.uiPermissions.map(permissionMapper),
      groups: { [ALL_DEVICES]: uiPermissionsByArea.groups.uiPermissions.map(permissionMapper) },
      userManagement: uiPermissionsByArea.userManagement.uiPermissions.map(permissionMapper)
    }
  }
});

export const RECEIVED_QR_CODE = 'RECEIVED_QR_CODE';

export const SUCCESSFULLY_LOGGED_IN = 'SUCCESSFULLY_LOGGED_IN';
export const USER_LOGOUT = 'USER_LOGOUT';
export const RECEIVED_ACTIVATION_CODE = 'RECEIVED_ACTIVATION_CODE';
export const RECEIVED_USER_LIST = 'RECEIVED_USER_LIST';
export const RECEIVED_USER = 'RECEIVED_USER';
export const CREATED_USER = 'CREATED_USER';
export const REMOVED_USER = 'REMOVED_USER';
export const UPDATED_USER = 'UPDATED_USER';

export const RECEIVED_PERMISSION_SETS = 'RECEIVED_PERMISSION_SETS';
export const RECEIVED_ROLES = 'RECEIVED_ROLES';
export const CREATED_ROLE = 'CREATED_ROLE';
export const UPDATED_ROLE = 'UPDATED_ROLE';
export const REMOVED_ROLE = 'REMOVED_ROLE';

export const SET_CUSTOM_COLUMNS = 'SET_CUSTOM_COLUMNS';
export const SET_GLOBAL_SETTINGS = 'SET_GLOBAL_SETTINGS';
export const SET_USER_SETTINGS = 'SET_USER_SETTINGS';
export const SET_SHOW_HELP = 'SET_SHOW_HELP';
export const SET_SHOW_CONNECT_DEVICE = 'SET_SHOW_CONNECT_DEVICE';

export const OWN_USER_ID = 'me';

export const rolesByName = {
  ...staticRolesByName,
  groupAccess: { action: 'VIEW_DEVICE', object: { type: 'DEVICE_GROUP', value: undefined } },
  userManagement: { action: 'http', object: { type: 'any', value: `${useradmApiUrlv1}/.*` } }
};
export const twoFAStates = {
  enabled: 'enabled',
  disabled: 'disabled',
  unverified: 'unverified'
};
export const settingsKeys = { initialized: 'settings-initialized' };
