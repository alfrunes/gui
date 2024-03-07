// Copyright 2019 Northern.tech AS
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
import { connect } from 'react-redux';

import { ArrowBack as ArrowBackIcon, ArrowCircleRight as ArrowForwardIcon, ArrowCircleRight as ArrowCircleRightIcon } from '@mui/icons-material';

import { bindActionCreators } from 'redux';

import { setOnboardingComplete } from '../../actions/onboardingActions';
import { toggle } from '../../helpers';
import Tracking from '../../tracking';
import { OnboardingTooltip } from '../common/mendertooltip';

const iconWidth = 30;
const iconStyle = { fontSize: 30 };

export const orientations = {
  top: {
    arrow: <ArrowCircleRightIcon style={{ ...iconStyle, transform: 'rotate(270deg)' }} />,
    placement: 'bottom',
    offsetStyle: style => {
      style.left = style.left - iconWidth / 2;
      return style;
    }
  },
  right: {
    arrow: <ArrowBackIcon style={iconStyle} />,
    placement: 'right',
    offsetStyle: style => {
      style.top = style.top - iconWidth / 2;
      style.left = style.left + iconWidth / 2;
      return style;
    }
  },
  bottom: {
    arrow: <ArrowCircleRightIcon style={{ ...iconStyle, transform: 'rotate(90deg)' }} />,
    placement: 'top',
    offsetStyle: style => {
      style.left = style.left - iconWidth / 2;
      return style;
    }
  },
  left: {
    arrow: <ArrowForwardIcon style={iconStyle} />,
    placement: 'left',
    offsetStyle: style => {
      style.top = style.top - iconWidth / 2;
      return style;
    }
  }
};

export const OnboardingIndicator = React.forwardRef(({ className = '', orientation: { arrow, placement }, style = {}, toggle, ...props }, ref) => (
  <div className={className} onClick={toggle} ref={ref} style={style} {...props}>
    <div className={`tooltip onboard-icon ${placement}`}>{arrow}</div>
  </div>
));
OnboardingIndicator.displayName = 'OnboardingIndicator';

const BaseOnboardingTipComponent = ({
  anchor,
  component,
  place = 'top',
  progress,
  progressTotal = 4,
  id = '1',
  setOnboardingComplete,
  actionButton = null,
  dismissText = null,
  ...others
}) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    Tracking.event({ category: 'onboarding', action: id });
    setOpen(true);
  }, []);

  const toggleVisibility = () => setOpen(toggle);

  const hide = () => setOpen(false);

  const orientation = orientations[place];
  const style = orientation.offsetStyle({ left: anchor.left, top: anchor.top, overflow: 'initial' });

  return (
    <OnboardingTooltip
      disableFocusListener
      disableHoverListener
      disableTouchListener
      id={id}
      onClose={hide}
      open={open}
      placement={orientation.placement}
      PopperProps={{
        disablePortal: true,
        popperOptions: {
          strategy: 'fixed',
          modifiers: [
            { name: 'flip', enabled: false },
            { name: 'preventOverflow', enabled: true, options: { boundary: window, altBoundary: false } }
          ]
        }
      }}
      title={
        <div className="content">
          {React.cloneElement(component, others)}
          <div className="flexbox space-between flexbox-grow">
            {progress ? <div>{`Step ${progress} of ${progressTotal}`}</div> : null}
            {!progress && (
              <a style={{ fontSize: 12, fontWeight: 500 }} onClick={() => setOnboardingComplete(true)}>
                {dismissText || 'No thanks, I don’t need help'}
              </a>
            )}
            {actionButton}
          </div>
        </div>
      }
    >
      <OnboardingIndicator className="onboard-tip" orientation={orientation} style={style} toggle={toggleVisibility} />
    </OnboardingTooltip>
  );
};

const mapDispatchToProps = dispatch => {
  return bindActionCreators({ setOnboardingComplete }, dispatch);
};

export const BaseOnboardingTip = connect(null, mapDispatchToProps)(BaseOnboardingTipComponent);
export default BaseOnboardingTip;
