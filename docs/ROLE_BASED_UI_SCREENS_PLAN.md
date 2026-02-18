# Role-Based UI Screens Plan

## Overview

This document outlines **screen reuse** vs **new screens** for the three user roles in CashnTech Loan Management System:
- **Anchor Maker**
- **Anchor Checker**
- **Dealer Maker**

Current mobile app screens are built primarily for **Anchor Maker**. This plan shows what can be reused and what needs to be built per role.

---

## 1. Screen Reuse Matrix

| Screen | File | Anchor Maker | Anchor Checker | Dealer Maker | Reuse? |
|--------|------|:------------:|:-------------:|:------------:|:------:|
| Invoice Dashboard | `InvoiceDashboard.tsx` | ✅ | ✅ | ❌ | ✅ Same |
| Invoice Details | `InvoiceDetails.tsx` | ✅ | ✅ | ✅ | ✅ Same + role config |
| Create Invoice | `CreateInvoice.tsx` | ✅ | ❌ | ✅ | ✅ Same + labels |
| Upload Invoice List | `UploadInvoiceList.tsx` | ✅ | ❌ | ✅ | ✅ Same |
| Pending Approvals | `PendingApprovals.tsx` | ✅ | ✅ | ❌ | ✅ Same |
| Rejected Finances | `RejectedFinances.tsx` | ✅ | ✅ | ❌ | ✅ Same |
| Discounting Payments | `DiscountingPayments.tsx` | ✅ | ✅ | ❌ | ✅ Same |
| DPD Invoice List | `DPDInvoiceList.tsx` | ✅ | ✅ | ✅ | ✅ Same |
| Dealers List | `DealerInvoicelist.tsx` | ✅ | ✅ | ❌ | ✅ Same |
| Funding Limits for Dealers | `FundingLimitsForDealers.tsx` | ✅ | ✅ | ✅ | ✅ Same |
| Credit Account (Anchor) | `ANCreditAccount.tsx` | ✅ | ✅ | ❌ | ✅ Same |
| Credit Account Details | `CreditAccountDetails.tsx` | ✅ | ✅ | ✅ | ✅ Same |
| Credit Account Invoice Number | `CreditAccountInvoiceNumber.tsx` | ✅ | ✅ | ✅ | ✅ Same |
| Credit Account Daily Interest | `CreditAccountDailyInterest.tsx` | ✅ | ✅ | ✅ | ✅ Same |
| **Fund Planner > Financing Request** | *New* | ❌ | ❌ | ✅ | ❌ **NEW** |
| **Fund Planner > Limit Details** | *New* | ❌ | ❌ | ✅ | ❌ **NEW** |
| **Dashboard** (OD Summary, Upcoming Due, DPD) | *New* | ❌ | ❌ | ✅ | ❌ **NEW** |
| **Loan Accounts > OD Details** | *New* | ❌ | ❌ | ✅ | ❌ **NEW** |
| **Loan Accounts > OD Repayments** | *New* | ❌ | ❌ | ✅ | ❌ **NEW** |
| **Anchors List** | *New* | ❌ | ❌ | ✅ | ❌ **NEW** |
| **Select Role Screen** | *New* | ✅ | ✅ | ✅ | ❌ **NEW** |

---

## 2. Modals / Components

| Modal/Component | File | Anchor Maker | Anchor Checker | Dealer Maker | Reuse? |
|----------------|------|:------------:|:-------------:|:------------:|:------:|
| Upload Invoices | `UploadModal.tsx` | ✅ | ❌ | ✅ | ✅ Same + link text |
| Checker Approval Detail | `CheckerApprovalModal.tsx` | ❌ | ✅ | ❌ | ✅ Exists |
| **Approve/Reject Modal** | *New* | ❌ | ✅ | ❌ | ❌ **NEW** |
| **Add Fund Modal** | *New* | ❌ | ❌ | ✅ | ❌ **NEW** |

---

## 3. Role-wise Changes Required

### 3.1 Anchor Maker

| Category | Action |
|----------|--------|
| **Screens** | All existing Invoice + Payments screens – **reuse as-is** |
| **Drawer** | Transactions > Invoice + Payments – **reuse as-is** |
| **Invoice Details** | Actions: Edit, Recreate, Attachment, Print, Delete – **reuse** |
| **Buttons** | Upload Invoices, Create Invoice – **reuse** |
| **Upload Modal** | Link: "List of Dealers" – **reuse** |
| **New** | None |

---

### 3.2 Anchor Checker

| Category | Action |
|----------|--------|
| **Screens** | Same as Anchor Maker – **reuse** |
| **Drawer** | Same as Anchor Maker – **reuse** |
| **Invoice Details** | Actions: **Approve/Reject**, Checker Approval, Attachment, Print – **change** |
| **Invoice Details** | Buttons: Export, Filters only (no Upload/Create) – **change** |
| **Modals** | **Approve/Reject Modal** – **new** |
| **Checker Approval Modal** | Already exists – **reuse** |
| **New Screens** | None |

---

### 3.3 Dealer Maker

| Category | Action |
|----------|--------|
| **Screens** | Fund Planner, Loan Accounts, Dashboard – **new** |
| **Drawer** | Different structure – **change** |
| **Invoice Details** | Actions: Pay me Early, Attachment, Print – **change** |
| **Invoice Details** | Buttons: Export, Import, Upload Invoices, Execute Drawdown – **change** |
| **Create Invoice** | Labels: Anchor Name, Anchor Code (instead of Dealer) – **change** |
| **Upload Modal** | Link: "List of Anchor" (instead of Dealers) – **change** |
| **Modals** | **Add Fund Modal** – **new** |
| **New Screens** | 6 (see Section 4) |

---

## 4. New Screens to Build

| # | Screen Name | Role | Description |
|---|-------------|------|-------------|
| 1 | **SelectRoleScreen** | All | Login ke baad: Anchor Maker / Anchor Checker / Dealer Maker select |
| 2 | **FinancingRequestScreen** | Dealer Maker | Fund Planner > Financing Request list (Loan Ref, Invoice, Anchor, Status) |
| 3 | **LimitDetailsScreen** | Dealer Maker | Fund Planner > Limit Details (Anchor, Sanctioned Limit, Drawing Power, etc.) |
| 4 | **DealerMakerDashboardScreen** | Dealer Maker | Tabs: OD Account Summary, Upcoming Due Dates, DPD Invoice List |
| 5 | **ODDetailsScreen** | Dealer Maker | Loan Accounts > OD Details |
| 6 | **ODRepaymentsScreen** | Dealer Maker | Loan Accounts > OD Repayments |
| 7 | **AnchorsListScreen** | Dealer Maker | Master Data > Anchors List (Anchor Name, Company ID, Credit Account) |

---

## 5. Component Changes (Reuse with Config)

| Component | Change Type | Anchor Maker | Anchor Checker | Dealer Maker |
|-----------|-------------|:------------:|:-------------:|:------------:|
| **DrawerContent** | Role-based menu | Invoice + Payments | Invoice + Payments | Fund Planner + Loan Accounts + Invoice |
| **AppBar** | Role badge | AM (red) | AC (blue) | DM (orange) |
| **InvoiceDetails** | Action menu | Edit, Recreate, Attach, Print, Delete | Approve/Reject, Checker Approval, Attach, Print | Pay me Early, Attach, Print |
| **InvoiceDetails** | Top buttons | Upload, Create | Export, Filters | Export, Import, Upload, Execute Drawdown |
| **InvoiceForm** | Labels | Dealer Name, Dealer Code | – | Anchor Name, Anchor Code |
| **UploadModal** | Link text | List of Dealers | – | List of Anchor |
| **DrawerContent** | Header color | #FFE9E9 | #E3F2FD | #FFF3E0 |

---

## 6. Drawer Menu Structure by Role

### Anchor Maker & Anchor Checker
```
TRANSACTIONS
├── Invoice
│   ├── Invoice Dashboard
│   ├── Invoice Details
│   ├── Pending Approvals
│   ├── Rejected Finance
│   ├── Discounting Invoices
│   └── DPD Invoice List
└── Payments
    ├── Dealers List
    ├── Funding Limits
    ├── Anchor Credit Account
    └── Credit Account Details
```

### Dealer Maker
```
FUND PLANNER
├── Fund Planner
└── Financing Requests

LOAN ACCOUNTS
├── OD Details
└── OD Repayments

TRANSACTIONS
├── Invoice
│   ├── Invoice Dashboard (or Dashboard with tabs)
│   ├── Invoice Details
│   ├── DPD Invoice List
│   └── ...
└── Master Data
    └── Anchors List
```

---

## 7. Summary Table

| Metric | Count |
|--------|-------|
| **Screens to reuse (no change)** | 14 |
| **Screens to reuse (with role config)** | 5 |
| **New screens** | 7 |
| **New modals** | 2 (Approve/Reject, Add Fund) |
| **Components to modify** | 5 (Drawer, AppBar, InvoiceDetails, InvoiceForm, UploadModal) |

---

## 8. Implementation Order

1. **Phase 1:** Role infra + SelectRoleScreen + Drawer role-based
2. **Phase 2:** Role badge + Drawer header color (UI identity)
3. **Phase 3:** InvoiceDetails + InvoiceForm + UploadModal role config
4. **Phase 4:** Approve/Reject modal (Anchor Checker)
5. **Phase 5:** Dealer Maker new screens (Fund Planner, Loan Accounts, Dashboard, Anchors List)
6. **Phase 6:** Add Fund modal (Dealer Maker)

---

*Document Version: 1.0*  
*Last Updated: February 2026*
