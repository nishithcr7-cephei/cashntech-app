import axiosInstance from './api';
import {CustomRequestConfig} from './api';
import type {InvoiceFields} from '@type/Invoice';

export const invoiceApi = {
  submitInvoice: async (invoiceData: InvoiceFields): Promise<any> => {
    try {
      console.log('Invoice Data Received:', invoiceData);

      // Validate required fields
      if (!invoiceData.invoiceNumber?.trim()) {
        throw new Error('Invoice number is required');
      }
      if (!invoiceData.dealer?.trim()) {
        throw new Error('Dealer is required');
      }
      if (!invoiceData.dealerCode?.trim()) {
        throw new Error('Dealer code is required');
      }
      if (!invoiceData.invoiceDate?.trim()) {
        throw new Error('Invoice date is required');
      }
      if (!invoiceData.items || invoiceData.items.length === 0) {
        throw new Error('At least one item is required');
      }

      // Calculate totals if not provided
      const subtotal = invoiceData.items.reduce((sum, item) => {
        return sum + (parseFloat(item.total) || 0);
      }, 0);

      // Calculate discount
      let discountAmount = 0;
      const discountType = invoiceData.discountType || '';
      const discountValue = parseFloat(invoiceData.discountValue || '0') || 0;
      
      if (discountType === 'percentage' && discountValue > 0) {
        discountAmount = (subtotal * discountValue) / 100;
      } else if (discountType === 'absolute' && discountValue > 0) {
        discountAmount = discountValue;
      }
      
      // Calculate final amount after discount
      const finalAmount = Math.max(0, subtotal - discountAmount);

      const cgst = invoiceData.cgst ? parseFloat(invoiceData.cgst) : finalAmount * 0.025;
      const sgst = invoiceData.sgst ? parseFloat(invoiceData.sgst) : finalAmount * 0.025;
      const grandTotal = finalAmount + cgst + sgst;

      // Prepare data for API
      const payload = {
        dealer: invoiceData.dealer,
        dealer_code: invoiceData.dealerCode,
        credit_account_number: invoiceData.odAccountNumber,
        invoice_number: invoiceData.invoiceNumber,
        po_ref_number: invoiceData.associatedPO,
        invoice_date: invoiceData.invoiceDate,
        payment_request_date: invoiceData.invoiceDueDate,
        early_payment_discount: invoiceData.earlyPaymentDiscount || '0',
        currency: invoiceData.currency || 'INR',
        remark: invoiceData.remark || '',
        items: invoiceData.items.map(item => ({
          item_name: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          price_per_quantity: item.pricePerQuantity,
          total: item.total,
        })),
        cgst: cgst.toFixed(2),
        sgst: sgst.toFixed(2),
        grand_total: grandTotal.toFixed(2),
        subtotal: subtotal.toFixed(2),
        discount_type: invoiceData.discountType || '',
        discount_value: invoiceData.discountValue || '',
        discount_amount: discountAmount.toFixed(2),
        final_amount: finalAmount.toFixed(2),
      };

      console.log('Invoice API Payload:', payload);

      const response = await axiosInstance.post('/client-info-master/invoice/create', payload, {
        authRequired: true,
      } as CustomRequestConfig);

      console.log('Invoice API Success Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Invoice API Error:', error);
      throw error;
    }
  },
};

