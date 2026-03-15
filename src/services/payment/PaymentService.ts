import breezSDKService from '../breez/BreezSDKService';
import { CreateInvoiceInput, InvoiceDetails, PaymentRecord, SendPaymentInput } from '../../types/payment';
import { isBolt11, msatToSat, satsToMsat } from '../../utils/paymentValidation';

class PaymentService {
  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceDetails> {
    const sdk = await breezSDKService.getSDK();

    const response = await sdk.receivePayment({
      amountMsat: satsToMsat(input.amountSat),
      description: input.description ?? '',
    });

    return {
      bolt11: response.bolt11,
      amountSat: input.amountSat,
      description: input.description,
      expiresAt: response.expiryTimestamp,
      paymentHash: response.paymentHash,
    };
  }

  async decodeInvoice(bolt11: string): Promise<InvoiceDetails> {
    if (!isBolt11(bolt11)) {
      throw new Error('Invalid Bolt11 invoice.');
    }

    const sdk = await breezSDKService.getSDK();
    const parsed = await sdk.parseInvoice({ invoice: bolt11 });

    return {
      bolt11,
      amountSat: msatToSat(parsed.amountMsat),
      description: parsed.description,
      expiresAt: parsed.expiryTimestamp,
      paymentHash: parsed.paymentHash,
    };
  }

  async sendPayment(input: SendPaymentInput) {
    if (!isBolt11(input.bolt11)) {
      throw new Error('Invalid Bolt11 invoice.');
    }

    const sdk = await breezSDKService.getSDK();

    const result = await sdk.sendPayment({
      bolt11: input.bolt11,
    });

    return result;
  }

  async listPayments(): Promise<PaymentRecord[]> {
    const sdk = await breezSDKService.getSDK();
    const payments = await sdk.listPayments({});

    return payments.map((payment: any) => ({
      id: payment.id ?? payment.paymentHash ?? String(payment.timestamp),
      direction: payment.paymentType === 'received' ? 'received' : 'sent',
      amountSat: msatToSat(payment.amountMsat) ?? 0,
      description: payment.description ?? '',
      createdAt: payment.timestamp ?? Date.now(),
      status: payment.status === 'complete' ? 'completed' : payment.status ?? 'pending',
      feeSat: msatToSat(payment.feeMsat),
      paymentHash: payment.paymentHash,
    }));
  }
}

export default new PaymentService();