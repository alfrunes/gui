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
import ReCAPTCHA from 'react-google-recaptcha';

import FormCheckbox from '../../common/forms/formcheckbox';
import TextInput from '../../common/forms/textinput';

export const OrgDataEntry = ({ emailVerified, recaptchaSiteKey = '', setCaptchaTimestamp, setRecaptcha }) => {
  const handleCaptchaChange = value => {
    setCaptchaTimestamp(new Date().getTime());
    setRecaptcha(value);
  };

  return (
    <div>
      <h1 className="flexbox centered">Setting up your Account</h1>
      <h2 className="flexbox align-center margin-bottom-large">To finish creating your account, please fill in a few details</h2>
      <TextInput hint="Company or organization name *" label="Company or organization name *" id="name" required validations="isLength:1" />
      {!emailVerified && <TextInput hint="Email *" label="Email *" id="email" required validations="isLength:1,isEmail" />}
      <FormCheckbox
        id="tos"
        label={
          <label htmlFor="tos">
            By checking this you agree to our{' '}
            <a href="https://northern.tech/legal/hosted-mender-agreement-10_10_2022-northern-tech-as.pdf" target="_blank" rel="noopener noreferrer">
              Terms of service
            </a>{' '}
            and <br />
            <a href="https://northern.tech/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>{' '}
            *
          </label>
        }
        required={true}
      />
      <FormCheckbox
        id="marketing"
        label="By checking this you agree that we can send you occasional email updates about Alvaldi. You can unsubscribe from these emails at any time"
      />
      {recaptchaSiteKey && (
        <div className="margin-top">
          <ReCAPTCHA sitekey={recaptchaSiteKey} onChange={handleCaptchaChange} />
        </div>
      )}
    </div>
  );
};

export default OrgDataEntry;
