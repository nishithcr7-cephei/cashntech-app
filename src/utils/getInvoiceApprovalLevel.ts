import type {Bank} from '@constants/programSelection';

/** Matches backend workflow_config.level for invoice approve/reject APIs (0 is valid). */
export type InvoiceApprovalLevelContext = {
  /** From GET /user/scope → products[].approval_level (same as web). */
  workflowLevelFromScope?: number | null;
  rawApprovalStatus?: string | null;
  isAnchorChecker?: boolean;
  isDealerMaker?: boolean;
  isDealerChecker?: boolean;
};

/** workflow_config.level from API; includes 0 (e.g. Dealer All Access entry level). */
export function parseWorkflowLevel(level: unknown): number | null {
  if (level == null) return null;
  const n = Number(level);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function getWorkflowApprovalLevelFromScope(
  scopeData: Bank[] | null | undefined,
  productId: string | null | undefined,
): number | null {
  if (!scopeData?.length || !productId) return null;
  for (const bank of scopeData) {
    for (const product of bank.products || []) {
      if (product.id === productId) {
        return parseWorkflowLevel(product.approval_level);
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
        return parseWorkflowLevel(product.approval_level);
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
      const level = parseWorkflowLevel(product.approval_level);
      if (level != null) return level;
    }
  }
  return null;
}

/**
 * Resolves approval_level for PATCH /invoice/status and bulk checker APIs.
 * Prefer workflow level from user scope (web parity, including 0); then role fallback.
 */
export function getInvoiceApprovalLevel(ctx: InvoiceApprovalLevelContext): number {
  const scopeLevel = parseWorkflowLevel(ctx.workflowLevelFromScope);
  if (scopeLevel != null) {
    return scopeLevel;
  }

  // Only when scope has no level — last resort (tenant-specific).
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
