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

import { FileCopy as CopyPasteIcon } from '@mui/icons-material';
import { Button, IconButton, Tab, Tabs, TextField, Tooltip } from '@mui/material';
import { tabsClasses } from '@mui/material/Tabs';
import { makeStyles } from 'tss-react/mui';

import { canAccess } from '../../../constants/appConstants';
import FileUpload from '../../common/forms/fileupload';
import InfoText from '../../common/infotext';

const tabs = [
  { key: 'upload', canAccess: ({ userCapabilities: { canTroubleshoot, canWriteDevices } }) => canTroubleshoot && canWriteDevices },
  { key: 'download', canAccess }
];

const maxWidth = 400;

const useStyles = makeStyles()(theme => ({
  column: { maxWidth },
  inputWrapper: { display: 'grid', gridTemplateColumns: 'auto 0px max-content', flexGrow: 1 },
  tab: { alignItems: 'flex-start' },
  tabs: {
    [`.${tabsClasses.flexContainer}`]: {
      borderBottom: `1px solid ${theme.palette.border.colors.primary}`
    }
  },
  fileDestination: { marginTop: theme.spacing(2) },
  copyPasteIcon: { color: theme.palette.greySecondary[600] }
}));

export const FileTransfer = ({
  deviceId,
  downloadPath,
  file,
  onDownload,
  onUpload,
  setFile,
  setDownloadPath,
  setSnackbar,
  setUploadPath,
  uploadPath,
  userCapabilities
}) => {
  const { classes } = useStyles();
  const [currentTab, setCurrentTab] = useState(tabs[0].key);
  const [isValidDestination, setIsValidDestination] = useState(true);
  const [availableTabs, setAvailableTabs] = useState(tabs);

  useEffect(() => {
    let destination = currentTab === 'download' ? downloadPath : uploadPath;
    const isValid = destination.length ? /^(?:\/|[a-z]+:\/\/)/.test(destination) : true;
    setIsValidDestination(isValid);
  }, [currentTab, downloadPath, uploadPath]);

  useEffect(() => {
    const availableTabs = tabs.reduce((accu, item) => {
      if (item.canAccess({ userCapabilities })) {
        accu.push(item);
      }
      return accu;
    }, []);
    setAvailableTabs(availableTabs);
    setCurrentTab(availableTabs[0].key);
  }, [JSON.stringify(userCapabilities)]);

  const onPasteDownloadClick = async () => {
    const path = await navigator.clipboard.readText();
    setDownloadPath(path);
  };

  const onPasteUploadClick = async () => {
    const path = await navigator.clipboard.readText();
    setUploadPath(path);
  };

  const onFileSelect = selectedFile => {
    let path;
    if (selectedFile) {
      path = `${uploadPath}/${selectedFile.name}`;
    } else {
      path = file && uploadPath.includes(file.name) ? uploadPath.substring(0, uploadPath.lastIndexOf('/')) : uploadPath;
    }
    setUploadPath(path);
    setFile(selectedFile);
  };

  return (
    <div className="tab-container file-transfer-container with-sub-panels" style={{ minHeight: '95%' }}>
      <Tabs orientation="horizontal" className={`leftFixed ${classes.tabs}`} onChange={(e, item) => setCurrentTab(item)} value={currentTab}>
        {availableTabs.map(({ key }) => (
          <Tab className={`${classes.tab} capitalized`} key={key} label={key} value={key} />
        ))}
      </Tabs>
      <div className="padding-right">
        {currentTab === 'upload' ? (
          <>
            <InfoText className={`${classes.column} infotext`}>Upload a file to the device</InfoText>
            <FileUpload
              enableContentReading={false}
              fileNameSelection={file?.name}
              onFileChange={() => undefined}
              onFileSelect={onFileSelect}
              placeholder={
                <div className="infotext">
                  Drag here or browse to <a>upload</a> a file
                </div>
              }
              setSnackbar={setSnackbar}
            />
            <div style={{ alignItems: 'baseline' }} className={classes.inputWrapper}>
              <TextField
                autoFocus={true}
                error={!isValidDestination}
                fullWidth
                helperText={!isValidDestination && <div className="warning">Destination has to be an absolute path</div>}
                inputProps={{ style: { marginTop: 16 } }}
                InputLabelProps={{ shrink: true }}
                label="Destination directory on the device where the file will be transferred"
                onChange={e => setUploadPath(e.target.value)}
                placeholder="Example: /opt/installed-by-single-file"
                value={uploadPath}
              />
              <Tooltip title="Paste" placement="top">
                <IconButton className="copy-paste-button" onClick={onPasteUploadClick} size="large">
                  <CopyPasteIcon className={classes.copyPasteIcon} />
                </IconButton>
              </Tooltip>
              <div>
                <Button
                  className="upload-button"
                  variant="contained"
                  color="primary"
                  disabled={!(file && uploadPath && isValidDestination)}
                  onClick={() => onUpload(deviceId, uploadPath, file).then(() => onFileSelect())} // clears the upload form after successful uploading
                >
                  Upload
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <InfoText className="infotext">Download a file from the device</InfoText>
            <div style={{ alignItems: 'baseline' }} className={classes.inputWrapper}>
              <TextField
                autoFocus={true}
                error={!isValidDestination}
                fullWidth
                helperText={!isValidDestination && <div className="warning">Destination has to be an absolute path</div>}
                inputProps={{ className: classes.fileDestination }}
                InputLabelProps={{ shrink: true }}
                label="Path to the file on the device"
                onChange={e => setDownloadPath(e.target.value)}
                placeholder="Example: /home/mender/"
                value={downloadPath}
              />
              <Tooltip title="Paste" placement="top">
                <IconButton className="copy-paste-button" onClick={onPasteDownloadClick} size="large">
                  <CopyPasteIcon className={classes.copyPasteIcon} />
                </IconButton>
              </Tooltip>
              <div>
                <Button
                  className="upload-button"
                  variant="contained"
                  color="primary"
                  disabled={!(downloadPath && isValidDestination)}
                  onClick={() => onDownload(downloadPath)}
                  style={{ alignSelf: 'flex-end' }}
                >
                  Download
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileTransfer;
