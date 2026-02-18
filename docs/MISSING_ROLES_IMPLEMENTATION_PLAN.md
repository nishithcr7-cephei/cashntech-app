# Missing Roles Implementation Plan – Vendor Maker, Vendor Checker, Dealer Checker

## Overview

This document outlines the implementation plan for adding **3 missing roles** to the CashnTech Loan Management System mobile app:
- **Vendor Maker** – Creates invoices for goods supplied to Anchor
- **Vendor Checker** – Reviews and approves/rejects Vendor invoices (internal approval)
- **Dealer Checker** – Reviews and approves/rejects Dealer invoices (internal approval)

**Note**: CashnTech User/Verifier role is skipped for now as per requirements.

---

## 1. Role Analysis & Reuse Strategy

### 1.1 Role Similarity Matrix

| New Role | Similar To | Reuse Level | Key Differences |
|----------|-----------|-------------|-----------------|
| **Vendor Maker** | Anchor Maker | 95% | InvoiceForm labels: "Anchor Name" (Vendor supplies TO Anchor) |
| **Vendor Checker** | Anchor Checker | 98% | Approves Vendor invoices (internal approval before Anchor) |
| **Dealer Checker** | Anchor Checker | 98% | Approves Dealer invoices (internal approval before Anchor) |

### 1.2 Screen Reuse Strategy

| Screen | Vendor Maker | Vendor Checker | Dealer Checker | Action |
|--------|:------------:|:-------------:|:-------------:|--------|
| Invoice Dashboard | ✅ | ✅ | ✅ | **Reuse** (no changes) |
| Invoice Details | ✅ | ✅ | ✅ | **Modify** (role-based buttons/menu) |
| Create Invoice | ✅ | ❌ | ❌ | **Reuse** (Vendor Maker only) |
| Upload Invoice List | ✅ | ❌ | ❌ | **Modify** (link text change) |
| Pending Approvals | ❌ | ✅ | ✅ | **Reuse** (no changes) |
| Rejected Finances | ❌ | ✅ | ✅ | **Reuse** (no changes) |
| Discounting Payments | ❌ | ✅ | ✅ | **Reuse** (no changes) |
| DPD Invoice List | ✅ | ✅ | ✅ | **Reuse** (no changes) |

**Key Insight**: Maximum reuse possible. Only role-based conditional rendering needed.

---

## 2. Role Constants & Types

### 2.1 Update `src/constants/roles.ts`

```typescript
/**
 * Role Constants for CashnTech Loan Management System
 * Defines all user roles: Anchor, Vendor, Dealer (Maker & Checker)
 */

export type AppRole = 
  | 'anchor_maker' 
  | 'anchor_checker' 
  | 'dealer_maker' 
  | 'dealer_checker'
  | 'vendor_maker'
  | 'vendor_checker';

export const ROLE_LABELS: Record<AppRole, string> = {
  anchor_maker: 'Anchor Maker',
  anchor_checker: 'Anchor Checker',
  dealer_maker: 'Dealer Maker',
  dealer_checker: 'Dealer Checker',
  vendor_maker: 'Vendor Maker',
  vendor_checker: 'Vendor Checker',
};

export const ROLE_HEADER_COLORS: Record<AppRole, { bg: string; border: string }> = {
  anchor_maker: { bg: '#FFE9E9', border: 'rgba(227, 6, 19, 0.5)' },
  anchor_checker: { bg: '#FFD9D9', border: 'rgba(227, 6, 19, 0.45)' },
  dealer_maker: { bg: '#FFE8D6', border: 'rgba(227, 6, 19, 0.4)' },
  dealer_checker: { bg: '#FFD4B3', border: 'rgba(227, 6, 19, 0.35)' }, // Lighter peach/orange
  vendor_maker: { bg: '#E8F4FD', border: 'rgba(227, 6, 19, 0.3)' }, // Light blue tint
  vendor_checker: { bg: '#D1E9F7', border: 'rgba(227, 6, 19, 0.25)' }, // Slightly darker blue
};

// Role-specific button colors for SelectRoleScreen
export const ROLE_BUTTON_COLORS: Record<AppRole, { bg: string; border: string; text: string }> = {
  anchor_maker: { bg: '#FFE9E9', border: '#FFD9D9', text: '#E30613' },
  anchor_checker: { bg: '#FFD9D9', border: '#FFC4C4', text: '#E30613' },
  dealer_maker: { bg: '#FFE8D6', border: '#FFD4B3', text: '#E30613' },
  dealer_checker: { bg: '#FFD4B3', border: '#FFC19A', text: '#E30613' },
  vendor_maker: { bg: '#E8F4FD', border: '#D1E9F7', text: '#E30613' },
  vendor_checker: { bg: '#D1E9F7', border: '#B8DDF0', text: '#E30613' },
};
```

---

## 3. Screen-by-Screen Implementation Detail

### 3.1 SelectRoleScreen (MODIFY)

| Item | Detail |
|------|--------|
| **Location** | `src/screens/Auth/SelectRoleScreen.tsx` |
| **Change** | Add 3 new role options to `roleOptions` array |
| **New Options** | Vendor Maker, Vendor Checker, Dealer Checker |
| **Code Change** | ```typescript<br>const roleOptions: AppRole[] = [<br>  'anchor_maker', <br>  'anchor_checker', <br>  'dealer_maker',<br>  'dealer_checker',<br>  'vendor_maker',<br>  'vendor_checker'<br>];``` |

---

### 3.2 DrawerContent (MODIFY)

| Item | Detail |
|------|--------|
| **Role Flags** | Add `isVendorMaker`, `isVendorChecker`, `isDealerChecker` |
| **Header Colors** | Use `ROLE_HEADER_COLORS[role]` (already dynamic) |
| **Menu Visibility** | |

#### Menu Visibility Rules:

| Role | TRANSACTIONS > Invoice | Payments | Fund Planner | Loan Accounts | Master Data |
|------|:----------------------:|:--------:|:-----------:|:-------------:|:-----------:|
| **Vendor Maker** | ✅ Subset (Dashboard, Details, DPD) | ❌ | ❌ | ❌ | ❌ |
| **Vendor Checker** | ✅ All 6 items | ✅ All 4 | ❌ | ❌ | ❌ |
| **Dealer Checker** | ✅ All 6 items | ✅ All 4 | ❌ | ❌ | ❌ |

**Code Changes**:
```typescript
// Add role flags
const isVendorMaker = userRole === 'vendor_maker';
const isVendorChecker = userRole === 'vendor_checker';
const isDealerChecker = userRole === 'dealer_checker';

// Update menu visibility
const showPayments = isAnchorMaker || isAnchorChecker || isVendorChecker || isDealerChecker;
const showPendingApprovals = isAnchorMaker || isAnchorChecker || isVendorChecker || isDealerChecker;
const showRejectedFinances = isAnchorMaker || isAnchorChecker || isVendorChecker || isDealerChecker;
const showDiscountingPayments = isAnchorMaker || isAnchorChecker || isVendorChecker || isDealerChecker;

// Vendor Maker: Show only Invoice Dashboard, Invoice Details, DPD Invoice List
const showVendorMakerInvoiceSubset = isVendorMaker;
```

---

### 3.3 InvoiceDetails (MODIFY)

| Item | Detail |
|------|--------|
| **Role Flags** | Add `isVendorMaker`, `isVendorChecker`, `isDealerChecker` |
| **Primary Buttons** | |
| **Action Menu** | |

#### Primary Buttons by Role:

| Role | Buttons |
|------|---------|
| **Vendor Maker** | Upload Invoices, Create Invoice |
| **Vendor Checker** | Export |
| **Dealer Checker** | Export |

#### Action Menu (3 dots) by Role:

| Role | Menu Items |
|------|-----------|
| **Vendor Maker** | Edit, Recreate, Attachment, Print, Delete |
| **Vendor Checker** | Approve/Reject, Checker Approval, Attachment, Print |
| **Dealer Checker** | Approve/Reject, Checker Approval, Attachment, Print |

**Code Changes**:
```typescript
// Add role flags
const isVendorMaker = userRole === 'vendor_maker';
const isVendorChecker = userRole === 'vendor_checker';
const isDealerChecker = userRole === 'dealer_checker';

// Primary buttons section
{isVendorMaker && (
  <>
    <TouchableOpacity ...>Upload Invoices</TouchableOpacity>
    <TouchableOpacity ...>Create Invoice</TouchableOpacity>
  </>
)}

{isVendorChecker && (
  <TouchableOpacity ...>Export</TouchableOpacity>
)}

{isDealerChecker && (
  <TouchableOpacity ...>Export</TouchableOpacity>
)}

// Action menu section
{isVendorMaker && (
  <>
    <TouchableOpacity ...>Edit</TouchableOpacity>
    <TouchableOpacity ...>Recreate</TouchableOpacity>
    <TouchableOpacity ...>Attachment</TouchableOpacity>
    <TouchableOpacity ...>Print</TouchableOpacity>
    <TouchableOpacity ...>Delete</TouchableOpacity>
  </>
)}

{(isVendorChecker || isDealerChecker) && (
  <>
    <TouchableOpacity ...>Approve/Reject</TouchableOpacity>
    <TouchableOpacity ...>Checker Approval</TouchableOpacity>
    <TouchableOpacity ...>Attachment</TouchableOpacity>
    <TouchableOpacity ...>Print</TouchableOpacity>
  </>
)}
```

---

### 3.4 CreateInvoice / InvoiceForm (MODIFY)

| Item | Detail |
|------|--------|
| **Visibility** | Vendor Checker & Dealer Checker: Hide Create Invoice in Drawer + InvoiceDetails |
| **Labels** | InvoiceForm: Add `entityType: 'vendor'` support |

#### InvoiceForm Labels by Role:

| Role | Entity Type | Labels |
|------|-------------|--------|
| **Vendor Maker** | `vendor` | "Anchor Name", "Anchor Code", "Anchor OD Account" |
| **Anchor Maker** | `anchor` | "Dealer Name", "Dealer Code", "Dealer OD Account" |
| **Dealer Maker** | `dealer` | "Anchor Name", "Anchor Code", "Anchor OD Account" |

**Code Changes**:
```typescript
// InvoiceForm.tsx
type Props = {
  entityType?: 'anchor' | 'dealer' | 'vendor'; // Add 'vendor'
  // ... other props
};

// Derive entity type from role if not provided
const effectiveEntityType = entityType || 
  (isVendorMaker ? 'vendor' : 
   isDealerMaker ? 'dealer' : 
   'anchor');

const entityLabel = effectiveEntityType === 'vendor' ? 'Anchor' :
                   effectiveEntityType === 'dealer' ? 'Anchor' :
                   'Dealer';

// Use entityLabel in form fields
<Text>${entityLabel} Name</Text>
<Text>${entityLabel} Code</Text>
```

---

### 3.5 UploadInvoiceList (MODIFY)

| Item | Detail |
|------|--------|
| **Visibility** | Vendor Checker & Dealer Checker: Hide in Drawer |
| **Links** | Role-based link text below DashedButton |

#### Link Text by Role:

| Role | Link Text | Navigation |
|------|-----------|------------|
| **Vendor Maker** | "List of Anchor" | AnchorsListScreen |
| **Anchor Maker** | "List of Dealers" | DealerInvoicelist |
| **Dealer Maker** | "List of Anchor" | AnchorsListScreen |

**Code Changes**:
```typescript
// UploadInvoiceList.tsx
const isVendorMaker = userRole === 'vendor_maker';
const linkText = isVendorMaker || isDealerMaker 
  ? 'List of Anchor' 
  : 'List of Dealers';
const linkNavigation = isVendorMaker || isDealerMaker
  ? 'AnchorsListScreen'
  : 'DealerInvoicelist';

<TouchableOpacity onPress={() => navigation.navigate(linkNavigation as never)}>
  <Text>{linkText}</Text>
</TouchableOpacity>
```

---

## 4. File Change Summary

### 4.1 Modified Files (7)

| # | File | Changes |
|---|------|---------|
| 1 | `src/constants/roles.ts` | Add 3 new roles to `AppRole` type, `ROLE_LABELS`, `ROLE_HEADER_COLORS`, `ROLE_BUTTON_COLORS` |
| 2 | `src/screens/Auth/SelectRoleScreen.tsx` | Add 3 new role options to `roleOptions` array |
| 3 | `src/components/Drawer/DrawerContent.tsx` | Add role flags, update menu visibility logic |
| 4 | `src/screens/Invoice/InvoiceDetails.tsx` | Add role flags, add buttons/menu for 3 new roles |
| 5 | `src/components/InvoiceForm.tsx` | Add `vendor` entityType support, update labels |
| 6 | `src/screens/Invoice/UploadInvoiceList.tsx` | Add role-based link text logic |
| 7 | `src/screens/Invoice/CreateInvoice.tsx` | Pass `entityType='vendor'` for Vendor Maker |

### 4.2 New Files (0)

**No new screens or components needed** – Maximum reuse from existing implementation.

---

## 5. Implementation Order (Phases)

### Phase 1: Role Constants & Types
1. Update `src/constants/roles.ts`:
   - Add 3 new roles to `AppRole` type
   - Add labels to `ROLE_LABELS`
   - Add colors to `ROLE_HEADER_COLORS` (distinct shades)
   - Add button colors to `ROLE_BUTTON_COLORS`

### Phase 2: SelectRoleScreen
2. Update `src/screens/Auth/SelectRoleScreen.tsx`:
   - Add 3 new roles to `roleOptions` array
   - Test role selection flow

### Phase 3: DrawerContent
3. Update `src/components/Drawer/DrawerContent.tsx`:
   - Add `isVendorMaker`, `isVendorChecker`, `isDealerChecker` flags
   - Update `showPayments`, `showPendingApprovals`, etc. logic
   - Add conditional rendering for Vendor Maker invoice subset
   - Test drawer menu visibility for all 3 roles

### Phase 4: InvoiceDetails
4. Update `src/screens/Invoice/InvoiceDetails.tsx`:
   - Add 3 new role flags
   - Add Vendor Maker buttons (Upload, Create)
   - Add Vendor Checker & Dealer Checker Export button
   - Add Vendor Maker action menu (Edit, Recreate, etc.)
   - Add Vendor Checker & Dealer Checker action menu (Approve/Reject, etc.)
   - Test buttons and menus for all 3 roles

### Phase 5: InvoiceForm & CreateInvoice
5. Update `src/components/InvoiceForm.tsx`:
   - Add `vendor` to `entityType` type
   - Update label logic to handle `vendor` entityType
   - Test form labels for Vendor Maker

6. Update `src/screens/Invoice/CreateInvoice.tsx`:
   - Pass `entityType='vendor'` when `isVendorMaker`
   - Test Create Invoice flow for Vendor Maker

### Phase 6: UploadInvoiceList
7. Update `src/screens/Invoice/UploadInvoiceList.tsx`:
   - Add Vendor Maker role flag
   - Update link text logic (show "List of Anchor" for Vendor Maker)
   - Update navigation logic
   - Test link functionality

### Phase 7: Testing & Polish
8. Test all 3 roles:
   - Vendor Maker: Create Invoice, Upload Invoice, View Invoice Details
   - Vendor Checker: View Invoice Details, Approve/Reject, Export
   - Dealer Checker: View Invoice Details, Approve/Reject, Export
9. Verify drawer menu visibility for all roles
10. Verify colors are distinct and visible
11. Verify all buttons and menus work correctly

---

## 6. Role-Specific Details

### 6.1 Vendor Maker

**Responsibilities**:
- Create invoices for goods supplied to Anchor
- Upload invoice documents
- Edit draft invoices
- Submit invoices for approval
- Track invoice status

**UI Features**:
- ✅ Upload Invoices button
- ✅ Create Invoice button
- ✅ Action menu: Edit, Recreate, Attachment, Print, Delete
- ✅ InvoiceForm labels: "Anchor Name", "Anchor Code"
- ✅ Drawer: TRANSACTIONS > Invoice (subset: Dashboard, Details, DPD List)
- ❌ No Payments menu
- ❌ No Pending Approvals menu

**Color Scheme**: Light blue tint (`#E8F4FD`)

---

### 6.2 Vendor Checker

**Responsibilities**:
- Review invoices submitted by Vendor Maker
- Verify invoice details (amount, date, products, GRN)
- Approve or reject invoices (internal approval)
- Provide rejection reasons
- Forward approved invoices to Anchor for final approval

**UI Features**:
- ✅ Export button
- ✅ Action menu: Approve/Reject, Checker Approval, Attachment, Print
- ✅ ApproveRejectModal (reuse existing)
- ✅ CheckerApprovalModal (reuse existing)
- ✅ Drawer: TRANSACTIONS > Invoice (all 6 items) + Payments (all 4)
- ❌ No Create Invoice button
- ❌ No Upload Invoice button

**Color Scheme**: Slightly darker blue (`#D1E9F7`)

---

### 6.3 Dealer Checker

**Responsibilities**:
- Review invoices submitted by Dealer Maker
- Verify invoice details (amount, date, products, GRN)
- Approve or reject invoices (internal approval)
- Provide rejection reasons
- Forward approved invoices to Anchor for final approval

**UI Features**:
- ✅ Export button
- ✅ Action menu: Approve/Reject, Checker Approval, Attachment, Print
- ✅ ApproveRejectModal (reuse existing)
- ✅ CheckerApprovalModal (reuse existing)
- ✅ Drawer: TRANSACTIONS > Invoice (all 6 items) + Payments (all 4)
- ❌ No Create Invoice button
- ❌ No Upload Invoice button

**Color Scheme**: Lighter peach/orange (`#FFD4B3`)

---

## 7. Testing Checklist

### 7.1 Vendor Maker
- [ ] SelectRoleScreen: Vendor Maker option visible and selectable
- [ ] Drawer: Header color shows light blue tint
- [ ] Drawer: TRANSACTIONS > Invoice shows only Dashboard, Details, DPD List
- [ ] Drawer: No Payments menu visible
- [ ] Invoice Details: Upload Invoices button visible
- [ ] Invoice Details: Create Invoice button visible
- [ ] Invoice Details: Action menu shows Edit, Recreate, Attachment, Print, Delete
- [ ] Create Invoice: Form labels show "Anchor Name", "Anchor Code"
- [ ] Upload Invoice List: Link shows "List of Anchor"
- [ ] Navigation: All screens accessible

### 7.2 Vendor Checker
- [ ] SelectRoleScreen: Vendor Checker option visible and selectable
- [ ] Drawer: Header color shows darker blue tint
- [ ] Drawer: TRANSACTIONS > Invoice shows all 6 items
- [ ] Drawer: Payments menu shows all 4 items
- [ ] Invoice Details: Export button visible
- [ ] Invoice Details: No Upload/Create buttons visible
- [ ] Invoice Details: Action menu shows Approve/Reject, Checker Approval, Attachment, Print
- [ ] ApproveRejectModal: Opens on Approve/Reject click
- [ ] CheckerApprovalModal: Opens on Checker Approval click
- [ ] Navigation: All screens accessible

### 7.3 Dealer Checker
- [ ] SelectRoleScreen: Dealer Checker option visible and selectable
- [ ] Drawer: Header color shows lighter peach/orange tint
- [ ] Drawer: TRANSACTIONS > Invoice shows all 6 items
- [ ] Drawer: Payments menu shows all 4 items
- [ ] Invoice Details: Export button visible
- [ ] Invoice Details: No Upload/Create buttons visible
- [ ] Invoice Details: Action menu shows Approve/Reject, Checker Approval, Attachment, Print
- [ ] ApproveRejectModal: Opens on Approve/Reject click
- [ ] CheckerApprovalModal: Opens on Checker Approval click
- [ ] Navigation: All screens accessible

---

## 8. Color Scheme Reference

| Role | Header BG | Border | Button BG | Button Border | Button Text |
|------|-----------|--------|-----------|---------------|-------------|
| Anchor Maker | `#FFE9E9` | `rgba(227, 6, 19, 0.5)` | `#FFE9E9` | `#FFD9D9` | `#E30613` |
| Anchor Checker | `#FFD9D9` | `rgba(227, 6, 19, 0.45)` | `#FFD9D9` | `#FFC4C4` | `#E30613` |
| Dealer Maker | `#FFE8D6` | `rgba(227, 6, 19, 0.4)` | `#FFE8D6` | `#FFD4B3` | `#E30613` |
| **Dealer Checker** | `#FFD4B3` | `rgba(227, 6, 19, 0.35)` | `#FFD4B3` | `#FFC19A` | `#E30613` |
| **Vendor Maker** | `#E8F4FD` | `rgba(227, 6, 19, 0.3)` | `#E8F4FD` | `#D1E9F7` | `#E30613` |
| **Vendor Checker** | `#D1E9F7` | `rgba(227, 6, 19, 0.25)` | `#D1E9F7` | `#B8DDF0` | `#E30613` |

**Note**: Colors are distinct enough to identify roles while maintaining brand consistency.

---

## 9. API Considerations

### 9.1 Filter Status Values

Current filter statuses in `InvoiceDetails.tsx`:
```typescript
'Approval Status': [
  'PENDING_ANCHOR_CHECKER',
  'PENDING_DEALER_MAKER',
  'PENDING_DEALER_CHECKER',
  'APPROVAL_COMPLETE',
  'REJECTED_BY_ANCHOR_CHECKER',
  'REJECTED_BY_DEALER_MAKER',
  'REJECTED_BY_DEALER_CHECKER',
]
```

**May need to add** (if API supports):
- `PENDING_VENDOR_CHECKER`
- `REJECTED_BY_VENDOR_CHECKER`

**Note**: Check with backend team if these statuses are needed.

---

## 10. Reuse vs New – Quick Reference

| Component/Screen | Action | Based On |
|------------------|--------|----------|
| SelectRoleScreen | MODIFY | Add 3 options |
| DrawerContent | MODIFY | Update visibility logic |
| InvoiceDetails | MODIFY | Add role-based buttons/menu |
| InvoiceForm | MODIFY | Add vendor entityType |
| CreateInvoice | MODIFY | Pass vendor entityType |
| UploadInvoiceList | MODIFY | Update link text |
| ApproveRejectModal | REUSE | Existing (no changes) |
| CheckerApprovalModal | REUSE | Existing (no changes) |

**Key Insight**: **100% reuse** – No new screens or components needed!

---

## 11. Estimated Effort

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Role Constants | Update roles.ts | 30 min |
| Phase 2: SelectRoleScreen | Add 3 options | 15 min |
| Phase 3: DrawerContent | Update menu logic | 1 hour |
| Phase 4: InvoiceDetails | Add buttons/menu | 2 hours |
| Phase 5: InvoiceForm | Add vendor support | 1 hour |
| Phase 6: UploadInvoiceList | Update links | 30 min |
| Phase 7: Testing | Test all 3 roles | 2 hours |
| **Total** | | **~7 hours** |

---

## 12. Dependencies

- ✅ Existing role infrastructure (already implemented)
- ✅ ApproveRejectModal (already exists)
- ✅ CheckerApprovalModal (already exists)
- ✅ All existing screens (reuse)
- ⚠️ Backend API support for Vendor/Dealer Checker approval statuses (verify)

---

## 13. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| API doesn't support Vendor/Dealer Checker statuses | Medium | Use existing statuses, add new ones later if needed |
| Color scheme not distinct enough | Low | Test with users, adjust if needed |
| Menu visibility logic becomes complex | Low | Use clear boolean flags, add comments |

---

## 14. Next Steps After Implementation

1. **Testing**: Complete testing checklist for all 3 roles
2. **User Feedback**: Get feedback on color scheme and UI
3. **API Integration**: Verify backend supports all required statuses
4. **Documentation**: Update user documentation with new roles
5. **Training**: Prepare training materials for new roles

---

*Document Version: 1.0*  
*Last Updated: February 2026*  
*Author: CashnTech Development Team*
