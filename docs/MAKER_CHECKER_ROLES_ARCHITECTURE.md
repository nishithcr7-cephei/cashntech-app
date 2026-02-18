# Maker and Checker Roles Architecture

## Overview

This document describes the **Maker and Checker roles architecture** for the CashnTech mobile application and web portal. It explains which roles are available on which platform and why, based on security, usability, and industry best practices.

---

## Executive Summary

### Key Principle
- **Mobile App**: Maker roles only (create/submit invoices)
- **Web Portal**: Maker + Checker roles (complete functionality)
- **Reason**: Checker roles require proper screen space and security - risky on mobile devices

---

## Mobile App Roles

### ✅ Available Roles (Maker Only)

| Role | Available | Functionality |
|------|-----------|--------------|
| **Anchor Maker** | ✅ Yes | Create/Edit/Submit invoices |
| **Vendor Maker** | ✅ Yes | Create/Submit invoices |
| **Dealer Maker** | ✅ Yes | Create/Submit invoices |

### ❌ Not Available Roles (Checker)

| Role | Available | Reason |
|------|-----------|--------|
| **Anchor Checker** | ❌ No | Verification needs proper screen space - risky on mobile |
| **Vendor Checker** | ❌ No | Verification needs proper screen space - risky on mobile |
| **Dealer Checker** | ❌ No | Verification needs proper screen space - risky on mobile |

---

## Web Portal Roles

### ✅ Available Roles (Maker + Checker)

| Role | Available | Functionality |
|------|-----------|--------------|
| **Anchor Maker** | ✅ Yes | Create/Edit/Submit invoices (better screen space) |
| **Anchor Checker** | ✅ Yes | Review/Approve/Reject invoices (final approval) |
| **Vendor Maker** | ✅ Yes | Create/Submit invoices (better screen space) |
| **Vendor Checker** | ✅ Yes | Review/Approve/Reject invoices (internal approval) |
| **Dealer Maker** | ✅ Yes | Create/Submit invoices (better screen space) |
| **Dealer Checker** | ✅ Yes | Review/Approve/Reject invoices (internal approval) |

---

## Role Definitions

### 1. Anchor Maker

**Role**: Creates and submits invoices on behalf of Anchor

**Responsibilities**:
- Create invoices for goods/services
- Edit draft invoices
- Fill invoice details (amount, date, GRN, products)
- Submit invoices for approval
- Track invoice status

**Permissions**:
- ✅ Create invoices
- ✅ Edit own invoices (draft status)
- ✅ Submit invoices for approval
- ❌ Cannot approve own invoices
- ❌ Cannot approve other invoices

**Available On**:
- ✅ Mobile App
- ✅ Web Portal

---

### 2. Anchor Checker

**Role**: Reviews and approves/rejects invoices (final approval authority)

**Responsibilities**:
- Review invoices submitted by Vendors and Dealers
- Verify invoice details (amount, date, products, GRN)
- Verify supporting documents
- Approve or reject invoices
- Provide rejection reasons (if rejected)
- Trigger finance processing (on approval)

**Permissions**:
- ✅ View all submitted invoices
- ✅ Approve invoices
- ✅ Reject invoices
- ✅ Add rejection reasons
- ❌ Cannot create invoices (usually)

**Available On**:
- ❌ Mobile App (risky - not recommended)
- ✅ Web Portal (recommended)

**Why Not on Mobile**:
- Limited screen space for detailed verification
- Security concerns (financial approvals on mobile device)
- Risk of mistakes due to small screen
- Complex documents difficult to review
- Device loss/theft risk

---

### 3. Vendor Maker

**Role**: Creates invoices for goods supplied to Anchor

**Responsibilities**:
- Create invoices for goods supplied
- Fill invoice details (amount, date, GRN, products supplied)
- Submit invoices for approval
- Track invoice status

**Permissions**:
- ✅ Create invoices
- ✅ Edit own invoices (draft status)
- ✅ Submit invoices for approval
- ❌ Cannot approve own invoices

**Available On**:
- ✅ Mobile App
- ✅ Web Portal

---

### 4. Vendor Checker

**Role**: Reviews and approves/rejects Vendor invoices (internal approval before sending to Anchor)

**Responsibilities**:
- Review invoices submitted by Vendor Maker
- Verify invoice details (amount, date, products, GRN)
- Verify supporting documents
- Approve or reject invoices (internal approval)
- Provide rejection reasons (if rejected)
- Forward approved invoices to Anchor for final approval

**Permissions**:
- ✅ View Vendor invoices
- ✅ Approve Vendor invoices (internal)
- ✅ Reject Vendor invoices
- ✅ Add rejection reasons
- ❌ Cannot create invoices (usually)

**Available On**:
- ❌ Mobile App (risky - not recommended)
- ✅ Web Portal (recommended)

**Why Not on Mobile**:
- Limited screen space for detailed verification
- Security concerns (financial approvals on mobile device)
- Risk of mistakes due to small screen
- Complex documents difficult to review
- Device loss/theft risk

---

### 5. Dealer Maker

**Role**: Creates invoices for stock purchased from Anchor

**Responsibilities**:
- Create invoices for stock purchases
- Fill invoice details (amount, date, GRN, products purchased)
- Submit invoices for approval
- Track invoice status

**Permissions**:
- ✅ Create invoices
- ✅ Edit own invoices (draft status)
- ✅ Submit invoices for approval
- ❌ Cannot approve own invoices

**Available On**:
- ✅ Mobile App
- ✅ Web Portal

---

### 6. Dealer Checker

**Role**: Reviews and approves/rejects Dealer invoices (internal approval before sending to Anchor)

**Responsibilities**:
- Review invoices submitted by Dealer Maker
- Verify invoice details (amount, date, products, GRN)
- Verify supporting documents
- Approve or reject invoices (internal approval)
- Provide rejection reasons (if rejected)
- Forward approved invoices to Anchor for final approval

**Permissions**:
- ✅ View Dealer invoices
- ✅ Approve Dealer invoices (internal)
- ✅ Reject Dealer invoices
- ✅ Add rejection reasons
- ❌ Cannot create invoices (usually)

**Available On**:
- ❌ Mobile App (risky - not recommended)
- ✅ Web Portal (recommended)

**Why Not on Mobile**:
- Limited screen space for detailed verification
- Security concerns (financial approvals on mobile device)
- Risk of mistakes due to small screen
- Complex documents difficult to review
- Device loss/theft risk

---

## Complete Workflow Scenarios

### Scenario 1: Vendor Invoice Flow

```
Step 1: Mobile App (Vendor Maker)
├── Vendor Maker creates invoice
├── Fills invoice details (amount, date, GRN, products)
└── Submits invoice for approval

Step 2: Web Portal (Vendor Checker - if internal approval needed)
├── Vendor Checker reviews invoice
├── Verifies details
├── Approves invoice (internal approval)
└── Invoice forwarded to Anchor

Step 3: Web Portal (Anchor Checker - final approval)
├── Anchor Checker reviews invoice
├── Verifies details
├── Approves invoice (final approval)
└── Finance processing starts (SID)
```

### Scenario 2: Dealer Invoice Flow

```
Step 1: Mobile App (Dealer Maker)
├── Dealer Maker creates invoice
├── Fills invoice details (amount, date, GRN, products)
└── Submits invoice for approval

Step 2: Web Portal (Dealer Checker - if internal approval needed)
├── Dealer Checker reviews invoice
├── Verifies details
├── Approves invoice (internal approval)
└── Invoice forwarded to Anchor

Step 3: Web Portal (Anchor Checker - final approval)
├── Anchor Checker reviews invoice
├── Verifies details
├── Approves invoice (final approval)
└── Finance processing starts (PID)
```

### Scenario 3: Anchor Invoice Flow (if Anchor creates invoices)

```
Step 1: Mobile App (Anchor Maker)
├── Anchor Maker creates invoice
├── Fills invoice details
└── Submits invoice for approval

Step 2: Web Portal (Anchor Checker - final approval)
├── Anchor Checker reviews invoice
├── Verifies details
├── Approves invoice (final approval)
└── Finance processing starts
```

---

## Why This Architecture?

### Mobile App: Maker Roles Only

#### Advantages:
1. **Mobile-Friendly**
   - Invoice creation is manageable on mobile
   - Form filling is easy
   - Camera integration for document capture
   - Quick submission

2. **Lower Risk**
   - Mistakes while creating can be corrected
   - Edit/delete possible before submission
   - No financial approval risk on mobile

3. **Better UX**
   - Mobile is convenient for on-the-go creation
   - Users can create invoices anywhere
   - Quick and easy process

### Mobile App: Checker Roles Avoided

#### Reasons:
1. **Limited Screen Space**
   - Multiple fields comparison difficult
   - Documents/images not clearly visible
   - Complex data review challenging
   - Long invoice lists hard to navigate

2. **Security Concerns**
   - Financial approvals risky on mobile devices
   - Device loss/theft risk
   - Screen sharing/recording risk
   - Public place approvals risky

3. **Error Prevention**
   - Wrong approval can cause financial loss
   - Mistakes more likely on small screen
   - Complex verification needs proper tools

### Web Portal: Maker + Checker Both

#### Advantages:
1. **Complete Functionality**
   - Maker: Better screen for complex invoices
   - Checker: Proper verification possible
   - All features available

2. **Flexibility**
   - Users can use both platforms
   - Mobile: Quick creation
   - Web: Detailed work and approvals

3. **Industry Standard**
   - Most finance apps follow this pattern
   - Mobile: Maker, Web: Checker
   - Proven approach

---

## Comparison Table

### Mobile App

| Role | Available | Functionality | Risk Level |
|------|-----------|--------------|------------|
| Anchor Maker | ✅ Yes | Create/Edit/Submit | Low |
| Anchor Checker | ❌ No | N/A | High (if on mobile) |
| Vendor Maker | ✅ Yes | Create/Submit | Low |
| Vendor Checker | ❌ No | N/A | High (if on mobile) |
| Dealer Maker | ✅ Yes | Create/Submit | Low |
| Dealer Checker | ❌ No | N/A | High (if on mobile) |

### Web Portal

| Role | Available | Functionality | Risk Level |
|------|-----------|--------------|------------|
| Anchor Maker | ✅ Yes | Create/Edit/Submit | Low |
| Anchor Checker | ✅ Yes | Review/Approve/Reject | Low (proper screen) |
| Vendor Maker | ✅ Yes | Create/Submit | Low |
| Vendor Checker | ✅ Yes | Review/Approve/Reject | Low (proper screen) |
| Dealer Maker | ✅ Yes | Create/Submit | Low |
| Dealer Checker | ✅ Yes | Review/Approve/Reject | Low (proper screen) |

---

## Security Considerations

### Mobile App Security
- ✅ Maker roles: Low risk (creation only)
- ❌ Checker roles: High risk (financial approvals)
- ✅ No sensitive approvals on mobile
- ✅ Device security less critical for makers

### Web Portal Security
- ✅ Proper authentication required
- ✅ Session management
- ✅ Audit logs for approvals
- ✅ Role-based access control
- ✅ Secure environment for financial approvals

---

## Implementation Guidelines

### Mobile App Implementation

#### Maker Roles:
1. **Invoice Creation**
   - Form-based input
   - Camera integration for documents
   - Auto-save drafts
   - Validation before submission

2. **Invoice Management**
   - View own invoices
   - Edit draft invoices
   - Submit for approval
   - Track status

3. **No Approval Features**
   - No approve/reject buttons
   - No approval queue
   - No verification screens

### Web Portal Implementation

#### Maker Roles:
1. **Invoice Creation**
   - Full-featured form
   - Better screen space
   - Advanced features
   - Bulk operations

#### Checker Roles:
1. **Approval Queue**
   - List of pending approvals
   - Filter and search
   - Sort by priority/date

2. **Verification Screen**
   - Full invoice details
   - Side-by-side comparison
   - Document viewer
   - History tracking

3. **Approval Actions**
   - Approve button
   - Reject button with reason
   - Bulk approval (if needed)
   - Comments/notes

---

## Industry Best Practices

### Similar Applications:
- **Banking Apps**: Mobile for transactions, Web for approvals
- **ERP Systems**: Mobile for data entry, Web for approvals
- **Finance Apps**: Mobile for requests, Web for verification
- **Procurement Apps**: Mobile for requisitions, Web for approvals

### Common Pattern:
```
Mobile App = Maker (Create/Submit)
Web Portal = Maker + Checker (Complete Functionality)
```

---

## FAQs

### Q: Why can't Checker roles be on mobile?
**A**: Checker roles require detailed verification which is risky on mobile due to limited screen space, security concerns, and higher chance of mistakes.

### Q: Can Maker use web portal?
**A**: Yes, Maker can use both mobile and web. Web provides better screen space for complex invoices.

### Q: Can Checker use mobile app?
**A**: No, Checker should only use web portal for proper verification and security.

### Q: What if we need mobile approval?
**A**: If absolutely necessary, implement with:
- Simplified approval flow
- Warning messages
- Limited to small amounts
- Additional verification steps

### Q: Who has final approval authority?
**A**: Anchor Checker has final approval authority for all invoices (Vendor and Dealer).

### Q: What is internal approval?
**A**: Vendor/Dealer Checker provides internal approval before sending to Anchor. This is optional and depends on company policy.

---

## Summary

### Mobile App:
- ✅ **Maker roles only** (Anchor, Vendor, Dealer)
- ❌ **No Checker roles** (security and usability concerns)

### Web Portal:
- ✅ **Maker roles** (better screen space)
- ✅ **Checker roles** (proper verification)

### Key Principle:
**Mobile = Creation, Web = Verification**

This architecture ensures:
- ✅ Security (no risky approvals on mobile)
- ✅ Usability (appropriate features on each platform)
- ✅ Industry best practices (proven approach)
- ✅ Risk minimization (proper verification on web)

---

## Document Version

- **Version**: 1.0
- **Last Updated**: February 2026
- **Author**: CashnTech Development Team
- **Status**: Approved Architecture
