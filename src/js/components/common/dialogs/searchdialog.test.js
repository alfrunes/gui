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
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Search as SearchIcon } from '@mui/icons-material';
import { Dialog, DialogContent, DialogTitle, InputAdornment, TextField, inputClasses, toolbarClasses } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import pluralize from 'pluralize';

import { setSearchState } from '../../../actions/appActions.js';
import { setDeviceInfoHighlight } from '../../../actions/deviceActions.js';
import { SORTING_OPTIONS, TIMEOUTS } from '../../../constants/appConstants.js';
import { getIdAttribute, getMappedDevicesList, getOnboardingState, getUserSettings } from '../../../selectors/index.js';
import { useDebounce } from '../../../utils/debouncehook.js';
import { getHeaders } from '../../devices/authorized-devices.js';
import { routes } from '../../devices/base-devices.js';
import Devicelist from '../../devices/devicelist.js';
import Loader from '../loader.js';

const endAdornment = (
  <InputAdornment position="end">
    <Loader show small style={{ marginTop: -10 }} />
  </InputAdornment>
);

const useStyles = makeStyles()(theme => ({
  DialogTitle: {
    width: 648,
    borderBottom: `1px solid ${theme.palette.border.colors.primary}`,
    [`.${inputClasses.root}`]: {
      [`&:before, &:hover:before, &.${inputClasses.focused}:after`]: {
        border: 'none',
        outline: 'none'
      }
    }
  },
  Devicelist: {
    ['&.deviceList']: {
      marginTop: 25,
      paddingLeft: 0,
      minWidth: 'auto',
      gridTemplateColumns: '1fr 1fr 1fr 1fr !important'
    },
    [`.${toolbarClasses.root}`]: {
      paddingLeft: 0
    }
  },
  summary: {
    marginTop: 13,
    color: theme.palette.text.inactive
  },
  searchIcon: {
    fontSize: 24
  }
}));

export const SearchDialog = ({ open, handleClose }) => {
  const { classes } = useStyles();
  const [searchValue, setSearchValue] = useState('');
  const searchState = useSelector(state => state.app.searchState);
  const onSearchUpdated = ({ target: { value } }) => setSearchValue(value);

  const onSearch = searchTerm => dispatch(setSearchState({ searchTerm, page: 1 }));
  const debouncedSearchTerm = useDebounce(searchValue, TIMEOUTS.debounceDefault);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
    dispatch(setDeviceInfoHighlight(debouncedSearchTerm));
  }, [debouncedSearchTerm]);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { columnSelection } = useSelector(getUserSettings);
  const customColumnSizes = useSelector(state => state.users.customColumns);
  const devices = useSelector(state => getMappedDevicesList(state, 'search'));
  const idAttribute = useSelector(getIdAttribute);
  const onboardingState = useSelector(getOnboardingState);
  const [columnHeaders, setColumnHeaders] = useState(getHeaders(columnSelection, routes.devices.defaultSearchHeaders, idAttribute));

  const { isSearching, searchTotal, sort = {} } = searchState;
  const { direction: sortDown = SORTING_OPTIONS.desc, key: sortCol } = sort;

  useEffect(() => {
    const columnHeaders = getHeaders(columnSelection, routes.devices.defaultSearchHeaders, idAttribute);
    setColumnHeaders(columnHeaders);
  }, [columnSelection, idAttribute.attribute]);

  const onDeviceSelect = device => {
    close();
    setTimeout(() => navigate(`/devices/${device.id}`), TIMEOUTS.debounceShort);
  };

  const close = () => {
    handleClose();
    setSearchValue('');
  };

  const handlePageChange = page => {
    dispatch(setSearchState({ page }));
  };

  const onSortChange = attribute => {
    let changedSortCol = attribute.name;
    let changedSortDown = sortDown === SORTING_OPTIONS.desc ? SORTING_OPTIONS.asc : SORTING_OPTIONS.desc;
    if (changedSortCol !== sortCol) {
      changedSortDown = SORTING_OPTIONS.desc;
    }
    dispatch(
      setSearchState({
        page: 1,
        sort: { direction: changedSortDown, key: changedSortCol, scope: attribute.scope }
      })
    );
  };
  const adornment = isSearching ? { endAdornment } : {};
  return (
    <Dialog open={open} onClose={close} maxWidth="md">
      <DialogTitle className={classes.DialogTitle}>
        <TextField
          autoFocus
          InputProps={{
            autoComplete: 'off',
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
            ...adornment
          }}
          onChange={onSearchUpdated}
          size="small"
          value={searchValue}
          style={{ marginTop: 0 }}
        />
      </DialogTitle>
      <DialogContent>
        <div className={classes.summary}>{`${searchTotal ? searchTotal : 'No'} ${pluralize('device', searchTotal)} found for "${searchValue}"`}</div>
        {!!searchTotal && (
          <Devicelist
            className={classes.Devicelist}
            columnHeaders={columnHeaders}
            customColumnSizes={customColumnSizes}
            deviceListState={{ perPage: 10, sort: {} }}
            devices={devices}
            idAttribute={idAttribute}
            onboardingState={onboardingState}
            onSort={onSortChange}
            PaginationProps={{ rowsPerPageOptions: [10] }}
            pageTotal={searchTotal}
            onPageChange={handlePageChange}
            pageLoading={isSearching}
            onExpandClick={onDeviceSelect}
            highlight={searchValue}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
