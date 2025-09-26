// path: src/api/service-request/content-types/service-request/lifecycles.js

module.exports = {
  async beforeUpdate(event) {
    const { params } = event;

    const { paymentStatus } = params.data;

    // Get current entry before update
    const {
      orderId,
      paymentStatus: paymentStatusOld,
      customer,
      locales = "en",
    } = await strapi.entityService.findOne(
      "api::order.order",
      params.where.id,
      {
        populate: {
          customer: true,
        },
      }
    );

    // Only send email if payment status changes to pending
    if (paymentStatus === paymentStatusOld || paymentStatus !== "paid") {
      return;
    }

    const documentId = orderId?.toUpperCase();

    const body = {
      ar: {
        subject: `تم تأكيد طلب خدمتك في ممز وورلد 🎉`,
        text: `
          ،${customer.fullName} أهلًا

          .شكرًا لاختيارك خدمات الأمهات على ممزورلد

          .يسعدنا إبلاغك بأن طلب الخدمة رقم #${documentId} قد تم تأكيده بنجاح

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

              .يسعدنا إبلاغك بأن طلب الخدمة رقم #${documentId} قد تم تأكيده بنجاح<br/><br/>

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

            We're happy to let you know that your service order #${documentId} has been successfully confirmed.

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

              We're happy to let you know that your service order #${documentId} has been successfully confirmed.<br/><br/>

              We’ll be in touch shortly to guide you through the next steps and make sure everything goes smoothly.<br/><br/>

              We're here to support you and can't wait to make this part of your journey a little easier.<br/><br/>

              Warmly,<br/>
              The Mumzworld Team
            </body>
          </html>
          `,
      },
    };

    try {
      await strapi
        .plugin("email")
        .service("email")
        .send({
          to: customer.email,
          ...body[locales || "en"],
        });
    } catch (error) {
      console.error(error);
    }
  },
};
