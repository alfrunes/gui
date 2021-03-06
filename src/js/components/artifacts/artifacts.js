import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { Button, LinearProgress, IconButton, Tooltip } from '@material-ui/core';
import { Cancel as CancelIcon, CloudUpload, InfoOutlined as InfoIcon } from '@material-ui/icons';

import { setSnackbar } from '../../actions/appActions';
import { selectDevices } from '../../actions/deviceActions';
import { advanceOnboarding, setShowCreateArtifactDialog } from '../../actions/onboardingActions';
import {
  cancelArtifactUpload,
  createArtifact,
  getReleases,
  removeArtifact,
  showRemoveArtifactDialog,
  selectArtifact,
  selectRelease,
  uploadArtifact
} from '../../actions/releaseActions';
import { onboardingSteps } from '../../constants/onboardingConstants';
import { colors } from '../../themes/mender-theme';
import { getOnboardingState } from '../../selectors';
import { getOnboardingComponentFor } from '../../utils/onboardingmanager';

import ReleaseRepository from './releaserepository';
import ReleasesList from './releaseslist';
import RemoveArtifactDialog from './dialogs/removeartifact';
import AddArtifactDialog from './dialogs/addartifact';
import Tracking from '../../tracking';

const refreshArtifactsLength = 30000; //60000

export class Artifacts extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      doneLoading: false,
      showCreateArtifactDialog: false
    };
  }
  componentDidUpdate(prevProps) {
    if (prevProps.releases.length !== this.props.releases.length && this.props.releases.length) {
      const selectedRelease = this.props.releases.find(release => prevProps.releases.every(item => item.Name !== release.Name)) || this.props.releases[0];
      this.props.selectRelease(selectedRelease);
    }
    if (this.props.params && this.props.params.artifactVersion && prevProps.params && prevProps.params.artifactVersion !== this.props.params.artifactVersion) {
      // selected artifacts
      self.props.selectArtifact(this.props.params.artifactVersion);
    }
  }
  componentDidMount() {
    const self = this;
    const { artifactVersion } = self.props.match.params;
    if (!self.props.onboardingState.complete) {
      self.props.selectDevices([]);
    }
    if (!self.props.releases.length) {
      self._getReleases(artifactVersion);
    } else {
      self.setState({ doneLoading: true }, () => {
        if (artifactVersion) {
          self.props.selectRelease(artifactVersion);
        } else {
          self.props.selectRelease(self.props.releases[0]);
        }
      });
    }
    self.artifactTimer = setInterval(() => self._getReleases(), refreshArtifactsLength);
  }
  componentWillUnmount() {
    clearInterval(this.artifactTimer);
  }

  onFilterReleases(releases) {
    let selectedRelease = this.props.selectedRelease;
    if (releases && !releases.find(item => selectedRelease && selectedRelease.Name === item.Name)) {
      selectedRelease = releases.length ? releases[0] : null;
    }
    if (this.props.selectedRelease != selectedRelease) {
      this.props.selectRelease(selectedRelease);
    }
  }

  _getReleases(artifactVersion) {
    var self = this;
    return self.props.getReleases().finally(() => {
      if (artifactVersion) {
        self.props.selectRelease(artifactVersion);
      }
      self.setState({ doneLoading: true });
    });
  }

  onUploadClick() {
    if (this.props.releases.length) {
      this.props.advanceOnboarding(onboardingSteps.UPLOAD_NEW_ARTIFACT_TIP);
    }
    this.setState({ showCreateArtifactDialog: true });
  }

  addArtifact(meta, file, type = 'upload') {
    const self = this;
    const { advanceOnboarding, createArtifact, deviceTypes, onboardingState, pastCount, uploadArtifact } = self.props;
    const upload = type === 'create' ? createArtifact(meta, file) : uploadArtifact(meta, file);
    return self.setState({ showCreateArtifactDialog: false }, () =>
      upload.then(() => {
        if (!onboardingState.complete && deviceTypes.length && pastCount) {
          advanceOnboarding(onboardingSteps.UPLOAD_NEW_ARTIFACT_TIP);
          if (type === 'create') {
            advanceOnboarding(onboardingSteps.UPLOAD_NEW_ARTIFACT_DIALOG_RELEASE_NAME);
          }
        }
        // track in GA
        Tracking.event({ category: 'artifacts', action: 'create' });
        return setTimeout(() => self._getReleases(), 1000);
      })
    );
  }

  _removeArtifact(artifact) {
    const self = this;
    return self.props.removeArtifact(artifact.id).finally(() => self.props.showRemoveArtifactDialog(false));
  }

  render() {
    const self = this;
    const { doneLoading, selectedFile, showCreateArtifactDialog } = self.state;
    const {
      advanceOnboarding,
      artifactProgress,
      cancelArtifactUpload,
      deviceTypes,
      onboardingState,
      releases,
      showRemoveDialog,
      selectedArtifact,
      selectedRelease,
      setShowCreateArtifactDialog,
      setSnackbar,
      showOnboardingDialog,
      showRemoveArtifactDialog
    } = self.props;

    let uploadArtifactOnboardingComponent = null;
    if (!onboardingState.complete && self.uploadButtonRef) {
      uploadArtifactOnboardingComponent = getOnboardingComponentFor(
        onboardingSteps.UPLOAD_NEW_ARTIFACT_TIP,
        { ...onboardingState, setShowCreateArtifactDialog },
        {
          place: 'right',
          anchor: {
            left: self.uploadButtonRef.offsetLeft + self.uploadButtonRef.offsetWidth,
            top: self.uploadButtonRef.offsetTop + self.uploadButtonRef.offsetHeight / 2
          }
        }
      );
    }

    return (
      <div style={{ height: '100%' }}>
        <div className="repository">
          <div>
            <ReleasesList
              releases={releases}
              selectedRelease={selectedRelease}
              onSelect={release => self.props.selectRelease(release)}
              onFilter={rels => self.onFilterReleases(rels)}
              loading={!doneLoading}
            />
            <Button
              buttonRef={ref => (this.uploadButtonRef = ref)}
              color="secondary"
              onClick={() => self.onUploadClick()}
              startIcon={<CloudUpload fontSize="small" />}
              style={{ minWidth: 164 }}
              variant="contained"
            >
              Upload
            </Button>
            <p className="info flexbox" style={{ alignItems: 'center' }}>
              <InfoIcon fontSize="small" />
              Upload an Artifact to an existing or new Release
            </p>
            {!!uploadArtifactOnboardingComponent && !showOnboardingDialog && !showCreateArtifactDialog && uploadArtifactOnboardingComponent}
          </div>
          <ReleaseRepository
            refreshArtifacts={() => self._getReleases()}
            loading={!doneLoading}
            onUpload={selectedFile => self.setState({ selectedFile, showCreateArtifactDialog: true })}
            release={selectedRelease}
          />
        </div>
        {artifactProgress ? (
          <div id="progressBarContainer">
            <p className="align-center">Upload in progress ({Math.round(artifactProgress)}%)</p>
            <LinearProgress variant="determinate" style={{ backgroundColor: colors.grey, gridColumn: 1, margin: '15px 0' }} value={artifactProgress} />
            <Tooltip title="Abort" placement="top">
              <IconButton onClick={cancelArtifactUpload}>
                <CancelIcon />
              </IconButton>
            </Tooltip>
          </div>
        ) : null}
        {showRemoveDialog && (
          <RemoveArtifactDialog
            artifact={selectedArtifact.name}
            open={showRemoveDialog}
            onCancel={() => showRemoveArtifactDialog(false)}
            onRemove={() => self._removeArtifact(selectedArtifact || selectedRelease.Artifacts[0])}
          />
        )}
        {showCreateArtifactDialog && (
          <AddArtifactDialog
            advanceOnboarding={advanceOnboarding}
            selectedFile={selectedFile}
            setSnackbar={setSnackbar}
            deviceTypes={deviceTypes}
            open={showCreateArtifactDialog}
            onboardingState={onboardingState}
            onCancel={() => self.setState({ showCreateArtifactDialog: false })}
            onCreate={(meta, file) => self.addArtifact(meta, file, 'create')}
            onUpload={(meta, file) => self.addArtifact(meta, file, 'upload')}
            releases={releases}
          />
        )}
      </div>
    );
  }
}

const actionCreators = {
  advanceOnboarding,
  cancelArtifactUpload,
  createArtifact,
  getReleases,
  removeArtifact,
  selectArtifact,
  selectDevices,
  selectRelease,
  setShowCreateArtifactDialog,
  setSnackbar,
  showRemoveArtifactDialog,
  uploadArtifact
};

const mapStateToProps = state => {
  const deviceTypes = state.devices.byStatus.accepted.deviceIds.slice(0, 200).reduce((accu, item) => {
    const deviceType = state.devices.byId[item] ? state.devices.byId[item].attributes.device_type : '';
    if (deviceType.length > 0) {
      accu[deviceType] = accu[deviceType] ? accu[deviceType] + 1 : 1;
    }
    return accu;
  }, {});
  return {
    artifactProgress: state.releases.uploadProgress,
    deviceTypes: Object.keys(deviceTypes),
    onboardingState: getOnboardingState(state),
    showOnboardingDialog: state.onboarding.showCreateArtifactDialog,
    pastCount: state.deployments.byStatus.finished.total,
    releases: Object.values(state.releases.byId),
    selectedArtifact: state.releases.selectedArtifact,
    selectedRelease: state.releases.selectedRelease ? state.releases.byId[state.releases.selectedRelease] : null,
    showRemoveDialog: state.releases.showRemoveDialog
  };
};

export default withRouter(connect(mapStateToProps, actionCreators)(Artifacts));
