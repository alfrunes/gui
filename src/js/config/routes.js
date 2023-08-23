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
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import AuditLogs from '../components/auditlogs/auditlogs';
import Devices from '../components/devices/device-groups';
import Device from '../components/devices/device.js';
import Help from '../components/help/help';
import Login from '../components/login/login';
import Password from '../components/login/password';
import PasswordReset from '../components/login/passwordreset';
import Signup from '../components/login/signup';
import Settings from '../components/settings/settings';
import { DEVICE_STATES } from '../constants/deviceConstants.js';

export const PrivateRoutes = () => (
  <Routes>
    <Route path="auditlog" element={<AuditLogs />} />
    <Route path="devices" element={null}>
      <Route index element={<Devices />} />
      <Route path=":id" element={<Device />} />
      {Object.values(DEVICE_STATES).map(state => (
        <Route key={state} path={state} element={<Devices />} />
      ))}
    </Route>
    <Route path="devices/:id" element={<Device />} />
    <Route path="settings" element={<Settings />}>
      <Route path=":section" element={null} />
    </Route>
    <Route path="help" element={<Help />}>
      <Route path=":section" element={null} />
    </Route>
    <Route path="*" element={<Devices />} />
  </Routes>
);

export const PublicRoutes = () => (
  <Routes>
    <Route path="password" element={<Password />} />
    <Route path="password/:secretHash" element={<PasswordReset />} />
    <Route path="signup" element={<Signup />}>
      <Route path=":campaign" element={null} />
    </Route>
    <Route path="*" element={<Login />} />
  </Routes>
);
