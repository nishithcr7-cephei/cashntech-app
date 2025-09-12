import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {VisitState, VisitDetailsItem, SalesmanItem, LocationItem} from './visit.types';

const initialState: VisitState = {
  visitLoader: false,
  visitDetailsList: [],
  visitDetailsError: null,
  
  salesmanLoader: false,
  salesmanList: [],
  salesmanError: null,
  
  locationsLoader: false,
  locationsList: [],
  locationsError: null,
  
  saveVisitLoader: false,
  saveVisitError: null,
};

const visitSlice = createSlice({
  name: 'visit',
  initialState,
  reducers: {
    // Visit Details List Actions
    getVisitDetailsListRequest: (state) => {
      state.visitLoader = true;
      state.visitDetailsError = null;
    },
    getVisitDetailsListSuccess: (state, action: PayloadAction<VisitDetailsItem[]>) => {
      state.visitLoader = false;
      state.visitDetailsList = action.payload;
      state.visitDetailsError = null;
    },
    getVisitDetailsListFailure: (state, action: PayloadAction<string>) => {
      state.visitLoader = false;
      state.visitDetailsError = action.payload;
    },
    
    // Salesman List Actions
    getSalesmanListRequest: (state) => {
      state.salesmanLoader = true;
      state.salesmanError = null;
    },
    getSalesmanListSuccess: (state, action: PayloadAction<SalesmanItem[]>) => {
      state.salesmanLoader = false;
      state.salesmanList = action.payload;
      state.salesmanError = null;
    },
    getSalesmanListFailure: (state, action: PayloadAction<string>) => {
      state.salesmanLoader = false;
      state.salesmanError = action.payload;
    },
    
    // Locations List Actions
    getLocationsListRequest: (state) => {
      state.locationsLoader = true;
      state.locationsError = null;
    },
    getLocationsListSuccess: (state, action: PayloadAction<LocationItem[]>) => {
      state.locationsLoader = false;
      state.locationsList = action.payload;
      state.locationsError = null;
    },
    getLocationsListFailure: (state, action: PayloadAction<string>) => {
      state.locationsLoader = false;
      state.locationsError = action.payload;
    },
    
    // Save Visit Form Actions
    saveVisitFormRequest: (state) => {
      state.saveVisitLoader = true;
      state.saveVisitError = null;
    },
    saveVisitFormSuccess: (state) => {
      state.saveVisitLoader = false;
      state.saveVisitError = null;
    },
    saveVisitFormFailure: (state, action: PayloadAction<string>) => {
      state.saveVisitLoader = false;
      state.saveVisitError = action.payload;
    },
    
    // Clear errors
    clearVisitErrors: (state) => {
      state.visitDetailsError = null;
      state.salesmanError = null;
      state.locationsError = null;
      state.saveVisitError = null;
    },
  },
});

export const {
  getVisitDetailsListRequest,
  getVisitDetailsListSuccess,
  getVisitDetailsListFailure,
  getSalesmanListRequest,
  getSalesmanListSuccess,
  getSalesmanListFailure,
  getLocationsListRequest,
  getLocationsListSuccess,
  getLocationsListFailure,
  saveVisitFormRequest,
  saveVisitFormSuccess,
  saveVisitFormFailure,
  clearVisitErrors,
} = visitSlice.actions;

export default visitSlice.reducer;
