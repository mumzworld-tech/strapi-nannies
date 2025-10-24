"use strict";

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async search(ctx) {
    try {
      const { query } = ctx.request.query;

      if (!query || query.trim().length < 3) {
        return ctx.badRequest("Search query must be at least 3 characters");
      }

      const orders = await strapi.entityService.findMany("api::order.order", {
        filters: {
          $or: [
            { orderId: { $eq: query } },
            { "customer.email": { $eq: query } },
            { "customer.phone": { $eq: query } },
          ],
        },
        populate: {
          package: {
            fields: ["title", "type"],
          },
        },
        fields: ["orderId", "paymentStatus", "createdAt"],
        limit: 50,
      });

      const results = orders.map((order) => ({
        orderId: order.orderId,
        packageName: order.package?.title || order.package?.type || "N/A",
        bookingDate: order.createdAt,
        status: order.paymentStatus,
      }));

      return { results };
    } catch (error) {
      console.error("Search error:", error);
      return ctx.internalServerError("Search failed");
    }
  },
  async create(ctx) {
    try {
      const { fullName, email, phone, countryCode } =
        ctx.request.body.data.customer;
      const customerDetails = await this.getCustomerDetails({
        email,
        fullName,
        phone,
        countryCode,
      });

      const { customer, ...rest } = ctx.request.body.data;

      // Generate order ID with retry logic
      const generateUniqueOrderId = async (attempts = 0) => {
        if (attempts > 3) {
          throw new Error(
            "Failed to generate unique order ID after 3 attempts"
          );
        }

        // Using findOne in Strapi v5
        const lastOrder = await strapi.entityService.findMany(
          "api::order.order",
          {
            sort: { id: "desc" },
            fields: ["orderId"],
            limit: 1,
          }
        );

        let orderId;
        if (lastOrder.length > 0 && lastOrder[0].orderId?.startsWith("BS-")) {
          const lastOrderId = lastOrder[0].orderId.split("-")[1];
          orderId = `BS-${parseInt(lastOrderId) + 1}`;
        } else {
          orderId = `BS-915100`;
        }

        try {
          const data = await strapi.entityService.create("api::order.order", {
            data: {
              customerId: customerDetails.documentId,
              customer: {
                fullName: customerDetails.fullName,
                email: customerDetails.email,
                phone: customerDetails.phone,
                countryCode: customerDetails.countryCode,
              },
              orderId,
              ...rest,
              dayOfWeek: rest.dayOfWeek?.map((day) => ({
                label: day,
              })),
              childAgeGroups: rest.childAgeGroups?.map((child) => ({
                label: child,
              })),
            },
          });
          return data;
        } catch (error) {
          if (
            error.message.includes("unique") ||
            error.message.includes("duplicate")
          ) {
            // Retry with new ID
            return await generateUniqueOrderId(attempts + 1);
          }
          throw error;
        }
      };

      const data = await generateUniqueOrderId();

      return { data };
    } catch (error) {
      console.error("Error creating order:", error);
      ctx.throw(500, "Failed to create order");
    }
  },
  async updateCustomer(customerId, data) {
    try {
      const updatedCustomer = await strapi.entityService.update(
        "api::customer.customer",
        customerId,
        {
          data,
        }
      );

      return updatedCustomer;
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  },

  async createCustomer(data) {
    try {
      const customer = await strapi.entityService.create(
        "api::customer.customer",
        {
          data: {
            email: data.email,
            fullName: data.fullName,
            phone: data.phone,
            countryCode: data.countryCode,
          },
        }
      );

      return customer;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  },
  async getCustomerDetails(data) {
    try {
      const customers = await strapi.entityService.findMany(
        "api::customer.customer",
        {
          filters: {
            phone: {
              $eq: data.phone,
            },
            countryCode: {
              $eq: data.countryCode,
            },
          },
          populate: "*",
        }
      );

      if (!customers.length) {
        const customer = await this.createCustomer(data);
        return customer;
      }

      const customer = customers[0];

      const isPhoneExists = customer.phone === data.phone;

      if (isPhoneExists) {
        const updatedCustomer = await this.updateCustomer(customer.id, {
          email: data.email,
        });
        return updatedCustomer;
      }

      return customer;
    } catch (error) {
      console.error("Error in getCustomerDetails:", error);
      throw error;
    }
  },
}));
