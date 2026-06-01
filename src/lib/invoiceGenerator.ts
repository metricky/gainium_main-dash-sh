import { logger } from '@/lib/loggerInstance';

export interface InvoiceData {
  // Invoice metadata
  invoiceNumber: string;
  invoiceDate: string;
  customerId?: string;

  // Bill to
  customerName?: string;
  customerCompany?: string;
  customerEmail?: string;
  customerAddress?: string;

  // Line items
  items: {
    description: string;
    price: number;
    quantity: number;
    total: number;
  }[];

  // Totals
  subtotal: number;
  other?: number;
  total: number;
}

/**
 * Generate and download a PDF invoice
 * Uses browser print functionality to create a PDF
 */
export function downloadInvoice(data: InvoiceData): void {
  logger.info('[SUBSCRIPTION_INVOICE] Generating invoice', {
    invoiceNumber: data.invoiceNumber,
  });

  const invoiceHtml = generateInvoiceHtml(data);

  // Open a new window with the invoice HTML
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    logger.error(
      '[SUBSCRIPTION_INVOICE] Failed to open print window - popup blocked'
    );
    return;
  }

  printWindow.document.write(invoiceHtml);
  printWindow.document.close();

  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  logger.info('[SUBSCRIPTION_INVOICE] Invoice generated successfully');
}

function generateInvoiceHtml(data: InvoiceData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0;">${item.description}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: right;">${item.price.toFixed(2)}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; text-align: right;">${item.total.toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${data.invoiceNumber} - Gainium</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #333;
          background: white;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
        }
        .logo-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .logo {
          display: flex;
          align-items: center;
        }
        .company-info {
          font-size: 12px;
          color: #666;
          line-height: 1.6;
        }
        .invoice-title {
          font-size: 36px;
          font-weight: bold;
          color: #f97316;
          text-align: right;
        }
        .invoice-meta {
          text-align: right;
          margin-top: 16px;
        }
        .invoice-meta table {
          margin-left: auto;
        }
        .invoice-meta td {
          padding: 4px 0;
        }
        .invoice-meta td:first-child {
          padding-right: 16px;
          font-weight: 500;
        }
        .invoice-meta td:last-child {
          border: 1px solid #ddd;
          padding: 4px 12px;
          min-width: 100px;
        }
        .bill-to {
          margin-bottom: 40px;
        }
        .bill-to-header {
          background: #f97316;
          color: white;
          padding: 8px 16px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .bill-to-content {
          padding-left: 16px;
          line-height: 1.8;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .items-table th {
          background: #f97316;
          color: white;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
        }
        .items-table th:nth-child(2),
        .items-table th:nth-child(3),
        .items-table th:nth-child(4) {
          text-align: right;
        }
        .items-table th:nth-child(3) {
          text-align: center;
        }
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .totals-table {
          min-width: 250px;
        }
        .totals-table td {
          padding: 8px 16px;
        }
        .totals-table td:first-child {
          text-align: right;
          padding-right: 24px;
        }
        .totals-table td:last-child {
          text-align: right;
          min-width: 100px;
        }
        .totals-table tr:last-child {
          background: #f97316;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        .payment-details {
          margin-top: 40px;
        }
        .payment-details-header {
          background: #f97316;
          color: white;
          padding: 8px 16px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .payment-details-content {
          padding-left: 16px;
          line-height: 1.8;
          font-size: 13px;
        }
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .invoice-container {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="logo-section">
            <div class="logo">
              <svg viewBox="0 0 158 24" xmlns="http://www.w3.org/2000/svg" style="height: 32px; width: auto;">
                <g fill="#f97316">
                  <path d="M55.6377 10.4169V13.0449C55.6377 16.2111 54.5792 18.8285 52.462 20.8971C50.3667 22.9657 47.6057 24 44.179 24C40.5995 24 37.6748 22.9024 35.4049 20.7071C33.135 18.4908 32 15.7361 32 12.4433C32 9.1504 33.135 6.39578 35.4049 4.17942C37.6748 1.94195 40.5122 0.82322 43.9171 0.82322C46.056 0.82322 48.0095 1.2876 49.7774 2.21636C51.5671 3.14512 52.9749 4.40106 54.0008 5.98417L48.4351 9.05541C47.5184 7.70448 46.056 7.02902 44.048 7.02902C42.4111 7.02902 41.0797 7.53562 40.0539 8.54881C39.0498 9.56201 38.5478 10.8707 38.5478 12.4749C38.5478 13.9947 39.0171 15.3245 39.9556 16.4644C40.8942 17.5831 42.3456 18.1425 44.31 18.1425C46.5799 18.1425 48.0968 17.3615 48.8607 15.7995H43.9826V10.4169H55.6377Z" />
                  <path d="M68.9449 7.66227H75.0017V23.4934H68.9449V22.0686C67.8973 23.314 66.4349 23.9367 64.5579 23.9367C62.3534 23.9367 60.5528 23.1451 59.1559 21.562C57.759 19.9789 57.0606 17.9842 57.0606 15.5778C57.0606 13.1715 57.759 11.1768 59.1559 9.59367C60.5528 8.01055 62.3534 7.219 64.5579 7.219C66.4349 7.219 67.8973 7.84169 68.9449 9.08707V7.66227ZM63.9031 17.6992C64.4488 18.2691 65.1581 18.5541 66.0312 18.5541C66.9042 18.5541 67.6026 18.2691 68.1265 17.6992C68.6721 17.1293 68.9449 16.4222 68.9449 15.5778C68.9449 14.7335 68.6721 14.0264 68.1265 13.4565C67.6026 12.8865 66.9042 12.6016 66.0312 12.6016C65.1581 12.6016 64.4488 12.8865 63.9031 13.4565C63.3793 14.0264 63.1174 14.7335 63.1174 15.5778C63.1174 16.4222 63.3793 17.1293 63.9031 17.6992Z" />
                  <path d="M80.6802 6.4591C79.7635 6.4591 78.9668 6.14248 78.2902 5.50924C77.6354 4.85488 77.308 4.09499 77.308 3.22955C77.308 2.36412 77.6354 1.61478 78.2902 0.981531C78.9668 0.327177 79.7635 0 80.6802 0C81.575 0 82.3499 0.327177 83.0047 0.981531C83.6813 1.61478 84.0196 2.36412 84.0196 3.22955C84.0196 4.09499 83.6813 4.85488 83.0047 5.50924C82.3499 6.14248 81.575 6.4591 80.6802 6.4591ZM77.6354 23.4934V7.66227H83.6922V23.4934H77.6354Z" />
                  <path d="M96.7436 7.219C98.5334 7.219 99.963 7.82058 101.032 9.02375C102.124 10.2058 102.669 11.9789 102.669 14.343V23.4934H96.6127V14.9763C96.6127 13.562 95.9361 12.8549 94.5828 12.8549C93.8626 12.8549 93.306 13.0765 92.9131 13.5198C92.5421 13.9631 92.3566 14.5752 92.3566 15.3562V23.4934H86.2998V7.66227H92.3566V9.21372C93.3606 7.88391 94.8229 7.219 96.7436 7.219Z" />
                  <path d="M108.176 6.4591C107.259 6.4591 106.463 6.14248 105.786 5.50924C105.131 4.85488 104.804 4.09499 104.804 3.22955C104.804 2.36412 105.131 1.61478 105.786 0.981531C106.463 0.327177 107.259 0 108.176 0C109.071 0 109.846 0.327177 110.5 0.981531C111.177 1.61478 111.515 2.36412 111.515 3.22955C111.515 4.09499 111.177 4.85488 110.5 5.50924C109.846 6.14248 109.071 6.4591 108.176 6.4591ZM105.131 23.4934V7.66227H111.188V23.4934H105.131Z" />
                  <path d="M123.945 7.66227H130.002V23.4934H123.945V21.942C122.941 23.2718 121.478 23.9367 119.558 23.9367C117.768 23.9367 116.327 23.3456 115.236 22.1636C114.167 20.9604 113.632 19.1768 113.632 16.8127V7.66227H119.689V16.1794C119.689 17.5937 120.365 18.3008 121.719 18.3008C122.439 18.3008 122.984 18.0792 123.356 17.6359C123.748 17.1926 123.945 16.5805 123.945 15.7995V7.66227Z" />
                  <path d="M151.943 7.219C153.842 7.219 155.326 7.79947 156.396 8.96042C157.465 10.1003 158 11.7361 158 13.8681V23.4934H151.943V14.6596C151.943 13.4565 151.387 12.8549 150.274 12.8549C148.986 12.8549 148.342 13.6359 148.342 15.1979V23.4934H142.285V14.6596C142.285 13.4565 141.729 12.8549 140.615 12.8549C139.328 12.8549 138.684 13.6359 138.684 15.1979V23.4934H132.627V7.66227H138.684V9.1504C139.753 7.8628 141.238 7.219 143.136 7.219C145.013 7.219 146.378 7.87335 147.229 9.18206C148.407 7.87335 149.979 7.219 151.943 7.219Z" />
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M21.9776 18.6668C23.2962 16.6934 24 14.3734 24 12H15.2871C15.2871 12.6501 15.0944 13.2857 14.7332 13.8262C14.372 14.3668 13.8586 14.7881 13.2579 15.0369C12.6573 15.2857 11.9964 15.3508 11.3587 15.224C10.7211 15.0971 10.1354 14.7841 9.67566 14.3243C9.21594 13.8646 8.90287 13.2789 8.77604 12.6413C8.6492 12.0036 8.7143 11.3427 8.96309 10.7421C9.21189 10.1414 9.63321 9.62804 10.1738 9.26685C10.7143 8.90565 11.3499 8.71287 12 8.71287L12 0C9.62663 0 7.30656 0.703788 5.33317 2.02236C3.35978 3.34094 1.82171 5.21508 0.913456 7.4078C0.00520488 9.60051 -0.232435 12.0133 0.230587 14.3411C0.69361 16.6689 1.8365 18.807 3.51473 20.4853C5.19296 22.1635 7.33115 23.3064 9.65893 23.7694C11.9867 24.2324 14.3995 23.9948 16.5922 23.0865C18.7849 22.1783 20.6591 20.6402 21.9776 18.6668ZM23.9999 0H15.3043V8.69565H23.9999V0Z" />
                </g>
              </svg>
            </div>
            <div class="company-info">
              Gainium Pte. Ltd.<br>
              68 Circular Road, #02-01<br>
              049422, Singapore<br>
              Phone: +66 992537390
            </div>
          </div>
          <div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">
              <table>
                <tr>
                  <td>DATE</td>
                  <td>${data.invoiceDate}</td>
                </tr>
                <tr>
                  <td>INVOICE #</td>
                  <td>${data.invoiceNumber}</td>
                </tr>
                ${
                  data.customerId
                    ? `
                <tr>
                  <td>CUSTOMER ID</td>
                  <td>${data.customerId}</td>
                </tr>
                `
                    : ''
                }
              </table>
            </div>
          </div>
        </div>

        <div class="bill-to">
          <div class="bill-to-header">BILL TO</div>
          <div class="bill-to-content">
            ${data.customerName || 'Customer'}<br>
            ${data.customerCompany ? `${data.customerCompany}<br>` : ''}
            ${data.customerAddress ? `${data.customerAddress.replace(/\n/g, '<br>')}<br>` : ''}
            ${data.customerEmail || ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>DESCRIPTION</th>
              <th>PRICE</th>
              <th>QTY</th>
              <th>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td>${data.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Other</td>
              <td>${data.other !== undefined ? data.other.toFixed(2) : '-'}</td>
            </tr>
            <tr>
              <td>TOTAL</td>
              <td>$ ${data.total.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="payment-details">
          <div class="payment-details-header">PAYMENT DETAILS</div>
          <div class="payment-details-content">
            Gainium Pte. Ltd.<br>
            Account No.: 885111398379560<br>
            SWIFT: REVOSGS2<br>
            Account type: Checking<br>
            Revolut Technologies Singapore Pte. Ltd<br>
            6 Battery Road, Floor 6-01<br>
            049909, Singapore
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
