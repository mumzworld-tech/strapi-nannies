'use strict';

/**
 * nanny controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::nanny.nanny');
