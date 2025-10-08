const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

module.exports = ({ strapi }) => ({
  /**
   * Generate PDF invoice for an order
   * @param {Object} orderData - Complete order data with relations
   * @param {String} orderId - Order ID for filename
   * @returns {Promise<String>} Path to generated PDF
   */
  async generateInvoice(orderData, orderId) {
    try {
      const invoiceDir = path.join(process.cwd(), "public", "invoices");
      await fs.ensureDir(invoiceDir);

      const pdfPath = path.join(invoiceDir, `${orderId}.pdf`);

      // Check if invoice already exists
      if (await fs.pathExists(pdfPath)) {
        strapi.log.info(`Invoice already exists for order ${orderId}`);
        return pdfPath;
      }

      // Generate HTML for the invoice
      const html = this.generateInvoiceHTML(orderData, orderId);

      // Launch Puppeteer with bundled Chromium
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        headless: true,
        ignoreDefaultArgs: ['--disable-extensions'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      await browser.close();

      // Save the PDF buffer to file
      await fs.writeFile(pdfPath, pdfBuffer);

      strapi.log.info(`Invoice generated successfully for order ${orderId}`);

      // Log the generation event
      await strapi
        .plugin("download-invoice")
        .service("logger")
        .logEvent(orderId, "generated");

      return pdfPath;
    } catch (error) {
      strapi.log.error(`Failed to generate invoice for order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Generate HTML for invoice
   * @param {Object} orderData - Order data
   * @param {String} orderId - Order ID
   * @returns {String} HTML string
   */
  generateInvoiceHTML(orderData, orderId) {
    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatCurrency = (amount, currency = "AED") => {
      const curr = currency || "AED";
      const amt = amount || 0;
      return `${curr} ${parseFloat(amt).toFixed(2)}`;
    };

    // Ensure no null values are rendered
    const customerName = orderData?.customer?.fullName || 'N/A';
    const customerEmail = orderData?.customer?.email || 'N/A';
    const customerPhone = `${orderData?.customer?.countryCode || ''} ${orderData?.customer?.phone || ''}`.trim() || 'N/A';
    const locationAddress = orderData?.location?.address || 'N/A';
    const locationCity = orderData?.location?.city || 'N/A';
    const packageType = orderData?.package?.type || 'N/A';
    const serviceDate = formatDate(orderData?.date);
    const serviceTime = orderData?.time || 'N/A';
    const serviceHours = orderData?.hours || 0;
    const price = formatCurrency(orderData?.price, orderData?.currencyCode);
    const total = formatCurrency(orderData?.total, orderData?.currencyCode);
    const paymentStatus = orderData?.paymentStatus || 'Pending';
    const statusClass = paymentStatus === "Payment confirmed" ? "status-paid" : "status-pending";
    const statusText = paymentStatus === "Payment confirmed" ? "Paid" : paymentStatus;
    const invoiceDate = formatDate(orderData?.createdAt);

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    .invoice-container {
      max-width: 900px;
      margin: 0 auto;
      background-color: white;
      padding: 40px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 2px solid #262626;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .logo {
      width: 64px;
      height: 64px;
    }
    h1 {
      font-size: 36px;
      font-weight: bold;
      color: #262626;
      margin: 0;
    }
    .header-center {
      text-align: center;
    }
    h2 {
      font-size: 24px;
      font-weight: 600;
      color: #e50056;
      margin: 0 0 8px 0;
    }
    .date {
      color: #737373;
    }
    h3 {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 16px;
      color: #262626;
    }
    .details {
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      margin: 12px 0;
    }
    .label {
      font-weight: 600;
      width: 160px;
      color: #262626;
    }
    .value {
      color: #737373;
    }
    .total-row {
      padding-top: 12px;
      border-top: 1px solid #f5f5f5;
    }
    .total-label {
      font-weight: bold;
      width: 160px;
      color: #262626;
      font-size: 18px;
    }
    .total-value {
      font-weight: bold;
      color: #e50056;
      font-size: 18px;
    }
    .status-paid {
      font-weight: 600;
      color: #16a34a;
    }
    .status-pending {
      font-weight: 600;
      color: #f97316;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="header-top">
        <svg class="logo" viewBox="0 0 77.87 78.78" xmlns="http://www.w3.org/2000/svg">
          <path fill="#e50056" d="M21.7,17.91c-10.94,9.2-16,24.85-8.68,37.73,10.46,18.01,34.75,20.68,48.1,4.21,13.55-16.7,7.89-37.3-10.07-47.84-4-2.26-8.5-3.85-13.09-3.36-2.17.22-4.79.91-5.27,3.17-.6,3.39,3.54,6.05,6.24,7.86,6.23,3.8,13.79,4.24,21.05,3.61,2.48-.23,4.95-.6,7.4-1.1,2.55-.41,4.81-1.51,7.5-1.18.57.06.84.81.43,1.21-1.94,1.94-4.74,2.25-7.25,2.97-2.53.62-5.1,1.11-7.7,1.46-10.51,1.51-22.8,0-30.2-8.59-2.97-3.35-3.02-8.82.65-11.81,3.1-2.47,7.12-2.87,10.87-2.67,9.72.95,18.36,6.8,24.48,14.15,13.59,16.31,10.04,38.98-7.47,50.81-5.65,3.78-12.36,6.02-19.16,6.16-12.26.24-24.93-5.38-31.65-16.03C-1.49,43.98,5.13,23.57,20.01,15.48c1.58-.86,3.02,1.28,1.69,2.43"/>
          <path fill="#e50056" d="M32.48,39.29c0,1.75-1.42,3.17-3.17,3.17s-3.17-1.42-3.17-3.17,1.42-3.17,3.17-3.17,3.17,1.42,3.17,3.17"/>
          <path fill="#e50056" d="M51.86,39.29c0,1.75-1.42,3.17-3.17,3.17s-3.17-1.42-3.17-3.17,1.42-3.17,3.17-3.17,3.17,1.42,3.17,3.17"/>
          <path fill="#e50056" d="M39.01,58.53c-6.12,0-11.76-3.04-14.72-7.92-.53-.87-.25-2.01.62-2.54.87-.53,2.01-.25,2.54.62,2.29,3.79,6.72,6.15,11.56,6.15s9.26-2.35,11.56-6.15c.53-.87,1.66-1.15,2.54-.62.87.53,1.15,1.66.62,2.54-2.96,4.89-8.6,7.92-14.72,7.92"/>
        </svg>
        <h1>Invoice</h1>
      </div>
      <div class="header-center">
        <h2>Order ID: ${orderId}</h2>
        <p class="date">Date: ${invoiceDate}</p>
      </div>
    </div>

    <div class="details">
      <h3>Order Details</h3>
      <div class="detail-row">
        <span class="label">Customer:</span>
        <span class="value">${customerName}</span>
      </div>
      <div class="detail-row">
        <span class="label">Email:</span>
        <span class="value">${customerEmail}</span>
      </div>
      <div class="detail-row">
        <span class="label">Phone:</span>
        <span class="value">${customerPhone}</span>
      </div>
      <div class="detail-row">
        <span class="label">Location:</span>
        <span class="value">${locationAddress}, ${locationCity}</span>
      </div>
      <div class="detail-row">
        <span class="label">Package:</span>
        <span class="value">${packageType}</span>
      </div>
      <div class="detail-row">
        <span class="label">Service Date:</span>
        <span class="value">${serviceDate}</span>
      </div>
      <div class="detail-row">
        <span class="label">Time:</span>
        <span class="value">${serviceTime}</span>
      </div>
      <div class="detail-row">
        <span class="label">Hours:</span>
        <span class="value">${serviceHours}</span>
      </div>
      <div class="detail-row">
        <span class="label">Price:</span>
        <span class="value">${price}</span>
      </div>
      <div class="detail-row total-row">
        <span class="total-label">Total:</span>
        <span class="total-value">${total}</span>
      </div>
      <div class="detail-row">
        <span class="label">Payment Status:</span>
        <span class="${statusClass}">${statusText}</span>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  },

  /**
   * Prepare order data for invoice
   * @param {Object} orderData - Raw order data
   * @returns {Object} Formatted data for invoice
   */
  prepareInvoiceData(orderData) {
    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatTime = (timeStr) => {
      if (!timeStr) return "N/A";
      return timeStr;
    };

    const formatCurrency = (amount, currency = "AED") => {
      if (!amount) return `${currency} 0.00`;
      return `${currency} ${parseFloat(amount).toFixed(2)}`;
    };

    return {
      orderId: orderData.orderId || "N/A",
      date: formatDate(orderData.createdAt),
      customer: {
        name: orderData.customer?.fullName || "N/A",
        email: orderData.customer?.email || "N/A",
        phone: `${orderData.customer?.countryCode || ""} ${orderData.customer?.phone || ""}`.trim() || "N/A",
      },
      location: {
        address: orderData.location?.address || "N/A",
        city: orderData.location?.city || "N/A",
        area: orderData.location?.area || "N/A",
        country: orderData.location?.country || "N/A",
      },
      package: {
        type: orderData.package?.type || "N/A",
        position: orderData.package?.position || "N/A",
      },
      service: {
        date: formatDate(orderData.date),
        time: formatTime(orderData.time),
        hours: orderData.hours || 0,
        type: orderData.type || "N/A",
        noOfDays: orderData.noOfDays || 0,
        noOfNannies: orderData.noOfNannies || 1,
      },
      pricing: {
        price: formatCurrency(orderData.price, orderData.currencyCode),
        total: formatCurrency(orderData.total, orderData.currencyCode),
        currency: orderData.currencyCode || "AED",
      },
      payment: {
        status: orderData.paymentStatus || "Pending",
        id: orderData.paymentId || "N/A",
        responseId: orderData.responseId || "N/A",
      },
      childAgeGroups: orderData.childAgeGroups?.map((g) => g.name).join(", ") || "N/A",
      dayOfWeek: orderData.dayOfWeek?.map((d) => d.name).join(", ") || "N/A",
      locale: orderData.locales || "en",
    };
  },

  /**
   * Check if invoice exists
   * @param {String} orderId - Order ID
   * @returns {Promise<Boolean>}
   */
  async invoiceExists(orderId) {
    const invoiceDir = path.join(process.cwd(), "public", "invoices");
    const pdfPath = path.join(invoiceDir, `${orderId}.pdf`);
    return await fs.pathExists(pdfPath);
  },

  /**
   * Get invoice path
   * @param {String} orderId - Order ID
   * @returns {String} Path to invoice PDF
   */
  getInvoicePath(orderId) {
    return path.join(process.cwd(), "public", "invoices", `${orderId}.pdf`);
  },
});

