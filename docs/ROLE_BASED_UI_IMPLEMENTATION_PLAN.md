# Role-Based UI – Detailed Implementation Plan

## 1. Codebase Analysis Summary

### 1.1 Existing Patterns (Reusable)

| Pattern | Used In | Structure |
|---------|---------|-----------|
| **List Screen** | FundingLimitsForDealers, DPDInvoiceList, ANCreditAccount, DealerInvoicelist | AppBar → ProgramBreadcrumb → Page Title → Badge (label + count) → Search + Filter → Card list (infoGrid) → Pagination |
| **Dashboard with Tabs** | InvoiceDashboard | Card metrics row → TabBar (2 tabs) → Tab content (dealer table / unpaid table) |
| **Invoice Card List** | InvoiceDetails | Badge → Search + Filter → Primary buttons (Upload, Create) → Card list with 3-dots menu → Modal actions |
| **Form Screen** | CreateInvoice | AppBar → ProgramBreadcrumb → InvoiceForm (labels from productType) |
| **Upload Flow** | UploadInvoiceList | DashedButton → UploadModal (file picker) → Table (Invoice No, Status, Remark) |

### 1.2 Components Inventory

| Component | Purpose | Role Config Needed? |
|-----------|---------|---------------------|
| AppBar | Header with menu | Add role badge (optional) |
| Container | Screen wrapper | No |
| ProgramBreadcrumb | Breadcrumb nav | No |
| FilterModal | Filter dropdown | No |
| UploadModal | File picker (camera/browse) | No |
| DashedButton | Upload trigger | No |
| TabBar | Tab switcher | No |
| CheckerApprovalModal | Approval detail view | Exists, reuse |
| InvoiceForm | Create invoice form | Yes – labels (Dealer vs Anchor) |
| DrawerContent | Side menu | Yes – menu items + header color |

### 1.3 Store / State

| Store | Current | Change |
|-------|---------|--------|
| user | id, email, first_name, last_name, mobile_number, role, scope | Add/use `role: AppRole` |
| auth | isLoggedIn, userType | No change |
| programSelection | programId, program, userType | No change |

---

## 2. Role Constants & Types

```ts
// src/constants/roles.ts (NEW)
export type AppRole = 'anchor_maker' | 'anchor_checker' | 'dealer_maker';

export const ROLE_LABELS: Record<AppRole, string> = {
  anchor_maker: 'Anchor Maker',
  anchor_checker: 'Anchor Checker',
  dealer_maker: 'Dealer Maker',
};

export const ROLE_HEADER_COLORS: Record<AppRole, { bg: string; border: string }> = {
  anchor_maker: { bg: '#FFE9E9', border: 'rgba(227, 6, 19, 0.5)' },
  anchor_checker: { bg: '#FFE0E0', border: 'rgba(227, 6, 19, 0.4)' },
  dealer_maker: { bg: '#FFF0E9', border: 'rgba(227, 6, 19, 0.35)' },
};
```

---

## 3. Screen-by-Screen Implementation Detail

### 3.1 SelectRoleScreen (NEW)

| Item | Detail |
|------|--------|
| **Location** | `src/screens/Auth/SelectRoleScreen.tsx` |
| **Reference** | SelectUserTypeScreen (same layout) |
| **Layout** | AppBar (hide hamburger) → Title "Select Role" → Instruction text → 3 option buttons |
| **Options** | Anchor Maker, Anchor Checker, Dealer Maker |
| **Selected state** | backgroundColor: #E30613, text: white (when tapped) |
| **Flow** | On tap → dispatch(setUserRole) → navigation.replace('HomeNavigator') |
| **Register** | AuthNavigator, NavigatorTypes (SelectRoleScreen) |

---

### 3.2 DrawerContent (MODIFY)

| Item | Detail |
|------|--------|
| **Role source** | `useSelector(userSelector.getUserRole)` |
| **Header** | `headerContainer` style: dynamic `backgroundColor`, `borderColor` from ROLE_HEADER_COLORS[role] |
| **Menu visibility** | |
| Anchor Maker / Checker | Show: TRANSACTIONS > Invoice (all 6) + Payments (all 4) |
| Dealer Maker | Show: FUND PLANNER (Financing Requests, Limit Details) + LOAN ACCOUNTS (OD Details, OD Repayments) + TRANSACTIONS > Invoice (subset) + Master Data > Anchors List |
| **New sections** | Fund Planner, Loan Accounts, Anchors List (for dealer_maker only) |

---

### 3.3 InvoiceDetails (MODIFY)

| Item | Detail |
|------|--------|
| **Role source** | `useSelector(userSelector.getUserRole)` |
| **Primary buttons (Row 3)** | |
| anchor_maker | Upload Invoices, Create Invoice |
| anchor_checker | Export, Filters only (hide Upload, Create) |
| dealer_maker | Export, Import, Upload Invoices, Execute Drawdown |
| **Action menu (3 dots)** | |
| anchor_maker | Edit, Recreate, Attachment, Print, Delete |
| anchor_checker | Approve/Reject, Checker Approval, Attachment, Print |
| dealer_maker | Pay me Early, Attachment, Print |
| **Modals** | anchor_checker: ApproveRejectModal (new) on Approve/Reject; CheckerApprovalModal (existing) |

---

### 3.4 CreateInvoice / InvoiceForm (MODIFY)

| Item | Detail |
|------|--------|
| **Visibility** | anchor_checker: hide Create Invoice in Drawer + InvoiceDetails; no change to screen itself |
| **Labels** | InvoiceForm receives `productType` or new prop `entityType: 'dealer' | 'anchor'` |
| dealer_maker | "Anchor Name", "Anchor Code", "Anchor OD Account" |
| anchor_maker | "Dealer Name", "Dealer Code", "Dealer OD Account" (current) |

---

### 3.5 UploadInvoiceList (MODIFY)

| Item | Detail |
|------|--------|
| **Visibility** | anchor_checker: hide in Drawer |
| **Links** | Below DashedButton: "Download Sample Excel File", "List of Dealers" or "List of Anchor" (role-based) |
| **Link action** | "List of Dealers" → DealerInvoicelist; "List of Anchor" → AnchorsListScreen |

---

### 3.6 UploadModal (NO CHANGE for now)

- Current UploadModal is file picker. Figma "Upload Invoices" modal had Excel + links – those links go in UploadInvoiceList below the button, not inside UploadModal.

---

### 3.7 New Screens – Reuse Pattern

All new screens follow **FundingLimitsForDealers / ANCreditAccount** pattern:

```
AppBar → ProgramBreadcrumb → Page Title → Badge → Search + Filter → Card list → Pagination
```

---

### 3.8 FinancingRequestScreen (NEW)

| Item | Detail |
|------|--------|
| **Pattern** | FundingLimitsForDealers |
| **Columns** | Loan Reference No, Invoice/Unique Ref No, Anchor, Loan Date, Loan End Date, Eligibility (%), Loan Amount, Status, Action (3 dots) |
| **Status** | Created, Submitted, Rejected, Approved, Reserved (color-coded) |
| **Navigator** | Add to HomeNavigator, HomeNavigatorType |

---

### 3.9 LimitDetailsScreen (NEW)

| Item | Detail |
|------|--------|
| **Pattern** | ANCreditAccount |
| **Columns** | Anchor, Sanctioned Limit, Drawing Power, Utilized Limit, Pipeline Requests, Excess Credit, Available Limit, OD Expiry Date |
| **Navigator** | Add to HomeNavigator |

---

### 3.10 DealerMakerDashboardScreen (NEW)

| Item | Detail |
|------|--------|
| **Pattern** | InvoiceDashboard (tabs + content) |
| **Tabs** | OD Account Summary, Upcoming Due Dates, DPD Invoice List |
| **OD Account Summary** | Table: Anchor, Credit Account, Sanctioned Limit, Drawing Power, Utilized Limit, Pipeline Requests, Excess Credit, Available Limit, Overdue Amount, OD Expiry, Overdue Days, Status, Actions |
| **Upcoming Due Dates** | Table: Invoice/Unique Ref No, Anchor, Credit Account No, Drawdown Amount, Drawdown Date, Total Outstanding, Tenor End Date |
| **DPD Invoice List** | Reuse DPDInvoiceList component or same data structure |
| **Navigator** | Add to HomeNavigator |

---

### 3.11 ODDetailsScreen (NEW)

| Item | Detail |
|------|--------|
| **Pattern** | CreditAccountDetails (simplified) or list |
| **Content** | OD account details for dealer maker context |
| **Navigator** | Add to HomeNavigator |

---

### 3.12 ODRepaymentsScreen (NEW)

| Item | Detail |
|------|--------|
| **Pattern** | List screen |
| **Columns** | Particulars, Drawdown Date, Overdue Date, Principal Balance, Fees/Charges Balance, Accrued Interest Balance, Accrued Penal Balance, Total Penal Tax, Total Outstanding, Status |
| **Navigator** | Add to HomeNavigator |

---

### 3.13 AnchorsListScreen (NEW)

| Item | Detail |
|------|--------|
| **Pattern** | DealerInvoicelist (copy structure) |
| **Columns** | Anchor Name, Company's Unique Identification No, Credit Account, Credit to |
| **Title** | "Anchor List of (Company Name)" |
| **Badge** | "Anchors" |
| **Navigator** | Add to HomeNavigator |

---

### 3.14 ApproveRejectModal (NEW)

| Item | Detail |
|------|--------|
| **Reference** | Figma: "Are you sure, you want to approve or reject this Invoice / Unique Ref. No - XXXXX?" |
| **Content** | Title, Invoice ref, Table (Sub Total, Withholding Taxes, Withholding Amount, Final Payable Amount, Final Due Date), Remark input, Reject (grey), Approve (green) buttons |
| **Location** | `src/components/ApproveRejectModal/ApproveRejectModal.tsx` |

---

### 3.15 AddFundModal (NEW)

| Item | Detail |
|------|--------|
| **Reference** | Figma: "Are you sure, you want to add fund to this Credit Account No : XXXXX" |
| **Content** | Credit to, Credit Date, Credit Amount, Particulars, Remark, Cancel, Submit |
| **Location** | `src/components/AddFundModal/AddFundModal.tsx` |
| **Usage** | From Credit Account or OD Details (Dealer Maker) |

---

## 4. Auth Flow Change

| Step | Current | New |
|------|---------|-----|
| 1 | Signin → OTP | Same |
| 2 | SuccessScreen | Same |
| 3 | navigation.reset | Was: SelectProgramScreen or HomeNavigator |
| 4 | | Now: **SelectRoleScreen** always |
| 5 | | SelectRoleScreen → dispatch(setUserRole) → HomeNavigator |
| 6 | | Optional: SelectProgramScreen before Home (if needed) |

**SuccessScreen.tsx**: Change `navigation.reset` to go to `SelectRoleScreen` instead of SelectProgramScreen/HomeNavigator.

---

## 5. File Change Summary

### New Files (12)

| # | File |
|---|------|
| 1 | `src/constants/roles.ts` |
| 2 | `src/screens/Auth/SelectRoleScreen.tsx` |
| 3 | `src/screens/Invoice/FinancingRequestScreen.tsx` |
| 4 | `src/screens/Invoice/LimitDetailsScreen.tsx` |
| 5 | `src/screens/Invoice/DealerMakerDashboardScreen.tsx` |
| 6 | `src/screens/Invoice/ODDetailsScreen.tsx` |
| 7 | `src/screens/Invoice/ODRepaymentsScreen.tsx` |
| 8 | `src/screens/Invoice/AnchorsListScreen.tsx` |
| 9 | `src/components/ApproveRejectModal/ApproveRejectModal.tsx` |
| 10 | `src/components/AddFundModal/AddFundModal.tsx` |

### Modified Files (15)

| # | File | Changes |
|---|------|---------|
| 1 | `src/store/user/user.slice.ts` | Add role, setUserRole |
| 2 | `src/store/user/user.types.ts` | Add role: AppRole |
| 3 | `src/store/user/user.selector.ts` | getUserRole |
| 4 | `src/screens/Auth/SuccessScreen.tsx` | Navigate to SelectRoleScreen |
| 5 | `src/navigation/AuthNavigator.tsx` | Add SelectRoleScreen |
| 6 | `src/types/NavigatorTypes.ts` | SelectRoleScreen + new Home screens |
| 7 | `src/navigation/HomeNavigator.tsx` | Register new screens |
| 8 | `src/components/Drawer/DrawerContent.tsx` | Role-based menu + header color |
| 9 | `src/screens/Invoice/InvoiceDetails.tsx` | Role-based buttons + action menu |
| 10 | `src/screens/Invoice/CreateInvoice.tsx` | Pass entityType to InvoiceForm |
| 11 | `src/components/InvoiceForm.tsx` | entityType prop for labels |
| 12 | `src/screens/Invoice/UploadInvoiceList.tsx` | Role-based link (Dealers vs Anchor) |
| 13 | `src/components/AppBar.tsx` | Optional role badge |
| 14 | `src/screens/index.ts` | Export new screens |
| 15 | `src/components/index.ts` | Export new modals |

---

## 6. Implementation Order (Phases)

### Phase 1: Foundation (Role + SelectRole + Drawer)
1. Create `roles.ts`
2. Update user slice, types, selector
3. Create SelectRoleScreen
4. Update SuccessScreen, AuthNavigator, NavigatorTypes
5. Update DrawerContent: header color + menu visibility (skeleton for Dealer Maker)

### Phase 2: Role-Based UI Identity
6. Drawer header colors (subtle shades)
7. Optional: AppBar role badge

### Phase 3: InvoiceDetails + CreateInvoice + UploadInvoiceList
8. InvoiceDetails: role-based buttons + action menu
9. CreateInvoice/InvoiceForm: entityType labels
10. UploadInvoiceList: role-based link
11. ApproveRejectModal

### Phase 4: Dealer Maker New Screens
12. FinancingRequestScreen
13. LimitDetailsScreen
14. DealerMakerDashboardScreen (with TabBar)
15. ODDetailsScreen
16. ODRepaymentsScreen
17. AnchorsListScreen
18. AddFundModal
19. HomeNavigator + NavigatorTypes updates
20. DrawerContent: full Dealer Maker menu with new routes

### Phase 5: Polish
21. Role-based visibility for Pending Approvals, Rejected Finances, etc. in Drawer
22. Testing all 3 roles

---

## 7. Reuse vs New – Quick Reference

| Screen | Action | Based On |
|--------|--------|----------|
| SelectRoleScreen | NEW | SelectUserTypeScreen |
| FinancingRequestScreen | NEW | FundingLimitsForDealers |
| LimitDetailsScreen | NEW | ANCreditAccount |
| DealerMakerDashboardScreen | NEW | InvoiceDashboard |
| ODDetailsScreen | NEW | CreditAccountDetails |
| ODRepaymentsScreen | NEW | FundingLimitsForDealers |
| AnchorsListScreen | NEW | DealerInvoicelist |
| ApproveRejectModal | NEW | CheckerApprovalModal |
| AddFundModal | NEW | CheckerApprovalModal |
| InvoiceDetails | MODIFY | - |
| DrawerContent | MODIFY | - |
| CreateInvoice | MODIFY | - |
| InvoiceForm | MODIFY | - |
| UploadInvoiceList | MODIFY | - |
| SuccessScreen | MODIFY | - |

---

*Document Version: 1.0*  
*Last Updated: February 2026*
