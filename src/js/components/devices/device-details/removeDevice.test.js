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
import React from 'react';

import userEvent from '@testing-library/user-event';

import { defaultState, undefineds } from '../../../../../tests/mockData';
import { render } from '../../../../../tests/setupTests';
import RemoveDevice from './removeDevice.js';
import { act } from '@testing-library/react';

describe('RemoveDevice Component', () => {
  it('renders correctly', async () => {
    const { baseElement } = render(<RemoveDevice device={defaultState.devices.byId.c1} />);
    const view = baseElement.firstChild.firstChild;
    expect(view).toMatchSnapshot();
    expect(view).toEqual(expect.not.stringMatching(undefineds));
  });
  test('opens dialog on remove button click', async () => {
    const { getByText } = render(<RemoveDevice device={defaultState.devices.byId.c1} />);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await act(async () => {
      await user.click(getByText(/Remove device/i));
    });
    const removeDeviceDialogText = getByText('Are you sure you want to remove this device?');
    expect(removeDeviceDialogText).toBeInTheDocument();
  });
});
