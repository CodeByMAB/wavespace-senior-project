export type PaymentDirection = 'sent' | 'received';

export interface InvoiceDetails {
  bolt11: string;
  amountSat?: number;
  description?: string;
  expiresAt?: number;
  paymentHash?: string;
}

export interface PaymentRecord {
  id: string;
  direction: PaymentDirection;
  amountSat: number;
  description?: string;
  createdAt: number;
  status: 'pending' | 'completed' | 'failed';
  feeSat?: number;
  paymentHash?: string;
}

export interface CreateInvoiceInput {
  amountSat?: number;
  description?: string;
}

export interface SendPaymentInput {
  bolt11: string;
}