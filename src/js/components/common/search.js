// Copyright 2022 Northern.tech AS
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
import React, { useState } from 'react';

import { Search as SearchIcon } from '@mui/icons-material';
import { InputAdornment, TextField, inputClasses } from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import SearchDialog from './dialogs/searchdialog.js';

const useStyles = makeStyles()(theme => ({
  root: {
    input: {
      fontSize: '14px',
      color: theme.palette.text.inactive,
      ['::placeholder']: {
        opacity: 1
      }
    },
    [`.${inputClasses.root}`]: {
      [`&:before, &:hover:before, &.${inputClasses.focused}:after, &.${inputClasses.focused}:before`]: {
        border: 'none !important'
      }
    }
  },
  searchIcon: {
    color: theme.palette.text.inactive
  }
}));

const Search = ({ placeholder = 'Search devices', style = {} }) => {
  const [showDialog, setShowDialog] = useState(false);
  const { classes } = useStyles();

  return (
    <div>
      <TextField
        onClick={() => setShowDialog(true)}
        className={classes.root}
        readOnly
        InputProps={{
          autoComplete: 'off',
          readOnly: true,
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="disabled" fontSize="size" className={classes.searchIcon} />
            </InputAdornment>
          )
        }}
        placeholder={placeholder}
        size="small"
        style={style}
      />
      <SearchDialog open={showDialog} handleClose={() => setShowDialog(false)} />
    </div>
  );
};

export default Search;
