# Activity Log

## 2025-10-08 03:43 (Dubai Time)
- Updated order lifecycles.js to use Strapi email plugin with base64 PDF attachments instead of direct AWS SES, inspired by provided example. PDFs are stored in public/invoices/ and attached as base64 encoded content.

## 2025-10-08 04:38 (Dubai Time)
- Removed PDF attachment from confirmation emails and added "Download Invoice" link in email body instead. Link points to /api/download-invoice/download/{orderId} endpoint. Updated both Arabic and English email templates.

## 2025-10-08 04:38 (Dubai Time)
- Improved "Download Invoice" link styling in emails by adding CSS button styling with Mumzworld brand color (#e50056) background, white text, padding, and hover effects for better visual appeal.

## 2025-10-08 04:43 (Dubai Time)
- Fixed download link to use documentId instead of orderId in email templates. Links now use /api/download-invoice/download/{documentId} format for proper PDF download functionality.

## 2025-10-08 04:45 (Dubai Time)
- Ensured download endpoint serves binary PDF correctly by using fs.createReadStream() instead of reading entire file into memory, and added explicit policies: [] to route config for unrestricted access.