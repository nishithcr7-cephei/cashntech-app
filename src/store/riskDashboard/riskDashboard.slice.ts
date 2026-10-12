import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {
  AlertDispatchFilters,
  AlertDispatchRow,
  AsyncSlot,
  BankRiskDetail,
  BorrowerRiskRow,
  EcosystemRiskData,
  FetchMode,
  FilterOption,
  initialAlertFilters,
  initialRiskDashboardState,
  PartyRiskProfile,
  RefreshPayload,
} from './riskDashboard.types';

const startSlot = (slot: AsyncSlot<any>, mode?: FetchMode) => {
  const background = !!mode?.background && slot.data != null;
  slot.loading = !mode?.refresh && !background;
  slot.refreshing = !!mode?.refresh;
  slot.updating = background;
  slot.error = null;
};

const finishSlot = <T>(slot: AsyncSlot<T>, data: T | null) => {
  slot.data = data as any;
  slot.loading = false;
  slot.refreshing = false;
  slot.updating = false;
  slot.fetchedAt = Date.now();
};

/** A failed background refetch keeps the old data on screen instead of an error page. */
const failSlot = (slot: AsyncSlot<any>, error: string) => {
  const keepData = slot.updating && slot.data != null;
  slot.loading = false;
  slot.refreshing = false;
  slot.updating = false;
  slot.error = keepData ? null : error;
};

const riskDashboardSlice = createSlice({
  name: 'riskDashboard',
  initialState: initialRiskDashboardState,
  reducers: {
    // Ecosystem Risk Profile
    fetchEcosystemRiskRequest: (state, action: PayloadAction<RefreshPayload>) => {
      startSlot(state.ecosystem, action.payload);
    },
    fetchEcosystemRiskSuccess: (state, action: PayloadAction<EcosystemRiskData>) => {
      finishSlot(state.ecosystem, action.payload);
    },
    fetchEcosystemRiskFailure: (state, action: PayloadAction<string>) => {
      failSlot(state.ecosystem, action.payload);
    },

    // Bank Risk Detail — data is cleared when a different bank is opened.
    fetchBankRiskDetailRequest: (
      state,
      action: PayloadAction<{bankId: string} & FetchMode>,
    ) => {
      if (state.bankDetail.bankId !== action.payload.bankId) {
        state.bankDetail.data = null;
        state.bankDetail.fetchedAt = null;
      }
      state.bankDetail.bankId = action.payload.bankId;
      startSlot(state.bankDetail, action.payload);
    },
    fetchBankRiskDetailSuccess: (
      state,
      action: PayloadAction<BankRiskDetail | null>,
    ) => {
      finishSlot(state.bankDetail, action.payload);
    },
    fetchBankRiskDetailFailure: (state, action: PayloadAction<string>) => {
      failSlot(state.bankDetail, action.payload);
    },

    // Party Risk Profile
    fetchPartyRiskProfileRequest: (
      state,
      action: PayloadAction<{partyId: string} & FetchMode>,
    ) => {
      if (state.partyProfile.partyId !== action.payload.partyId) {
        state.partyProfile.data = null;
        state.partyProfile.fetchedAt = null;
      }
      state.partyProfile.partyId = action.payload.partyId;
      startSlot(state.partyProfile, action.payload);
    },
    fetchPartyRiskProfileSuccess: (
      state,
      action: PayloadAction<PartyRiskProfile>,
    ) => {
      finishSlot(state.partyProfile, action.payload);
    },
    fetchPartyRiskProfileFailure: (state, action: PayloadAction<string>) => {
      failSlot(state.partyProfile, action.payload);
    },

    // Alert Dashboard — the saga fetches with the filters stored here.
    fetchAlertDispatchesRequest: (state, action: PayloadAction<RefreshPayload>) => {
      startSlot(state.alerts, action.payload);
    },
    fetchAlertDispatchesSuccess: (
      state,
      action: PayloadAction<AlertDispatchRow[]>,
    ) => {
      finishSlot(state.alerts, action.payload);
    },
    fetchAlertDispatchesFailure: (state, action: PayloadAction<string>) => {
      failSlot(state.alerts, action.payload);
    },
    /** Apply: stores filters; the saga issues exactly one fetch. */
    applyAlertFilters: (state, action: PayloadAction<AlertDispatchFilters>) => {
      state.alerts.filters = action.payload;
    },
    /** Clear: resets filters; the saga issues exactly one fetch. */
    clearAlertFilters: state => {
      state.alerts.filters = initialAlertFilters;
    },

    // Alert filter dropdowns (banks + programs), fetched once per session.
    fetchAlertFilterOptionsRequest: state => {
      state.filterOptions.loading = true;
      state.filterOptions.error = null;
    },
    fetchAlertFilterOptionsSuccess: (
      state,
      action: PayloadAction<{banks: FilterOption[]; programs: FilterOption[]}>,
    ) => {
      state.filterOptions.banks = action.payload.banks;
      state.filterOptions.programs = action.payload.programs;
      state.filterOptions.loading = false;
      state.filterOptions.loaded = true;
    },
    fetchAlertFilterOptionsFailure: (state, action: PayloadAction<string>) => {
      state.filterOptions.loading = false;
      state.filterOptions.error = action.payload;
    },

    // Borrower Risk Dashboard
    fetchBorrowerRiskRequest: (state, action: PayloadAction<RefreshPayload>) => {
      startSlot(state.borrowers, action.payload);
    },
    fetchBorrowerRiskSuccess: (state, action: PayloadAction<BorrowerRiskRow[]>) => {
      finishSlot(state.borrowers, action.payload);
    },
    fetchBorrowerRiskFailure: (state, action: PayloadAction<string>) => {
      failSlot(state.borrowers, action.payload);
    },

    resetRiskDashboardState: () => initialRiskDashboardState,
  },
});

export const {
  fetchEcosystemRiskRequest,
  fetchEcosystemRiskSuccess,
  fetchEcosystemRiskFailure,
  fetchBankRiskDetailRequest,
  fetchBankRiskDetailSuccess,
  fetchBankRiskDetailFailure,
  fetchPartyRiskProfileRequest,
  fetchPartyRiskProfileSuccess,
  fetchPartyRiskProfileFailure,
  fetchAlertDispatchesRequest,
  fetchAlertDispatchesSuccess,
  fetchAlertDispatchesFailure,
  applyAlertFilters,
  clearAlertFilters,
  fetchAlertFilterOptionsRequest,
  fetchAlertFilterOptionsSuccess,
  fetchAlertFilterOptionsFailure,
  fetchBorrowerRiskRequest,
  fetchBorrowerRiskSuccess,
  fetchBorrowerRiskFailure,
  resetRiskDashboardState,
} = riskDashboardSlice.actions;

export default riskDashboardSlice.reducer;
