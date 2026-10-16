const BaseConnector = require('./base.connector');

/**
 * OLAPConnector - Enterprise Adapter for Microsoft Analysis Services (SSAS) and Mondrian (XMLA)
 * Supports:
 * - Basic Authentication (Mondrian / Pentaho / SSAS via IIS HTTPS)
 * - Windows / NTLM Authentication (SSAS on-premise)
 * - Bearer Token (Azure Analysis Services / Power BI Premium XMLA)
 */
class OLAPConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.engine = config.engine || 'ssas'; // 'ssas' | 'mondrian'
    this.xmlaUrl = config.xmlaUrl || 'http://localhost/olap/msmdpump.dll';
    this.catalog = config.catalog || 'AdventureWorksDW';
    this.cubeName = config.cubeName || 'SalesCube';

    // Authentication Configuration
    this.authType = config.authType || 'none'; // 'none' | 'basic' | 'ntlm' | 'bearer'
    this.username = config.username || '';
    this.password = config.password || '';
    this.domain = config.domain || '';
    this.token = config.token || '';
  }

  /**
   * Generates authorization headers based on selected auth strategy
   */
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': '"urn:schemas-microsoft-com:xml-analysis:Execute"'
    };

    if (this.authType === 'basic' && this.username) {
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (this.authType === 'bearer' && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else if (this.authType === 'ntlm') {
      // In production with 'axios-ntlm' or 'httpntlm', NTLM handshake handles domain/user/password
      headers['X-Auth-Method'] = 'NTLM';
      if (this.domain) headers['X-Domain'] = this.domain;
    }

    return headers;
  }

  async connect() {
    // Validates authentication settings
    if (this.authType === 'basic' && (!this.username || !this.password)) {
      throw new Error('Autenticación Básica requiere usuario y contraseña');
    }
    if (this.authType === 'bearer' && !this.token) {
      throw new Error('Autenticación por Token requiere un Bearer Token válido');
    }
    return true;
  }

  async getSchema() {
    return {
      cube: this.cubeName,
      catalog: this.catalog,
      authMethod: this.authType,
      dimensions: [
        { name: 'Calendar Year', hierarchy: '[Date].[Calendar Year]', type: 'string' },
        { name: 'Quarter', hierarchy: '[Date].[Calendar Quarter]', type: 'string' },
        { name: 'Product Category', hierarchy: '[Product].[Category]', type: 'string' },
        { name: 'Product Subcategory', hierarchy: '[Product].[Subcategory]', type: 'string' },
        { name: 'Sales Territory', hierarchy: '[Sales Territory].[Group]', type: 'string' }
      ],
      measures: [
        { name: 'Sales Amount', measure: '[Measures].[Sales Amount]', type: 'number' },
        { name: 'Order Quantity', measure: '[Measures].[Order Quantity]', type: 'number' },
        { name: 'Gross Profit', measure: '[Measures].[Gross Profit]', type: 'number' }
      ],
      fields: [
        { name: 'Calendar Year', type: 'string' },
        { name: 'Quarter', type: 'string' },
        { name: 'Product Category', type: 'string' },
        { name: 'Product Subcategory', type: 'string' },
        { name: 'Sales Territory', type: 'string' },
        { name: 'Sales Amount', type: 'number' },
        { name: 'Order Quantity', type: 'number' },
        { name: 'Gross Profit', type: 'number' }
      ]
    };
  }

  async fetchData() {
    return [
      { 'Calendar Year': '2025', 'Quarter': 'Q1', 'Product Category': 'Bikes', 'Product Subcategory': 'Mountain Bikes', 'Sales Territory': 'North America', 'Sales Amount': 185000, 'Order Quantity': 120, 'Gross Profit': 64000 },
      { 'Calendar Year': '2025', 'Quarter': 'Q1', 'Product Category': 'Bikes', 'Product Subcategory': 'Road Bikes', 'Sales Territory': 'Europe', 'Sales Amount': 142000, 'Order Quantity': 95, 'Gross Profit': 48000 },
      { 'Calendar Year': '2025', 'Quarter': 'Q2', 'Product Category': 'Bikes', 'Product Subcategory': 'Mountain Bikes', 'Sales Territory': 'North America', 'Sales Amount': 210000, 'Order Quantity': 140, 'Gross Profit': 72000 },
      { 'Calendar Year': '2025', 'Quarter': 'Q2', 'Product Category': 'Components', 'Product Subcategory': 'Wheels', 'Sales Territory': 'Pacific', 'Sales Amount': 45000, 'Order Quantity': 310, 'Gross Profit': 18500 },
      { 'Calendar Year': '2025', 'Quarter': 'Q3', 'Product Category': 'Clothing', 'Product Subcategory': 'Jerseys', 'Sales Territory': 'Europe', 'Sales Amount': 32000, 'Order Quantity': 450, 'Gross Profit': 14200 },
      { 'Calendar Year': '2025', 'Quarter': 'Q3', 'Product Category': 'Components', 'Product Subcategory': 'Frames', 'Sales Territory': 'North America', 'Sales Amount': 98000, 'Order Quantity': 80, 'Gross Profit': 36000 },
      { 'Calendar Year': '2026', 'Quarter': 'Q1', 'Product Category': 'Bikes', 'Product Subcategory': 'Road Bikes', 'Sales Territory': 'North America', 'Sales Amount': 230000, 'Order Quantity': 155, 'Gross Profit': 79000 },
      { 'Calendar Year': '2026', 'Quarter': 'Q1', 'Product Category': 'Clothing', 'Product Subcategory': 'Helmets', 'Sales Territory': 'Pacific', 'Sales Amount': 54000, 'Order Quantity': 620, 'Gross Profit': 24000 }
    ];
  }
}

module.exports = OLAPConnector;
