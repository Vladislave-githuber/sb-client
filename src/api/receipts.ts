import api from "./axios";
import type { ITransaction, IUser } from "../types";

export interface IReceipt {
  id: string;
  receiptNumber: string;
  officeNumber: string;
  transactionId: string;
  createdAt: string;
}

export interface ReceiptWithDetails {
  receipt: IReceipt;
  transaction: ITransaction;
  cashier: IUser;
}

export const getReceiptByTransactionId = async (
  transactionId: string
): Promise<ReceiptWithDetails> => {
  const response = await api.get(`/receipts/transaction/${transactionId}`);
  console.log("RECEIPT RESPONSE", response.data); // Если есть global TransformInterceptor
  if (response.data?.data) {
    return response.data.data;
  }
  return response.data;
};
