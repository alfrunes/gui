// Copyright 2015 Northern.tech AS
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
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import './../less/main.less';
import App from './components/app';
import ErrorBoundary from './errorboundary';
import store from './reducers';

const cache = createCache({
  key: 'mui',
  prepend: true
});

export const AppProviders = () => (
  <React.StrictMode>
    <Provider store={store}>
      <CacheProvider value={cache}>
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <ErrorBoundary>
            <BrowserRouter basename="ui">
              <App />
            </BrowserRouter>
          </ErrorBoundary>
        </LocalizationProvider>
      </CacheProvider>
    </Provider>
  </React.StrictMode>
);

const welcomeMessage = `Welcome to the Alvaldi project!

Does this page need fixes or improvements?

Open an issue, or contribute a fix to:

- https://github.com/NorthernTechHQ/alvaldi-gui

🤝 Contribute to Alvaldi: https://github.com/NorthernTechHQ/alvaldi
🔎 Ask about problems, and report issues: https://alvaldi.com
🚀 We like your curiosity! Help us improve Alvaldi by joining the team: https://northern.tech/careers
`;

console.log(welcomeMessage);
const root = ReactDOM.createRoot(document.getElementById('main') || document.createElement('div'));
root.render(<AppProviders />);
