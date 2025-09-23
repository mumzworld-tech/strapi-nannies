'use strict';

/**
 * nanny router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::nanny.nanny');
