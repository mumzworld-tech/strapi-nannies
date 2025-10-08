module.exports = ({ strapi }) => ({
  /**
   * Log invoice events for auditing
   * @param {String} orderId - Order ID
   * @param {String} eventType - Type of event (generated, downloaded, emailed)
   * @param {Object} metadata - Additional metadata
   */
  async logEvent(orderId, eventType, metadata = {}) {
    try {
      const logEntry = {
        orderId,
        eventType,
        timestamp: new Date().toISOString(),
        ...metadata,
      };

      strapi.log.info(`[Invoice ${eventType}] Order: ${orderId}`, logEntry);

      // You can extend this to save to database or external logging service
      // For now, we're using Strapi's built-in logger
    } catch (error) {
      strapi.log.error(`Failed to log invoice event for order ${orderId}:`, error);
    }
  },

  /**
   * Get logs for an order (placeholder for future implementation)
   * @param {String} orderId - Order ID
   * @returns {Promise<Array>} Array of log entries
   */
  async getLogsForOrder(orderId) {
    // Placeholder - implement if you want to store logs in database
    return [];
  },
});
