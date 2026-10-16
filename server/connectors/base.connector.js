/**
 * BaseConnector - Abstract contract for all data source adapters in FlexAnalytics
 */
class BaseConnector {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * Connect to the underlying source or validate configuration
   */
  async connect() {
    throw new Error('Method connect() must be implemented');
  }

  /**
   * Introspect schema: returns available dimensions (categorical) and measures (numerical)
   * @returns {Promise<{fields: Array<{name: string, type: 'string'|'number'|'date'|'boolean'}>}>}
   */
  async getSchema() {
    throw new Error('Method getSchema() must be implemented');
  }

  /**
   * Fetch raw rows or execute source-specific query
   * @param {Object} queryOptions
   * @returns {Promise<Array<Object>>}
   */
  async fetchData(queryOptions = {}) {
    throw new Error('Method fetchData() must be implemented');
  }

  /**
   * Clean up resources
   */
  async disconnect() {
    return true;
  }
}

module.exports = BaseConnector;
