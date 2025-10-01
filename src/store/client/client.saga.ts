import {all, call, put, select, takeLatest} from 'redux-saga/effects';
import {
  deleteClientRequest,
  FilterRequest,
  getCityList,
  getClientBasicDetails,
  getClients,
  getClientsDetails,
  getFirmDetails,
  getMasterBankList,
  getReport,
  getVendorDetails,
  getVisitDetails,
  prepareClientForEdit,
  saveClientBasicDetails,
  saveClientsDetails,
  saveFirmDetails,
  saveVendorDetails,
  saveVisitDetails,
  saveVisitDetailsAndSubmit,
  TaskRecordsFilterRequest,
  updateClientBasicDetails,
  updateClientsDetails,
} from './client.slice';
import {ClientApis} from '@services/api';
import axiosInstance from '@services/api/api';
import {
  clientActions,
  clientSelector,
  BasicDetailsResponse,
  BasicDetailsPayload,
  IFilterPayload,
  IRemarkReportResponse,
} from '.';
import {Result} from '@utils/TryCatch';
import clientApi from '@services/api/client.api';
import taskApi from '@services/api/task.api';
import {PayloadAction} from '@reduxjs/toolkit';
import moment from 'moment';
import {PayloadWithCallback} from '@type/global.types';
import {
  IFilterResponseDatum,
  ITaskRecordsFilterPayload,
  ITaskReordsFilterResponseDatum,
  ITaskHistoryResponse,
  BasicDetailsType,
  ClientsDetailsType,
  ClientsDetailsPayload,
  ClientsDetailsResponseType,
  MasterBankResponse,
  FirmDetailsType,
  FirmDetailsPayload,
  VendorDetailsType,
  VendorDetailsPayload,
  VisitDetailsPayload,
  VisitDetailsType,
  ClientsFilterResponse,
  IDeleteResponse,
  ClientsFilterResponseDatum,
  GetBasicDetailsData,
  FirmDetailsData,
  VisitDetailsData,
  VendorDetailsDatum,
} from './client.types';
import Toast from 'react-native-toast-message';
import {userSelector, UserState} from '@store/user';
import {AxiosError} from 'axios';
import {decryptUtility, encryptUtility} from '@utils/crypto';
import {ProductCategory, UserResponse} from '@screens/index';
import Cities from '@constants/Cities';
import {tasklogActions} from '@store/tasklog';

function* handleGetRemarkReport(): unknown {
  const {data, error}: Result<IRemarkReportResponse> = yield call(
    ClientApis.getRemarkReport,
  );
  if (!error) {
    yield put(clientActions.setReportList(data.data));
  } else {
    yield put(clientActions.setReportList([]));
  }
}

function* handleGetClientRemarkReport(action: any): unknown {
  const {data, error}: Result<any> = yield call(
    ClientApis.getRemarkReportByClient,
    action.payload,
  );
  if (!error) {
    yield put(clientActions.setClientRemarkReportList(data.data || []));
  } else {
    yield put(clientActions.setClientRemarkReportList([]));
  }
}



function* handleGetTaskHistory(): unknown {
  const {first_name, last_name}: UserState = yield select(
    userSelector.getUserInfo,
  );
  const userName = `${first_name} ${last_name}`;
  const {data, error}: Result<ITaskHistoryResponse> = yield call(
    taskApi.getTaskHistory,
    userName,
  );
  if (!error) {
    yield put(tasklogActions.setTaskHistoryList(data.data));
  } else {
    yield put(tasklogActions.setTaskHistoryList([]));
  }
}

function* handleGetClientsFilter(
  action: PayloadAction<Record<string, string[]>>,
): unknown {
  const city = (action.payload?.['City'] ?? []).map(city =>
    encryptUtility(city),
  );
  const sector = action.payload?.['Sector'] ?? [];
  const source_of_lead = action.payload?.['Source of lead'] ?? [];
  
  // Use the correct payload structure for POST /client-info-master/filter
  const payload = {
    locations: city, // City data goes to locations
    firstNames: [], // Not used in current filter
    lastNames: [], // Not used in current filter
    sourceOfLead: source_of_lead, // Source of lead data
  };

  // Check if payload is empty (no filters applied)
  const hasFilters = city.length > 0 || sector.length > 0 || source_of_lead.length > 0;
  
  console.log('=== API Call Decision ===');
  console.log('hasFilters:', hasFilters);
  console.log('city.length:', city.length);
  console.log('sector.length:', sector.length);
  console.log('source_of_lead.length:', source_of_lead.length);
  console.log('Final payload:', payload);
  
  // Always use POST filter endpoint with correct payload structure
  console.log('Using getClientsFilter with payload:', payload);
  const result: Result<ClientsFilterResponse, AxiosError<{message: string}>> =
    yield call(ClientApis.getClientsFilter, payload);
  
  const {data, error} = result;
  
  // Debug logging
  console.log('=== Saga Debug - handleGetClientsFilter ===');
  console.log('hasFilters:', hasFilters);
  console.log('API Response data:', data);
  console.log('API Response data.data:', data?.data);
  console.log('API Response dataLength:', data?.data?.length);
  console.log('API Response error:', error);
  console.log('API Response error.response:', error?.response);
  console.log('API Response error.response.data:', error?.response?.data);
  console.log('API Response error.message:', error?.message);
  console.log('API Response error.status:', error?.status);
  console.log('==========================================');
  
  yield put(clientActions.setClientLoader(false));
  if (error) {
    if (error.status === 404) {
      yield put(clientActions.setClientList([]));
      return;
    }
    if (error.status === 500) {
      // Handle 500 Internal Server Error - try with a simpler payload
      console.warn('500 error received, this might be due to server-side payload validation issues');
      Toast.show({
        type: 'error',
        text1: 'Server error occurred while fetching client list. Please try again.',
      });
      return;
    }
    Toast.show({
      type: 'error',
      text1: error.response?.data?.message || 'Failed to fetch client list.',
    });
    return;
  }
  console.log('=== Processing client data ===');
  console.log('Raw data.data:', data.data);
  console.log('data.data type:', typeof data.data);
  console.log('data.data is array:', Array.isArray(data.data));
  
  const clientList = data.data.map((client, index) => {
    console.log(`Processing client ${index}:`, client);
    const processedClient = {
      ...client,
      firm_name: decryptUtility(client.firm_name),
      city: decryptUtility(client.city),
    };
    console.log(`Processed client ${index}:`, processedClient);
    return processedClient;
  });
  
  console.log('Final clientList:', clientList);
  console.log('Final clientList length:', clientList.length);
  console.log('Dispatching setClientList...');
  yield put(clientActions.setClientList(clientList));
  console.log('setClientList dispatched successfully');
}

function* handleGetCityList(): unknown {
  const {data, error}: Result<Array<string>> = yield call(
    ClientApis.getCityList,
  );
  yield put(clientActions.setClientLoader(false));
  if (!error) {
    yield put(clientActions.setCityList(data));
  }
}

function* handleDeleteClient(
  action: PayloadAction<{id: number; deleted_by: string}>,
): unknown {
  const {id, deleted_by} = action.payload;
  const currentClientList: Array<ClientsFilterResponseDatum> = yield select(
    clientSelector.getClientList,
  );
  const {
    error,
  }: Result<IDeleteResponse, AxiosError<{message?: string}>> = yield call(
    clientApi.deleteClient,
    id,
    {deleted_by},
  );
  yield put(clientActions.setClientLoader(false));
  if (error) {
    Toast.show({
      type: 'error',
      text1: error.response?.data?.message || 'Failed to delete client.',
    });
  } else {
    const updatedClientList = currentClientList.filter(
      client => client.id !== id,
    );
    yield put(clientActions.setClientList(updatedClientList));
  }
}

function* handlePrepareClientForEdit(action: PayloadAction<number>) {
  const clientId = action.payload;
  yield put(clientActions.resetAllClientFormData());
  yield put(clientActions.saveClientFormId(clientId));
  yield all([
    put(clientActions.getClientBasicDetails(clientId)),
    put(clientActions.getClientsDetails(clientId)),
    put(clientActions.getFirmDetails(clientId)),
    put(clientActions.getVendorDetails(clientId)),
    put(clientActions.getVisitDetails(clientId)),
  ]);
  yield put(clientActions.setSavedClientsDetailsStatus(true));
  yield put(clientActions.setSavedFirmDetailsStatus(true));
  yield put(clientActions.setSavedVendorDetailsStatus(true));
  yield put(clientActions.setSavedVisitDetailsStatus(true));
  yield put(clientActions.setClientLoader(false));
}

function* saveBasicDetails(): unknown {
  const basicDetailForm: BasicDetailsType = yield select(
    clientSelector.getBasicDetailFormData,
  );
  const {id, first_name, last_name}: UserState = yield select(
    userSelector.getUserInfo,
  );
  const body: BasicDetailsPayload = {
    source_of_lead: basicDetailForm.sourceOfLead.trim(),
    location: encryptUtility(basicDetailForm.location.trim()),
    city: encryptUtility(basicDetailForm.city),
    state: encryptUtility(basicDetailForm.state ?? ''),
    address: encryptUtility(basicDetailForm.address.trim()),
    created_by: `${first_name} ${last_name}`,
    date_of_visit: moment(basicDetailForm.dateOfVisit).toISOString(),
    firm_name: encryptUtility(basicDetailForm.firmName.trim()),
    pin_code: encryptUtility(basicDetailForm.pincode.trim()),
    program_type: basicDetailForm.programType,
    product_type: basicDetailForm.productType,
    userId: id,
  };
  const {data, error}: Result<BasicDetailsResponse> = yield call(
    ClientApis.saveBasicDetailForm,
    body,
  );
  yield put(clientActions.setClientLoader(false));
  if (error) {
    Toast.show({
      type: 'error',
      text1: 'Failed to save basic details.',
    });
    return;
  }
  yield put(clientActions.saveClientFormId(data.data));
  Toast.show({
    type: 'success',
    text1: data.message || 'Basic details saved successfully.',
  });
}

function* updateBasicDetails(): unknown {
  const basicDetailForm: BasicDetailsType = yield select(
    clientSelector.getBasicDetailFormData,
  );
  const {id, first_name, last_name}: UserState = yield select(
    userSelector.getUserInfo,
  );
  const clientId = yield select(clientSelector.getClientFormId);
  const body: BasicDetailsPayload = {
    source_of_lead: basicDetailForm.sourceOfLead.trim(),
    location: encryptUtility(basicDetailForm.location.trim()),
    city: encryptUtility(basicDetailForm.city),
    state: encryptUtility(basicDetailForm.state ?? ''),
    address: encryptUtility(basicDetailForm.address.trim()),
    created_by: `${first_name} ${last_name}`,
    date_of_visit: moment(basicDetailForm.dateOfVisit).toISOString(),
    firm_name: encryptUtility(basicDetailForm.firmName.trim()),
    pin_code: encryptUtility(basicDetailForm.pincode.trim()),
    program_type: basicDetailForm.programType,
    product_type: basicDetailForm.productType,
    userId: id,
    clientId: clientId,
  };
  const {data, error}: Result<BasicDetailsResponse> = yield call(
    ClientApis.saveBasicDetailForm,
    body,
  );
  yield put(clientActions.setClientLoader(false));
  if (error) {
    Toast.show({
      type: 'error',
      text1: 'Failed to update basic details.',
    });
    return;
  }
  Toast.show({
    type: 'success',
    text1: data.message || 'Basic details updated successfully.',
  });
}

function* getBasicDetailsSaga(action: PayloadAction<number>): unknown {
  const clientId = action.payload;
  const {data, error}: Result<GetBasicDetailsData> = yield call(
    ClientApis.getBasicDetailForm,
    clientId,
  );
  yield put(clientActions.setClientLoader(false));
  if (error) {
    Toast.show({
      type: 'error',
      text1: 'Failed to get basic details.',
    });
    return;
  }
  yield put(
    clientActions.setBasicDetails({
      sourceOfLead: data.source_of_lead,
      firmName: decryptUtility(data.firm_name),
      location: decryptUtility(data.location),
      state: decryptUtility(data.state) as keyof typeof Cities,
      city: decryptUtility(data.city),
      dateOfVisit: data.date_of_visit,
      pincode: decryptUtility(data.pin_code),
      address: decryptUtility(data.address),
      productType: data.product_type,
      programType: data.program_type,
      filedBy: data.file_by,
    }),
  );
}

function* saveClientsDetailsSaga(): unknown {
  const clientDetails: ClientsDetailsType = yield select(
    clientSelector.getClientDetailsFormData,
  );
  const {first_name, last_name}: UserState = yield select(
    userSelector.getUserInfo,
  );
  const clientId = yield select(clientSelector.getClientFormId);
  const body: ClientsDetailsPayload = clientDetails.map(client => ({
    client_type: client.clientType,
    name_of_client: client.nameOfClient.trim(),
    contact_number: client.contactNumber.trim(),
    email: client.email.trim(),
    created_by: `${first_name} ${last_name}`,
  }));
  const {
    data,
    error,
  }: Result<
    {statusCode: number; message: string},
    AxiosError<{message?: string}>
  > = yield call(ClientApis.saveClientsDetailsForm, clientId, body);
  if (error) {
    yield put(clientActions.setClientLoader(false));
    Toast.show({
      type: 'error',
      text1: error.response?.data?.message || 'Failed to save client details.',
    });
    return;
  }
  yield put(clientActions.getClientsDetails(clientId));
  yield put(clientActions.setClientLoader(false));
  yield put(clientActions.setSavedClientsDetailsStatus(true));
  Toast.show({
    type: 'success',
    text1: data.message || 'Client details saved successfully.',
  });
}

function* updateClientsDetailsSaga(): unknown {
  const clientDetails: ClientsDetailsType = yield select(
    clientSelector.getClientDetailsFormData,
  );
  const {first_name, last_name}: UserState = yield select(
    userSelector.getUserInfo,
  );
  const clientId = yield select(clientSelector.getClientFormId);
  const body: ClientsDetailsPayload = clientDetails.map(client => ({
    client_type: client.clientType,
    name_of_client: client.nameOfClient.trim(),
    contact_number: client.contactNumber.trim(),
    email: client.email.trim(),
    created_by: `${first_name} ${last_name}`,
    ...(client.id && {client_detail_id: client.id}),
  }));
  const {
    data,
    error,
  }: Result<
    {statusCode: number; message: string},
    AxiosError<{message?: string}>
  > = yield call(ClientApis.saveClientsDetailsForm, clientId, body);
  if (error) {
    yield put(clientActions.setClientLoader(false));
    Toast.show({
      type: 'error',
      text1:
        error.response?.data?.message || 'Failed to update client details.',
    });
    return;
  }
  yield put(clientActions.getClientsDetails(clientId));
  yield put(clientActions.setClientLoader(false));
  yield put(clientActions.setSavedClientsDetailsStatus(true));
  Toast.show({
    type: 'success',
    text1: data.message || 'Client details updated successfully.',
  });
}

function* getClientsDetailsSaga(action: PayloadAction<number>): unknown {
  const clientId = action.payload.toString();
  const {first_name, last_name}: UserState = yield select(
    userSelector.getUserInfo,
  );
  const {
    data,
    error,
  }: Result<
    ClientsDetailsResponseType,
    AxiosError<{message?: string}>
  > = yield call(ClientApis.getClientsDetailsForm, clientId);
  yield put(clientActions.setClientLoader(false));
  if (error) {
    Toast.show({
      type: 'error',
      text1: error.response?.data?.message || 'Failed to fetch client details.',
    });
    return;
  }
  const clientsDetails: ClientsDetailsType =
    data.data.map(client => ({
      key: Math.random().toString(36).substring(7),
      id: client.id,
      clientType: client.client_type,
      nameOfClient: decryptUtility(client.name_of_client),
      contactNumber: decryptUtility(client.contact_number),
      email: decryptUtility(client.email),
      createdBy: `${first_name} ${last_name}`,
    })) || [];

  yield put(clientActions.setAllClientsDetails(clientsDetails));
}

function* handleGetMasterBankList(): unknown {
  const {
    data,
    error,
  }: Result<MasterBankResponse, AxiosError<{message?: string}>> = yield call(
    ClientApis.getMasterBankList,
  );
  yield put(clientActions.setClientLoader(false));
  if (error) {
    Toast.show({
      type: 'error',
      text1:
        error.response?.data?.message || 'Failed to fetch master bank list.',
    });
    return;
  }
  yield put(clientActions.setMasterBankList(data.data));
}

function* saveFirmDetailsSaga(): unknown {
  const clientId = yield select(clientSelector.getClientFormId);
  
  const {first_name, last_name}: UserState = yield select(
    userSelector.getUserInfo,
  );
  
  const firmDetails: FirmDetailsType = yield select(
    clientSelector.getFirmDetailsFormData,
  );
  
  // Prepare bank names for encryption
  const bankNamesString = firmDetails.bankName.join(',');
  
  const encryptedBankNames = encryptUtility(bankNamesString);
  
  // Prepare facility types for API (comma-separated string)
  const facilityTypesString = firmDetails.facilityType.join(',');
  
  const body: FirmDetailsPayload = {
    firm_type: firmDetails.firmType,
    bank_name: encryptedBankNames, // Join multiple banks with comma and encrypt
    business_vintage: firmDetails.businessVintage.trim(),
    sector: firmDetails.sector,
    facility_type: facilityTypesString, // Join multiple facility types with comma
    cibil_score: Number(firmDetails.cibilScore),
    credit_period_offer: Number(firmDetails.creditPeriodOffer),
    estimated_funding_required: Number(firmDetails.estimatedFundingRequired),
    existing_funding_sanctioned_amount: Number(
      firmDetails.existingFundingSanctionedAmount,
    ),
    annual_turnover: Number(firmDetails.annualTurnover),
    created_by: `${first_name} ${last_name}`,
  };
  
  const {
    error,
  }: Result<
    {statusCode: number; message: string},
    AxiosError<{message?: string}>
  > = yield call(ClientApis.saveFirmDetailsForm, clientId, body);
  
  yield put(clientActions.setClientLoader(false));
  if (error) {
    Toast.show({
      type: 'error',
      text1: error.response?.data?.message || 'Failed to save firm details.',
    });
    return;
  }
  yield put(clientActions.setSavedFirmDetailsStatus(true));
  Toast.show({
    type: 'success',
    text1: 'Firm details saved successfully.',
  });
}

function* getFirmDetailsSaga(action: PayloadAction<number>): unknown {
  const clientId = action.payload;
  const {data, error}: Result<FirmDetailsData> = yield call(
    ClientApis.getFirmDetailsForm,
    clientId,
  );
  
  yield put(clientActions.setClientLoader(false));
  if (error) {
    Toast.show({
      type: 'error',
      text1: 'Failed to get firm details.',
    });
    return;
  }
  if (data) {
    
    // Handle bank_name - it might be a string or array from the API
    let bankNames: string[] = [];
    if (data.bank_name) {
      if (Array.isArray(data.bank_name)) {
        bankNames = data.bank_name.map(bank => decryptUtility(bank));
      } else if (typeof data.bank_name === 'string') {
        // If it's a string, it might be comma-separated or a single value
        const decryptedBankName = decryptUtility(data.bank_name);
        
        if (decryptedBankName && decryptedBankName.trim() !== '') {
          bankNames = decryptedBankName.includes(',') 
            ? decryptedBankName.split(',').map(bank => bank.trim()).filter(bank => bank !== '')
            : [decryptedBankName.trim()];
        } else {
          bankNames = [];
        }
      }
    }

    // Handle facility_type - parse comma-separated string back to array
    let facilityTypes: string[] = [];
    if (data.facility_type) {
      if (data.facility_type && data.facility_type.trim() !== '') {
        facilityTypes = data.facility_type.includes(',') 
          ? data.facility_type.split(',').map(type => type.trim()).filter(type => type !== '')
          : [data.facility_type.trim()];
      } else {
        facilityTypes = [];
      }
    }

    const firmDetails: Partial<FirmDetailsType> = {
      firmType: data.firm_type,
      bankName: bankNames,
      businessVintage: data.business_vintage,
      industry: data.industry,
      sector: data.sector,
      facilityType: facilityTypes,
      cibilScore: data.cibil_score?.toString() ?? '',
      creditPeriodOffer: data.credit_period_offer?.toString() ?? '',
      estimatedFundingRequired:
        data.estimated_funding_required?.toString() ?? '',
      existingFundingSanctionedAmount:
        data.existing_funding_sanctioned_amount?.toString() ?? '',
      annualTurnover: data.annual_turnover?.toString() ?? '',
    };
    
    yield put(clientActions.setFirmDetails(firmDetails));
  }
}

function* saveVendorDetailsSaga(): unknown {
  const clientId = yield select(clientSelector.getClientFormId);
  const vendorDetails: VendorDetailsType = yield select(
    clientSelector.getVendorDetailsFormData,
  );
  const body: VendorDetailsPayload = vendorDetails.map(vendor => ({
    product_category: vendor.productCategory ?? '',
    product_type: vendor.productType,
    vendor_name: vendor.vendorName.trim(),
    address: vendor.address.trim(),
    city: vendor.city,
    state: vendor.state ?? '',
    pin_code: vendor.pinCode.trim(),
    vendor_contact_number: vendor.vendorContactNumber.trim(),
    monthly_sales_value: Number(vendor.monthlySalesValue),
  }));
  const {
    error,
  }: Result<
    {statusCode: number; message: string},
    AxiosError<{message?: string}>
  > = yield call(ClientApis.saveVendorDetailsForm, clientId, body);
  yield put(clientActions.setClientLoader(false));
  if (error) {
    Toast.show({
      type: 'error',
      text1:
        error.response?.data?.message ||
        'Failed to save/update vendor details.',
    });
    return;
  }
  yield put(clientActions.setSavedVendorDetailsStatus(true));
  Toast.show({
    type: 'success',
    text1: 'Vendor details saved/updated successfully.',
  });
}

function* getVendorDetailsSaga(action: PayloadAction<number>): unknown {
  try {
    const clientId = action.payload;
    const {data, error}: Result<Array<VendorDetailsDatum>> = yield call(
      ClientApis.getVendorDetailsForm,
      clientId,
    );
    yield put(clientActions.setClientLoader(false));
    
    if (error) {
      console.error('getVendorDetailsSaga API error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to get vendor details.',
      });
      yield put(clientActions.setAllVendorDetails([]));
      return;
    }
    
    // Handle case where data is null or undefined
    if (!data || !Array.isArray(data)) {
      console.log('getVendorDetailsSaga: No vendor data received');
      yield put(clientActions.setAllVendorDetails([]));
      return;
    }
    
    const vendorDetails: VendorDetailsType = data.map(vendor => {
      try {
        return {
          productCategory: vendor.product_category as ProductCategory,
          productType: vendor.product_type || '',
          vendorName: decryptUtility(vendor.vendor_name || ''),
          address: decryptUtility(vendor.vendor_address || ''),
          city: decryptUtility(vendor.vendor_city || ''),
          state: decryptUtility(vendor.vendor_state || '') as keyof typeof Cities,
          pinCode: decryptUtility(vendor.vendor_pin_code || ''),
          vendorContactNumber: vendor.vendor_contact_number || '',
          vendorContactEmail: vendor.vendor_contact_email || '',
          monthlySalesValue: vendor.monthly_sales_value?.toString() || '0',
          key: Math.random().toString(36).substring(7),
        };
      } catch (vendorError) {
        console.error('getVendorDetailsSaga: Error processing vendor:', vendor, vendorError);
        // Return a safe default vendor object
        return {
          productCategory: undefined,
          productType: '',
          vendorName: '',
          address: '',
          city: '',
          state: undefined,
          pinCode: '',
          vendorContactNumber: '',
          vendorContactEmail: '',
          monthlySalesValue: '0',
          key: Math.random().toString(36).substring(7),
        };
      }
    });
    
    yield put(clientActions.setAllVendorDetails(vendorDetails));
  } catch (sagaError) {
    console.error('getVendorDetailsSaga: Unexpected error:', sagaError);
    yield put(clientActions.setClientLoader(false));
    yield put(clientActions.setAllVendorDetails([]));
    Toast.show({
      type: 'error',
      text1: 'Failed to get vendor details.',
    });
  }
}

function* saveVisitDetailsSaga(): unknown {
  const clientId = yield select(clientSelector.getClientFormId);
  const {first_name, last_name}: UserState = yield select(
    userSelector.getUserInfo,
  );
  const visitDetails: VisitDetailsType = yield select(
    clientSelector.getVisitDetailsFormData,
  );

  let body: VisitDetailsPayload;
  if (!visitDetails.userResponse) return;
  if (visitDetails.userResponse === UserResponse.INTERESTED) {
    body = {
      client_response: visitDetails.userResponse,
      intent: visitDetails.intent ?? ''.trim(),
      date_of_next_visit: moment(visitDetails.dateOfNextVisit).toISOString(),
      created_by: `${first_name} ${last_name}`,
    };
  } else {
    body = {
      client_response: visitDetails.userResponse,
      are_you_interested_for: visitDetails.interestedFor.trim(),
      reason_for_not_interested: visitDetails.reasonForNotInterested.trim(),
      created_by: `${first_name} ${last_name}`,
    };
  }
  const {
    error,
  }: Result<
    {statusCode: number; message: string},
    AxiosError<{message?: string}>
  > = yield call(ClientApis.saveVisitDetailsForm, clientId, body);
  yield put(clientActions.setClientLoader(false));
  if (error) {
    Toast.show({
      type: 'error',
      text1: error.response?.data?.message || 'Failed to save visit details.',
    });
    return;
  }
  yield put(clientActions.setSavedVisitDetailsStatus(true));
  Toast.show({
    type: 'success',
    text1: 'Visit details saved successfully.',
  });
}

function* saveVisitDetailsAndSubmitSaga(): unknown {
  const clientId = yield select(clientSelector.getClientFormId);
  const {first_name, last_name}: UserState = yield select(
    userSelector.getUserInfo,
  );
  const visitDetails: VisitDetailsType = yield select(
    clientSelector.getVisitDetailsFormData,
  );

  let body: VisitDetailsPayload;
  if (!visitDetails.userResponse) return;
  if (visitDetails.userResponse === UserResponse.INTERESTED) {
    body = {
      client_response: visitDetails.userResponse,
      intent: visitDetails.intent ?? ''.trim(),
      date_of_next_visit: moment(visitDetails.dateOfNextVisit).toISOString(),
      created_by: `${first_name} ${last_name}`,
    };
  } else {
    body = {
      client_response: visitDetails.userResponse,
      are_you_interested_for: visitDetails.interestedFor.trim(),
      reason_for_not_interested: visitDetails.reasonForNotInterested.trim(),
      created_by: `${first_name} ${last_name}`,
    };
  }
  const {
    error,
  }: Result<
    {statusCode: number; message: string},
    AxiosError<{message?: string}>
  > = yield call(ClientApis.saveVisitDetailsForm, clientId, body);
  yield put(clientActions.setClientLoader(false));
  if (error) {
    Toast.show({
      type: 'error',
      text1: error.response?.data?.message || 'Failed to save visit details.',
    });
    return;
  }
  yield put(clientActions.setSavedVisitDetailsStatus(true));
  Toast.show({
    type: 'success',
    text1: 'Form submitted successfully!',
  });
  
  // Navigate back after successful save and submit
  // Note: Navigation will be handled by the component after receiving the success state
}

function* getVisitDetailsFormData(action: PayloadAction<number>): unknown {
  const clientId = action.payload;
  const {data, error}: Result<VisitDetailsData> = yield call(
    ClientApis.getVisitDetailsForm,
    clientId,
  );
  yield put(clientActions.setClientLoader(false));
  if (error) {
    yield put(clientActions.setClientLoader(false));
    Toast.show({
      type: 'error',
      text1: 'Failed to get visit details.',
    });
    return;
  }
  let dataToSet: Partial<VisitDetailsType> = {
    userResponse: data.client_response ?? undefined,
    intent: data.intent ?? undefined,
    dateOfNextVisit: data.date_of_next_visit ?? undefined,
    interestedFor: data.are_you_interested_for ?? undefined,
    reasonForNotInterested: data.reason_for_not_interested ?? undefined,
  };
  yield put(clientActions.setVisitDetails(dataToSet));
}



function* handleFilterbox(action: PayloadAction<IFilterPayload>) {
  try {
    const {data, error}: {data: IFilterResponseDatum | null; error: AxiosError<{message?: string}> | null} =
      yield call(clientApi.FilterBox, action.payload);

    if (data) {
      yield put(clientActions.FilterSucess(data));
    } else {
      yield put(clientActions.FilterFailure(error?.response?.data?.message || error?.message || 'Unknown error'));
    }
  } catch (error: any) {
    yield put(clientActions.FilterFailure(error.response?.data?.message || error.message || 'Unexpected error'));
  }
}

function* handleTaskRecordsFilter(
  action: PayloadAction<ITaskRecordsFilterPayload>,
) {
  try {
    const {
      data,
      error,
    }: {data: ITaskReordsFilterResponseDatum | null; error: any} = yield call(
      clientApi.taskRecordsFilter,
      action.payload,
    );
    if (data) {
      yield put(clientActions.TaskRecordsFilterSucess(data));
    } else {
      yield put(
        clientActions.TaskRecordsFailure(error?.message || 'Unkown error'),
      );
    }
  } catch (error: any) {
    yield put(
      clientActions.TaskRecordsFailure(error.message || 'Unexpected error'),
    );
  }
}



function* handleGetClientDetails(action: PayloadAction<number>): Generator<any, void, any> {
  try {
    const clientId = action.payload;
    // Clear previous client details
    yield put(clientActions.setClientDetails(null));
    const url = `/client-info-master/details/${clientId}`;
    const response = yield call([axiosInstance, 'get'], url);

    const clientData =
      response.data.data && response.data.data[0]
        ? response.data.data[0]
        : null;
    yield put(clientActions.setClientDetails(clientData));
  } catch (error: any) {
    yield put(
      clientActions.setClientDetailsError(
        error.message || 'Failed to fetch client details',
      ),
    );
  }
}


export default function* clientSaga() {
  yield takeLatest(getClients.type, handleGetClientsFilter);
  yield takeLatest(getCityList.type, handleGetCityList);
  yield takeLatest(saveClientBasicDetails.type, saveBasicDetails);
  yield takeLatest(updateClientBasicDetails.type, updateBasicDetails);
  yield takeLatest(getClientBasicDetails.type, getBasicDetailsSaga);
  yield takeLatest(saveClientsDetails.type, saveClientsDetailsSaga);
  yield takeLatest(updateClientsDetails.type, updateClientsDetailsSaga);
  yield takeLatest(getClientsDetails.type, getClientsDetailsSaga);
  yield takeLatest(getMasterBankList.type, handleGetMasterBankList);
  yield takeLatest(saveFirmDetails.type, saveFirmDetailsSaga);
  yield takeLatest(getFirmDetails.type, getFirmDetailsSaga);
  yield takeLatest(saveVendorDetails.type, saveVendorDetailsSaga);
  yield takeLatest(getVendorDetails.type, getVendorDetailsSaga);
  yield takeLatest(saveVisitDetails.type, saveVisitDetailsSaga);
  yield takeLatest(saveVisitDetailsAndSubmit.type, saveVisitDetailsAndSubmitSaga);
  yield takeLatest(getVisitDetails.type, getVisitDetailsFormData);
  yield takeLatest(prepareClientForEdit.type, handlePrepareClientForEdit);
  yield takeLatest(deleteClientRequest.type, handleDeleteClient);
  yield takeLatest(getReport.type, handleGetRemarkReport);
  yield takeLatest(clientActions.getClientRemarkReport.type, handleGetClientRemarkReport);

  yield takeLatest(FilterRequest.type, handleFilterbox);
  yield takeLatest(TaskRecordsFilterRequest.type, handleTaskRecordsFilter);
  yield takeLatest(clientActions.getClientDetails.type, handleGetClientDetails);
}
