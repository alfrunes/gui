import React from 'react';
import renderer from 'react-test-renderer';
import CopyCode from './copy-code';
import { undefineds } from '../../../../tests/mockData';

describe('CopyCode Component', () => {
  it('renders correctly', () => {
    const tree = renderer.create(<CopyCode code="sudo it all!" />).toJSON();
    expect(tree).toMatchSnapshot();
    expect(JSON.stringify(tree)).toEqual(expect.not.stringMatching(undefineds));
  });
});
