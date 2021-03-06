import React from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import moment from 'moment';

import { Button, Tab, Tabs } from '@material-ui/core';

import { getGroups, getDynamicGroups, initializeGroupsDevices, selectDevice } from '../../actions/deviceActions';
import { advanceOnboarding } from '../../actions/onboardingActions';
import { selectRelease } from '../../actions/releaseActions';
import { saveGlobalSettings } from '../../actions/userActions';
import { setSnackbar } from '../../actions/appActions';
import { abortDeployment, createDeployment, selectDeployment } from '../../actions/deploymentActions';
import { onboardingSteps } from '../../constants/onboardingConstants';
import { getIsEnterprise, getOnboardingState } from '../../selectors';

import CreateDialog, { allDevices } from './createdeployment';
import Progress from './inprogressdeployments';
import Past from './pastdeployments';
import Report from './report';
import Scheduled from './scheduleddeployments';

import { deepCompare, standardizePhases } from '../../helpers';
import { getOnboardingComponentFor } from '../../utils/onboardingmanager';
import Tracking from '../../tracking';

const MAX_PREVIOUS_PHASES_COUNT = 5;

const routes = {
  active: {
    component: Progress,
    route: '/deployments/active',
    title: 'Active'
  },
  scheduled: {
    component: Scheduled,
    route: '/deployments/scheduled',
    title: 'Scheduled'
  },
  finished: {
    component: Past,
    route: '/deployments/finished',
    title: 'Finished'
  }
};

export const defaultRefreshDeploymentsLength = 30000;

export const getPhaseStartTime = (phases, index) => {
  if (index < 1) {
    return phases[0].start_ts || new Date();
  }
  // since we don't want to get stale phase start times when the creation dialog is open for a long time
  // we have to ensure start times are based on delay from previous phases
  // since there likely won't be 1000s of phases this should still be fine to recalculate
  const newStartTime = phases.slice(0, index).reduce((accu, phase) => moment(accu).add(phase.delay, phase.delayUnit), phases[0].start_ts || new Date());
  return newStartTime.toISOString();
};

export class Deployments extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      deploymentObject: {},
      createDialog: false,
      reportDialog: false,
      startDate: null,
      tabIndex: this._updateActive()
    };
  }

  componentDidMount() {
    const self = this;
    let tasks = [self.props.getGroups(), self.props.selectRelease(), self.props.selectDevice()];
    if (self.props.isEnterprise) {
      tasks.push(self.props.getDynamicGroups());
    }
    Promise.all(tasks)
      .then(() => self.props.initializeGroupsDevices())
      .catch(err => console.log(err));
    let startDate = self.state.startDate;
    const params = new URLSearchParams(this.props.location.search);
    if (this.props.match && params) {
      if (params.get('open')) {
        if (params.get('id')) {
          self.showReport(self.state.reportType || self.props.match.params.tab, params.get('id'));
        } else if (params.get('release')) {
          self.props.selectRelease(params.get('release'));
        } else if (params.get('deviceId')) {
          self.props.selectDevice(params.get('deviceId'));
        } else {
          setTimeout(() => self.setState({ createDialog: true }), 400);
        }
      } else if (params.get('from')) {
        startDate = new Date(params.get('from'));
        startDate.setHours(0, 0, 0);
      }
    }
    self.setState({
      createDialog: Boolean(params.get('open')),
      reportType: this.props.match ? this.props.match.params.tab : 'active',
      startDate,
      tabIndex: this._updateActive()
    });
  }

  retryDeployment(deployment, devices) {
    const self = this;
    const release = { Name: deployment.artifact_name, device_types_compatible: deployment.device_types_compatible || [] };
    const deploymentObject = {
      group: deployment.name,
      deploymentDeviceIds: devices.map(item => item.id),
      release,
      phases: [{ batch_size: 100, start_ts: new Date().toISOString(), delay: 0 }]
    };
    self.setState({ deploymentObject, createDialog: true, reportDialog: false });
  }

  onScheduleSubmit(deploymentObject) {
    const self = this;
    const { deploymentDeviceIds, device, filterId, group, phases, release, retries } = deploymentObject;
    const newDeployment = {
      artifact_name: release.Name,
      devices: filterId || (group && group !== allDevices) ? undefined : deploymentDeviceIds,
      filter_id: filterId,
      group: group === allDevices ? undefined : group,
      name: device?.id || (group ? decodeURIComponent(group) : 'All devices'),
      phases: phases
        ? phases.map((phase, i, origPhases) => {
            phase.start_ts = getPhaseStartTime(origPhases, i);
            return phase;
          })
        : phases,
      retries
    };
    self.setState({ createDialog: false, reportDialog: false });

    return self.props.createDeployment(newDeployment).then(() => {
      if (phases) {
        const standardPhases = standardizePhases(phases);
        let previousPhases = self.props.settings.previousPhases || [];
        previousPhases = previousPhases.map(standardizePhases);
        if (!previousPhases.find(previousPhaseList => previousPhaseList.every(oldPhase => standardPhases.find(phase => deepCompare(phase, oldPhase))))) {
          previousPhases.push(standardPhases);
        }
        self.props.saveGlobalSettings({ previousPhases: previousPhases.slice(-1 * MAX_PREVIOUS_PHASES_COUNT) });
      }
      self.setState({ deploymentObject: {} });
      // track in GA
      Tracking.event({ category: 'deployments', action: 'create' });
      // successfully retrieved new deployment
      if (self._getCurrentRoute().title !== routes.active.title) {
        self.props.history.push(routes.active.route);
        self._changeTab(routes.active.route);
      }
    });
  }

  _abortDeployment(id) {
    var self = this;
    return self.props.abortDeployment(id).then(() => {
      self.setState({ createDialog: false, reportDialog: false });
      return Promise.resolve();
    });
  }

  _updateActive(tab = this.props.match.params.tab) {
    if (routes.hasOwnProperty(tab)) {
      return routes[tab].route;
    }
    return routes.active.route;
  }

  _getCurrentRoute(tab = this.props.match.params.tab) {
    if (routes.hasOwnProperty(tab)) {
      return routes[tab];
    }
    return routes.active;
  }

  _changeTab(tabIndex) {
    this.setState({ tabIndex });
    this.props.setSnackbar('');
    if (this.props.pastCount && !this.props.onboardingState.complete) {
      this.props.advanceOnboarding(onboardingSteps.DEPLOYMENTS_PAST);
    }
  }

  showReport(reportType, deploymentId) {
    const self = this;
    if (!self.props.onboardingState.complete) {
      self.props.advanceOnboarding(onboardingSteps.DEPLOYMENTS_INPROGRESS);
    }
    self.props.selectDeployment(deploymentId).then(() => self.setState({ createDialog: false, reportType, reportDialog: true }));
  }

  closeReport() {
    const self = this;
    self.setState({ reportDialog: false }, () => self.props.selectDeployment());
  }

  render() {
    const self = this;
    const { onboardingState, pastCount } = self.props;
    // tabs
    const { createDialog, deploymentObject, reportDialog, reportType, startDate, tabIndex } = self.state;
    let onboardingComponent = null;
    // the pastCount prop is needed to trigger the rerender as the change in past deployments would otherwise not be noticed on this view
    if (pastCount && self.tabsRef) {
      const tabs = self.tabsRef.getElementsByClassName('MuiTab-root');
      const finishedTab = tabs[tabs.length - 1];
      onboardingComponent = getOnboardingComponentFor(onboardingSteps.DEPLOYMENTS_PAST, onboardingState, {
        anchor: {
          left: self.tabsRef.offsetLeft + self.tabsRef.offsetWidth - finishedTab.offsetWidth / 2,
          top: self.tabsRef.offsetHeight + finishedTab.offsetHeight
        }
      });
    }
    const ComponentToShow = self._getCurrentRoute().component;
    return (
      <>
        <div className="margin-left-small margin-top" style={{ maxWidth: '80vw' }}>
          <div className="flexbox space-between">
            <Tabs value={tabIndex} onChange={(e, newTabIndex) => self._changeTab(newTabIndex)} ref={ref => (self.tabsRef = ref)}>
              {Object.values(routes).map(route => (
                <Tab component={Link} key={route.route} label={route.title} to={route.route} value={route.route} />
              ))}
            </Tabs>
            <Button color="secondary" variant="contained" onClick={() => self.setState({ createDialog: true })} style={{ height: '100%' }}>
              Create a deployment
            </Button>
          </div>
          <ComponentToShow
            abort={id => self._abortDeployment(id)}
            createClick={() => self.setState({ createDialog: true })}
            openReport={(type, id) => self.showReport(type, id)}
            startDate={startDate}
          />
        </div>
        {reportDialog && (
          <Report
            abort={id => self._abortDeployment(id)}
            onClose={() => self.closeReport()}
            retry={(deployment, devices) => self.retryDeployment(deployment, devices)}
            type={reportType}
          />
        )}
        {createDialog && (
          <CreateDialog
            onDismiss={() => self.setState({ createDialog: false, deploymentObject: {} })}
            deploymentObject={deploymentObject}
            onScheduleSubmit={deploymentObj => self.onScheduleSubmit(deploymentObj)}
          />
        )}
        {onboardingComponent}
      </>
    );
  }
}

const actionCreators = {
  abortDeployment,
  advanceOnboarding,
  createDeployment,
  getGroups,
  getDynamicGroups,
  initializeGroupsDevices,
  saveGlobalSettings,
  selectDevice,
  selectDeployment,
  selectRelease,
  setSnackbar
};

const mapStateToProps = state => {
  return {
    isEnterprise: getIsEnterprise(state),
    onboardingState: getOnboardingState(state),
    pastCount: state.deployments.byStatus.finished.total,
    settings: state.users.globalSettings
  };
};

export default withRouter(connect(mapStateToProps, actionCreators)(Deployments));
