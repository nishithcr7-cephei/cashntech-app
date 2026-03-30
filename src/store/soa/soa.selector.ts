import {RootState} from '../app/store';

export const programListSelector = (state: RootState) => state.soa.programList;
export const soaLoadingSelector = (state: RootState) => state.soa.loading;
export const soaErrorSelector = (state: RootState) => state.soa.error;
export const soaPageSelector = (state: RootState) => state.soa.page;
export const soaHasMoreSelector = (state: RootState) => state.soa.hasMore;
export const totalProgramsSelector = (state: RootState) => state.soa.totalPrograms;
