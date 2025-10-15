'use strict';

/**
 * order router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('api::order.order');

const customRoutes = [
  {
    method: 'GET',
    path: '/orders/search',
    handler: 'order.search',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

module.exports = {
  routes: [
    ...customRoutes,
    ...defaultRouter.routes,
  ],
};
