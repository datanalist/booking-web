export type PaymentStatus = "pending" | "succeeded" | "canceled";

export type StoredPayment = {
  id: string;
  userId: string;
  amountRub: number;
  status: PaymentStatus;
  credited: boolean;
  yookassaPaymentId: string;
};

export type RemotePayment = {
  id: string;
  status: string;
  currency: string;
  amountRub: number;
  userId: string;
  paymentId: string;
  amountMetaRub: number;
};
