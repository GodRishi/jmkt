import type { InvoiceData } from '../types/invoice';

export const initialInvoiceData: InvoiceData = {
  buyer: {
    buyerName: '',
    buyerAddress: '',
    gstinUin: 'Unregistered',
    accountNo: '',
    stateAndCode: 'West Bengal (19)',
  },
  meta: {
    invoiceNo: '',
    dated: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
    placeOfSupply: 'West Bengal (19)',
    termsOfPayment: 'Immediate / Against Delivery',
    dispatchMode: 'Local Road Transport',
    copyType: 'ORIGINAL FOR RECIPIENT',
  },
  items: [
    {
      id: '1',
      hsnCode: '64041990',
      description: '',
      colorSpec: '',
      quantity: 0,
      mrp: 0,
      unitPrice: 0,
      discount: '—',
    },
  ],
  charges: {
    packingCharge: 0,
  },
  signatoryName: 'Ujjal Saha',
};

// Sample footwear invoice data for user reference / reset button
export const sampleInvoiceData: InvoiceData = {
  buyer: {
    buyerName: 'Nuruddin Sultan',
    buyerAddress: 'Dalkhola, West Bengal',
    gstinUin: 'Unregistered',
    accountNo: '998796956823',
    stateAndCode: 'West Bengal (19)',
  },
  meta: {
    invoiceNo: '130/26-27',
    dated: '28-Sep-2026',
    placeOfSupply: 'West Bengal (19)',
    termsOfPayment: 'Immediate / Against Delivery',
    dispatchMode: 'Local Road Transport',
    copyType: 'ORIGINAL FOR RECIPIENT',
  },
  items: [
    {
      id: '1',
      hsnCode: '64041990',
      description: '22G-13388N-RESIL',
      colorSpec: 'Glacier/D.Teal',
      quantity: 12,
      mrp: 1549.00,
      unitPrice: 910.00,
      discount: '—',
    },
    {
      id: '2',
      hsnCode: '64041990',
      description: '22G-1179N-VESPER',
      colorSpec: 'L.Gry/D.Gry',
      quantity: 12,
      mrp: 1799.00,
      unitPrice: 1057.00,
      discount: '—',
    },
    {
      id: '3',
      hsnCode: '64041990',
      description: '22G-13420N-MIBRO',
      colorSpec: 'Blk/Slc',
      quantity: 12,
      mrp: 1199.00,
      unitPrice: 759.00,
      discount: '—',
    },
  ],
  charges: {
    packingCharge: 103,
  },
  signatoryName: 'Ujjal Saha',
};
