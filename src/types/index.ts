export interface ICurrency {
  code: string; // USD, EUR, RUB
  rateBuy: number; // курс покупки
  rateSell: number; // курс продажи
  scale: number; // номинал (например, 100 для RUB)
}

export interface ITransaction {
  id: string;
  type: "BUY" | "SELL" | "CONVERT";
  sumIn: number;
  sumOut: number;
  givenAmount: number | null;
  currencyIn: string;
  currencyOut: string;
  createdAt: string;
  cashierId: string;
  cashierName?: string;
  clientId?: string;
  client?: IClient;
  status?: "ACTIVE" | "STORNO" | "REFUNDED";
  originalTransactionId?: string | null;
  canceledAt?: string | null;
  canceledBy?: string | null;
  cancelReason?: string | null;
}

export interface IUser {
  id: string;
  fullName: string;
  tabNumber: string;
  role: "cashier" | "admin" | "senior_cashier";
}

export interface ControlTapeItem {
  checkNumber: string;
  date: string;
  operationType: "BUY" | "SELL" | "CONVERT";
  currencyIn: string;
  amountIn: number;
  currencyOut: string;
  amountOut: number;
  paymentType: "CASH" | "CASHLESS";
  cashierName: string;
  status: "ACTIVE" | "STORNO" | "REFUNDED" | "REQUIRES_APPROVAL";
}

export interface SystemAuditItem {
  id: string;
  userId: string;
  userFullName: string;
  action: string; // LOGIN, EXPORT_PDF, UPDATE_CASH_LIMIT, ...
  details: string | null;
  ipAddress: string | null;
  result: string;
  createdAt: string;
}

export interface IClient {
  id: string;
  fullName: string;
  passportNumber: string;
  passportIssuedBy?: string;
  passportIssueDate?: string;
  personalNumber?: string;
  isResident: boolean;
  phone?: string;
  createdAt: string;
}

export interface ICashBalance {
  currencyCode: string;
  amount: number;
}

export interface IExchangePayload {
  type: "BUY" | "SELL" | "CONVERT";
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount?: number;
  givenAmount?: number;
}

export interface IReceiptData {
  transaction: ITransaction;
  cashier: IUser;
  officeNumber: string;
  date: string;
}
