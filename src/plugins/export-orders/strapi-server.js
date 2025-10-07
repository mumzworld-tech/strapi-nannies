import routes from "./server/routes/index.js";
import exportOrders from "./server/controllers/exportOrders.js";

export default {
  register({ strapi }) {},

  bootstrap({ strapi }) {
    strapi.log.info(`🚀 Plugin export-orders is loaded`);
  },

  routes,

  controllers: {
    exportOrders,
  },
};
