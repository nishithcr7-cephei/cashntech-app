import type {Bank} from '@constants/programSelection';

/** Matches backend workflow_config.level for invoice approve/reject APIs. */
export type InvoiceApprovalLevelContext = {
  /** From GET /user/scope → products[].approval_level (same as web). */
  workflowLevelFromScope?: number | null;
  rawApprovalStatus?: string | null;
  isAnchorChecker?: boolean;
  isDealerMaker?: boolean;
  isDealerChecker?: boolean;
};

export function getWorkflowApprovalLevelFromScope(
  scopeData: Bank[] | null | undefined,
  productId: string | null | undefined,
): number | null {
  if (!scopeData?.length || !productId) return null;
  for (const bank of scopeData) {
    for (const product of bank.products || []) {
      if (product.id === productId) {
        const level = product.approval_level;
        if (level != null && Number.isFinite(Number(level)) && Number(level) > 0) {
          return Number(level);
        }
      }
    }
  }
  return null;
}

export function getWorkflowApprovalLevelForProgram(
  scopeData: Bank[] | null | undefined,
  programId: string | null | undefined,
): number | null {
  if (!scopeData?.length || !programId) return null;
  for (const bank of scopeData) {
    for (const product of bank.products || []) {
      const program = product.programs?.find(p => p.id === programId);
      if (program) {
        const level = product.approval_level;
        if (level != null && Number.isFinite(Number(level)) && Number(level) > 0) {
          return Number(level);
        }
      }
    }
  }
  return null;
}

/** When product/program not selected (e.g. All Program scope), use any workflow level from scope. */
export function getBestWorkflowApprovalLevelFromScope(
  scopeData: Bank[] | null | undefined,
  opts?: {productId?: string | null; programId?: string | null},
): number | null {
  const byProduct = getWorkflowApprovalLevelFromScope(scopeData, opts?.productId);
  if (byProduct != null) return byProduct;
  const byProgram = getWorkflowApprovalLevelForProgram(scopeData, opts?.programId);
  if (byProgram != null) return byProgram;
  if (!scopeData?.length) return null;
  for (const bank of scopeData) {
    for (const product of bank.products || []) {
      const level = product.approval_level;
      if (level != null && Number.isFinite(Number(level)) && Number(level) > 0) {
        return Number(level);
      }
    }
  }
  return null;
}

/**
 * Resolves approval_level for PATCH /invoice/status and bulk checker APIs.
 * Prefer workflow level from user scope (web parity); then status text; then role.
 */
export function getInvoiceApprovalLevel(ctx: InvoiceApprovalLevelContext): number {
  const scopeLevel = ctx.workflowLevelFromScope;
  if (
    scopeLevel != null &&
    Number.isFinite(Number(scopeLevel)) &&
    Number(scopeLevel) > 0
  ) {
    return Number(scopeLevel);
  }

  // Legacy label fallbacks only when scope has no workflow level (tenant-specific; avoid ANCHOR_CHECKER→1).
  if (ctx.isDealerChecker) return 3;
  if (ctx.isDealerMaker) return 2;
  if (ctx.isAnchorChecker) return 2;
  return 1;
}

export function getInvoiceApprovalLevelForId(
  invoiceId: string,
  lookupRawApprovalStatus: (id: string) => string | undefined,
  roleCtx: Omit<InvoiceApprovalLevelContext, 'rawApprovalStatus' | 'workflowLevelFromScope'>,
  workflowLevelFromScope?: number | null,
): number {
  return getInvoiceApprovalLevel({
    workflowLevelFromScope,
    rawApprovalStatus: lookupRawApprovalStatus(invoiceId),
    ...roleCtx,
  });
}
