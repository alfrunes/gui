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

import { undefineds } from '../../../../tests/mockData';
import { render } from '../../../../tests/setupTests';
import DeviceLink from './device-link.js';

const deviceId = 'device-id';
describe('Device link component', () => {
  it('renders correctly', async () => {
    const { baseElement: view } = render(<DeviceLink id={deviceId} />);
    expect(view).toMatchSnapshot();
    expect(view).toEqual(expect.not.stringMatching(undefineds));
  });
  it('correct link', async () => {
    const { baseElement: view } = render(<DeviceLink id={deviceId} />);
    expect(view.querySelector('a')).toHaveAttribute('href', `/devices/${deviceId}`);
  });
  it('child element passed to the link', async () => {
    const linkText = 'link text';
    const { baseElement: view } = render(<DeviceLink id={deviceId}>{linkText}</DeviceLink>);
    expect(view.querySelector('a')).toHaveTextContent(linkText);
  });
});
