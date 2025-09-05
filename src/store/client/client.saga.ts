import {call, put, select, takeLatest} from 'redux-saga/effects';
import {
  bankStatementRequest,
  FilterRequest,
  getBankList,
  getClients,
  getClientsDetails,
  getKycBusinessChecked,
  getKycChecked,
  getLead,
  getLeadDesciption,
  getMasterBankList,
  getReport,
  getSoftSanction,
  getSoftSanctionBnkPro,
  getSoftSanctionRuleset,
  getTaskHistory,
  saveClientBasicDetails,
  saveClientsDetails,
  saveFirmDetails,
  saveVendorDetails,
  saveVisitDetails,
  TaskRecordsFilterRequest,
  updateClientBasicDetails,
  updateClientsDetails,
  uploadAdharFailure,
  uploadAdharRequest,
  uploadAdharSuccess,
  uploadCompanyInfoFailure,
  uploadCompanyInfoRequest,
  uploadCompanyInfoSuccess,
  uploadCompanyPanFailure,
  uploadCompanyPanRequest,
  uploadCompanyPanSuccess,
  uploadGoDownFailure,
  uploadGoDownRequest,
  uploadGoDownSuccess,
  uploadGstRequest,
  uploadGstSuccess,
  uploadKycFailure,
  uploadKycRequest,
  uploadKycSuccess,
  uploadPanFailure,
  uploadPanRequest,
  uploadPanSuccess,
  uploadResidenceFailure,
  uploadResidenceRequest,
  uploadResidenceSuccess,
  uploadShareholdingFailure,
  uploadShareholdingRequest,
  uploadShareholdingSuccess,
  uploadUdhyamFailure,
  uploadUdhyamRequest,
  uploadUdhyamSuccess,
} from './client.slice';
import {ClientApis} from '@services/api';
import axiosInstance from '@services/api/api';
import {
  clientActions,
  clientSelector,
  BasicDetailsResponse,
  IBankListResponse,
  IClientInfoSuccessResponse,
  ILeadProgressResponse,
  IRemarkReportResponse,
  ITaskHistoryResponse,
  IUploadKycDocumentPayload,
  IUploadKycDocumentResponse,
  IvisitResponse,
  IKycCheckedResponse,
  IUploadPanDocumentsPayload,
  IUploadPanDocumentsResponse,
  IUploadResidenceDetailsResponse,
  IUploadResidenceDetailsPayload,
  IUploadUdhyamPayload,
  IUploadUdhyamResponse,
  IUploadGstPayload,
  IUploadGstResponse,
  IUploadGoDownDetailsPayload,
  IUploadGodDownDetailsResponse,
  IUploadShareholdingPayload,
  IUploadShareholdingResponse,
  IuploadCompanyPanPayload,
  IuplaodCompanyPanResponse,
  IUploadAdharDocumnetsPayload,
  IUploadAdharDocumentResponse,
  IUploadCompanyInfoPayload,
  IUploadCompanyInfoResponse,
  ISoftSanctionResponse,
  BasicDetailsPayload,
  IVisitPayload,
  IFilterPayload,
  IBankStatementPayload,
  IKYCBusinessResponse,
} from '.';
import {Result} from '@utils/TryCatch';
import clientApi from '@services/api/client.api';
import {PayloadAction} from '@reduxjs/toolkit';
import moment from 'moment';
import {PayloadWithCallback} from '@type/global.types';
import {
  IFilterResponseDatum,
  ITaskRecordsFilterPayload,
  ITaskReordsFilterResponseDatum,
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
} from './client.types';
import Toast from 'react-native-toast-message';
import {userSelector, UserState} from '@store/user';
import {AxiosError} from 'axios';
import {decryptUtility, encryptUtility} from '@utils/crypto';
import {UserResponse} from '@screens/index';

function* handleGetClient(): unknown {
  console.log('Saga: handleGetClient called');
  const {data, error}: Result<IClientInfoSuccessResponse> = yield call(
    ClientApis.getAllClients,
  );
  console.log('Saga: API response:', {
    data: data?.data?.length || 0,
    error: !!error,
  });
  if (!error) {
    yield put(clientActions.setClientList(data.data));
    console.log('Saga: Client list set successfully');
  } else {
    yield put(clientActions.setClientList([]));
    console.log('Saga: Error occurred, setting empty list');
  }
}

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

function* handleGetLeadProgress(): unknown {
  try {
    console.log('Saga: handleGetLeadProgress called');
    const {data, error}: Result<ILeadProgressResponse> = yield call(
      clientApi.getLeadProgress,
    );
    console.log('Saga: API response:', {
      hasData: !!data,
      hasError: !!error,
      dataType: typeof data,
    });

    if (!error && data) {
      console.log(
        'Saga: Setting lead list with data length:',
        data.data?.length || 0,
      );
      yield put(clientActions.setLeadList(data.data));
    } else {
      console.log('Saga: Setting empty lead list due to error or no data');
      yield put(clientActions.setLeadList([]));
    }
  } catch (error) {
    console.log('Saga: Error fetching lead progress:', error);
    yield put(clientActions.setLeadList([]));
  }
}

function* handleGetLeadDesProgress({
  payload,
}: PayloadAction<PayloadWithCallback<string, [Array<any>]>>): unknown {
  const {data, error}: Result<ILeadProgressResponse> = yield call(
    clientApi.getLeadDesProgress,
    payload.payload,
  );
  if (!error) {
    payload.callbackSuccess?.(data.data);
  } else {
    payload.callbackError?.();
  }
}

function* handleGetTaskHistory(): unknown {
  const {data, error}: Result<ITaskHistoryResponse> = yield call(
    clientApi.getTaskHistory,
  );
  if (!error) {
    yield put(clientActions.setTaskHistoryList(data.data));
  } else {
    yield put(clientActions.setTaskHistoryList([]));
  }
}

function* saveBasicDetails(): unknown {
  const basicDetailForm: BasicDetailsType = yield select(
    clientSelector.getBasicDetailFormData,
  );
  const {id, first_name, last_name}: UserState = yield select(
    userSelector.getUserInfo,
  );
  const body: BasicDetailsPayload = {
    source_of_lead: basicDetailForm.sourceOfLead,
    location: encryptUtility(basicDetailForm.location),
    city: encryptUtility(basicDetailForm.city),
    state: encryptUtility(basicDetailForm.state ?? ''),
    address: encryptUtility(basicDetailForm.address),
    created_by: `${first_name} ${last_name}`,
    date_of_visit: moment(basicDetailForm.dateOfVisit).toISOString(),
    firm_name: encryptUtility(basicDetailForm.firmName),
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
    source_of_lead: basicDetailForm.sourceOfLead,
    location: encryptUtility(basicDetailForm.location),
    city: encryptUtility(basicDetailForm.city),
    state: encryptUtility(basicDetailForm.state ?? ''),
    address: encryptUtility(basicDetailForm.address),
    created_by: `${first_name} ${last_name}`,
    date_of_visit: moment(basicDetailForm.dateOfVisit).toISOString(),
    firm_name: encryptUtility(basicDetailForm.firmName),
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
    name_of_client: client.nameOfClient,
    contact_number: client.contactNumber,
    email: client.email,
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
  yield put(clientActions.getClientsDetails());
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
    name_of_client: client.nameOfClient,
    contact_number: client.contactNumber,
    email: client.email,
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
  yield put(clientActions.getClientsDetails());
  yield put(clientActions.setClientLoader(false));
  yield put(clientActions.setSavedClientsDetailsStatus(true));
  Toast.show({
    type: 'success',
    text1: data.message || 'Client details updated successfully.',
  });
}

function* getClientsDetailsSaga(): unknown {
  const clientId = yield select(clientSelector.getClientFormId);
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
  const body: FirmDetailsPayload = {
    firm_type: firmDetails.firmType,
    bank_name: encryptUtility(firmDetails.bankName),
    business_vintage: firmDetails.businessVintage,
    sector: firmDetails.sector,
    facility_type: firmDetails.facilityType,
    cibil_score: Number(firmDetails.cibilScore),
    credit_period_offer: Number(firmDetails.creditPeriodOffer),
    estimated_funding_required: Number(firmDetails.estimatedFundingRequired),
    existing_funding_sanctioned_amount: Number(
      firmDetails.existingFundingSanctionedAmount,
    ),
    monthly_turnover: Number(firmDetails.monthlyTurnover),
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

function* saveVendorDetailsSaga(): unknown {
  const clientId = yield select(clientSelector.getClientFormId);
  const vendorDetails: VendorDetailsType = yield select(
    clientSelector.getVendorDetailsFormData,
  );
  const body: VendorDetailsPayload = vendorDetails.map(vendor => ({
    product_category: vendor.productCategory ?? '',
    product_type: vendor.productType,
    vendor_name: vendor.vendorName,
    address: encryptUtility(vendor.address),
    city: encryptUtility(vendor.city),
    state: encryptUtility(vendor.state ?? ''),
    pin_code: vendor.pinCode,
    vendor_contact_number: vendor.vendorContactNumber,
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
      intent: visitDetails.intent ?? '',
      date_of_next_visit: moment(visitDetails.dateOfNextVisit).toISOString(),
      created_by: `${first_name} ${last_name}`,
    };
  } else {
    body = {
      client_response: visitDetails.userResponse,
      are_you_interested_for: visitDetails.interestedFor,
      reason_for_not_interested: visitDetails.reasonForNotInterested,
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

function* handleUploadKyc(action: PayloadAction<IUploadKycDocumentPayload>) {
  try {
    console.log('Called uploadKycRequest');
    const formData = new FormData();
    formData.append('doc', {
      uri: action.payload.doc.uri,
      name: action.payload.doc.name,
      type: action.payload.doc.type,
    } as any);
    formData.append('clientId', action.payload.clientId.toString());
    formData.append('uploaded_by', action.payload.uploaded_by);
    formData.append('params', action.payload.params);
    formData.append('client_name', action.payload.client_name);

    const {data, error}: {data: IUploadKycDocumentResponse | null; error: any} =
      yield call(ClientApis.uploadKycDocument, formData);
    if (data) {
      yield put(uploadKycSuccess(data));
    } else {
      yield put(uploadKycFailure(error?.message ?? 'Upload failed'));
    }
  } catch (err: any) {
    yield put(uploadKycFailure(err?.message ?? 'Something went wrong'));
  }
}

function* handleUploadPan(action: PayloadAction<IUploadPanDocumentsPayload>) {
  try {
    const {clientId, uploaded_by, doc, files} = action.payload;

    const formData = new FormData();
    formData.append('clientId', clientId.toString());
    formData.append('uploaded_by', uploaded_by);

    files.forEach((file, index) => {
      formData.append('doc', {
        // Unique key for each file
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    });

    doc.forEach((item, index) => {
      formData.append(`doc[${index}][name_as_per_pan]`, item.name_as_per_pan);
      formData.append(`doc[${index}][pan_number]`, item.pan_number);
      formData.append(`doc[${index}][dob]`, item.dob);
    });

    const {
      data,
      error,
    }: {data: IUploadPanDocumentsResponse | null; error: any} = yield call(
      ClientApis.uploadPanDocument,
      formData,
    );

    if (data) {
      yield put(uploadPanSuccess(data));
    } else {
      yield put(uploadPanFailure(error?.message ?? 'PAN Upload failed'));
    }
  } catch (err: any) {
    yield put(uploadPanFailure(err?.message ?? 'Something went wrong'));
  }
}

function* handleUploadAdhar(
  action: PayloadAction<IUploadAdharDocumnetsPayload>,
) {
  try {
    const {clientId, uploaded_by, doc, files} = action.payload;

    const formData = new FormData();
    formData.append('clientId', clientId.toString());
    formData.append('uploaded_by', uploaded_by);

    files.forEach(file => {
      formData.append('doc', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    });

    doc.forEach((item, index) => {
      formData.append(
        `doc[${index}][name_as_per_aadhar]`,
        item.name_as_per_aadhar,
      );
      formData.append(`doc[${index}[aadhar_number]`, item.aadhar_number);
    });
    const {
      data,
      error,
    }: {data: IUploadAdharDocumentResponse | null; error: any} = yield call(
      ClientApis.uploadAadharDocument,
      formData,
    );

    if (data) {
      yield put(uploadAdharSuccess(data));
    } else {
      yield put(uploadAdharFailure(error?.message ?? 'Adhar Upload failed'));
    }
  } catch (err: any) {
    yield put(uploadAdharFailure(err?.message ?? 'Something went wrong'));
  }
}

function* handleUploadResidence(
  action: PayloadAction<IUploadResidenceDetailsPayload>,
) {
  try {
    const formData = new FormData();
    formData.append('doc', {
      uri: action.payload.doc.uri,
      name: action.payload.doc.name,
      type: action.payload.doc.type,
    } as any);

    formData.append('clientId', action.payload.clientId.toString());
    formData.append('uploaded_by', action.payload.uploaded_by);
    formData.append('params', action.payload.params);
    formData.append('client_name', action.payload.client_name);
    formData.append('name_of_owner', action.payload.name_of_owner);
    formData.append('ownership_status', action.payload.ownership_status);

    const {
      data,
      error,
    }: {data: IUploadResidenceDetailsResponse | null; error: any} = yield call(
      ClientApis.uploadResidenceDocument,
      formData,
    );

    if (data) {
      yield put(uploadResidenceSuccess(data));
    } else {
      yield put(uploadResidenceFailure(error?.message ?? 'Upload failed'));
    }
  } catch (err: any) {
    yield put(uploadResidenceFailure(err?.message ?? 'Something went wrong'));
  }
}

function* handleUploadUdhyam(action: PayloadAction<IUploadUdhyamPayload>) {
  try {
    console.log('Uploading Udhyam Document...');

    const formData = new FormData();

    // Attach each file in doc[]
    action.payload.doc.forEach((file, index) => {
      formData.append('doc', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });

    // Text fields
    formData.append(
      'doc[name_as_per_udhyam]',
      action.payload.docDetails.name_as_per_udhyam,
    );
    formData.append('doc[urn_number]', action.payload.docDetails.urn_number);
    formData.append('clientId', action.payload.clientId.toString());
    formData.append('uploaded_by', action.payload.uploaded_by);

    // API Call
    const {data, error}: {data: IUploadUdhyamResponse | null; error: any} =
      yield call(ClientApis.uploadUdhyamDocument, formData);

    if (data) {
      yield put(uploadUdhyamSuccess(data));
    } else {
      yield put(uploadUdhyamFailure(error?.message ?? 'Upload failed'));
    }
  } catch (err: any) {
    yield put(uploadUdhyamFailure(err?.message ?? 'Something went wrong'));
  }
}

function* handleUploadGst(action: PayloadAction<IUploadGstPayload>) {
  try {
    console.log('Uploading GST Document...');

    const formData = new FormData();

    // Attach the document
    formData.append('doc', {
      uri: action.payload.doc.uri,
      name: action.payload.doc.name,
      type: action.payload.doc.type,
    } as any);

    // Append other form fields
    formData.append('clientId', action.payload.clientId.toString());
    formData.append('uploaded_by', action.payload.uploaded_by);
    formData.append('name_as_per_gst', action.payload.name_as_per_gst);
    formData.append('gst_number', action.payload.gst_number);
    formData.append('params', action.payload.params);

    // API Call
    const {data, error}: {data: IUploadGstResponse | null; error: any} =
      yield call(ClientApis.uploadGstDocument, formData);

    if (data) {
      yield put(uploadGstSuccess(data));
    } else {
      yield put(uploadKycFailure(error?.message ?? 'Upload failed'));
    }
  } catch (err: any) {
    yield put(uploadKycFailure(err?.message ?? 'Something went wrong'));
  }
}

function* handleUploadGoDown(
  action: PayloadAction<IUploadGoDownDetailsPayload>,
) {
  try {
    const formData = new FormData();
    formData.append('doc', {
      uri: action.payload.doc.uri,
      name: action.payload.doc.name,
      type: action.payload.doc.type,
    } as any);

    formData.append('clientId', action.payload.clientId.toString());
    formData.append('uploaded_by', action.payload.uploaded_by);
    formData.append('params', action.payload.params);
    formData.append('client_name', action.payload.client_name);
    formData.append('name_of_owner', action.payload.name_of_owner);
    formData.append('ownership_status', action.payload.ownership_status);

    const {
      data,
      error,
    }: {data: IUploadGodDownDetailsResponse | null; error: any} = yield call(
      ClientApis.uploadGoDownDocument,
      formData,
    );

    if (data) {
      yield put(uploadGoDownSuccess(data));
    } else {
      yield put(uploadGoDownFailure(error?.message ?? 'Upload failed'));
    }
  } catch (err: any) {
    yield put(uploadGoDownFailure(err?.message ?? 'Something went wrong'));
  }
}

function* handleUploadShareholding(
  action: PayloadAction<IUploadShareholdingPayload>,
) {
  try {
    console.log('Called UploadShareholdingRequest');
    const formData = new FormData();
    formData.append('doc', {
      uri: action.payload.doc.uri,
      name: action.payload.doc.name,
      type: action.payload.doc.type,
    } as any);
    formData.append('clientId', action.payload.clientId.toString());
    formData.append('uploaded_by', action.payload.uploaded_by);
    formData.append('params', action.payload.params);
    formData.append('client_name', action.payload.client_name);

    const {
      data,
      error,
    }: {data: IUploadShareholdingResponse | null; error: any} = yield call(
      ClientApis.uploadShareholdingDocument,
      formData,
    );
    if (data) {
      yield put(uploadShareholdingSuccess(data));
    } else {
      yield put(
        uploadGoDownFailure(error?.message ?? 'Shareholding Upload failed'),
      );
    }
  } catch (err: any) {
    yield put(
      uploadShareholdingFailure(err?.message ?? 'Something went wrong'),
    );
  }
}

function* handleUploadCompanyPan(
  action: PayloadAction<IuploadCompanyPanPayload>,
) {
  try {
    console.log('Uploading CompanyPan Document...');

    const formData = new FormData();

    action.payload.doc.forEach(file => {
      formData.append('doc', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });

    formData.append(
      'doc[name_as_per_pan]',
      action.payload.docDetails.name_as_per_pan,
    );
    formData.append('doc[pan_number]', action.payload.docDetails.pan_number);
    formData.append('clientId', action.payload.clientId.toString());
    formData.append('uploaded_by', action.payload.uploaded_by);

    const {data, error}: {data: IuplaodCompanyPanResponse | null; error: any} =
      yield call(ClientApis.uploadCompanyPanDocument, formData);

    if (data) {
      yield put(uploadCompanyPanSuccess(data));
    } else {
      yield put(uploadCompanyPanFailure(error?.message ?? 'Upload failed'));
    }
  } catch (err: any) {
    yield put(uploadCompanyPanFailure(err?.message ?? 'Something went wrong'));
  }
}

function* handleUploadCompanyInfo(
  action: PayloadAction<IUploadCompanyInfoPayload>,
) {
  try {
    const {clientId, uploaded_by, doc} = action.payload;

    const formData = new FormData();
    formData.append('clientId', clientId.toString());
    formData.append('uploaded_by', uploaded_by);

    doc.forEach(file => {
      formData.append('doc', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    });

    const {data, error}: {data: IUploadCompanyInfoResponse | null; error: any} =
      yield call(ClientApis.uploadCopmanyInfoDocument, formData);

    if (error) {
      yield put(
        uploadCompanyInfoFailure(error.message || 'Something went wrong'),
      );
    } else {
      yield put(uploadCompanyInfoSuccess(data!));
    }
  } catch (err: any) {
    yield put(
      uploadCompanyInfoFailure(err.message || 'Unexpected error occurred'),
    );
  }
}

function* hnadleGetBankList(): unknown {
  const {data, error}: Result<IBankListResponse> = yield call(
    clientApi.getBankList,
  );
  if (!error) {
    yield put(clientActions.setBankList(data.data));
  } else {
    yield put(clientActions.setBankList([]));
  }
}

function* handleGetKycChecked({payload}: PayloadAction<string>): unknown {
  const {data, error}: Result<IKycCheckedResponse> = yield call(
    clientApi.getKycChecked,
    payload,
  );
  if (!error) {
    yield put(clientActions.setKycCheckedList(data.data));
  } else {
    yield put(clientActions.setKycCheckedList([]));
  }
}

function* handleGetBusinessChecked({payload}: PayloadAction<string>): unknown {
  const {data, error}: Result<IKYCBusinessResponse> = yield call(
    clientApi.getBusinessKycChecked,
    payload,
  );
  if (!error) {
    yield put(clientActions.setKycBusinessCheckedList(data.data));
  } else {
    yield put(clientActions.setKycBusinessCheckedList([]));
  }
}

function* handleGetSoftSantion(): unknown {
  const {data, error}: Result<ISoftSanctionResponse> = yield call(
    ClientApis.getSoftSanction,
  );
  if (!error) {
    yield put(clientActions.setSoftSanctionList(data.data));
  } else {
    yield put(clientActions.setSoftSanctionList([]));
  }
}

function* handleGetSoftSantionBnkPro(action: {
  payload: {bank: string; product: string};
}): Generator<any, void, any> {
  const {bank, product} = action.payload;
  const {data, error}: Result<any> = yield call(
    clientApi.getSoftSanctionProductBank,
    bank,
    product,
  );
  if (!error) {
    yield put(clientActions.setSoftSanctionBnkProList(data || []));
  } else {
    yield put(clientActions.setSoftSanctionBnkProList([]));
  }
}

function* handleFilterbox(action: PayloadAction<IFilterPayload>) {
  try {
    const {data, error}: {data: IFilterResponseDatum | null; error: any} =
      yield call(clientApi.FilterBox, action.payload);

    if (data) {
      yield put(clientActions.FilterSucess(data));
    } else {
      yield put(clientActions.FilterFailure(error?.message || 'Unknown error'));
    }
  } catch (error: any) {
    yield put(clientActions.FilterFailure(error.message || 'Unexpected error'));
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

function* handleGetSoftSanctionRuleset(
  action: PayloadAction<{bank: string; product: string}>,
) {
  const {bank, product} = action.payload;
  const {data, error}: Result<any> = yield call(
    clientApi.getSoftSanctionRuleset,
    bank,
    product,
  );
  if (!error) {
    yield put(clientActions.setSoftSanctionRuleset(data || []));
  } else {
    yield put(
      clientActions.setSoftSanctionRulesetError('Failed to fetch ruleset'),
    );
  }
}

function* handleGetSoftSanctionClientList() {
  const {data, error}: Result<any> = yield call(
    clientApi.getSoftSanctionClientList,
  );
  if (!error) {
    yield put(clientActions.setSoftSanctionClientList(data || []));
  } else {
    yield put(
      clientActions.setSoftSanctionClientListError(
        'Failed to fetch client list',
      ),
    );
  }
}

function* handleGetSoftSanctionFields(action: any): Generator<any, void, any> {
  yield put(clientActions.setSoftSanctionFieldsLoading());
  const {bankName, productName} = action.payload;
  const {data, error}: Result<any> = yield call(
    clientApi.getSoftSanctionFields,
    bankName,
    productName,
  );
  if (!error) {
    if (Array.isArray(data)) {
      const grouped: Record<string, any[]> = {};
      data.forEach((item: any) => {
        if (!grouped[item.method_name]) grouped[item.method_name] = [];
        grouped[item.method_name].push(item);
      });
      yield put(clientActions.setSoftSanctionFields(grouped));
    } else {
      yield put(clientActions.setSoftSanctionFieldsError('No fields found'));
    }
  } else {
    yield put(
      clientActions.setSoftSanctionFieldsError('Failed to fetch fields'),
    );
  }
}

function* handleBankStatement(action: PayloadAction<IBankStatementPayload>) {
  try {
    const {clientId, uploaded_by, doc, files} = action.payload;

    const formData = new FormData();
    formData.append('clientId', clientId.toString());
    formData.append('uploaded_by', uploaded_by);

    doc.forEach((item, index) => {
      formData.append(`doc[${index}][account_number]`, item.account_number);
      formData.append(
        `doc[${index}][statement_duration]`,
        item.statement_duration,
      );
      formData.append(`doc[${index}][bank_name]`, item.bank_name);
      formData.append(`doc[${index}][acount_type]`, item.acount_type);
      formData.append(`doc[${index}][statement_from]`, item.statement_from);
      formData.append(`doc[${index}][statement_to]`, item.statement_to);
    });

    files.forEach((file, index) => {
      formData.append(`files[${index}]`, {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });

    const {data, error}: {data: any | null; error: any} = yield call(
      clientApi.bankStatement,
      formData,
    );

    if (data) {
      yield put(clientActions.bankStatementSuccess(data));
    } else {
      yield put(
        clientActions.bankStatementFailure(error?.message || 'Unknown error'),
      );
    }
  } catch (error: any) {
    yield put(
      clientActions.bankStatementFailure(error.message || 'Unexpected error'),
    );
  }
}

function* handleGetClientDetails(action: PayloadAction<number>) {
  try {
    const clientId = action.payload;
    console.log('Using axiosInstance baseURL for client details');
    // Clear previous client details
    yield put(clientActions.setClientDetails(null));
    const url = `/client-info-master/details/${clientId}`;
    console.log('API URL:', url, 'Method: GET');
    const response = yield call([axiosInstance, 'get'], url);
    console.log('Raw axios response status:', response.status);
    console.log('Raw axios response data:', response.data);
    console.log('API Response statusCode:', response.data.statusCode);
    console.log('API Response data array:', response.data.data);
    console.log(
      'API Response data length:',
      response.data.data ? response.data.data.length : 0,
    );
    console.log(
      'First data item:',
      response.data.data && response.data.data[0]
        ? response.data.data[0]
        : 'No data[0]',
    );
    console.log(
      'Extracted client data:',
      response.data.data && response.data.data[0]
        ? response.data.data[0]
        : 'No data found',
    );

    const clientData =
      response.data.data && response.data.data[0]
        ? response.data.data[0]
        : null;
    console.log('Setting client data in Redux:', clientData);
    yield put(clientActions.setClientDetails(clientData));
  } catch (error: any) {
    console.log('API Error:', error);
    yield put(
      clientActions.setClientDetailsError(
        error.message || 'Failed to fetch client details',
      ),
    );
  }
}

function* handleGetLeadProgressDetails(action: PayloadAction<number>) {
  try {
    console.log(
      'Saga: handleGetLeadProgressDetails called with clientId:',
      action.payload,
    );

    // Use the correct API function that calls the right endpoint with the lead ID
    const {data, error} = yield call(
      clientApi.getLeadDesProgress,
      action.payload.toString(),
    );

    console.log('Saga: Lead progress API response:', {
      hasData: !!data,
      hasError: !!error,
      dataType: typeof data,
      isArray: Array.isArray(data),
      dataLength: data?.length,
      errorMessage: error?.message,
    });

    if (!error && data && Array.isArray(data)) {
      const mapped = data.map((item: any) => ({
        id: item.id,
        status: item.current_status,
        date: item.completed_at
          ? new Date(item.completed_at).toISOString().slice(0, 10)
          : 'N/A',
        remark: item.remark ?? 'N/A',
        tat: item.turn_around_time?.toString() ?? 'N/A',
      }));
      console.log('Saga: Mapped data:', mapped);
      yield put(clientActions.setLeadProgressDetails(mapped));
      console.log(
        'Saga: Lead progress details set successfully, mapped items:',
        mapped.length,
      );
    } else {
      console.log('Saga: No valid data, setting empty array. Error:', error);
      yield put(clientActions.setLeadProgressDetails([]));
      console.log('Saga: No lead progress data found, setting empty array');
    }
  } catch (error: any) {
    console.log('Saga: Lead progress error:', error);
    yield put(
      clientActions.setLeadProgressDetailsError(
        error.message || 'Failed to fetch lead progress',
      ),
    );
  }
}

export default function* clientSaga() {
  yield takeLatest(getClients.type, handleGetClient);
  yield takeLatest(saveClientBasicDetails.type, saveBasicDetails);
  yield takeLatest(updateClientBasicDetails.type, updateBasicDetails);
  yield takeLatest(saveClientsDetails.type, saveClientsDetailsSaga);
  yield takeLatest(updateClientsDetails.type, updateClientsDetailsSaga);
  yield takeLatest(getClientsDetails.type, getClientsDetailsSaga);
  yield takeLatest(getMasterBankList.type, handleGetMasterBankList);
  yield takeLatest(saveFirmDetails.type, saveFirmDetailsSaga);
  yield takeLatest(saveVendorDetails.type, saveVendorDetailsSaga);
  yield takeLatest(saveVisitDetails.type, saveVisitDetailsSaga);

  yield takeLatest(getReport.type, handleGetRemarkReport);
  yield takeLatest(getLead.type, handleGetLeadProgress);
  yield takeLatest(getLeadDesciption.type, handleGetLeadDesProgress);
  yield takeLatest(getTaskHistory.type, handleGetTaskHistory);

  yield takeLatest(uploadKycRequest.type, handleUploadKyc);
  yield takeLatest(uploadPanRequest.type, handleUploadPan);
  yield takeLatest(uploadAdharRequest.type, handleUploadAdhar);
  yield takeLatest(uploadResidenceRequest.type, handleUploadResidence);
  yield takeLatest(uploadUdhyamRequest.type, handleUploadUdhyam);
  yield takeLatest(uploadGstRequest.type, handleUploadGst);
  yield takeLatest(uploadGoDownRequest.type, handleUploadGoDown);
  yield takeLatest(uploadShareholdingRequest.type, handleUploadShareholding);
  yield takeLatest(uploadCompanyInfoRequest.type, handleUploadCompanyInfo);
  yield takeLatest(uploadCompanyPanRequest.type, handleUploadCompanyPan);
  yield takeLatest(getBankList.type, hnadleGetBankList);
  yield takeLatest(getKycChecked.type, handleGetKycChecked);
  yield takeLatest(getKycBusinessChecked.type, handleGetBusinessChecked);
  yield takeLatest(getSoftSanction.type, handleGetSoftSantion);
  yield takeLatest(getSoftSanctionBnkPro.type, handleGetSoftSantionBnkPro);
  yield takeLatest(FilterRequest.type, handleFilterbox);
  yield takeLatest(TaskRecordsFilterRequest.type, handleTaskRecordsFilter);
  yield takeLatest(bankStatementRequest.type, handleBankStatement);
  yield takeLatest(getSoftSanctionRuleset.type, handleGetSoftSanctionRuleset);
  yield takeLatest(
    clientActions.getSoftSanctionClientList.type,
    handleGetSoftSanctionClientList,
  );
  yield takeLatest(
    clientActions.getSoftSanctionFields.type,
    handleGetSoftSanctionFields,
  );
  yield takeLatest(clientActions.getClientDetails.type, handleGetClientDetails);
  yield takeLatest(
    clientActions.getLeadProgressDetails.type,
    handleGetLeadProgressDetails,
  );
}
