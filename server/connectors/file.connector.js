const fs = require('fs');
const path = require('path');
const readline = require('readline');
const XLSX = require('xlsx');
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
    const fileExt = this.filePath ? path.extname(this.filePath).replace('.', '').toLowerCase() : '';
    const rawType = (config.type || '').toLowerCase();
    if (rawType === 'excel' || rawType === 'xlsx' || rawType === 'xls' || fileExt === 'xlsx' || fileExt === 'xls') {
      this.type = 'xlsx';
    } else if (rawType === 'csv' || fileExt === 'csv') {
      this.type = 'csv';
    } else {
      this.type = config.type || (fileExt || 'json');
    }
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

    // Read local Excel file (.xlsx, .xls)
    if (this.type === 'xlsx' || this.type === 'xls' || (this.filePath && /\.(xlsx|xls)$/i.test(this.filePath))) {
      try {
        const workbook = XLSX.readFile(this.filePath, { cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) return [];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        this.cachedData = jsonData;
        return this.cachedData;
      } catch (err) {
        throw new Error(`Error al leer archivo Excel: ${err.message}`);
      }
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

    const sampleLimit = Math.min(data.length, 100);
    const firstRowKeys = Object.keys(data[0]);

    const fields = firstRowKeys.map(key => {
      let sampleVal = null;
      for (let i = 0; i < sampleLimit; i++) {
        const v = data[i][key];
        if (v !== null && v !== undefined && v !== '') {
          sampleVal = v;
          break;
        }
      }

      let type = 'string';
      if (typeof sampleVal === 'number') {
        type = 'number';
      } else if (typeof sampleVal === 'boolean') {
        type = 'boolean';
      } else if (
        sampleVal !== null &&
        typeof sampleVal === 'string' &&
        sampleVal.length >= 8 &&
        sampleVal.length <= 35 &&
        (sampleVal.includes('-') || sampleVal.includes('/')) &&
        !isNaN(Date.parse(sampleVal))
      ) {
        type = 'date';
      } else if (sampleVal !== null && !isNaN(Number(sampleVal)) && sampleVal !== '') {
        type = 'number';
      }

      return { name: key, type };
    });

    return { fields };
  }

  _detectDelimiter(firstLine) {
    if (!firstLine) return ',';
    const clean = firstLine.charCodeAt(0) === 0xFEFF ? firstLine.slice(1) : firstLine;
    const candidates = [';', ',', '\t', '|'];
    const counts = { ';': 0, ',': 0, '\t': 0, '|': 0 };
    let inQuotes = false;

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (char === '"') {
        if (inQuotes && clean[i + 1] === '"') {
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (!inQuotes && counts[char] !== undefined) {
        counts[char]++;
      }
    }

    let bestDelim = ',';
    let maxCount = 0;
    for (const delim of candidates) {
      if (counts[delim] > maxCount) {
        maxCount = counts[delim];
        bestDelim = delim;
      }
    }
    return bestDelim;
  }

  _parseCSVLine(line, delimiter) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  }

  _parseValue(val, delimiter) {
    if (val === undefined || val === null) return null;
    let trimmed = String(val).trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      trimmed = trimmed.slice(1, -1).replace(/""/g, '"').trim();
    }
    if (trimmed === '') return null;

    // Spanish / European format with thousand dots and comma decimal e.g. 1.234.567,89 or -1.234,50
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(trimmed)) {
      const normalized = trimmed.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num)) return num;
    }

    // US format with thousand commas and dot decimal e.g. 1,234,567.89 or -1,234.50
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(trimmed)) {
      const normalized = trimmed.replace(/,/g, '');
      const num = parseFloat(normalized);
      if (!isNaN(num)) return num;
    }

    // Comma decimal without thousand dots e.g. -6285714,29 or 8,5
    if (/^-?\d+,\d+$/.test(trimmed)) {
      const num = parseFloat(trimmed.replace(',', '.'));
      if (!isNaN(num)) return num;
    }

    // Standard integer or dot decimal e.g. -50, 758, 123.45
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!isNaN(num)) return num;
    }

    return trimmed;
  }

  _parseCSVString(csvText) {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    let headerLine = lines[0];
    if (headerLine.charCodeAt(0) === 0xFEFF) {
      headerLine = headerLine.slice(1);
    }

    const delimiter = this._detectDelimiter(headerLine);
    const rawHeaders = this._parseCSVLine(headerLine, delimiter);
    const headers = rawHeaders.map((h, idx) => {
      let clean = h.trim();
      if (clean.startsWith('"') && clean.endsWith('"')) {
        clean = clean.slice(1, -1).trim();
      }
      return clean || `col_${idx + 1}`;
    });

    return lines.slice(1).map(line => {
      const rawValues = this._parseCSVLine(line, delimiter);
      const row = {};
      for (let i = 0; i < headers.length; i++) {
        row[headers[i]] = this._parseValue(rawValues[i], delimiter);
      }
      return row;
    });
  }

  _parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      let headers = null;
      let delimiter = ',';

      rl.on('line', (line) => {
        if (!line.trim()) return;

        if (!headers) {
          let headerLine = line;
          if (headerLine.charCodeAt(0) === 0xFEFF) {
            headerLine = headerLine.slice(1);
          }
          delimiter = this._detectDelimiter(headerLine);
          const rawHeaders = this._parseCSVLine(headerLine, delimiter);
          headers = rawHeaders.map((h, idx) => {
            let clean = h.trim();
            if (clean.startsWith('"') && clean.endsWith('"')) {
              clean = clean.slice(1, -1).trim();
            }
            return clean || `col_${idx + 1}`;
          });
          return;
        }

        const values = this._parseCSVLine(line, delimiter);
        const row = {};
        for (let i = 0; i < headers.length; i++) {
          row[headers[i]] = this._parseValue(values[i], delimiter);
        }
        results.push(row);
      });

      rl.on('close', () => resolve(results));
      rl.on('error', (err) => reject(err));
    });
  }
}

module.exports = FileConnector;
