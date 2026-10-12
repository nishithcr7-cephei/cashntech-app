import React, {useMemo} from 'react';
import {FilterSheet} from '@components/FilterSheet/FilterSheet';
import type {
  FilterSheetGroup,
  FilterSheetValue,
} from '@components/FilterSheet/filterSheet.utils';
import {
  ADMIN_STATUS_OPTIONS,
  INVOICE_STATUS_OPTIONS,
} from '@constants/invoiceStatuses';
import type {ProductCode} from '@store/product/product.types';
import type {
  ConsolidatedProductOption,
  ConsolidatedStatusFilterDraft,
} from '../useConsolidatedInvoices';

type Props = {
  visible: boolean;
  productOptions: ConsolidatedProductOption[];
  productCodes: ProductCode[];
  invoiceStatuses: string[];
  adminStatuses: string[];
  onClose: () => void;
  onApply: (draft: ConsolidatedStatusFilterDraft) => void;
  onClearAll: () => void;
};

const toOptions = (values: readonly string[]) =>
  values.map(value => ({value, label: value}));

export const ConsolidatedFilterSheet: React.FC<Props> = ({
  visible,
  productOptions,
  productCodes,
  invoiceStatuses,
  adminStatuses,
  onClose,
  onApply,
  onClearAll,
}) => {
  const groups = useMemo<FilterSheetGroup[]>(
    () => [
      {
        type: 'multi',
        key: 'product',
        title: 'Product',
        options: productOptions.map(option => ({
          value: option.code,
          label: option.label,
        })),
      },
      {
        type: 'multi',
        key: 'invoice',
        title: 'Invoice Status',
        options: toOptions(INVOICE_STATUS_OPTIONS),
      },
      {
        type: 'multi',
        key: 'admin',
        title: 'Admin Status',
        options: toOptions(ADMIN_STATUS_OPTIONS),
      },
    ],
    [productOptions],
  );

  const value: FilterSheetValue = {
    product: productCodes,
    invoice: invoiceStatuses,
    admin: adminStatuses,
  };

  return (
    <FilterSheet
      visible={visible}
      groups={groups}
      value={value}
      onClose={onClose}
      onClearAll={onClearAll}
      onApply={draft =>
        onApply({
          productCodes: (draft.product ?? []) as ProductCode[],
          invoiceStatuses: draft.invoice ?? [],
          adminStatuses: draft.admin ?? [],
        })
      }
    />
  );
};
