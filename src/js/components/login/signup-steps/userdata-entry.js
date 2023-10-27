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
import { useFormState, useWatch } from 'react-hook-form';

import { Button, Tooltip } from '@mui/material';

import PasswordInput from '../../common/forms/passwordinput';
import TextInput from '../../common/forms/textinput';
import { OAuthHeader } from '../login';
import { LightbulbOutlined as LightbulbOutlinedIcon, InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import { microsoftOAuth2ProviderId } from '../oauth2providers.js';
import { useradmApiUrl } from '../../../constants/userConstants.js';

export const UserDataEntry = ({ classes, onProgressClick, showForm, setShowForm }) => {
  const { isValid } = useFormState();
  const email = useWatch({ name: 'email' });

  const handleKeyPress = ({ key }) => {
    if (key === 'Enter') {
      onProgressClick();
    }
  };

  return (
    <div className={classes.userData} onKeyDown={handleKeyPress}>
      {!showForm ? (
        <div>
          <div className={`flexbox ${classes.onlyEdgeMessage}`}>
            <div>
              <LightbulbOutlinedIcon color="primary" />
            </div>{' '}
            <div className="align-center">
              Alvaldi is currently only available for Azure IoT Edge devices. See our{' '}
              <a rel="noopener noreferrer" target="_blank" href="https://docs.alvaldi.com/reference/faq/#is-alvaldi-only-available-to-azure-users">
                FAQ
              </a>{' '}
              for more information.
            </div>
          </div>
          <h1 className="flexbox centered margin-bottom-xxl">Create your account</h1>
          <OAuthHeader type="Sign up" />
          <div className={`align-center flexbox ${classes.helpFormText}`}>
            <span>
              Signing up with your existing Microsoft account makes it easier for you to upgrade later.{' '}
              <a onClick={() => setShowForm(true)}>Creating an account with username and password</a> is also possible.
            </span>
            <Tooltip
              classes={{ popper: classes.tooltip }}
              arrow
              placement="right"
              title="If you sign up with username and password, you will have to contact us or create a new account when you want to upgrade to a paid plan."
            >
              <InfoOutlinedIcon fontSize="16" />
            </Tooltip>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="flexbox centered">Create a new account</h1>
          <div className={`flexbox margin-bottom-large msSignupText ${classes.helpFormText}`}>
            <InfoOutlinedIcon className="margin-right-sx" fontSize="16" />
            <span>
              For an optimal experience with Alvaldi, we kindly suggest using <a href={`${useradmApiUrl}/oauth2/${microsoftOAuth2ProviderId}`}>Microsoft</a> to
              sign up.
            </span>
          </div>
          <TextInput hint="Email *" label="Email *" id="email" required={true} validations="isLength:1,isEmail" />
          <PasswordInput
            id="password"
            label="Password *"
            validations={`isLength:8,isNot:${email}`}
            create={true}
            generate={false}
            required={true}
            className="margin-bottom-small"
          />
          <PasswordInput id="password_confirmation" label="Confirm password *" validations={`isLength:8,isNot:${email}`} required={true} />
          <Button fullWidth className="margin-top" color="primary" disabled={!isValid} variant="contained" onClick={onProgressClick}>
            Sign up
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserDataEntry;
