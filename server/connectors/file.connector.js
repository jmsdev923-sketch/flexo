const fs = require('fs');
const path = require('path');
const readline = require('readline');
const BaseConnector = require('./base.connector');

/**
 * FileConnector - Reads and introspects JSON and CSV datasets
 * Supports:
 * - Local files (upload or filesystem)
 * - Remote HTTP/REST APIs with Authentication (Bearer, API Key, Basic)
 */
class FileConnector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.filePath = config.filePath;
    this.url = config.url || '';
    this.type = config.type || (this.filePath ? path.extname(this.filePath).replace('.', '').toLowerCase() : 'json');
    this.cachedData = config.rawData || null;

    // API Authentication
    this.authType = config.authType || 'none'; // 'none' | 'bearer' | 'api_key' | 'basic'
    this.token = config.token || '';
    this.apiKeyHeader = config.apiKeyHeader || 'X-API-Key';
    this.apiKeyValue = config.apiKeyValue || '';
    this.username = config.username || '';
    this.password = config.password || '';
  }

  getApiHeaders() {
    const headers = { 'Accept': 'application/json, text/csv' };
    if (this.authType === 'bearer' && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else if (this.authType === 'api_key' && this.apiKeyValue) {
      headers[this.apiKeyHeader] = this.apiKeyValue;
    } else if (this.authType === 'basic' && this.username) {
      headers['Authorization'] = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`;
    }
    return headers;
  }

  async connect() {
    if (this.cachedData) return true;
    if (this.url) return true;
    if (!this.filePath || !fs.existsSync(this.filePath)) {
      throw new Error(`Data file not found: ${this.filePath}`);
    }
    return true;
  }

  async fetchData() {
    if (this.cachedData) return this.cachedData;

    // Fetch from authenticated remote API
    if (this.url) {
      const response = await fetch(this.url, {
        headers: this.getApiHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP Error fetching API data: ${response.status} ${response.statusText}`);
      }
      if (this.type === 'csv') {
        const text = await response.text();
        this.cachedData = this._parseCSVString(text);
      } else {
        this.cachedData = await response.json();
      }
      return this.cachedData;
    }

    // Read local JSON file
    if (this.type === 'json') {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      this.cachedData = JSON.parse(content);
      return this.cachedData;
    }

    // Read local CSV file
    if (this.type === 'csv') {
      this.cachedData = await this._parseCSV(this.filePath);
      return this.cachedData;
    }

    throw new Error(`Unsupported file type: ${this.type}`);
  }

  async getSchema() {
    const data = await this.fetchData();
    if (!data || data.length === 0) {
      return { fields: [] };
    }

    const sample = data[0];
    const fields = Object.keys(sample).map(key => {
      let type = 'string';
      const val = sample[key];
      if (typeof val === 'number') {
        type = 'number';
      } else if (typeof val === 'boolean') {
        type = 'boolean';
      } else if (!isNaN(Date.parse(val)) && typeof val === 'string' && val.length > 7 && (val.includes('-') || val.includes('/'))) {
        type = 'date';
      } else if (!isNaN(Number(val)) && val !== '' && val !== null) {
        type = 'number';
      }
      return { name: key, type };
    });

    return { fields };
  }

  _parseCSVString(csvText) {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    return lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());
      const row = {};
      headers.forEach((h, i) => {
        const raw = cleanValues[i];
        row[h] = (!isNaN(Number(raw)) && raw !== '') ? Number(raw) : raw;
      });
      return row;
    });
  }

  _parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      let headers = null;

      rl.on('line', (line) => {
        if (!line.trim()) return;
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

        if (!headers) {
          headers = cleanValues;
        } else {
          const row = {};
          headers.forEach((h, i) => {
            const raw = cleanValues[i] !== undefined ? cleanValues[i] : null;
            if (raw !== null && !isNaN(Number(raw)) && raw !== '') {
              row[h] = Number(raw);
            } else {
              row[h] = raw;
            }
          });
          results.push(row);
        }
      });

      rl.on('close', () => resolve(results));
      rl.on('error', (err) => reject(err));
    });
  }
}

module.exports = FileConnector;
