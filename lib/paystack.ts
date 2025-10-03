// Paystack Integration Utility
// Documentation: https://paystack.com/docs/api/

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

export interface PaystackConfig {
  email: string;
  amount: number; // in kobo (smallest currency unit)
  reference?: string;
  currency?: string;
  metadata?: Record<string, any>;
  callback_url?: string;
  channels?: string[];
}

export interface PaystackResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
  };
}

/**
 * Generate a unique payment reference
 */
export function generatePaymentReference(prefix: string = "INT"): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Initialize Paystack payment
 * @param config Payment configuration
 * @returns Payment initialization response
 */
export async function initializePayment(
  config: PaystackConfig
): Promise<PaystackResponse> {
  const response = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: config.email,
        amount: config.amount,
        reference: config.reference || generatePaymentReference(),
        currency: config.currency || "NGN",
        metadata: config.metadata,
        callback_url: config.callback_url,
        channels: config.channels || [
          "card",
          "bank",
          "ussd",
          "qr",
          "mobile_money",
          "bank_transfer",
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to initialize payment");
  }

  return response.json();
}

/**
 * Verify Paystack payment
 * @param reference Payment reference
 * @returns Verification response
 */
export async function verifyPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to verify payment");
  }

  return response.json();
}

/**
 * Convert Naira to Kobo (Paystack uses kobo)
 * @param naira Amount in Naira
 * @returns Amount in Kobo
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/**
 * Convert Kobo to Naira
 * @param kobo Amount in Kobo
 * @returns Amount in Naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Get Paystack public key
 */
export function getPaystackPublicKey(): string {
  if (!PAYSTACK_PUBLIC_KEY) {
    throw new Error("Paystack public key is not configured");
  }
  return PAYSTACK_PUBLIC_KEY;
}
