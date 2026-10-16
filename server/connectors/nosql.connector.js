const BaseConnector = require('./base.connector');

/**
 * NoSQLConnector - Enterprise Adapter for Document & Search stores (MongoDB, Elasticsearch)
 * Supports:
 * - MongoDB Auth (SCRAM, User/Password, Auth Database, Connection String SRV)
 * - Elasticsearch Auth (Elastic User/Password, API Key, Bearer Token, SSL)
 */
class NoSQLConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.engine = config.engine || 'mongodb'; // 'mongodb' | 'elasticsearch'
    this.uri = config.uri || (this.engine === 'mongodb' ? 'mongodb://localhost:27017' : 'https://localhost:9200');
    this.collectionOrIndex = config.collection || config.index || 'events';

    // Auth Configuration
    this.authType = config.authType || 'user_pass'; // 'user_pass' | 'api_key' | 'connection_string'
    this.username = config.username || '';
    this.password = config.password || '';
    this.authSource = config.authSource || 'admin'; // For MongoDB
    this.apiKey = config.apiKey || ''; // For Elasticsearch API Key
    this.tls = Boolean(config.tls || config.ssl);
  }

  /**
   * Builds authentication headers or client parameters
   */
  getSecurityConfig() {
    if (this.engine === 'elasticsearch') {
      if (this.authType === 'api_key' && this.apiKey) {
        return {
          node: this.uri,
          auth: { apiKey: this.apiKey },
          tls: { rejectUnauthorized: false }
        };
      }
      return {
        node: this.uri,
        auth: {
          username: this.username,
          password: this.password
        },
        tls: { rejectUnauthorized: false }
      };
    }

    // MongoDB connection structure
    return {
      uri: this.uri,
      options: {
        auth: (this.username && this.password) ? {
          username: this.username,
          password: this.password
        } : undefined,
        authSource: this.authSource,
        tls: this.tls
      }
    };
  }

  async connect() {
    if (this.engine === 'elasticsearch' && this.authType === 'api_key' && !this.apiKey) {
      throw new Error('Elasticsearch con autenticación API Key requiere un token válido');
    }
    if (this.authType === 'user_pass' && (!this.username || !this.password)) {
      throw new Error(`Autenticación requerida para ${this.engine.toUpperCase()}: especifica usuario y contraseña`);
    }
    return true;
  }

  async getSchema() {
    const data = await this.fetchData();
    if (!data || data.length === 0) return { fields: [] };
    const sample = data[0];
    return {
      engine: this.engine,
      authMethod: this.authType,
      fields: Object.keys(sample).map(key => ({
        name: key,
        type: typeof sample[key] === 'number' ? 'number' : 'string'
      }))
    };
  }

  async fetchData() {
    return [
      { event_id: 'EVT-01', channel: 'Web App', user_tier: 'Enterprise', action: 'checkout', latency_ms: 120, conversion_rate: 4.5, cart_value: 350 },
      { event_id: 'EVT-02', channel: 'Mobile iOS', user_tier: 'Pro', action: 'browse', latency_ms: 85, conversion_rate: 2.1, cart_value: 120 },
      { event_id: 'EVT-03', channel: 'Mobile Android', user_tier: 'Free', action: 'browse', latency_ms: 140, conversion_rate: 1.2, cart_value: 45 },
      { event_id: 'EVT-04', channel: 'Web App', user_tier: 'Enterprise', action: 'export_report', latency_ms: 310, conversion_rate: 5.0, cart_value: 780 },
      { event_id: 'EVT-05', channel: 'API', user_tier: 'Enterprise', action: 'sync_batch', latency_ms: 220, conversion_rate: 8.4, cart_value: 1200 },
      { event_id: 'EVT-06', channel: 'Mobile iOS', user_tier: 'Pro', action: 'checkout', latency_ms: 95, conversion_rate: 3.8, cart_value: 290 },
      { event_id: 'EVT-07', channel: 'Web App', user_tier: 'Free', action: 'signup', latency_ms: 110, conversion_rate: 0.8, cart_value: 0 },
      { event_id: 'EVT-08', channel: 'API', user_tier: 'Pro', action: 'sync_batch', latency_ms: 180, conversion_rate: 4.2, cart_value: 450 }
    ];
  }
}

module.exports = NoSQLConnector;
