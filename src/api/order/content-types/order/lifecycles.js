// path: src/api/service-request/content-types/service-request/lifecycles.js

module.exports = {
  async beforeUpdate(event) {
    const { params } = event;

    const { paymentStatus } = params.data;

    // Get current entry before update
    const currentOrder = await strapi.entityService.findOne(
      "api::order.order",
      params.where.id,
      {
        populate: {
          customer: true,
        },
      }
    );

    const {
      orderId,
      paymentStatus: paymentStatusOld,
      customer,
      documentId,
      locales = "en",
    } = currentOrder;

    // Only send email if payment status changes to pending
    if (
      paymentStatus === paymentStatusOld ||
      paymentStatus !== "Payment confirmed"
    ) {
      return;
    }

    const orderIdUpperCase = orderId?.toUpperCase();
    const baseUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    const downloadLink = `${baseUrl}/download-invoice/download/${documentId}`;
    

    console.log("Payment confirmed for order:", downloadLink, documentId);
    const body = {
      ar: {
        subject: `تم تأكيد طلب خدمتك في ممز وورلد 🎉`,
        text: `
          ،${customer.fullName} أهلًا

          .شكرًا لاختيارك خدمات الأمهات على ممزورلد

          .يسعدنا إبلاغك بأن طلب الخدمة رقم #${orderId} قد تم تأكيده بنجاح

          .يمكنك تحميل الفاتورة من هنا: ${downloadLink}

          .سيتواصل معكِ فريقنا قريبًا لشرح الخطوات التالية والتأكد من أن كل شيء يسير بكل سهولة

          .نحن معكِ في كل خطوة، ونتطلع لأن نجعل هذه التجربة أيسر وأجمل لكِ

          ،من القلب
          فريق ممزورلد
        `.trim(),
        html: `
          <html lang="ar" dir="rtl">
            <body style="text-align: right;">
              ،${customer.fullName} أهلًا<br/><br/>

              .شكرًا لاختيارك خدمات الأمهات على ممزورلد<br/><br/>

              .يسعدنا إبلاغك بأن طلب الخدمة رقم #${orderIdUpperCase} قد تم تأكيده بنجاح<br/><br/>

              <a href="${downloadLink}">تحميل الفاتورة</a><br/><br/>

              .سيتواصل معكِ فريقنا قريبًا لشرح الخطوات التالية والتأكد من أن كل شيء يسير بكل سهولة<br/><br/>

              .نحن معكِ في كل خطوة، ونتطلع لأن نجعل هذه التجربة أيسر وأجمل لكِ<br/><br/>

              ،من القلب<br/>
              فريق ممزورلد
            </body>
          </html>
        `,
      },
      en: {
        subject: `Your Mumzworld Service Order is Confirmed 🎉`,
        text: `
            Dear ${customer.fullName},\n\n

            Thank you for booking your service with Mumzworld.

            We're happy to let you know that your service order #${orderIdUpperCase} has been successfully confirmed.

            You can download your invoice here: ${downloadLink}

            We'll be in touch shortly to guide you through the next steps and make sure everything goes smoothly.

            We're here to support you and can't wait to make this part of your journey a little easier.

            Warmly,
            The Mumzworld Team
          `.trim(),
        html: `
          <html>
            <body>
              Dear ${customer.fullName},<br/><br/>

              Thank you for booking your service with Mumzworld.<br/><br/>

              We're happy to let you know that your service order #${orderIdUpperCase} has been successfully confirmed.<br/><br/>

              <a href="${downloadLink}">Download Invoice</a><br/><br/>

              We're here to support you and can't wait to make this part of your journey a little easier.<br/><br/>

              Warmly,<br/>
              The Mumzworld Team
            </body>
          </html>
          `,
      },
    };

    const internalEmailBody = {
      en: {
        subject: `New booking alert - Car Seat Cleaning`,
        text: `
            Hello Team,
            A new booking has been successfully received and requires processing.

            Booking Details:

            Booking ID: ${orderId}

            Service: Car Seat Cleaning

            Customer Details:

            Customer Name: ${customer.fullName}

            Customer Email: ${customer.email}

            Customer Phone: ${customer.Phone}

            Please review and take the necessary next steps.

            Thank you,

            Mumzworld
          `.trim(),
        html: `
          <html>
            <body>
              Hello Team,<br/><br/>
              A new booking has been successfully received and requires processing.<br/><br/>

              <b>Booking Details:</b>
              <ul>
                <li>
                <b>Booking ID:</b> ${orderId}
                </li>
                <li>
                <b>Service:</b> Nannies
                </li>
              </ul>

              <b>Customer Details:</b>

              <ul>
                <li>
                  <b>Customer Name:</b> ${customer.fullName}
                </li>
                <li>
                  <b>Customer Email:</b> ${customer.email}
                </li>
                <li>
                  <b>Customer Phone:</b> ${customer.countryCode}${customer.phone}
                </li>
              </ul>

              Please review and take the necessary next steps.<br/><br/>

              Thank you,<br/>
              Mumzworld
            </body>
          </html>
          `,
      },
    };

    try {
      // Generate invoice PDF
      const pdfGenerator = strapi.plugin("download-invoice").service("pdfGenerator");
      const pdfPath = await pdfGenerator.generateInvoice(
        await strapi.entityService.findOne("api::order.order", params.where.id, {
          populate: ["package", "customer", "location", "childAgeGroups", "dayOfWeek", "assignNanny"],
        }),
        orderId
      );

      // Read PDF buffer and convert to base64 for SES compatibility
      const fs = require("fs-extra");
      const pdfBuffer = await fs.readFile(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');

      // Get complete order data for email
      const orderData = await strapi.entityService.findOne("api::order.order", params.where.id, {
        populate: ["package", "customer", "location", "childAgeGroups", "dayOfWeek", "assignNanny"],
      });

      // Send customer email with invoice download link using Strapi email plugin
      await strapi.plugins.email.services.email.send({
        to: customer.email,
        from: process.env.EMAIL_FROM || 'noreply@mumzworld.com',
        subject: body[locales || "en"].subject,
        text: body[locales || "en"].text,
        html: body[locales || "en"].html,
      });

      // Send internal team email
      await strapi
        .plugin("email")
        .service("email")
        .send({
          to: "services@mumzworld.com",
          ...internalEmailBody["en"],
        });
    } catch (error) {
      console.error("Error sending confirmation email with invoice:", error);
    }
  },
};
