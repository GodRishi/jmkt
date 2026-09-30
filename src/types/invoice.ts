export interface BuyerDetails {
  buyerName: string;
  buyerAddress: string;
  gstinUin: string;
  accountNo: string;
  stateAndCode: string;
}

export interface InvoiceMeta {
  invoiceNo: string;
  dated: string; // Saved in DD-MMM-YYYY or YYYY-MM-DD for datepicker
  placeOfSupply: string;
  termsOfPayment: string;
  dispatchMode: string;
  copyType?: string; // default "ORIGINAL FOR RECIPIENT"
}

export interface LineItem {
  id: string;
  hsnCode: string;
  description: string;
  colorSpec: string;
  quantity: number;
  mrp: number;
  unitPrice: number;
  discount: string;
}

export interface AdditionalCharges {
  packingCharge: number;
}

export interface InvoiceData {
  buyer: BuyerDetails;
  meta: InvoiceMeta;
  items: LineItem[];
  charges: AdditionalCharges;
  signatoryName?: string;
}

export interface InvoiceCalculations {
  itemTaxableAmounts: number[];
  totalQuantity: number;
  totalTaxableValue: number;
  packingCharge: number;
  cgst: number;
  sgst: number;
  subtotal: number;
  grandTotal: number;
  roundOff: string;
  amountInWords: string;
}
