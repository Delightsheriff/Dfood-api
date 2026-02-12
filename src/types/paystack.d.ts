declare module "paystack-api" {
  interface PaystackResponse<T = any> {
    status: boolean;
    message: string;
    data: T;
  }

  interface TransactionData {
    id: number;
    domain: string;
    status: "success" | "failed" | "abandoned";
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
    log: any;
    fees: number;
    fees_split: any;
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
    customer: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      customer_code: string;
      phone: string | null;
      metadata: any;
      risk_action: string;
    };
    plan: any;
    subaccount: any;
    split: any;
    order_id: string | null;
    paidAt: string;
    requested_amount: number;
  }

  interface InitializeTransactionData {
    authorization_url: string;
    access_code: string;
    reference: string;
  }

  interface ChargeAuthorizationParams {
    authorization_code: string;
    email: string;
    amount: number;
    reference?: string;
    currency?: string;
    metadata?: any;
  }

  interface InitializeTransactionParams {
    email: string;
    amount: number;
    reference?: string;
    callback_url?: string;
    plan?: string;
    invoice_limit?: number;
    metadata?: any;
    channels?: string[];
    split_code?: string;
    subaccount?: string;
    transaction_charge?: number;
    bearer?: string;
  }

  interface PaystackTransaction {
    initialize(
      params: InitializeTransactionParams,
    ): Promise<PaystackResponse<InitializeTransactionData>>;
    verify(reference: string): Promise<PaystackResponse<TransactionData>>;
    charge(
      params: ChargeAuthorizationParams,
    ): Promise<PaystackResponse<TransactionData>>;
  }

  interface PaystackAPI {
    transaction: PaystackTransaction;
  }

  function Paystack(secretKey: string): PaystackAPI;

  export = Paystack;
}
