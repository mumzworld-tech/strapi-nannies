const routes = require("./server/routes/index.js");
const invoice = require("./server/controllers/invoice.js");
const pdfGenerator = require("./server/services/pdf-generator.js");
const emailService = require("./server/services/email-service.js");
const logger = require("./server/services/logger.js");

module.exports = {
  register({ strapi }) {
    // Plugin registration logic
  },

  bootstrap({ strapi }) {
    strapi.log.info("🚀 Plugin download-invoice is loaded");
  },

  routes,

  controllers: {
    invoice,
  },

  services: {
    pdfGenerator,
    emailService,
    logger,
  },
};
