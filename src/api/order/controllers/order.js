"use strict";

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

const { customAlphabet } = require("nanoid");

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

      const orderId = customAlphabet("1234567890abcdef", 10)();

      const { customer, ...rest } = ctx.request.body.data;

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
          dayOfWeek: rest.dayOfWeek.map((day) => ({
            label: day,
          })),
          childAgeGroups: rest.childAgeGroups.map((child) => ({
            label: child,
          })),
        },
      });

      return {
        data,
      };
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
