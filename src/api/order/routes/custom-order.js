'use strict';

/**
 * custom order router
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/orders/search',
      handler: 'order.search',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
