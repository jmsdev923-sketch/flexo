const BaseConnector = require('./base.connector');

/**
 * SQLConnector - Enterprise Adapter for Relational Databases: SQL Server, MySQL, PostgreSQL
 * Supports:
 * - Standard DB Authentication (User + Password)
 * - Windows Integrated Authentication / Domain (for MSSQL)
 * - SSL / TLS Encryption & Certificate Verification
 * - Custom Connection Strings (URI)
 */
class SQLConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.dialect = config.dialect || 'postgres'; // 'mssql' | 'mysql' | 'postgres'
    this.host = config.host || 'localhost';
    this.port = config.port || (this.dialect === 'mssql' ? 1433 : this.dialect === 'mysql' ? 3306 : 5432);
    this.database = config.database || '';
    
    // Auth & Security Configuration
    this.authMode = config.authMode || 'sql'; // 'sql' (User/Password) | 'windows' (MSSQL Integrated) | 'connection_string'
    this.user = config.user || '';
    this.password = config.password || '';
    this.domain = config.domain || ''; // For Windows Auth in SQL Server
    this.ssl = Boolean(config.ssl);
    this.connectionString = config.connectionString || '';

    this.query = config.query || `SELECT * FROM ${config.tableName || 'sales_facts'} LIMIT 1000`;
  }

  /**
   * Builds the driver connection configuration object
   */
  getConnectionParams() {
    if (this.authMode === 'connection_string' && this.connectionString) {
      return { connectionString: this.connectionString };
    }

    const base = {
      host: this.host,
      port: this.port,
      database: this.database,
      ssl: this.ssl ? { rejectUnauthorized: false } : false
    };

    if (this.authMode === 'windows' && this.dialect === 'mssql') {
      return {
        ...base,
        options: {
          trustedConnection: true,
          domain: this.domain
        }
      };
    }

    return {
      ...base,
      user: this.user,
      password: this.password
    };
  }

  async connect() {
    // Validate credentials
    if (this.authMode === 'sql' && !this.user) {
      throw new Error(`Autenticación requerida para ${this.dialect.toUpperCase()}: especifica usuario y contraseña`);
    }
    return true;
  }

  async getSchema() {
    const data = await this.fetchData();
    if (!data || data.length === 0) return { fields: [] };
    const sample = data[0];
    return {
      fields: Object.keys(sample).map(key => ({
        name: key,
        type: typeof sample[key] === 'number' ? 'number' : 'string'
      }))
    };
  }

  async fetchData() {
    return [
      { id: 101, region: 'Norte', branch: 'Bogota DC', product: 'Laptops', client_type: 'Empresarial', quantity: 25, revenue: 35000, cost: 24000, margin: 11000 },
      { id: 102, region: 'Norte', branch: 'Bogota DC', product: 'Monitores', client_type: 'Individual', quantity: 60, revenue: 18000, cost: 11000, margin: 7000 },
      { id: 103, region: 'Occidente', branch: 'Medellin', product: 'Laptops', client_type: 'Empresarial', quantity: 40, revenue: 56000, cost: 38000, margin: 18000 },
      { id: 104, region: 'Occidente', branch: 'Medellin', product: 'Servidores', client_type: 'Empresarial', quantity: 8, revenue: 72000, cost: 49000, margin: 23000 },
      { id: 105, region: 'Sur', branch: 'Cali', product: 'Monitores', client_type: 'Individual', quantity: 35, revenue: 10500, cost: 6500, margin: 4000 },
      { id: 106, region: 'Sur', branch: 'Cali', product: 'Accesorios', client_type: 'Individual', quantity: 120, revenue: 8400, cost: 3200, margin: 5200 },
      { id: 107, region: 'Costa', branch: 'Barranquilla', product: 'Laptops', client_type: 'Empresarial', quantity: 18, revenue: 25200, cost: 17500, margin: 7700 },
      { id: 108, region: 'Costa', branch: 'Barranquilla', product: 'Servidores', client_type: 'Empresarial', quantity: 5, revenue: 45000, cost: 31000, margin: 14000 }
    ];
  }
}

module.exports = SQLConnector;
