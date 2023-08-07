// Copyright 2020 Northern.tech AS
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
import React, { memo, useEffect, useState } from 'react';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { makeStyles } from 'tss-react/mui';

import moment from 'moment';

const useStyles = makeStyles()(theme => ({
  datePicker: {
    position: 'relative',
    minWidth: 180,
    marginRight: theme.spacing(2),
    border: `1px solid ${theme.palette.border.colors.button}`,
    borderRadius: 4,
    padding: '12px 16px',
    label: {
      color: theme.palette.text.secondary,
      position: 'absolute',
      top: -9,
      left: theme.spacing(),
      background: theme.palette.surface.primary,
      zIndex: 2,
      display: 'inline-block',
      padding: '0 4px',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: 0.5,
      transform: 'none'
    },
    'label+div': {
      margin: 0
    }
  }
}));

export const TimeframePicker = ({ onChange, ...props }) => {
  const { classes } = useStyles();
  const [tonight] = useState(moment().endOf('day'));
  const [endDate, setEndDate] = useState(moment(props.endDate) > tonight ? tonight : moment(props.endDate));
  const [startDate, setStartDate] = useState(moment(props.startDate));

  useEffect(() => {
    setEndDate(moment(props.endDate) > tonight ? tonight : moment(props.endDate));
    setStartDate(moment(props.startDate));
  }, [props.tonight, props.endDate, props.startDate]);

  const handleChangeStartDate = date => {
    let currentEndDate = endDate.clone();
    if (date > currentEndDate) {
      currentEndDate = date;
      currentEndDate.endOf('day');
    }
    date.startOf('day');
    onChange(date.toISOString(), currentEndDate.toISOString());
  };

  const handleChangeEndDate = date => {
    let currentStartDate = startDate.clone();
    if (date < currentStartDate) {
      currentStartDate = date;
      currentStartDate.startOf('day');
    }
    date.endOf('day');
    onChange(currentStartDate.toISOString(), date.toISOString());
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: 440 }}>
      <div>Date and time range</div>
      <div className="flexbox">
        <DatePicker
          className={classes.datePicker}
          onChange={handleChangeStartDate}
          label="Start"
          format="D/M/Y"
          value={startDate}
          maxDate={props.endDate ? endDate : tonight}
          slotProps={{ textField: { InputProps: { disableUnderline: true } } }}
        />
        <DatePicker
          className={classes.datePicker}
          onChange={handleChangeEndDate}
          slotProps={{ textField: { InputProps: { disableUnderline: true } } }}
          label="End"
          format="D/M/Y"
          value={endDate}
          maxDate={tonight}
        />
      </div>
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  return !(prevProps.endDate != nextProps.endDate || prevProps.startDate != nextProps.startDate);
};

export default memo(TimeframePicker, areEqual);
