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
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';

import { formControlClasses } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import Cookies from 'universal-cookie';

import LoginLogo from '../../../assets/img/alvaldi-logo.svg';
import SignupHero from '../../../assets/img/signuphero.svg';
import { setSnackbar } from '../../actions/appActions';
import { createOrganization } from '../../actions/organizationActions';
import { TIMEOUTS, locations } from '../../constants/appConstants';
import { stringToBoolean } from '../../helpers';
import Form from '../common/forms/form';
import Loader from '../common/loader';
import { EntryLink } from './login';
import OrgDataEntry from './signup-steps/orgdata-entry';
import UserDataEntry from './signup-steps/userdata-entry';

const cookies = new Cookies();
const useStyles = makeStyles()(theme => ({
  background: {
    width: '100%',
    marginTop: -(50 + 45),
    height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px)`,
    [`.${formControlClasses.root}`]: {
      marginTop: 0,
      marginBottom: theme.spacing(2)
    },
    '> div': {
      display: 'grid',
      gridTemplateColumns: 'minmax(465px, 500px)',
      placeContent: 'center'
    }
  },
  locationSelect: { minWidth: 150, alignSelf: 'flex-start' },
  locationIcon: { marginLeft: theme.spacing(1.5), transform: 'scale(0.75)' },
  userData: {
    display: 'grid',
    justifyContent: 'center',
    alignContent: 'center',
    '> button': { justifySelf: 'flex-start' }
  },
  orgData: { display: 'grid', placeContent: 'center', gridTemplateColumns: 'min-content' },
  promo: {
    background: theme.palette.green[100],
    gridTemplateRows: 'min-content min-content min-content',
    padding: '80px 0'
  },
  logo: { marginLeft: '5vw', marginTop: 45, zIndex: 1, display: 'block', svg: { maxHeight: 50 } },
  svgContainer: {
    width: 'fit-content',
    margin: '45px auto'
  },
  helpFormText: {
    color: theme.palette.text.inactive,
    fontWeight: 500,
    a: {
      color: 'inherit',
      textDecoration: 'underline',
      fontWeight: 'inherit',
      '&:hover': {
        color: theme.palette.text.primary
      }
    },
    svg: {
      marginBottom: 3,
      alignSelf: 'flex-end'
    },
    '&.msSignupText': {
      maxWidth: 465,
      a: {
        color: theme.palette.blue[700]
      },
      svg: {
        alignSelf: 'initial',
        marginTop: 4
      }
    }
  },
  tooltip: {
    maxWidth: 175,
    color: 'red'
  },
  onlyEdgeMessage: {
    background: theme.palette.green[50],
    color: theme.palette.text.inactive,
    padding: '16px 51px',
    marginBottom: 58,
    a: {
      color: theme.palette.text.inactive,
      textDecoration: 'underline',
      fontWeight: 'normal'
    }
  }
}));
const TRIAL_SUBSCRIPTION_TYPE = 'trial';
const AZURE_SUBSCRIPTION_TYPE = 'azure';

export const Signup = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState(undefined);
  const [oauthId, setOauthId] = useState(undefined);
  const [marketing, setMarketing] = useState(false);
  const [organization, setOrganization] = useState('');
  const [tos, setTos] = useState(false);
  const [redirectOnLogin, setRedirectOnLogin] = useState(false);
  const [captchaTimestamp, setCaptchaTimestamp] = useState(0);
  const [recaptcha, setRecaptcha] = useState('');
  const [location, setLocation] = useState(locations.us.key);
  const { campaign = '' } = useParams();
  const currentUserId = useSelector(state => state.users.currentUserId);
  const recaptchaSiteKey = useSelector(state => state.app.recaptchaSiteKey);
  const dispatch = useDispatch();
  const { classes } = useStyles();
  const [subscriptionToken, setSubscriptionToken] = useState(null);
  const [subscriptionType, setSubscriptionType] = useState(TRIAL_SUBSCRIPTION_TYPE);
  const [showForm, setShowForm] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatchedSetSnackbar = message => dispatch(setSnackbar(message));

  useEffect(() => {
    /**
     * When Azure Marketplace redirects to the landing page, it sets a query parameter token, if present this token is
     * passed as the subscription_token parameter in the request and the subscription_type needs to be set to as azure.
     */
    if (searchParams.has('token')) {
      setSubscriptionToken(searchParams.get('token'));
      setSubscriptionType(AZURE_SUBSCRIPTION_TYPE);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const usedOauthProvider = cookies.get('oauth');
    if (usedOauthProvider) {
      setOauthProvider(usedOauthProvider);
      setOauthId(cookies.get('externalID'));
      setEmail(cookies.get('email'));
      setEmailVerified(stringToBoolean(cookies.get('emailVerified')));
      setStep(2);
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      dispatchedSetSnackbar('');
      setRedirectOnLogin(true);
    }
  }, [currentUserId]);

  const handleSignup = formData => {
    if (recaptchaSiteKey !== '' && recaptcha === '') {
      return setSnackbar('Please complete the reCAPTCHA test before proceeding!', TIMEOUTS.fiveSeconds, '');
    }
    setLoading(true);
    const { name, marketing, password, ...remainder } = formData;
    const actualEmail = formData.email != null ? formData.email : email;
    const credentials = oauthProvider ? { email: actualEmail, login: { [oauthProvider]: oauthId } } : { email: actualEmail, password };
    let signup = {
      ...remainder,
      ...credentials,
      'g-recaptcha-response': recaptcha || 'empty',
      campaign,
      emailVerified,
      location,
      marketing: marketing == 'true',
      organization: name,
      plan: 'enterprise',
      ts: captchaTimestamp,
      subscription_type: subscriptionType,
      subscription_token: subscriptionToken ? subscriptionToken : undefined
    };

    if (subscriptionToken !== null) {
      signup.subscription_token = subscriptionToken;
    }

    return dispatch(createOrganization(signup)).catch(() => {
      setStep(1);
      setOrganization(formData.name);
      setEmail(formData.email);
      setTos(formData.tos);
      setMarketing(formData.marketing);
      setLoading(false);
    });
  };

  const onProgressClick = () => {
    setEmailVerified(true);
    setStep(2);
  };

  if (redirectOnLogin) {
    return <Navigate to="/" replace />;
  }

  const steps = {
    1: <UserDataEntry classes={classes} onProgressClick={onProgressClick} showForm={showForm} setShowForm={setShowForm} />,
    2: (
      <OrgDataEntry
        classes={classes}
        emailVerified={emailVerified}
        location={location}
        recaptchaSiteKey={recaptchaSiteKey}
        setCaptchaTimestamp={setCaptchaTimestamp}
        setLocation={setLocation}
        setRecaptcha={setRecaptcha}
      />
    )
  };
  const isStarting = step === 1;
  return (
    <>
      <Link className={classes.logo} to="https://alvaldi.com/">
        <LoginLogo />
      </Link>
      <div className={`${classes.background} ${isStarting && !showForm ? 'two-columns' : classes.orgData}`} id="signup-box">
        <div>
          <Form
            buttonColor="primary"
            defaultValues={{ email: '', tos: false, marketing: false, name: '', captcha: '' }}
            initialValues={{ email, tos, marketing, name: organization, captcha: '' }}
            onSubmit={handleSignup}
            showButtons={!(isStarting || loading)}
            submitLabel={isStarting ? 'Sign up' : 'Complete signup'}
            submitButtonFullWidth={true}
          >
            {loading ? <Loader show style={{ marginTop: '40vh' }} /> : steps[step]}
          </Form>
          {!loading && <EntryLink target="login" />}
        </div>
        {isStarting && !showForm && (
          <div className={classes.promo}>
            <h2>Connect up to 10 devices with 2 user accounts free for 6 months.</h2>
            <p>
              Alvaldi provides a secure way to remotely access and efficiently troubleshoot issues on your devices. Whether they are in customer&#39;s homes,
              factories, or geographically remote locations, you have a tested way of resolving issues.
            </p>
            <div className={classes.svgContainer}>
              <SignupHero />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Signup;
