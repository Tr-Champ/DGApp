/**
 * Payment Service Module (MTN Mobile Money, Airtel Money, Bank Transfer)
 *
 * This module manages payment processing. Currently simulates approved transactions.
 * Developers can integrate live payment gateways (MTN MoMo API, Airtel Money, Flutterwave, Stripe)
 * by populating the handler functions below.
 */

export type PaymentMethod = 'MTN_MOMO' | 'AIRTEL_MONEY' | 'BANK_TRANSFER';

export interface PaymentRequest {
    amount: number;
    currency?: string;
    phoneNumber?: string;
    customerName?: string;
    customerEmail?: string;
    method: PaymentMethod;
    referenceId: string;
}

export interface PaymentResult {
    success: boolean;
    transactionId: string;
    message: string;
    method: PaymentMethod;
}

/**
 * Process a customer payment transaction.
 * Replace simulation logic with real API calls when credentials are ready.
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // -------------------------------------------------------------
    // TODO: Add live API gateway integration here:
    //
    // if (request.method === 'MTN_MOMO') {
    //     return await initiateMtnMoMoPush(request);
    // } else if (request.method === 'AIRTEL_MONEY') {
    //     return await initiateAirtelPush(request);
    // } else {
    //     return await initiateBankTransfer(request);
    // }
    // -------------------------------------------------------------

    // Simulated network processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
        success: true,
        transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`,
        message: `Payment of RWF ${Math.round(request.amount).toLocaleString('en-US')} via ${request.method.replace('_', ' ')} processed successfully.`,
        method: request.method,
    };

}

/**
 * MTN MoMo Hook Placeholder
 */
export async function initiateMtnMoMoPush(_req: PaymentRequest) {
    // Insert MTN MoMo API call here
    return { success: true };
}

/**
 * Airtel Money Hook Placeholder
 */
export async function initiateAirtelPush(_req: PaymentRequest) {
    // Insert Airtel Money API call here
    return { success: true };
}

/**
 * Bank Account / Card Hook Placeholder
 */
export async function initiateBankTransfer(_req: PaymentRequest) {
    // Insert Card / Bank transfer API call here
    return { success: true };
}
