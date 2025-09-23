'use strict';

/**
 * nanny service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::nanny.nanny');
