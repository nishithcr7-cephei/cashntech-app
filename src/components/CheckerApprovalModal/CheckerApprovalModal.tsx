import React, {useMemo} from 'react';
import {
  InvoiceTrackingModal,
  type WorkflowStep,
} from '../InvoiceTrackingModal/InvoiceTrackingModal';

export type CheckerApprovalEntry = {
  id: string;
  approvedBy: string;
  approvalDate: string;
  status: 'Approved' | 'Rejected';
  role?: string;
  approvalLevel?: string;
  action?: string;
  remark?: string;
  rejectionReason?: string;
};

type CheckerApprovalModalProps = {
  visible: boolean;
  onClose: () => void;
  approvalEntries?: CheckerApprovalEntry[];
  loading?: boolean;
  invoiceNo?: string;
  invoiceAmount?: string;
  counterParty?: string;
  primaryParty?: string;
  raisedOn?: string;
  dueOn?: string;
  programName?: string;
  steps?: WorkflowStep[];
};

function mapEntryToStep(entry: CheckerApprovalEntry): WorkflowStep {
  return {
    id: entry.id,
    action: entry.action || entry.status,
    roleLabel: entry.role || '',
    userName: entry.approvedBy || '',
    timestamp: entry.approvalDate || '',
    status: entry.status === 'Rejected' ? 'rejected' : 'completed',
  };
}

/**
 * Legacy wrapper — renders Invoice Tracking UI.
 * Prefer passing `steps` + summary fields; `approvalEntries` still maps for older screens.
 */
export const CheckerApprovalModal: React.FC<CheckerApprovalModalProps> = ({
  visible,
  onClose,
  approvalEntries = [],
  loading = false,
  invoiceNo,
  invoiceAmount,
  counterParty,
  primaryParty,
  raisedOn,
  dueOn,
  programName,
  steps,
}) => {
  const resolvedSteps = useMemo(() => {
    if (steps != null) {
      return steps;
    }
    return approvalEntries.map(mapEntryToStep);
  }, [steps, approvalEntries]);

  return (
    <InvoiceTrackingModal
      visible={visible}
      onClose={onClose}
      loading={loading}
      invoiceNo={invoiceNo}
      invoiceAmount={invoiceAmount}
      counterParty={counterParty}
      primaryParty={primaryParty}
      raisedOn={raisedOn}
      dueOn={dueOn}
      programName={programName}
      steps={resolvedSteps}
    />
  );
};
