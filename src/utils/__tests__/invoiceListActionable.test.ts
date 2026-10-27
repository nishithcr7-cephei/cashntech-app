import {
  canShowFinanceRequest,
  canShowNoticeOfAssignment,
  canShowViewNoticeOfAssignment,
  canShowWorkflowApproveReject,
  isInvoiceBulkSelectable,
  isNoticeOfAssignmentStep,
  isPendingInvoiceApprovalRow,
} from '../invoiceListActionable';

const noaRow = {
  actionable: true as const,
  currentStepActionType: 'Notice of Assignment',
  rawInvoiceStatus: 'Created',
};

const financeRow = {
  actionable: true as const,
  currentStepActionType: 'Finance Request',
  rawInvoiceStatus: 'Created',
};

const approveRow = {
  actionable: true as const,
  currentStepActionType: 'Approve',
  rawInvoiceStatus: 'Created',
};

describe('invoiceListActionable — Notice of Assignment', () => {
  describe('isNoticeOfAssignmentStep', () => {
    it('matches Notice of Assignment (case-insensitive)', () => {
      expect(isNoticeOfAssignmentStep(noaRow)).toBe(true);
      expect(
        isNoticeOfAssignmentStep({
          currentStepActionType: 'notice of assignment',
        }),
      ).toBe(true);
    });

    it('rejects other steps and empty', () => {
      expect(isNoticeOfAssignmentStep(financeRow)).toBe(false);
      expect(isNoticeOfAssignmentStep(approveRow)).toBe(false);
      expect(isNoticeOfAssignmentStep({})).toBe(false);
    });
  });

  describe('canShowNoticeOfAssignment', () => {
    it('shows when actionable + NOA step + permission', () => {
      expect(canShowNoticeOfAssignment(noaRow, true)).toBe(true);
    });

    it('hides without permission, actionable false, or wrong step', () => {
      expect(canShowNoticeOfAssignment(noaRow, false)).toBe(false);
      expect(
        canShowNoticeOfAssignment({...noaRow, actionable: false}, true),
      ).toBe(false);
      expect(canShowNoticeOfAssignment(financeRow, true)).toBe(false);
      expect(canShowNoticeOfAssignment(approveRow, true)).toBe(false);
    });

    it('hides for CashnTech admin', () => {
      expect(
        canShowNoticeOfAssignment(noaRow, true, {isCashnTechUser: true}),
      ).toBe(false);
    });
  });

  describe('mutual exclusion Approve / Finance Request / NOA', () => {
    it('NOA step: NOA only — not Finance Request, not party Approve', () => {
      expect(canShowNoticeOfAssignment(noaRow, true)).toBe(true);
      expect(canShowFinanceRequest(noaRow, true)).toBe(false);
      expect(
        canShowWorkflowApproveReject(noaRow, true, {
          roleLabel: 'Anchor Maker',
        }),
      ).toBe(false);
    });

    it('Finance Request step: FR only — not NOA', () => {
      expect(canShowFinanceRequest(financeRow, true)).toBe(true);
      expect(canShowNoticeOfAssignment(financeRow, true)).toBe(false);
      expect(
        canShowWorkflowApproveReject(financeRow, true, {
          roleLabel: 'Anchor Maker',
        }),
      ).toBe(false);
    });

    it('Approve step: Approve only — not FR, not NOA', () => {
      expect(
        canShowWorkflowApproveReject(approveRow, true, {
          roleLabel: 'Anchor Checker',
        }),
      ).toBe(true);
      expect(canShowFinanceRequest(approveRow, true)).toBe(false);
      expect(canShowNoticeOfAssignment(approveRow, true)).toBe(false);
    });
  });

  describe('canShowViewNoticeOfAssignment', () => {
    it('shows for SID workspace when not on serve step', () => {
      expect(
        canShowViewNoticeOfAssignment(
          {...approveRow, rawInvoiceStatus: 'Created'},
          true,
          {isSidWorkspace: true},
        ),
      ).toBe(true);
    });

    it('hides when serve menu is active, draft, or non-SID', () => {
      expect(
        canShowViewNoticeOfAssignment(noaRow, true, {isSidWorkspace: true}),
      ).toBe(false);
      expect(
        canShowViewNoticeOfAssignment(
          {...approveRow, rawInvoiceStatus: 'Draft'},
          true,
          {isSidWorkspace: true},
        ),
      ).toBe(false);
      expect(
        canShowViewNoticeOfAssignment(approveRow, true, {
          isSidWorkspace: false,
        }),
      ).toBe(false);
    });
  });

  describe('isInvoiceBulkSelectable — exclude NOA', () => {
    const partyCtx = {
      isCashnTechUser: false,
      hasFunctionalPermission: true,
      canVerify: false,
      canBulkActions: true,
    };

    it('excludes Notice of Assignment rows even when actionable', () => {
      expect(isInvoiceBulkSelectable(noaRow, partyCtx)).toBe(false);
    });

    it('still allows Approve-step actionable party bulk', () => {
      expect(isInvoiceBulkSelectable(approveRow, partyCtx)).toBe(true);
    });
  });

  describe('isPendingInvoiceApprovalRow — exclude NOA', () => {
    const makerCtx = {
      isCashnTechUser: false,
      canApprove: true,
      canReject: true,
      isAnchorMaker: true,
    };

    it('does not treat NOA step as approval-pending (keeps Sr. order)', () => {
      expect(isPendingInvoiceApprovalRow(noaRow, makerCtx)).toBe(false);
    });

    it('still flags Approve-step actionable Created rows', () => {
      expect(isPendingInvoiceApprovalRow(approveRow, makerCtx)).toBe(true);
    });
  });
});
