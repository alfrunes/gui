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
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { Button, Divider, TextField } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { changeIntegration, createIntegration, deleteIntegration, getIntegrations } from '../../actions/organizationActions';
import { TIMEOUTS } from '../../constants/appConstants';
import { EXTERNAL_PROVIDER } from '../../constants/deviceConstants';
import { getExternalIntegrations, getIsPreview } from '../../selectors';
import { useDebounce } from '../../utils/debouncehook';
import Confirm from '../common/confirm';
import InfoHint from '../common/info-hint';
import { IntegrationEnabled } from '../common/set-up-guide.js';

const maxWidth = 750;
const newId = 'new';

const useStyles = makeStyles()(theme => ({
  leftButton: { marginRight: theme.spacing() },
  inputWrapper: { alignItems: 'flex-end' },
  select: { marginTop: theme.spacing(2), minWidth: 300 },
  textInput: { margin: theme.spacing(), minWidth: 500, wordBreak: 'break-all' },
  widthLimit: { maxWidth }
}));

const ConnectionDetailsInput = ({ connectionConfig, isEditing, setConnectionConfig }) => {
  const { access_key_id = '', secret_access_key = '', region = '', device_policy_name = '' } = connectionConfig.aws || {};
  const [keyId, setKeyId] = useState(access_key_id);
  const [keySecret, setKeySecret] = useState(secret_access_key);
  const [awsRegion, setRegion] = useState(region);
  const [policy, setPolicy] = useState(device_policy_name);

  const debouncedId = useDebounce(keyId, TIMEOUTS.debounceDefault);
  const debouncedSecret = useDebounce(keySecret, TIMEOUTS.debounceDefault);
  const debouncedRegion = useDebounce(awsRegion, TIMEOUTS.debounceDefault);
  const debounced = useDebounce(policy, TIMEOUTS.debounceDefault);

  const { classes } = useStyles();

  useEffect(() => {
    setConnectionConfig({
      aws: {
        access_key_id: debouncedId,
        secret_access_key: debouncedSecret,
        region: debouncedRegion,
        device_policy_name: debounced
      }
    });
  }, [debounced, debouncedRegion, debouncedId, debouncedSecret]);

  useEffect(() => {
    setKeyId(access_key_id);
    setKeySecret(secret_access_key);
    setRegion(region);
    setPolicy(device_policy_name);
  }, [access_key_id, secret_access_key, region, device_policy_name]);

  const onKeyChange = ({ target: { value = '' } }) => setKeyId(value);
  const onSecretChange = ({ target: { value = '' } }) => setKeySecret(value);
  const onRegionChange = ({ target: { value = '' } }) => setRegion(value);
  const onPolicyChange = ({ target: { value = '' } }) => setPolicy(value);

  const commonProps = { className: classes.textInput, disabled: !isEditing, multiline: true };
  return (
    <div className="flexbox column">
      <TextField {...commonProps} label="Key ID" onChange={onKeyChange} value={keyId} />
      <TextField {...commonProps} label="Key Secret" onChange={onSecretChange} value={keySecret} />
      <TextField {...commonProps} label="Region" onChange={onRegionChange} value={awsRegion} />
      <TextField {...commonProps} label="Device Policy Name" onChange={onPolicyChange} value={policy} />
    </div>
  );
};

const ConnectionStringInput = ({ connectionConfig, isEditing, setConnectionConfig, title }) => {
  const [value, setValue] = useState(connectionConfig.connection_string);
  const debouncedValue = useDebounce(value, TIMEOUTS.debounceDefault);

  const { classes } = useStyles();

  useEffect(() => {
    setConnectionConfig({ connection_string: debouncedValue || '' });
  }, [debouncedValue]);

  useEffect(() => {
    setValue(connectionConfig.connection_string);
  }, [connectionConfig.connection_string]);

  const updateConnectionConfig = ({ target: { value = '' } }) => setValue(value);

  return (
    <TextField
      className={classes.textInput}
      disabled={!isEditing}
      label={`${title} connection string`}
      multiline
      onChange={updateConnectionConfig}
      value={value}
    />
  );
};

const providerConfigMap = {
  'iot-core': ConnectionDetailsInput,
  'iot-hub': ConnectionStringInput
};

export const IntegrationConfiguration = ({ integration, isLast, onCancel, onDelete, onSave }) => {
  const [showIntegrationEnabledDialog, setShowIntegrationEnabledDialog] = useState(false);
  const { credentials = {}, provider } = integration;
  const [connectionConfig, setConnectionConfig] = useState(credentials);
  // eslint-disable-next-line no-unused-vars
  const { type, ...otherProps } = credentials;
  const [isEditing, setIsEditing] = useState(!Object.values(otherProps).some(i => i));
  const [isDeleting, setIsDeleting] = useState(false);

  const { classes } = useStyles();

  useEffect(() => {
    const { credentials = {} } = integration;
    // eslint-disable-next-line no-unused-vars
    const { type, ...otherProps } = credentials;
    setConnectionConfig(credentials);
    setIsEditing(!Object.values(otherProps).some(i => i));
  }, [integration]);

  const onCancelClick = () => {
    setIsEditing(false);
    setConnectionConfig(credentials);
    onCancel(integration);
  };
  const onDeleteClick = () => setIsDeleting(true);
  const onDeleteConfirm = () => {
    onDelete(integration);
    setIsDeleting(false);
  };
  const onEditClick = () => setIsEditing(true);
  const onSaveClick = () => {
    onSave({
      ...integration,
      credentials: {
        type: EXTERNAL_PROVIDER[provider].credentialsType,
        ...connectionConfig
      }
    }).then(() => setShowIntegrationEnabledDialog(integration.id === newId));
  };

  const ConfigInput = providerConfigMap[provider];
  const { configHint, title } = EXTERNAL_PROVIDER[provider];
  return (
    <>
      <h3 className="margin-bottom-none">{title}</h3>
      <div className={`flexbox space-between relative ${classes.widthLimit} ${classes.inputWrapper}`}>
        <ConfigInput connectionConfig={connectionConfig} isEditing={isEditing} setConnectionConfig={setConnectionConfig} title={title} />
        <div className="flexbox">
          {isEditing ? (
            <>
              <Button className={classes.leftButton} onClick={onCancelClick}>
                Cancel
              </Button>
              <Button variant="contained" onClick={onSaveClick} disabled={credentials === connectionConfig}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Button className={classes.leftButton} onClick={onEditClick}>
                Edit
              </Button>
              <Button onClick={onDeleteClick}>Delete</Button>
            </>
          )}
        </div>
        {isDeleting && <Confirm type="integrationRemoval" classes="confirmation-overlay" action={onDeleteConfirm} cancel={() => setIsDeleting(false)} />}
      </div>
      <InfoHint className={`margin-bottom ${classes.widthLimit}`} content={configHint} />
      {!isLast && <Divider className={`margin-bottom ${classes.widthLimit}`} />}
      {showIntegrationEnabledDialog && <IntegrationEnabled />}
    </>
  );
};

export const Integrations = () => {
  const [iotHubIntegration, setIotHubIntegration] = useState({ ...EXTERNAL_PROVIDER['iot-hub'], id: newId });
  const integrations = useSelector(getExternalIntegrations) ?? [];
  const isPreRelease = useSelector(getIsPreview);
  const dispatch = useDispatch();

  useEffect(() => {
    setIotHubIntegration(
      integrations.find(integration => integration.provider === EXTERNAL_PROVIDER['iot-hub'].provider) || { ...EXTERNAL_PROVIDER['iot-hub'], id: newId }
    );
  }, [integrations, isPreRelease]);

  useEffect(() => {
    dispatch(getIntegrations());
  }, []);

  const onSaveClick = integration => {
    if (integration.id === newId) {
      return dispatch(createIntegration(integration));
    }
    dispatch(changeIntegration(integration));
  };
  return (
    <div>
      <h2 className="margin-top-small">Integrations</h2>
      <div className="margin-top">
        Enabling the integration with Azure IoT Hub allows Alvaldi to synchronize device information. This does not automatically install the Alvaldi client on
        your devices. For more information about how to set up Alvaldi, read our <Link to="/help/get-started">getting started guide</Link>.
      </div>

      <IntegrationConfiguration
        key={iotHubIntegration.provider}
        integration={iotHubIntegration}
        isLast={true}
        onDelete={integration => dispatch(deleteIntegration(integration))}
        onSave={onSaveClick}
      />
    </div>
  );
};

export default Integrations;
