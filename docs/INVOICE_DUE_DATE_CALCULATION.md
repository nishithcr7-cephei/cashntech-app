# Invoice Due Date Calculation Logic

## Overview

This document describes the client-side calculation logic for **Invoice Due Date** in the Create Invoice screen for Dealer Finance system.

## Business Logic

### Formula

The Invoice Due Date is **auto-calculated** based on the following formula:

```
Invoice Due Date = Base Date + Tenure Days
```

Where:
- **Base Date** = GRN Date (if available) OR Invoice Date (if GRN Date is not available)
- **Tenure Days** = Number of days from program/dealer configuration (currently mock value: 60 days)

### Calculation Priority

1. **If GRN Date is provided:**
   - Base Date = GRN Date
   - Invoice Due Date = GRN Date + Tenure Days

2. **If GRN Date is NOT provided:**
   - Base Date = Invoice Date
   - Invoice Due Date = Invoice Date + Tenure Days

### Example

**Scenario 1: With GRN Date**
- Invoice Date: 05-02-2024
- GRN Date: 07-02-2024
- Tenure Days: 60
- **Invoice Due Date = 07-02-2024 + 60 days = 08-04-2024**

**Scenario 2: Without GRN Date**
- Invoice Date: 05-02-2024
- GRN Date: (empty)
- Tenure Days: 60
- **Invoice Due Date = 05-02-2024 + 60 days = 06-04-2024**

## Implementation Details

### File Location
- **Component:** `src/components/InvoiceForm.tsx`
- **Type Definition:** `src/types/Invoice.ts`

### Key Functions

#### 1. `calculateInvoiceDueDate()`
```typescript
calculateInvoiceDueDate(
  invoiceDate: string,
  grnDate: string,
  tenureDays: number
): string
```

**Purpose:** Calculates the Invoice Due Date based on the provided dates and tenure.

**Parameters:**
- `invoiceDate`: Invoice date in DD-MM-YYYY format
- `grnDate`: GRN Date in DD-MM-YYYY format (optional)
- `tenureDays`: Number of days to add (from API/program config)

**Returns:** Calculated due date in DD-MM-YYYY format

#### 2. Auto-calculation via `useEffect`
```typescript
useEffect(() => {
  if (value.invoiceDate) {
    const calculatedDueDate = calculateInvoiceDueDate(
      value.invoiceDate,
      value.grnDate || '',
      TENURE_DAYS
    );
    
    if (calculatedDueDate && calculatedDueDate !== value.invoiceDueDate) {
      onChange({invoiceDueDate: calculatedDueDate});
    }
  } else if (!value.invoiceDate && value.invoiceDueDate) {
    onChange({invoiceDueDate: ''});
  }
}, [value.invoiceDate, value.grnDate]);
```

**Trigger:** Automatically recalculates when:
- Invoice Date changes
- GRN Date changes

**Behavior:**
- Clears Invoice Due Date if Invoice Date is cleared
- Updates Invoice Due Date if calculation result differs from current value

### Current Configuration

#### Mock Tenure Value
```typescript
const TENURE_DAYS = 60; // Default 60 days, will come from API
```

**Note:** This is a **temporary mock value**. When API integration is complete, this value will be replaced with the actual tenure days from:
- Program configuration API
- Dealer details API
- Product/Anchor program settings

### UI Behavior

#### Invoice Due Date Field
- **Type:** Read-only TextInput (auto-calculated)
- **Label:** "Invoice Due Date (Auto Calculated)"
- **Placeholder:** "Auto calculated from Invoice Date + Tenure"
- **Display:** Shows calculation info below field:
  - "Calculated: GRN Date + 60 days" (if GRN Date available)
  - "Calculated: Invoice Date + 60 days" (if GRN Date not available)

#### User Interaction
- User **cannot manually edit** Invoice Due Date
- Field is **automatically updated** when Invoice Date or GRN Date changes
- Calculation happens **in real-time** as user selects dates

## Date Validations

### Invoice Date Validation

**Rules:**
1. Must be current date or past date (not future)
2. Should not be older than 90 days (stale invoice check)

**Implementation:**
```typescript
const validateInvoiceDate = (dateStr: string): string | undefined
```

**Validation Messages:**
- "Invoice date cannot be in the future" (if future date selected)
- "Invoice is stale (older than 90 days)" (if older than threshold)

**UI:**
- Date picker `maximumDate` set to `new Date()` (prevents future dates)
- Warning message shown below field if validation fails

### Payment Date Validation

**Rules:**
1. Must be a future date (not current or past)
2. Should be at least 7 days from Invoice Date (as per payment terms)

**Implementation:**
```typescript
const validatePaymentDate = (dateStr: string, invoiceDateStr?: string): string | undefined
```

**Validation Messages:**
- "Payment date must be in the future" (if past/current date selected)
- "Payment date should be at least 7 days from invoice date" (if less than 7 days)

**UI:**
- Date picker `minimumDate` set to `new Date()` (prevents past dates)
- Warning message shown below field if validation fails

### GRN Date Validation

**Rules:**
1. Should be current date or past date (not future)
2. Optional field (can be empty)

**UI:**
- Date picker `maximumDate` set to `new Date()` (prevents future dates)

## API Integration (Future)

### When API is Ready

Replace the mock tenure value with API response:

```typescript
// Current (Mock)
const TENURE_DAYS = 60;

// Future (API)
const TENURE_DAYS = programDetails?.tenureDays || dealerDetails?.tenureDays || 60;
```

### Expected API Response Structure

```typescript
interface ProgramDetails {
  programId: string;
  programName: string;
  tenureDays: number; // 30, 45, 60, or 90
  // ... other fields
}

interface DealerDetails {
  dealerId: string;
  dealerName: string;
  tenureDays?: number; // Optional, falls back to program tenure
  // ... other fields
}
```

### Integration Points

1. **On Dealer Selection:**
   - Fetch dealer details from API
   - Extract `tenureDays` from response
   - Update `TENURE_DAYS` constant

2. **On Program Load:**
   - Fetch program configuration from API
   - Extract default `tenureDays` from response
   - Use as fallback if dealer-specific tenure not available

3. **Calculation Update:**
   - No changes needed to calculation logic
   - Only replace `TENURE_DAYS` constant with API value

## Testing Scenarios

### Test Case 1: Basic Calculation (Invoice Date Only)
- **Input:** Invoice Date = 01-01-2024, GRN Date = (empty), Tenure = 60
- **Expected:** Invoice Due Date = 01-03-2024 (01-01-2024 + 60 days)

### Test Case 2: Calculation with GRN Date
- **Input:** Invoice Date = 01-01-2024, GRN Date = 05-01-2024, Tenure = 60
- **Expected:** Invoice Due Date = 05-03-2024 (05-01-2024 + 60 days)

### Test Case 3: Date Change Triggers Recalculation
- **Input:** Change Invoice Date from 01-01-2024 to 15-01-2024
- **Expected:** Invoice Due Date automatically updates to 15-03-2024

### Test Case 4: GRN Date Change Triggers Recalculation
- **Input:** Add GRN Date = 10-01-2024 when Invoice Date = 01-01-2024
- **Expected:** Invoice Due Date changes from 01-03-2024 to 10-03-2024

### Test Case 5: Clear Invoice Date
- **Input:** Clear Invoice Date field
- **Expected:** Invoice Due Date is also cleared

### Test Case 6: Invalid Date Handling
- **Input:** Invalid date format in Invoice Date
- **Expected:** Invoice Due Date remains empty, no error thrown

## Related Files

- `src/components/InvoiceForm.tsx` - Main form component with calculation logic
- `src/types/Invoice.ts` - Type definitions for invoice fields
- `src/screens/Invoice/CreateInvoice.tsx` - Create invoice screen wrapper
- `src/constants/invoiceDropdowns.ts` - Dropdown options (if tenure dropdown needed later)

## Notes

1. **Date Format:** All dates are stored and displayed in `DD-MM-YYYY` format
2. **Moment.js:** Uses `moment.js` library for date calculations and parsing
3. **Timezone:** Calculations assume local timezone
4. **Edge Cases:** Handles empty dates, invalid formats, and date parsing errors gracefully
5. **Performance:** Calculation is lightweight and runs only when dependencies change

## Future Enhancements

1. **Tenure Dropdown:** If needed, add UI dropdown for tenure selection (30/45/60/90 days)
2. **Disbursement Date:** Include Disbursement Date in calculation formula (when available)
3. **Business Days:** Consider business days only (excluding weekends/holidays) if required
4. **Multiple Tenures:** Support different tenure options based on invoice amount or dealer type
5. **Date Range Validation:** Add validation to ensure Invoice Due Date is within acceptable range

---

**Last Updated:** 2024-01-20  
**Author:** Development Team  
**Status:** Implemented (Mock Tenure), Pending API Integration
