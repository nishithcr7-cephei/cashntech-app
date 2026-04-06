import {RootState} from '../app/store';

export const programListSelector = (state: RootState) => state.soa.programList;
export const soaLoadingSelector = (state: RootState) => state.soa.loading;
export const soaErrorSelector = (state: RootState) => state.soa.error;
export const totalProgramsSelector = (state: RootState) => state.soa.totalPrograms;
