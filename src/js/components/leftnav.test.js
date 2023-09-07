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
import React from 'react';

import { defaultState, undefineds } from '../../../tests/mockData';
import { render } from '../../../tests/setupTests';
import LeftNav from './leftnav';

describe('LeftNav Component', () => {
  it('renders correctly', async () => {
    const { baseElement } = render(<LeftNav />);
    const view = baseElement.firstChild.firstChild;
    expect(view).toMatchSnapshot();
    expect(view).toEqual(expect.not.stringMatching(undefineds));
  });
});

describe('FeedbackLink Component', () => {
  it('presented in the Left navigation', async () => {
    const { getByText } = render(<LeftNav />);
    const feedbackLink = getByText('Feedback');
    expect(feedbackLink).toBeInTheDocument();
  });
  it('contains proper user email address in the link', async () => {
    const currentUserEmail = defaultState.users.byId[defaultState.users.currentUser].email;
    const { getByText } = render(<LeftNav />);
    const feedbackLink = getByText('Feedback');
    const hrefAttribute = feedbackLink.getAttribute('href');
    expect(hrefAttribute).toContain(currentUserEmail);
  });
});
