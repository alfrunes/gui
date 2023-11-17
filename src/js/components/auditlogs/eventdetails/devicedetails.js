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
import { Link } from 'react-router-dom';

import { makeStyles } from 'tss-react/mui';

import { BEGINNING_OF_TIME } from '../../../constants/appConstants';
import { AUDIT_LOGS_TYPES } from '../../../constants/organizationConstants';
import { formatAuditlogs } from '../../../utils/locationutils';
import { TwoColumns } from '../../common/configurationobject';
import DeviceLink from '../../common/device-link.js';
import DeviceIdentityDisplay from '../../common/deviceidentity';

const useStyles = makeStyles()(theme => ({
  eventDetails: { gridTemplateColumns: 'minmax(max-content, 150px) max-content', rowGap: theme.spacing(2.5) }
}));

export const DetailInformation = ({ title, details, titleEnding = 'details', className = '' }) => {
  const { classes } = useStyles();
  return (
    <div key={`${title}-details`} className={`flexbox column detail-information ${className}`}>
      <b className="margin-bottom-small capitalized-start">
        {title} {titleEnding}
      </b>
      <TwoColumns className={classes.eventDetails} items={details} />
    </div>
  );
};

const deviceAuditlogType = AUDIT_LOGS_TYPES.find(type => type.value === 'device');

export const DeviceDetails = ({ device, idAttribute, onClose }) => {
  const { name, os } = device.attributes || {};
  const usesId = !idAttribute || idAttribute === 'id' || idAttribute === 'Device ID';
  const nameContainer = name ? { Name: name } : {};
  const deviceDetails = {
    ...nameContainer,
    [usesId ? 'Device ID' : idAttribute]: (
      <div className={`flexbox center-aligned`}>
        <DeviceIdentityDisplay device={device} isEditable={false} />
        <DeviceLink className="margin-left-xs" id={device.id} />
      </div>
    ),
    'OS': os || '-'
  };

  return (
    <div>
      <DetailInformation title="device" titleEnding="identity" details={deviceDetails} />
      <Link
        className="margin-top-large inline-block"
        to={`/auditlog?${formatAuditlogs({ pageState: { type: deviceAuditlogType, detail: device.id, startDate: BEGINNING_OF_TIME } }, {})}`}
        onClick={onClose}
      >
        List all log entries for this device
      </Link>
    </div>
  );
};

export default DeviceDetails;
