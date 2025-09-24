import {all, call, put, takeLatest} from 'redux-saga/effects';
import {
  bankStatementRequest,
  bankStatementSuccess,
  bankStatementFailure,
  getBankStatementInfoRequest,
  getBankStatementInfoSuccess,
  getBankStatementInfoFailure,
  getBankStatementDetailRequest,
  getBankStatementDetailSuccess,
  getBankStatementDetailFailure,
  getBankList,
  getKycBusinessChecked,
  getKycChecked,
  setBankList,
  setKycCheckedList,
  setKycBusinessCheckedList,
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
  getKycClients,
  setKycClientList,
  getKycDetailsRequest,
  getKycDetailsSuccess,
  getKycDetailsFailure,
  getPersonalKycRequest,
  getPersonalKycSuccess,
  getPersonalKycFailure,
  getBusinessKycRequest,
  getBusinessKycSuccess,
  getBusinessKycFailure,
} from './kyc.slice';
import {ClientApis} from '@services/api';
import kycApi from '@services/api/kyc.api';
import {
  IBankListResponse,
  IBankStatementInfoData,
  IBankStatementDetailData,
  IUploadKycDocumentPayload,
  IUploadKycDocumentResponse,
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
  IBankStatementPayload,
  IKYCBusinessResponse,
  IKycClientListResponseDatum,
  IKycDetailsPayload,
  IKycDetailsResponseDatum,
  IGetPersonalKycPayload,
  IGetPersonalKycResponse,
  IPersonalKycDocument,
} from './kyc.types';
import {Result} from '@utils/TryCatch';
import {PayloadAction} from '@reduxjs/toolkit';

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
          yield call(kycApi.uploadKycDocument, formData);
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
          kycApi.uploadPanDocument,
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

    // Add doc as JSON string (as per backend specification)
    formData.append('doc', JSON.stringify(doc));

    // Add files as separate field
    files.forEach(file => {
      formData.append('files', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    });

        const {
          data,
          error,
        }: {data: IUploadAdharDocumentResponse | null; error: any} = yield call(
          kycApi.uploadAadharDocument,
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
          kycApi.uploadResidenceDocument,
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

    // Attach file if exists
    if (action.payload.doc) {
      formData.append('doc', {
        uri: action.payload.doc.uri,
        name: action.payload.doc.name,
        type: action.payload.doc.type,
      } as any);
    }

    // Text fields
    formData.append('name_as_per_udhyam', action.payload.name_as_per_udhyam);
    formData.append('urn_number', action.payload.urn_number);
    formData.append('clientId', action.payload.clientId.toString());
    formData.append('uploaded_by', action.payload.uploaded_by);
    formData.append('params', action.payload.params);

        // API Call
        const {data, error}: {data: IUploadUdhyamResponse | null; error: any} =
          yield call(kycApi.uploadUdhyamDocument, formData);

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
          yield call(kycApi.uploadGstDocument, formData);

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
          kycApi.uploadGoDownDocument,
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
          kycApi.uploadShareholdingDocument,
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

    // Add the document file
    action.payload.doc.forEach(file => {
      formData.append('doc', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });

    // Add the required fields as per API specification
    formData.append('name_as_per_pan', action.payload.docDetails.name_as_per_pan);
    formData.append('pan_number', action.payload.docDetails.pan_number);
    formData.append('clientId', action.payload.clientId.toString());
    formData.append('uploaded_by', action.payload.uploaded_by);
    formData.append('params', 'CompanyPan');

        const {data, error}: {data: IuplaodCompanyPanResponse | null; error: any} =
          yield call(kycApi.uploadCompanyPanDocument, formData);

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
          yield call(kycApi.uploadCopmanyInfoDocument, formData);

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
    kycApi.getBankList,
  );
  if (!error) {
    yield put(setBankList(data.data));
  } else {
    yield put(setBankList([]));
  }
}

function* handleGetKycChecked({payload}: PayloadAction<string>): unknown {
  const {data, error}: Result<IKycCheckedResponse> = yield call(
    kycApi.getKycChecked,
    payload,
  );
  if (!error) {
    yield put(setKycCheckedList(data.data));
  } else {
    yield put(setKycCheckedList([]));
  }
}

function* handleGetBusinessChecked({payload}: PayloadAction<string>): unknown {
  const {data, error}: Result<IKYCBusinessResponse> = yield call(
    kycApi.getBusinessKycChecked,
    payload,
  );
  if (!error) {
    yield put(setKycBusinessCheckedList(data.data)); // data.data is now string[]
  } else {
    yield put(setKycBusinessCheckedList([]));
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
        uri: (file as any).uri,
        name: (file as any).name,
        type: (file as any).type,
      } as any);
    });

        const {data, error}: {data: any | null; error: any} = yield call(
          kycApi.bankStatement,
          formData,
        );

    if (data) {
      yield put(bankStatementSuccess(data));
    } else {
      yield put(
        bankStatementFailure(error?.message || 'Unknown error'),
      );
    }
  } catch (error: any) {
    yield put(
      bankStatementFailure(error.message || 'Unexpected error'),
    );
  }
}

function* handleGetKycClients(action: PayloadAction<number>): unknown {
  const {data, error}: Result<IKycClientListResponseDatum[]> = yield call(
    kycApi.getKycClients,
    action.payload,
  );
  if (!error) {
    yield put(setKycClientList(data));
  } else {
    yield put(setKycClientList([]));
  }
}

function* handleGetKycDetails(action: PayloadAction<IKycDetailsPayload>): unknown {
  console.log('KYC Saga: Starting getKycDetails with payload:', action.payload);
  const {data, error}: Result<IKycDetailsResponseDatum[]> = yield call(
    kycApi.getKycDetails,
    action.payload,
  );
  console.log('KYC Saga: API response:', {data, error});
  if (!error) {
    console.log('KYC Saga: Success - data length:', data?.length);
    yield put(getKycDetailsSuccess(data));
  } else {
    console.log('KYC Saga: Error:', error?.message);
    yield put(getKycDetailsFailure(error?.message ?? 'Failed to fetch KYC details'));
  }
}

function* handleGetPersonalKyc(action: PayloadAction<IGetPersonalKycPayload>): unknown {
  const {data, error}: Result<IPersonalKycDocument[]> = yield call(
    kycApi.getPersonalKycDocuments,
    action.payload,
  );
  if (!error) {
    yield put(getPersonalKycSuccess(data));
  } else {
    yield put(getPersonalKycFailure(error?.message ?? 'Failed to fetch personal KYC documents'));
  }
}

function* handleGetBusinessKyc(action: PayloadAction<IGetPersonalKycPayload>): unknown {
  console.log('🏢🏢🏢 BUSINESS KYC SAGA CALLED - NOT PERSONAL KYC 🏢🏢🏢');
  console.log('🏢 Business KYC Saga: Starting with payload:', action.payload);
  const {data, error}: Result<IPersonalKycDocument[]> = yield call(
    kycApi.getBusinessKycDocuments,
    action.payload,
  );
  console.log('🏢 Business KYC Saga: API response:', {data, error});
  if (!error) {
    console.log('🏢 Business KYC Saga: Success - data length:', data?.length);
    yield put(getBusinessKycSuccess(data));
  } else {
    console.log('🏢 Business KYC Saga: Error:', error?.message);
    yield put(getBusinessKycFailure(error?.message ?? 'Failed to fetch business KYC documents'));
  }
}

function* handleGetBankStatementInfo(action: PayloadAction<string>): unknown {
  const {data, error}: Result<IBankStatementInfoData[]> = yield call(
    kycApi.getBankStatementInfo,
    action.payload,
  );
  
  if (!error) {
    yield put(getBankStatementInfoSuccess(data));
  } else {
    yield put(getBankStatementInfoFailure(error?.message ?? 'Failed to fetch bank statement info'));
  }
}

function* handleGetBankStatementDetail(action: PayloadAction<string>): unknown {
  const {data, error}: Result<IBankStatementDetailData> = yield call(
    kycApi.getBankStatementDetail,
    action.payload,
  );
  
  if (!error) {
    yield put(getBankStatementDetailSuccess(data));
  } else {
    yield put(getBankStatementDetailFailure(error?.message ?? 'Failed to fetch bank statement detail'));
  }
}

export default function* kycSaga() {
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
  yield takeLatest(bankStatementRequest.type, handleBankStatement);
  yield takeLatest(getBankStatementInfoRequest.type, handleGetBankStatementInfo);
  yield takeLatest(getBankStatementDetailRequest.type, handleGetBankStatementDetail);
  yield takeLatest(getKycClients.type, handleGetKycClients);
  yield takeLatest(getKycDetailsRequest.type, handleGetKycDetails);
  yield takeLatest(getPersonalKycRequest.type, handleGetPersonalKyc);
  yield takeLatest(getBusinessKycRequest.type, handleGetBusinessKyc);
}
