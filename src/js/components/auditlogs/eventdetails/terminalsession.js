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

import { makeStyles } from 'tss-react/mui';

import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';

import { getDeviceById, getSessionDetails } from '../../../actions/deviceActions';
import { getDeviceById as getDeviceByIdSelector, getIdAttribute, getUserCapabilities } from '../../../selectors';
import Loader from '../../common/loader';
import Time from '../../common/time';
import DeviceDetails, { DetailInformation } from './devicedetails';
import TerminalPlayer from './terminalplayer';

momentDurationFormatSetup(moment);

const useStyles = makeStyles()(theme => ({
  terminalPlayer: {
    maxWidth: 560,
    '>div': {
      borderRadius: 5,
      overflow: 'hidden'
    }
  },
  detailsWrapper: {
    marginLeft: theme.spacing(5),
    minWidth: 'min-content',
    maxWidth: 400
  }
}));

export const TerminalSession = ({ item, onClose }) => {
  const { classes } = useStyles();
  const [sessionDetails, setSessionDetails] = useState();
  const dispatch = useDispatch();
  const { object = {} } = item;
  const { canReadDevices } = useSelector(getUserCapabilities);
  const device = useSelector(state => getDeviceByIdSelector(state, object.id));
  const { attribute: idAttribute } = useSelector(getIdAttribute);

  useEffect(() => {
    const { action, actor, meta, object, time } = item;
    if (canReadDevices && !device) {
      dispatch(getDeviceById(object.id));
    }
    dispatch(
      getSessionDetails(meta.session_id[0], object.id, actor.id, action.startsWith('open') ? time : undefined, action.startsWith('close') ? time : undefined)
    ).then(setSessionDetails);
  }, []);

  if (!sessionDetails || (canReadDevices && !device)) {
    return <Loader show={true} />;
  }

  const sessionMeta = {
    'Session ID': item.meta.session_id[0],
    'Start time': <Time value={sessionDetails.start} />,
    'End time': <Time value={sessionDetails.end} />,
    'Duration': moment.duration(moment(sessionDetails.end).diff(sessionDetails.start)).format('*hh:*mm:ss:SSS'),
    User: item.actor.email
  };

  return (
    <div>
      <div className="flexbox" style={{ flexWrap: 'wrap' }}>
        <div>
          <h2>
            Logged session from <Time value={sessionDetails.start} format="HH:mm" /> to <Time value={sessionDetails.end} format="HH:mm" /> on{' '}
            <Time value={sessionDetails.start} format="MMMM Do YYYY" />
          </h2>
          <TerminalPlayer className={`flexbox column margin-top ${classes.terminalPlayer}`} item={item} sessionInitialized={!!sessionDetails} />
        </div>
        <div className={`flexbox column ${classes.detailsWrapper}`}>
          {canReadDevices && <DeviceDetails device={device} idAttribute={idAttribute} onClose={onClose} />}
          <DetailInformation className="margin-top-xxl" title="session" details={sessionMeta} />
        </div>
      </div>
    </div>
  );
};

export default TerminalSession;
