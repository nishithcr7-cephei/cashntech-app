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

export const getSoftSanctionFields = (state: any) =>
  (state.softsan?.softSanctionFields as Record<string, any[]>) || {};
export const getSoftSanctionFieldsLoading = (state: any) =>
  state.softsan?.softSanctionFieldsLoading;
export const getSoftSanctionFieldsError = (state: any) =>
  state.softsan?.softSanctionFieldsError;

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
};

export default softSelector;


