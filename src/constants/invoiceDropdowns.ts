/**
 * Dropdown options for Invoice Form
 * Dummy data - will be replaced with API data later
 * These fields are NOT auto-filled by OCR - user must select manually
 */

import {INVOICE_UNITS} from '@constants/invoiceUnits';

// Dealer Name options (dummy enum)
export const dealerNameOptions = [
  {label: 'Dealer 1', value: 'Dealer 1'},
  {label: 'Dealer 2', value: 'Dealer 2'},
  {label: 'Dealer 3', value: 'Dealer 3'},
  {label: 'Dealer 4', value: 'Dealer 4'},
  {label: 'Dealer 5', value: 'Dealer 5'},
  {label: 'Dealer 6', value: 'Dealer 6'},
  {label: 'Dealer 7', value: 'Dealer 7'},
  {label: 'Dealer 8', value: 'Dealer 8'},
];

// Dealer Code options (dummy enum)
export const dealerCodeOptions = [
  {label: 'DC001', value: 'DC001'},
  {label: 'DC002', value: 'DC002'},
  {label: 'DC003', value: 'DC003'},
  {label: 'DC004', value: 'DC004'},
  {label: 'DC005', value: 'DC005'},
  {label: 'DC006', value: 'DC006'},
  {label: 'DC007', value: 'DC007'},
  {label: 'DC008', value: 'DC008'},
];

// Credit Account Number options (dummy enum)
export const creditAccountOptions = [
  {label: 'ACC-001', value: 'ACC-001'},
  {label: 'ACC-002', value: 'ACC-002'},
  {label: 'ACC-003', value: 'ACC-003'},
  {label: 'ACC-004', value: 'ACC-004'},
  {label: 'ACC-005', value: 'ACC-005'},
  {label: 'ACC-006', value: 'ACC-006'},
  {label: 'ACC-007', value: 'ACC-007'},
  {label: 'ACC-008', value: 'ACC-008'},
];

// PO Ref. No. options (dummy enum)
export const poRefOptions = [
  {label: 'PO-2024-001', value: 'PO-2024-001'},
  {label: 'PO-2024-002', value: 'PO-2024-002'},
  {label: 'PO-2024-003', value: 'PO-2024-003'},
  {label: 'PO-2024-004', value: 'PO-2024-004'},
  {label: 'PO-2024-005', value: 'PO-2024-005'},
  {label: 'PO-2024-006', value: 'PO-2024-006'},
  {label: 'PO-2024-007', value: 'PO-2024-007'},
  {label: 'PO-2024-008', value: 'PO-2024-008'},
];

// Unit options (common units for invoice items)
export const unitOptions = INVOICE_UNITS.map(unit => ({label: unit, value: unit}));

