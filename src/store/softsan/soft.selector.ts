import {createSelector} from '@reduxjs/toolkit';
import {RootState} from '@store/app/store';

const _selectState = (state: RootState) => (state as any).softsan;

export const getSoftSanctionMethod = createSelector(
  _selectState,
  _state => _state.SoftSanctionData,
);

export const getSoftSanctionBnkPro = createSelector(
  _selectState,
  _state => _state.SoftSanctionBNKPROData,
);

export const getSoftSanctionRuleset = createSelector(
  _selectState,
  _state => _state.rulesetData,
);
export const getSoftSanctionRulesetLoading = createSelector(
  _selectState,
  _state => _state.rulesetLoading,
);
export const getSoftSanctionRulesetError = createSelector(
  _selectState,
  _state => _state.rulesetError,
);

export const getSoftSanctionClientList = createSelector(
  _selectState,
  _state => _state.softSanctionClientList,
);
export const getSoftSanctionClientLoading = createSelector(
  _selectState,
  _state => _state.softSanctionClientLoading,
);
export const getSoftSanctionClientError = createSelector(
  _selectState,
  _state => _state.softSanctionClientError,
);

export const getSoftSanctionFields = createSelector(
  _selectState,
  _state => (_state.softSanctionFields as Record<string, any[]>) || {},
);

export const getSoftSanctionFieldsLoading = createSelector(
  _selectState,
  _state => _state.softSanctionFieldsLoading,
);

export const getSoftSanctionFieldsError = createSelector(
  _selectState,
  _state => _state.softSanctionFieldsError,
);

export const getSoftSanctionResult = createSelector(
  _selectState,
  _state => _state.softSanctionResult,
);

export const getSoftSanctionResultLoading = createSelector(
  _selectState,
  _state => _state.softSanctionResultLoading,
);

export const getSoftSanctionResultError = createSelector(
  _selectState,
  _state => _state.softSanctionResultError,
);

const softSelector = {
  getSoftSanctionMethod,
  getSoftSanctionBnkPro,
  getSoftSanctionRuleset,
  getSoftSanctionRulesetLoading,
  getSoftSanctionRulesetError,
  getSoftSanctionClientList,
  getSoftSanctionClientLoading,
  getSoftSanctionClientError,
  getSoftSanctionFields,
  getSoftSanctionFieldsLoading,
  getSoftSanctionFieldsError,
  getSoftSanctionResult,
  getSoftSanctionResultLoading,
  getSoftSanctionResultError,
};

export default softSelector;
