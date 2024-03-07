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
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { CloudDownload, Pause, PlayArrow, Refresh } from '@mui/icons-material';
import { Button } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import msgpack5 from 'msgpack5';

import { deviceConnect } from '../../../actions/deviceActions';
import { TIMEOUTS } from '../../../constants/appConstants';
import { DEVICE_MESSAGE_PROTOCOLS as MessageProtocols, DEVICE_MESSAGE_TYPES as MessageTypes } from '../../../constants/deviceConstants';
import { createFileDownload, toggle } from '../../../helpers';
import { blobToString, byteArrayToString } from '../../../utils/sockethook';
import XTerm from '../../common/xterm';

const MessagePack = msgpack5();

let socket = null;
let buffer = [];
let timer;

const useStyles = makeStyles()(theme => ({
  playArrow: { fontSize: '7rem', color: theme.palette.text.disabled }
}));

const generateHtml = (versions, content) => {
  const { fit, search, xterm } = Object.entries(versions).reduce((accu, [key, version]) => {
    accu[key] = version.match(/(?<version>\d.*)/).groups.version;
    return accu;
  }, {});
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <link rel="stylesheet" href="https://unpkg.com/xterm@${xterm}/css/xterm.css" />
      <script src="https://unpkg.com/xterm@${xterm}/lib/xterm.js"></script>
      <script src="https://unpkg.com/xterm-addon-search@${search}/lib/xterm-addon-search.js"></script>
      <script src="https://unpkg.com/xterm-addon-fit@${fit}/lib/xterm-addon-fit.js"></script>
      <style type="text/css">
        body {
          display: grid;
          justify-items: center;
          max-width: 80vw;
          margin: 10vh auto;
          row-gap: 5vh;
          font-family: 'Segoe UI', Roboto, Ubuntu, 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        h2 {
          color: #212121;
          font-size: 22px;
          font-weight: 700;
        }
        button {
          background-color: #14A452;
          padding: 1.3em 3.4em;
          color: #fff;
          font-weight: 700;
          text-transform: uppercase;
          border: 0;
          border-radius: 3px;
          cursor: pointer;
        }
        .disabled {
          color: rgba(0, 0, 0, 0.26);
          background-color: rgba(0, 0, 0, 0.12);
          cursor: initial;
        }
        .xterm-screen {
          padding: 10px;
        }
      </style>
    </head>
    <body>
      <svg xmlns="http://www.w3.org/2000/svg" width="110" height="34" fill="none" alt="Alvaldi logo"><path fill="#212121" d="m38.73 24.147 6.3-14h2.56l6.32 14h-2.72l-5.42-12.62h1.04l-5.4 12.62h-2.68Zm2.9-3.24.7-2.04h7.56l.7 2.04h-8.96Zm14.02 3.24V9.307h2.5v14.84h-2.5Zm8.822 0-4.58-10.68h2.6l3.94 9.42h-1.28l4.08-9.42h2.4l-4.58 10.68h-2.58Zm15.17 0v-2.16l-.14-.46v-3.78c0-.733-.22-1.3-.66-1.7-.44-.414-1.106-.62-2-.62-.6 0-1.193.093-1.78.28a4.358 4.358 0 0 0-1.46.78l-.98-1.82c.574-.44 1.254-.767 2.04-.98.8-.227 1.627-.34 2.48-.34 1.547 0 2.74.373 3.58 1.12.854.733 1.28 1.873 1.28 3.42v6.26h-2.36Zm-3.36.14c-.8 0-1.5-.133-2.1-.4-.6-.28-1.066-.66-1.4-1.14a2.985 2.985 0 0 1-.48-1.66c0-.6.14-1.14.42-1.62.294-.48.767-.86 1.42-1.14.654-.28 1.52-.42 2.6-.42h3.1v1.66h-2.92c-.853 0-1.426.14-1.72.42-.293.267-.44.6-.44 1 0 .453.18.813.54 1.08.36.267.86.4 1.5.4.614 0 1.16-.14 1.64-.42a2.37 2.37 0 0 0 1.06-1.24l.42 1.5c-.24.627-.673 1.113-1.3 1.46-.613.346-1.393.52-2.34.52Zm9.129-.14V9.307h2.5v14.84h-2.5Zm10.501.14c-1.027 0-1.953-.227-2.78-.68a5.104 5.104 0 0 1-1.92-1.92c-.467-.814-.7-1.774-.7-2.88 0-1.107.233-2.067.7-2.88a4.96 4.96 0 0 1 1.92-1.9c.827-.454 1.753-.68 2.78-.68.893 0 1.693.2 2.4.6.707.387 1.267.98 1.68 1.78.413.8.62 1.826.62 3.08 0 1.24-.2 2.267-.6 3.08-.4.8-.953 1.4-1.66 1.8-.707.4-1.52.6-2.44.6Zm.3-2.14c.6 0 1.133-.133 1.6-.4.48-.267.86-.654 1.14-1.16.293-.507.44-1.1.44-1.78 0-.694-.147-1.287-.44-1.78a2.894 2.894 0 0 0-1.14-1.16c-.467-.267-1-.4-1.6-.4-.6 0-1.14.133-1.62.4a3.074 3.074 0 0 0-1.14 1.16c-.28.493-.42 1.086-.42 1.78 0 .68.14 1.273.42 1.78.293.506.673.893 1.14 1.16.48.267 1.02.4 1.62.4Zm3.24 2v-2.52l.1-2.84-.2-2.84v-6.64h2.48v14.84h-2.38Zm5.87 0v-10.68h2.5v10.68h-2.5Zm1.26-12.44c-.466 0-.853-.147-1.16-.44a1.446 1.446 0 0 1-.44-1.06c0-.427.147-.78.44-1.06.307-.293.694-.44 1.16-.44.467 0 .847.14 1.14.42.307.267.46.607.46 1.02 0 .44-.146.813-.44 1.12-.293.293-.68.44-1.16.44Z"></path><path fill="#8FE2B1" fill-rule="evenodd" d="M4.272 1.948a3.94 3.94 0 1 0 3.896 6.849 3.94 3.94 0 0 0-3.896-6.85ZM9.6 26.216a3.94 3.94 0 1 1-6.852 3.895A3.94 3.94 0 0 1 9.6 26.216ZM14.054 19.15a3.94 3.94 0 1 0 3.897 6.849 3.94 3.94 0 0 0-3.897-6.85ZM23.884 13.56a3.94 3.94 0 1 0 3.897 6.85 3.94 3.94 0 0 0-3.896-6.85Z" clip-rule="evenodd"></path><path fill="#1AC55F" fill-rule="evenodd" d="M19.84 8.966a3.846 3.846 0 0 1-4.605 5.613c-4.455-.943-5.838 1.82-6.144 3.373a3.859 3.859 0 0 1-.046.285.305.305 0 0 1-.017.068 3.846 3.846 0 1 1-2.42-4.454c4.63.696 5.87-2.42 6.17-3.593.016-.09.036-.18.06-.27.02-.103.027-.162.027-.162l.015.013a3.846 3.846 0 0 1 6.96-.873Z" clip-rule="evenodd"></path></svg>
      <h2>Terminal playback</h2>
      <div id="terminal"></div>
      <div>
        <button id="start" onclick="handleStart()">Start</button>
        <button id="pause" class="disabled" disabled onclick="handlePause()">Pause</button>
        <button id="stop" class="disabled" disabled onclick="handleStop()">Stop</button>
      </div>
      <script>
        const byteArrayToString = body => String.fromCharCode(...body);
        const transfer = '${JSON.stringify(content.map(item => ({ delay: item.delay, content: btoa(JSON.stringify(item.content)) })))}';
        const content = JSON.parse(transfer);
        let contentIndex = 0;
        let timer;
        const term = new Terminal();
        const fitAddon = new FitAddon.FitAddon();
        const searchAddon = new SearchAddon.SearchAddon();
        term.loadAddon(searchAddon);
        term.loadAddon(fitAddon);
        term.open(document.getElementById('terminal'));
        fitAddon.fit();
        const startButton = document.getElementById('start');
        const pauseButton = document.getElementById('pause');
        const stopButton = document.getElementById('stop');

        const resetPlayer = () => {
          contentIndex = 0;
          term.reset()
          startButton.toggleAttribute('disabled');
          pauseButton.toggleAttribute('disabled');
          stopButton.toggleAttribute('disabled');
          pauseButton.classList.toggle('disabled');
          stopButton.classList.toggle('disabled');
          startButton.classList.toggle('disabled');
        }

        const processContent = () => {
          if (contentIndex === content.length) {
            return handlePause();
          }
          const item = content[contentIndex];
          contentIndex += 1;
          let delay = 1;
          if (item.delay) {
            delay = item.delay;
          } else if (item.content) {
            const buffer = JSON.parse(atob(item.content));
            term.write(byteArrayToString(buffer.data || []))
          }
          timer = setTimeout(processContent, delay)
        };

        const handleStart = () => {
          contentIndex = 0;
          startButton.toggleAttribute('disabled');
          pauseButton.toggleAttribute('disabled');
          stopButton.toggleAttribute('disabled');
          startButton.classList.toggle('disabled');
          pauseButton.classList.toggle('disabled');
          stopButton.classList.toggle('disabled');
          timer = setTimeout(processContent, 1);
        };

        const handlePause = () => {
          startButton.toggleAttribute('disabled');
          pauseButton.toggleAttribute('disabled');
          startButton.classList.toggle('disabled');
          pauseButton.classList.toggle('disabled');
          clearTimeout(timer);
        };

        const handleStop = () => {
          clearTimeout(timer);
          resetPlayer();
        };
      </script>
    </body>
  </html>`;
};

export const TerminalPlayer = ({ className, item, sessionInitialized }) => {
  const xtermRef = useRef({ terminal: React.createRef(), terminalRef: React.createRef() });
  const [socketInitialized, setSocketInitialized] = useState(false);
  const [bufferIndex, setBufferIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasStarted, setWasStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [fitTrigger, setFitTrigger] = useState(false);

  const { classes } = useStyles();

  useEffect(() => {
    if (!sessionInitialized) {
      return;
    }
    socket = new WebSocket(`wss://${window.location.host}${deviceConnect}/sessions/${item.meta.session_id[0]}/playback`);
    socket.onopen = () => setSocketInitialized(true);
  }, [item.meta.session_id, sessionInitialized]);

  useEffect(() => {
    if (!socketInitialized) {
      return;
    }
    buffer = [];
    socket.onmessage = event =>
      blobToString(event.data).then(data => {
        const {
          hdr: { proto, typ, props = {} },
          body
        } = MessagePack.decode(data);
        if (proto !== MessageProtocols.Shell) {
          return;
        }
        clearTimeout(timer);
        timer = setTimeout(() => setIsLoadingSession(false), TIMEOUTS.oneSecond);
        switch (typ) {
          case MessageTypes.Shell:
            return buffer.push({ content: body });
          case MessageTypes.Delay:
            return buffer.push({ delay: props.delay_value });
          default:
            break;
        }
      });
  }, [socketInitialized]);

  useEffect(() => {
    if (isPlaying && bufferIndex < buffer.length) {
      if (bufferIndex === 0) {
        xtermRef.current.terminal.current.reset();
      }
      if (buffer[bufferIndex].content) {
        xtermRef.current.terminal.current.write(byteArrayToString(buffer[bufferIndex].content));
        setTimeout(() => setBufferIndex(bufferIndex + 1), 20);
      }
      if (buffer[bufferIndex].delay) {
        setTimeout(() => {
          setBufferIndex(bufferIndex + 1);
        }, buffer[bufferIndex].delay);
      }
    } else if (!isPaused) {
      resetPlayer();
    }
  }, [bufferIndex, isPaused, isPlaying]);

  const resetPlayer = () => {
    setIsPlaying(false);
    setBufferIndex(0);
  };

  const onTogglePlayClick = useCallback(() => {
    if (!wasStarted) {
      setWasStarted(true);
      return setTimeout(() => {
        setFitTrigger(toggle);
        xtermRef.current.terminal.current.focus();
        setIsPlaying(!isPlaying);
      }, TIMEOUTS.debounceShort);
    }
    setIsPaused(isPlaying);
    setIsPlaying(!isPlaying);
  }, [isPlaying, wasStarted]);

  const onReplayClick = () => {
    resetPlayer();
    setIsPlaying(true);
  };

  const onDownloadClick = () => {
    // eslint-disable-next-line no-undef
    const text = generateHtml({ fit: XTERM_FIT_VERSION, search: XTERM_SEARCH_VERSION, xterm: XTERM_VERSION }, buffer);
    createFileDownload(text, 'terminalsession.html');
  };

  return (
    <div className={`${className} `}>
      <div className="relative">
        <XTerm className="xterm-min-screen" triggerResize={fitTrigger} xtermRef={xtermRef} />
        {!wasStarted && (
          <div
            className="flexbox centered clickable"
            style={{ background: 'black', width: '100%', height: '100%', position: 'absolute', top: 0, zIndex: 10 }}
            onClick={onTogglePlayClick}
          >
            <PlayArrow className={classes.playArrow} />
          </div>
        )}
      </div>
      <div className="flexbox margin-top-small margin-bottom-small">
        <Button color="primary" onClick={onTogglePlayClick} startIcon={isPlaying ? <Pause /> : <PlayArrow />}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button color="primary" onClick={onReplayClick} disabled={isPlaying} startIcon={<Refresh />}>
          Replay
        </Button>
        <Button color="primary" onClick={onDownloadClick} startIcon={<CloudDownload />} disabled={isLoadingSession}>
          Download
        </Button>
      </div>
    </div>
  );
};

export default TerminalPlayer;
