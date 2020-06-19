import React from 'react';
import { connect } from 'react-redux';
import { Link, Redirect } from 'react-router-dom';
import Time from 'react-time';
import pluralize from 'pluralize';

// material ui
import { SpeedDial, SpeedDialIcon, SpeedDialAction } from '@material-ui/lab';
import { CheckCircle as CheckCircleIcon, InfoOutlined as InfoIcon, HighlightOffOutlined as HighlightOffOutlinedIcon } from '@material-ui/icons';

import { getDevicesByStatus, selectGroup, setDeviceFilters, updateDevicesAuth } from '../../actions/deviceActions';
import { setSnackbar } from '../../actions/appActions';
import { DEVICE_LIST_MAXIMUM_LENGTH, DEVICE_STATES } from '../../constants/deviceConstants';
import { getOnboardingComponentFor, advanceOnboarding, getOnboardingStepCompleted } from '../../utils/onboardingmanager';
import Loader from '../common/loader';
import RelativeTime from '../common/relative-time';
import { DevicePendingTip } from '../helptips/onboardingtips';
import DeviceList from './devicelist';
import { refreshLength as refreshDeviceLength } from './devices';
import Filters from './filters';

export class Pending extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      authLoading: 'all',
      pageLength: 20,
      pageLoading: true,
      pageNo: 1,
      selectedRows: [],
      showActions: false
    };
    if (!props.pendingDeviceIds.length) {
      props.getDevicesByStatus(DEVICE_STATES.pending);
    }
  }

  componentDidMount() {
    this.props.selectGroup();
    this.props.setDeviceFilters([]);
    this.timer = setInterval(() => this._getDevices(), refreshDeviceLength);
    this._getDevices(true);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.count !== this.props.count) {
      this.props.setDeviceFilters([]);
      this._getDevices();
    }
    const self = this;
    if (!self.props.devices.length && self.props.count && self.state.pageNo !== 1) {
      //if devices empty but count not, put back to first page
      self._handlePageChange(1);
    }
  }

  shouldComponentUpdate(nextProps) {
    return (
      !this.props.devices.every((device, index) => device === nextProps.devices[index]) ||
      this.props.globalSettings.id_attribute !== nextProps.globalSettings.id_attribute ||
      true
    );
  }

  /*
   * Devices to show
   */
  _getDevices(shouldUpdate = false, filters = []) {
    var self = this;
    self.setState({ pageNo: filters.length ? 1 : self.state.pageNo, pageLength: filters.length ? DEVICE_LIST_MAXIMUM_LENGTH : self.state.pageLength }, () =>
      self.props
        .getDevicesByStatus(DEVICE_STATES.pending, this.state.pageNo, this.state.pageLength, shouldUpdate)
        .catch(error => {
          console.log(error);
          var errormsg = error.error || 'Please check your connection.';
          self.props.setSnackbar(errormsg, 5000, '');
          console.log(errormsg);
        })
        .finally(() => {
          self.setState({ pageLoading: false, authLoading: null });
        })
    );
  }

  _sortColumn() {
    console.log('sort');
  }

  _handlePageChange(pageNo) {
    var self = this;
    self.setState({ selectedRows: [], currentPage: pageNo, pageLoading: true, expandRow: null, pageNo: pageNo }, () => self._getDevices(true));
  }

  onAuthorizationChange(rows, status) {
    var self = this;
    self.setState({ authLoading: true });
    // for each device, get id and id of authset & make api call to accept
    // if >1 authset, skip instead
    const deviceIds = rows.map(row => self.props.devices[row]);
    return self.props.updateDevicesAuth(deviceIds, status).then(() => {
      // refresh devices by calling function in parent
      self.props.restart();
      self.setState({ selectedRows: [], authLoading: false });
    });
  }

  onRowSelection(selection) {
    if (!this.props.onboardingComplete) {
      advanceOnboarding('devices-pending-accepting-onboarding');
    }
    this.setState({ selectedRows: selection });
  }

  render() {
    const self = this;
    const {
      acceptedDevices,
      count,
      devices,
      deviceLimit,
      disabled,
      filters,
      globalSettings,
      highlightHelp,
      onboardingComplete,
      openSettingsDialog,
      showHelptips,
      showOnboardingTips
    } = self.props;
    const { authLoading, pageLoading, selectedRows, showActions } = self.state;
    const limitMaxed = deviceLimit ? deviceLimit <= acceptedDevices : false;
    const limitNear = deviceLimit ? deviceLimit < acceptedDevices + devices.length : false;
    const selectedOverLimit = deviceLimit ? deviceLimit < acceptedDevices + selectedRows.length : false;

    const columnHeaders = [
      {
        title: globalSettings.id_attribute || 'Device ID',
        name: 'device_id',
        customize: openSettingsDialog,
        style: { flexGrow: 1 }
      },
      {
        title: 'First request',
        name: 'first_request',
        render: device => (device.created_ts ? <Time value={device.created_ts} format="YYYY-MM-DD HH:mm" /> : '-')
      },
      {
        title: 'Last check-in',
        name: 'last_checkin',
        render: device => <RelativeTime updateTime={device.updated_ts} />
      },
      {
        title: 'Status',
        name: 'status',
        render: device => (device.status ? <div className="capitalized">{device.status}</div> : '-')
      }
    ];

    var deviceLimitWarning =
      limitMaxed || limitNear ? (
        <p className="warning">
          <InfoIcon style={{ marginRight: '2px', height: '16px', verticalAlign: 'bottom' }} />
          {limitMaxed ? <span>You have reached</span> : null}
          {limitNear && !limitMaxed ? <span>You are nearing</span> : null} your limit of authorized devices: {acceptedDevices} of {deviceLimit}
        </p>
      ) : null;

    const deviceConnectingProgressed = getOnboardingStepCompleted('devices-pending-onboarding');
    let onboardingComponent = null;
    if (showHelptips && !onboardingComplete) {
      if (this.deviceListRef) {
        const element = this.deviceListRef ? this.deviceListRef.getElementsByClassName('body')[0] : null;
        onboardingComponent = getOnboardingComponentFor('devices-pending-onboarding', {
          anchor: { left: 200, top: element ? element.offsetTop + element.offsetHeight : 170 }
        });
      }
      if (selectedRows && this.authorizeRef) {
        const anchor = {
          left: this.authorizeRef.offsetLeft - this.authorizeRef.offsetWidth / 2,
          top: this.authorizeRef.offsetParent.offsetTop - this.authorizeRef.offsetParent.offsetHeight - this.authorizeRef.offsetHeight / 2
        };
        onboardingComponent = getOnboardingComponentFor('devices-pending-accepting-onboarding', { place: 'left', anchor });
      }
      if (acceptedDevices && !window.sessionStorage.getItem('pendings-redirect')) {
        window.sessionStorage.setItem('pendings-redirect', true);
        return <Redirect to="/devices" />;
      }
    }

    const pluralized = pluralize('devices', selectedRows.length);
    const actions = [
      { icon: <HighlightOffOutlinedIcon />, title: `Reject ${pluralized}`, action: () => self.onAuthorizationChange(selectedRows, DEVICE_STATES.rejected) },
      { icon: <CheckCircleIcon />, title: `Accept ${pluralized}`, action: () => self.onAuthorizationChange(selectedRows, DEVICE_STATES.accepted) }
    ];

    return (
      <div className="tab-container">
        {!!count && (
          <div className="align-center">
            <h3 className="inline-block margin-right">
              {count} {pluralize('devices', count)} pending authorization
            </h3>
            {!authLoading && <Filters identityOnly={true} onFilterChange={filters => self._getDevices(true, filters)} />}
          </div>
        )}
        <Loader show={authLoading} />
        {devices.length && (!pageLoading || authLoading !== 'all') ? (
          <div className="padding-bottom" ref={ref => (this.deviceListRef = ref)}>
            {deviceLimitWarning}
            <DeviceList
              {...self.props}
              {...self.state}
              className="pending"
              columnHeaders={columnHeaders}
              limitMaxed={limitMaxed}
              onSelect={selection => self.onRowSelection(selection)}
              onChangeRowsPerPage={pageLength => self.setState({ pageNo: 1, pageLength }, () => self._handlePageChange(1))}
              onPageChange={e => self._handlePageChange(e)}
              pageTotal={count}
              refreshDevices={shouldUpdate => self._getDevices(shouldUpdate)}
            />
          </div>
        ) : (
          <div>
            {showHelptips && showOnboardingTips && !onboardingComplete && !deviceConnectingProgressed ? (
              <DevicePendingTip />
            ) : (
              <div className={authLoading ? 'hidden' : 'dashboard-placeholder'}>
                <p>
                  {filters.length
                    ? `There are no pending devices matching the selected ${pluralize('filters', filters.length)}`
                    : 'There are no devices pending authorization'}
                </p>
                {highlightHelp ? (
                  <p>
                    Visit the <Link to="/help/getting-started">Help section</Link> to learn how to connect devices to the Mender server.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        )}

        {!!selectedRows.length && (
          <div className="flexbox fixedButtons">
            <div className="margin-right">
              {authLoading && <Loader style={{ width: '100px', top: '7px', position: 'relative' }} table={true} waiting={true} show={true} />}
              {selectedRows.length} {pluralize('devices', selectedRows.length)} selected
            </div>
            <SpeedDial
              ariaLabel="device-actions"
              className="margin-small"
              icon={<SpeedDialIcon />}
              disabled={disabled || limitMaxed || selectedOverLimit}
              onClose={() => self.setState({ showActions: false })}
              onOpen={() => self.setState({ showActions: true })}
              buttonRef={ref => (this.authorizeRef = ref)}
              open={showActions}
            >
              {actions.map(action => (
                <SpeedDialAction key={action.title} icon={action.icon} tooltipTitle={action.title} tooltipOpen onClick={action.action} />
              ))}
            </SpeedDial>
            {deviceLimitWarning}
          </div>
        )}
        {onboardingComponent ? onboardingComponent : null}
      </div>
    );
  }
}

const actionCreators = { getDevicesByStatus, selectGroup, setDeviceFilters, setSnackbar, updateDevicesAuth };

const mapStateToProps = state => {
  return {
    acceptedDevices: state.devices.byStatus.accepted.total || 0,
    count: state.devices.byStatus.pending.total,
    devices: state.devices.selectedDeviceList.slice(0, DEVICE_LIST_MAXIMUM_LENGTH),
    deviceLimit: state.devices.limit,
    filters: state.devices.filters || [],
    globalSettings: state.users.globalSettings,
    highlightHelp: !state.devices.byStatus.accepted.total,
    onboardingComplete: state.users.onboarding.complete,
    pendingDeviceIds: state.devices.byStatus.pending.deviceIds,
    showHelptips: state.users.showHelptips,
    showOnboardingTips: state.users.onboarding.showTips
  };
};

export default connect(mapStateToProps, actionCreators)(Pending);
