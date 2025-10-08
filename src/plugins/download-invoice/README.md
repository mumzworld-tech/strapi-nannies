# Download Invoice Plugin

A Strapi plugin that generates and downloads PDF invoices for orders with AWS SES email integration.

## Features

- ✅ **PDF Generation**: Professional invoice PDFs using jsPDF
- ✅ **Download Button**: Integrated into Order admin panel
- ✅ **Email Integration**: Send invoices via AWS SES
- ✅ **Caching**: Avoid regenerating existing invoices
- ✅ **Logging**: Audit trail for downloads and emails
- ✅ **Performance**: Fast PDF generation without Puppeteer overhead

## Installation

The plugin is already installed in this project. Dependencies are:

```json
{
  "jspdf": "^3.0.3",
  "fs-extra": "^10.0.0"
}
```

## Configuration

The plugin is registered in `config/plugins.js`:

```javascript
module.exports = ({ env }) => ({
  // ... other plugins
  "download-invoice": {
    enabled: true,
    resolve: "./src/plugins/download-invoice",
  },
});
```

## Usage

### Admin Panel

1. Navigate to **Content Manager > Order**
2. Open any order entry
3. Click the **"Download Invoice"** button in the top-right corner
4. The PDF will be automatically downloaded

### API Endpoints

#### Generate Invoice
```
GET /download-invoice/generate/:orderId
```

Response:
```json
{
  "success": true,
  "message": "Invoice generated successfully",
  "orderId": "ORD-12345",
  "path": "/invoices/ORD-12345.pdf"
}
```

#### Download Invoice
```
GET /download-invoice/download/:orderId
```

Returns: PDF file as attachment

#### Send Invoice Email (Future Enhancement)
```
POST /download-invoice/send-email
Body: { "orderId": "ORD-12345" }
```

Response:
```json
{
  "success": true,
  "message": "Invoice email sent successfully",
  "orderId": "ORD-12345"
}
```

## File Storage

Invoices are stored in:
```
public/invoices/{orderId}.pdf
```

The plugin automatically:
- Creates the directory if it doesn't exist
- Checks for existing invoices before regenerating
- Uses the `orderId` as the filename

## Invoice Template

The invoice includes:

### Header
- Company name and contact info
- Invoice number (order ID)
- Invoice date
- Payment status

### Customer Information
- Customer name
- Email
- Phone number

### Service Location
- Full address
- City, area, country

### Service Details
- Package type
- Service date and time
- Duration (hours)
- Number of days
- Number of nannies
- Child age groups
- Days of week

### Pricing
- Service price
- Total amount
- Currency (AED/SAR)

### Payment Information (if available)
- Payment ID
- Response ID

## Email Integration

The plugin integrates with AWS SES to send invoices via email:

```javascript
// Email configuration in config/plugins.js
email: {
  config: {
    provider: "amazon-ses",
    providerOptions: {
      key: env("AWS_SES_KEY"),
      secret: env("AWS_SES_SECRET"),
      amazon: "https://email.us-east-1.amazonaws.com",
    },
    settings: {
      defaultFrom: "no-reply@mumzworld.com",
      defaultReplyTo: "no-reply@mumzworld.com",
    },
  },
}
```

## Services

### PDF Generator Service
- `generateInvoice(orderData, orderId)` - Generate PDF invoice
- `prepareInvoiceData(orderData)` - Format order data for PDF
- `invoiceExists(orderId)` - Check if invoice exists
- `getInvoicePath(orderId)` - Get invoice file path

### Email Service
- `sendInvoiceEmail(orderId, orderData, pdfPath)` - Send invoice via email
- `prepareEmailContent(orderData)` - Prepare email content

### Logger Service
- `logEvent(orderId, eventType, metadata)` - Log invoice events
- `getLogsForOrder(orderId)` - Get logs for specific order

## Performance Considerations

### Why jsPDF?

The plugin uses **jsPDF** instead of Puppeteer/Handlebars because:

1. **Lightweight**: No Chromium dependency (~300MB saved)
2. **Fast**: Direct PDF generation without HTML rendering
3. **Simple**: Pure JavaScript, no template engine needed
4. **Reliable**: No browser lifecycle management
5. **Scalable**: Lower memory footprint

### Caching Strategy

- Invoices are generated once and cached in `public/invoices/`
- Subsequent downloads use the cached PDF
- Re-generation only happens if the PDF is deleted

### Concurrent Requests

The plugin safely handles concurrent requests:
- Each invoice has a unique filename (orderId)
- File existence checks prevent duplicate generation
- Async operations ensure non-blocking behavior

## Error Handling

The plugin includes comprehensive error handling:

- **Invalid Order ID**: Returns `400 Bad Request`
- **Order Not Found**: Returns `404 Not Found`
- **PDF Generation Failed**: Returns `500 Internal Server Error`
- **Email Send Failed**: Returns `500 Internal Server Error`

All errors are logged using Strapi's logger:
```javascript
strapi.log.error("Error message", error);
```

## Logging & Auditing

All invoice events are logged:

```javascript
// Log types
- "generated" - Invoice PDF created
- "downloaded" - Invoice PDF downloaded
- "emailed" - Invoice sent via email
```

Logs include:
- Order ID
- Event type
- Timestamp
- Additional metadata

## Customization

### Modify Invoice Design

Edit `/server/services/pdf-generator.js`:

```javascript
// Colors
const primaryColor = [76, 175, 80]; // #4CAF50
const darkGray = [51, 51, 51];
const lightGray = [102, 102, 102];
const bgGray = [249, 249, 249];

// Margins and spacing
const margin = 20;
const contentWidth = pageWidth - 2 * margin;
```

### Add Custom Fields

1. Update `prepareInvoiceData()` to include new fields
2. Add rendering logic in `generateInvoice()`
3. Update email templates if needed

### Customize Email Template

Edit `/server/services/email-service.js`:

```javascript
prepareEmailContent(orderData) {
  // Modify email text and HTML
}
```

## Troubleshooting

### Invoice Not Generating

1. Check if `public/invoices/` directory exists and is writable
2. Verify order exists in database
3. Check Strapi logs for error messages

### Download Button Not Showing

1. Verify plugin is enabled in `config/plugins.js`
2. Check admin panel is built: `npm run build`
3. Ensure order has an `orderId` field

### Email Not Sending

1. Verify AWS SES credentials in `.env`
2. Check email configuration in `config/plugins.js`
3. Ensure customer has valid email address
4. Check AWS SES sending limits

## Development

### Plugin Structure

```
src/plugins/download-invoice/
├── admin/
│   └── src/
│       └── index.js
├── server/
│   ├── controllers/
│   │   └── invoice.js
│   ├── routes/
│   │   └── index.js
│   └── services/
│       ├── pdf-generator.js
│       ├── email-service.js
│       └── logger.js
├── package.json
└── strapi-server.js
```

### Testing

Test the plugin manually:

1. Start Strapi: `npm run develop`
2. Create a test order in admin panel
3. Click "Download Invoice" button
4. Verify PDF is generated in `public/invoices/`
5. Test re-download (should use cached PDF)

### Adding New Routes

Edit `/server/routes/index.js`:

```javascript
{
  method: "POST",
  path: "/custom-endpoint",
  handler: "invoice.customHandler",
  config: {
    auth: false,
  },
}
```

## Future Enhancements

- [ ] Add invoice regeneration endpoint
- [ ] Support multiple languages (Arabic/English)
- [ ] Add invoice templates customization UI
- [ ] Bulk invoice generation
- [ ] Invoice preview in admin panel
- [ ] PDF password protection
- [ ] Webhook integration for auto-sending invoices
- [ ] Invoice numbering sequences
- [ ] Tax calculations
- [ ] Discount support

## License

MIT

## Support

For issues or questions, contact the development team or create an issue in the project repository.
