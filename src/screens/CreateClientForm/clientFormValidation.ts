import {FormTypes} from './CreateClientForm.type';
import {ClientFormType} from '@store/client';

export const ENABLE_FORM_VALIDATION = true;

export const toggleFormValidation = (enabled: boolean) => {
  return enabled;
};

type FieldErrorMap = Record<string, string>;
type ValidationResult = {
  isValid: boolean;
  errors: FieldErrorMap;
};

const isEmpty = (value: string | undefined | null): boolean =>
  value == null || value.trim() === '';

const required = (
  value: string | undefined,
  fieldName: string,
  errors: FieldErrorMap,
) => {
  if (isEmpty(value)) {
    errors[fieldName] = 'This field is required';
  }
};

const validateBasicDetails = (
  data: ClientFormType['BasicDetails'],
): ValidationResult => {
  const errors: FieldErrorMap = {};

  required(data.sourceOfLead, 'sourceOfLead', errors);
  required(data.firmName, 'firmName', errors);
  required(data.location, 'location', errors);
  required(data.city, 'city', errors);
  required(data.state, 'state', errors);
  required(data.typeOfVisit, 'typeOfVisit', errors);
  required(data.visitNumber, 'visitNumber', errors);
  required(data.dateOfVisit, 'dateOfVisit', errors);
  required(data.Fillby, 'Fillby', errors);

  return {isValid: Object.keys(errors).length === 0, errors};
};

const validateClientFirm = (
  data: ClientFormType['ClientFirmScreen'],
): ValidationResult => {
  const errors: FieldErrorMap = {};

  required(data.clientName, 'clientName', errors);
  required(data.contactNumber, 'contactNumber', errors);
  if (
    data.contactNumber &&
    !/^[6-9][0-9]{9}$/.test(data.contactNumber.trim())
  ) {
    errors.contactNumber =
      'Contact number must be 10 digits and start with 6, 7, 8, or 9.';
  }
  required(data.typeOfFirm, 'typeOfFirm', errors);
  required(data.businessVintage, 'businessVintage', errors);
  required(data.sector, 'sector', errors);
  if (!data.bankName || data.bankName.length === 0) {
    errors.bankName = 'Bank name is required.';
  }
  required(data.cibilScore, 'cibilScore', errors);
  if (data.cibilScore) {
    const cibilScoreNum = parseInt(data.cibilScore);
    if (isNaN(cibilScoreNum) || cibilScoreNum < 300 || cibilScoreNum > 900) {
      errors.cibilScore = 'CIBIL Score must be between 300 and 900.';
    }
  }
  required(data.facilityType, 'facilityType', errors);
  required(data.existingFunding, 'existingFunding', errors);
  required(data.estimatedFunding, 'estimatedFunding', errors);
  required(data.creditPeriod, 'creditPeriod', errors);

  return {isValid: Object.keys(errors).length === 0, errors};
};

const validateVendor = (
  data: ClientFormType['VendorScreen'],
): ValidationResult => {
  const errors: FieldErrorMap = {};

  required(data.Product, 'Product', errors);
  required(data.vendorName, 'vendorName', errors);
  required(data.address, 'address', errors);
  required(data.city, 'city', errors);
  required(data.state, 'state', errors);
  required(data.pincode, 'pincode', errors);
  if (
    ENABLE_FORM_VALIDATION &&
    data.pincode &&
    !/^[1-9][0-9]{5}$/.test(data.pincode.trim())
  ) {
    errors.pincode = 'Pin code must be a valid 6-digit number.';
  }
  required(data.vendorContact, 'vendorContact', errors);
  if (
    data.vendorContact &&
    !/^[6-9][0-9]{9}$/.test(data.vendorContact.trim())
  ) {
    errors.vendorContact =
      'Vendor contact number must be 10 digits and start with 6, 7, 8, or 9.';
  }
  required(data.vendorEmail, 'vendorEmail', errors);
  if (
    data.vendorEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.vendorEmail.trim())
  ) {
    errors.vendorEmail = 'Please enter a valid email address.';
  }
  required(data.monthlySales, 'monthlySales', errors);

  return {isValid: Object.keys(errors).length === 0, errors};
};

const validateVisit = (
  data: ClientFormType['VisitScreen'],
): ValidationResult => {
  const errors: FieldErrorMap = {};

  required(data.UserResponse, 'UserResponse', errors);

  if (data.UserResponse === 'Interested') {
    required(data.intent, 'intent', errors);
    required(data.nextVisitDate, 'nextVisitDate', errors);
  } else if (data.UserResponse === 'Not interested') {
    required(data.reason, 'reason', errors);
    required(data.interested, 'interested', errors);
  }

  return {isValid: Object.keys(errors).length === 0, errors};
};

export const validateClientForm = (
  formName: FormTypes,
  formData: ClientFormType[FormTypes],
): ValidationResult => {
  if (!ENABLE_FORM_VALIDATION) {
    return {isValid: true, errors: {}};
  }

  switch (formName) {
    case 'BasicDetails':
      return validateBasicDetails(formData as ClientFormType['BasicDetails']);
    case 'ClientFirmScreen':
      return validateClientFirm(formData as ClientFormType['ClientFirmScreen']);
    case 'VendorScreen':
      return validateVendor(formData as ClientFormType['VendorScreen']);
    case 'VisitScreen':
      return validateVisit(formData as ClientFormType['VisitScreen']);
    default:
      return {isValid: true, errors: {}};
  }
};
