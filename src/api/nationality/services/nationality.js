'use strict';

/**
 * nationality service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::nationality.nationality');
