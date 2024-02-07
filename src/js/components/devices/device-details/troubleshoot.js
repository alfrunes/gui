// Copyright 2023 Northern.tech AS
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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Dropzone from 'react-dropzone';
import { useDispatch, useSelector } from 'react-redux';

import { ExpandMore as ExpandIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, Button, Divider } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import { mdiConsole as ConsoleIcon } from '@mdi/js';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';

import { setSnackbar } from '../../../actions/appActions';
import { deviceFileUpload, getDeviceFileDownloadLink } from '../../../actions/deviceActions';
import { TIMEOUTS } from '../../../constants/appConstants';
import { createDownload } from '../../../helpers';
import { getOnboardingState, getUserCapabilities } from '../../../selectors';
import { useSession } from '../../../utils/sockethook';
import { TwoColumns } from '../../common/configurationobject';
import MaterialDesignIcon from '../../common/materialdesignicon.js';
import { MaybeTime } from '../../common/time';
import FileTransfer from '../troubleshoot/filetransfer';
import Terminal from '../troubleshoot/terminal';
import { getOnboardingComponentFor } from '../../../utils/onboardingmanager.js';
import { onboardingSteps } from '../../../constants/onboardingConstants.js';
import { advanceOnboarding } from '../../../actions/onboardingActions.js';

momentDurationFormatSetup(moment);

const useStyles = makeStyles()(theme => ({
  title: { marginRight: theme.spacing(0.5) },
  connectionButton: { background: theme.palette.terminal.backgroundInactive, borderRadius: 5 },
  connectedIcon: { color: theme.palette.success.main, marginLeft: theme.spacing(), fontSize: 18 },
  disconnectedIcon: { color: theme.palette.error.main, marginLeft: theme.spacing(), fontSize: 18 },
  sessionInfo: { maxWidth: 'max-content' },
  terminalContent: {
    minHeight: '480px',
    display: 'grid',
    gridTemplateRows: 'max-content 0',
    flexGrow: 1,
    '&.device-connected': {
      gridTemplateRows: 'max-content minmax(min-content, 1fr)'
    }
  },
  terminalStatePlaceholder: {
    width: 280
  }
}));

export const Troubleshoot = ({ device }) => {
  const [downloadPath, setDownloadPath] = useState('');
  const [elapsed, setElapsed] = useState(moment());
  const [file, setFile] = useState();
  const [socketInitialized, setSocketInitialized] = useState(undefined);
  const [startTime, setStartTime] = useState();
  const [uploadPath, setUploadPath] = useState('');
  const [snackbarAlreadySet, setSnackbarAlreadySet] = useState(false);
  const snackTimer = useRef();
  const timer = useRef();
  const termRef = useRef({ terminal: React.createRef(), terminalRef: React.createRef() });
  const { classes } = useStyles();
  const userCapabilities = useSelector(getUserCapabilities);
  const { canTroubleshoot, canTransferFiles } = userCapabilities;
  const dispatch = useDispatch();
  const dispatchedSetSnackbar = (...args) => dispatch(setSnackbar(...args));

  const connectTerminalButtonRef = useRef();
  const filesTransferRef = useRef();

  useEffect(() => {
    if (socketInitialized === undefined) {
      return;
    }
    clearInterval(timer.current);
    if (socketInitialized) {
      setStartTime(new Date());
      timer.current = setInterval(() => setElapsed(moment()), TIMEOUTS.halfASecond);
    } else {
      close();
    }
    return () => {
      clearInterval(timer.current);
    };
  }, [socketInitialized]);

  useEffect(() => {
    if (socketInitialized) {
      return;
    }

    return () => close();
  }, [device.id]);

  const onConnectionToggle = () => {
    if (!canTroubleshoot) {
      dispatch(setSnackbar('You do not have enough permissions to connect to the device.', 5000));
      return;
    }
    if (sessionState === WebSocket.CLOSED) {
      setStartTime();
      setSocketInitialized(undefined);
      connect(device.id);
    } else {
      setSocketInitialized(false);
      close();
    }
  };

  const onDrop = acceptedFiles => {
    if (acceptedFiles.length === 1) {
      setFile(acceptedFiles[0]);
      setUploadPath(`/tmp/${acceptedFiles[0].name}`);
    }
  };

  const onDownloadClick = useCallback(
    path => {
      setDownloadPath(path);
      dispatch(setSnackbar('Downloading file'));
      dispatch(getDeviceFileDownloadLink(device.id, path)).then(address => {
        const filename = path.substring(path.lastIndexOf('/') + 1) || 'file';
        createDownload(address, filename);
      });
    },
    [dispatch, device.id]
  );

  const onSocketOpen = () => {
    setSocketInitialized(true);
    dispatch(setSnackbar('Connection with the device established.', 5000));
  };

  const onNotify = useCallback(
    content => {
      if (snackbarAlreadySet) {
        return;
      }
      setSnackbarAlreadySet(true);
      dispatch(setSnackbar(content, TIMEOUTS.threeSeconds));
      snackTimer.current = setTimeout(() => setSnackbarAlreadySet(false), TIMEOUTS.threeSeconds + TIMEOUTS.debounceShort);
    },
    [setSnackbar, snackbarAlreadySet, dispatch]
  );

  const onHealthCheckFailed = useCallback(() => {
    if (!socketInitialized) {
      return;
    }
    onNotify('Health check failed: connection with the device lost.');
  }, [onNotify, socketInitialized]);

  const onSocketClose = useCallback(
    event => {
      if (event.wasClean) {
        onNotify(`Connection with the device closed.`);
      } else if (event.code == 1006) {
        // 1006: abnormal closure
        onNotify('Connection to the remote terminal is forbidden.');
      } else {
        onNotify('Connection with the device died.');
      }
      setSocketInitialized(false);
    },
    [onNotify, setSocketInitialized, socketInitialized]
  );

  const onMessageReceived = useCallback(message => {
    if (!termRef.current.terminal.current) {
      return;
    }
    termRef.current.terminal.current.write(new Uint8Array(message));
  }, []);

  const [connect, sendMessage, close, sessionState] = useSession({
    onClose: onSocketClose,
    onHealthCheckFailed,
    onMessageReceived,
    onNotify,
    onOpen: onSocketOpen
  });

  useEffect(() => {
    if (socketInitialized === undefined) {
      return;
    }
    if (socketInitialized) {
      setStartTime(new Date());
      setSnackbar('Connection with the device established.', TIMEOUTS.fiveSeconds);
    } else {
      close();
    }
  }, [close, setSnackbar, socketInitialized]);

  useEffect(() => {
    return () => {
      clearTimeout(snackTimer.current);
      if (socketInitialized !== undefined) {
        close();
      }
    };
  }, [close, socketInitialized]);

  useEffect(() => {
    if (sessionState !== WebSocket.OPEN) {
      return;
    }
    return close;
  }, [close, sessionState]);

  const onboardingState = useSelector(getOnboardingState);
  let onboardingComponent;
  if (connectTerminalButtonRef.current) {
    const vwTermOffset = connectTerminalButtonRef.current.getBoundingClientRect();
    const anchor = {
      top: vwTermOffset.top + connectTerminalButtonRef.current.offsetHeight / 2 + 20,
      left: vwTermOffset.left + connectTerminalButtonRef.current.offsetWidth / 2
    };

    onboardingComponent = getOnboardingComponentFor(
      onboardingSteps.DEVICE_TERMINAL,
      onboardingState,
      { anchor, place: 'top' },
      onboardingComponent,
      <a onClick={() => dispatch(advanceOnboarding(onboardingSteps.DEVICE_TERMINAL))}>Next</a>
    );
  }

  if (filesTransferRef.current) {
    const vwFileOffset = filesTransferRef.current.getBoundingClientRect();
    const anchor = {
      top: vwFileOffset.top - 40,
      left: vwFileOffset.left + filesTransferRef.current.offsetWidth / 2
    };

    onboardingComponent = getOnboardingComponentFor(
      onboardingSteps.DEVICE_FILES_TRANSFERRING,
      onboardingState,
      { anchor, place: 'bottom' },
      onboardingComponent,
      <a onClick={() => dispatch(advanceOnboarding(onboardingSteps.DEVICE_FILES_TRANSFERRING))}>Done!</a>
    );
  }

  const duration = moment.duration(elapsed.diff(moment(startTime)));
  return (
    <div>
      <h2 className="flexbox center-aligned">
        Terminal {<MaterialDesignIcon className={socketInitialized ? classes.connectedIcon : classes.disconnectedIcon} path={ConsoleIcon} />}
      </h2>
      <div className="flexbox column">
        <div className={`${classes.terminalContent} ${socketInitialized ? 'device-connected' : ''}`}>
          <TwoColumns
            className={`margin-bottom-small ${classes.sessionInfo}`}
            items={{
              'Session status:': socketInitialized ? 'connected' : 'disconnected',
              'Connection start:': <MaybeTime value={startTime} />,
              'Duration:': socketInitialized ? `${duration.format('hh:mm:ss', { trim: false })}` : '-'
            }}
          />
          <Dropzone activeClassName="active" rejectClassName="active" multiple={false} onDrop={onDrop} noClick>
            {({ getRootProps }) => (
              <div {...getRootProps()} style={{ position: 'relative' }}>
                <Terminal
                  onDownloadClick={onDownloadClick}
                  sendMessage={sendMessage}
                  socketInitialized={socketInitialized}
                  style={{ position: 'absolute', width: '100%', height: '100%' }}
                  xtermRef={termRef}
                />
              </div>
            )}
          </Dropzone>
          {!socketInitialized && (
            <div className={`flexbox centered ${classes.connectionButton}`}>
              {!device.isOffline && (
                <Button ref={connectTerminalButtonRef} variant="contained" color="secondary" onClick={onConnectionToggle}>
                  Connect Terminal
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flexbox space-between margin-top-small">
        <div>{!device.isOffline && <Button onClick={onConnectionToggle}>{socketInitialized ? 'Disconnect' : 'Connect'} Terminal</Button>}</div>
      </div>
      {canTransferFiles && (
        <>
          <Divider className="margin-bottom-large" style={{ marginTop: 9 }} />
          <Accordion expanded={true} className="accordion">
            <AccordionSummary className="accordion-summary" expandIcon={<ExpandIcon style={{ fontSize: 24 }} />}>
              <h2>File transfer</h2>
            </AccordionSummary>
            <AccordionDetails className="accordion-details">
              <FileTransfer
                deviceId={device.id}
                downloadPath={downloadPath}
                file={file}
                onDownload={onDownloadClick}
                onUpload={(...args) => dispatch(deviceFileUpload(...args))}
                setDownloadPath={setDownloadPath}
                setFile={setFile}
                setSnackbar={dispatchedSetSnackbar}
                setUploadPath={setUploadPath}
                uploadPath={uploadPath}
                userCapabilities={userCapabilities}
                innerRef={filesTransferRef}
              />
            </AccordionDetails>
          </Accordion>
          {onboardingComponent}
        </>
      )}
    </div>
  );
};

export default Troubleshoot;
