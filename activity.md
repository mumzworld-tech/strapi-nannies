# Activity Log

## 2025-10-15 06:30 (Dubai Time)
### Added Order Search Endpoint for Bookings Search Feature

**Changes Made**:
1. **Package Schema Enhancement**:
   - Added `title` field to package schema for better display in search results
   - Allows package names to be shown instead of just type

2. **Order Schema Optimization**:
   - Added database indexes for `orderId`, `customer.email`, and `customer.phone`
   - Improves search query performance significantly

3. **Custom Search Controller**:
   - Created `search` method in order controller
   - Implements optimized search with $or filters for orderId, email, and phone
   - Returns only non-sensitive data: orderId, packageName, bookingDate, status
   - Validates minimum 3 character search query
   - Limits results to 50 orders

4. **Custom Route**:
   - Added `/api/orders/search` GET endpoint
   - Public access (auth: false) for customer self-service
   - Uses custom search controller method

**Files Modified**:
- `src/api/package/content-types/package/schema.json` - Added title field
- `src/api/order/content-types/order/schema.json` - Added database indexes
- `src/api/order/controllers/order.js` - Added search method
- `src/api/order/routes/order.js` - Added custom search route

**Security**:
- Only exposes non-sensitive order data
- No customer personal information (name, address) exposed
- Query validation prevents abuse
- Result limit prevents data dumping

**Performance**:
- Database indexes on search fields
- Optimized query with specific field selection
- Limited populate to only required relations

**Status**: ✅ Completed - Strapi backend ready for bookings search feature

---

## 2025-10-08 10:46 (Dubai Time)
- Fixed email service to use orderData.id as documentId for download URL, removing fallback to orderId. Updated download controller query to use id instead of documentId for proper Strapi v4 querying.

## 2025-10-08 05:57 (Dubai Time)
# Activity Log

## 2025-10-08 05:57 (Dubai Time)
- Fixed download URL in email service to include /api/ prefix: ${STRAPI_URL}/api/download-invoice/download/{documentId} for proper Strapi routing.

## 2025-10-08 05:18 (Dubai Time)
## 2025-10-08 05:18 (Dubai Time)
- Updated email service to use STRAPI_URL environment variable for download links instead of hardcoded localhost URL, making it environment-agnostic.

## 2025-10-08 05:06 (Dubai Time)
## 2025-10-08 05:06 (Dubai Time)
- Added download invoice link to email templates. Updated email-service.js to include a styled download button linking to http://localhost:1337/download-invoice/download/{documentId} for easy invoice access without attachments.

## 2025-10-08 04:53 (Dubai Time)
## 2025-10-08 04:53 (Dubai Time)
- Replaced Puppeteer and Chromium with jsPDF for PDF invoice generation. Removed puppeteer and puppeteer-core dependencies from package.json. Rewrote pdf-generator.js to use jsPDF API for direct PDF creation with pink header, customer information, service details, and summary sections. Application tested successfully and loads without errors.

## 2025-10-08 03:43 (Dubai Time)
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
