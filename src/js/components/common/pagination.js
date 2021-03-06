import React from 'react';

import { FirstPage as FirstPageIcon, LastPage as LastPageIcon, KeyboardArrowLeft, KeyboardArrowRight } from '@material-ui/icons';
import { IconButton, TablePagination, TextField } from '@material-ui/core';

import { DEVICE_LIST_MAXIMUM_LENGTH } from '../../constants/deviceConstants';

const defaultRowsPerPageOptions = [10, 20, DEVICE_LIST_MAXIMUM_LENGTH];
const paginationIndex = 1;

class TablePaginationActions extends React.Component {
  constructor(props, context) {
    super(props, context);
    const pageNo = props.page ? props.page + paginationIndex : 1;
    this.state = { pageNo };
  }

  componentDidUpdate(prevProps, prevState) {
    const currentPage = this.props.page + paginationIndex;
    if ((currentPage !== this.state.pageNo && !(prevState.pageNo !== this.state.pageNo)) || prevProps.rowsPerPage !== this.props.rowsPerPage) {
      this.setState({ pageNo: currentPage });
    }
  }

  onChange = event => {
    const self = this;
    const { pageNo } = self.state;
    const input = event.target.value;
    let value = Number(event.target.value);
    if (input === '') {
      value = input;
    } else if (isNaN(Number(input))) {
      value = pageNo;
    }
    if (value !== pageNo) {
      self.setState({ pageNo: value });
    }
  };

  onKeyPress = event => {
    const self = this;
    const { count, rowsPerPage } = self.props;
    if (event.key == 'Enter') {
      event.preventDefault();
      const newPage = Math.min(Math.max(paginationIndex, event.target.value), Math.ceil(count / rowsPerPage));
      return self.onPaging(newPage);
    }
  };

  onPaging = newPage => {
    return this.setState({ pageNo: newPage }, () => this.props.onChangePage(newPage));
  };

  render() {
    const self = this;
    const { count, page, rowsPerPage } = self.props;
    const currentPage = page + paginationIndex;
    const pages = Math.ceil(count / rowsPerPage);

    return (
      <div className="flexbox">
        <IconButton onClick={() => self.onPaging(paginationIndex)} disabled={currentPage === paginationIndex}>
          <FirstPageIcon />
        </IconButton>
        <IconButton onClick={() => self.onPaging(currentPage - 1)} disabled={currentPage === paginationIndex}>
          <KeyboardArrowLeft />
        </IconButton>
        <div className="flexbox" style={{ alignItems: 'baseline' }}>
          <TextField
            value={self.state.pageNo}
            onChange={self.onChange}
            onKeyUp={self.onKeyPress}
            margin="dense"
            style={{ minWidth: '30px', maxWidth: '30px', marginRight: '10px' }}
          />
          {`/ ${pages}`}
        </div>
        <IconButton onClick={() => self.onPaging(currentPage + 1)} disabled={currentPage >= Math.ceil(count / rowsPerPage)}>
          <KeyboardArrowRight />
        </IconButton>
        <IconButton
          onClick={() => self.onPaging(Math.max(paginationIndex, Math.ceil(count / rowsPerPage)))}
          disabled={currentPage >= Math.ceil(count / rowsPerPage)}
        >
          <LastPageIcon />
        </IconButton>
      </div>
    );
  }
}

const Pagination = props => {
  const { className, page, onChangeRowsPerPage, onChangePage, ...remainingProps } = props;
  return (
    <TablePagination
      className={`flexbox margin-top ${className || ''}`}
      classes={{ spacer: 'flexbox no-basis' }}
      component="div"
      labelDisplayedRows={() => ''}
      labelRowsPerPage="Rows"
      rowsPerPageOptions={defaultRowsPerPageOptions}
      onChangeRowsPerPage={e => onChangeRowsPerPage(e.target.value)}
      page={page - paginationIndex}
      onChangePage={onChangePage}
      ActionsComponent={TablePaginationActions}
      {...remainingProps}
    />
  );
};

export default Pagination;
