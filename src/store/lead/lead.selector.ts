import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const _selectState = (state: RootState) => state.lead;

const getLeadProgress = createSelector(_selectState, _state => _state.leadList);
const getLeadLoader = createSelector(_selectState, _state => _state.leadLoader);

const getLeadProgressDetails = createSelector(
  _selectState,
  _state => _state.leadProgressDetails,
);
const getLeadProgressDetailsLoading = createSelector(
  _selectState,
  _state => _state.leadProgressDetailsLoading,
);
const getLeadProgressDetailsError = createSelector(
  _selectState,
  _state => _state.leadProgressDetailsError,
);

export default {
  getLeadProgress,
  getLeadLoader,
  getLeadProgressDetails,
  getLeadProgressDetailsLoading,
  getLeadProgressDetailsError,
};
