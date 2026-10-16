/**
 * FlexAnalytics Pivot Engine v1.2
 * Supports:
 * - Multi-dimensional hierarchical cross-tabulations, aggregations
 * - Sub-totals & Grand totals
 * - Dimension member filtering
 * - Custom Calculated Measures & Formulas (e.g. `([profit] / [sales]) * 100`)
 */
class PivotEngine {
  /**
   * Run pivot aggregation on dataset
   * @param {Array<Object>} data - Raw input records
   * @param {Object} config - Pivot slice configuration
   * @param {Array<string>} config.rows - List of field names for row dimensions
   * @param {Array<string>} config.columns - List of field names for column dimensions
   * @param {Array<{field: string, aggregation: string, caption?: string, formula?: string}>} config.measures - Values to aggregate
   * @param {Array<{field: string, selectedValues: Array<any>}>} [config.filters] - Filter conditions
   */
  static process(data, config) {
    const {
      rows = [],
      columns = [],
      measures = [{ field: 'value', aggregation: 'sum' }],
      filters = []
    } = config;

    // 1. Apply Filters
    let filteredData = data;
    if (filters && filters.length > 0) {
      filteredData = data.filter(record => {
        return filters.every(f => {
          if (!f.selectedValues || f.selectedValues.length === 0) return true;
          const val = String(record[f.field] ?? '');
          return f.selectedValues.includes(val);
        });
      });
    }

    if (filteredData.length === 0) {
      return {
        rows,
        columns,
        measures,
        rowHeaders: [],
        columnDefinitions: [],
        matrix: [],
        grandTotals: [],
        grandGrandTotals: [],
        rowCount: 0
      };
    }

    const validMeasures = measures.length > 0 ? measures : [{ field: Object.keys(filteredData[0])[0], aggregation: 'count' }];

    // 2. Discover Unique Column & Row Combinations
    const colKeysMap = new Map();
    const rowKeysMap = new Map();
    const cellBuckets = new Map();

    for (const record of filteredData) {
      const rowKeyParts = rows.length > 0 ? rows.map(r => String(record[r] ?? '(blank)')) : ['Total'];
      const colKeyParts = columns.length > 0 ? columns.map(c => String(record[c] ?? '(blank)')) : ['Total'];

      const rowKey = rowKeyParts.join(' >>>> ');
      const colKey = colKeyParts.join(' >>>> ');

      if (!rowKeysMap.has(rowKey)) rowKeysMap.set(rowKey, rowKeyParts);
      if (!colKeysMap.has(colKey)) colKeysMap.set(colKey, colKeyParts);

      // Store cell values per measure
      validMeasures.forEach((m, mIdx) => {
        const bucketKey = `${rowKey}####${colKey}####${mIdx}`;
        if (!cellBuckets.has(bucketKey)) cellBuckets.set(bucketKey, []);

        if (m.aggregation === 'calc' && m.formula) {
          // Store raw record for row-level formula evaluation
          cellBuckets.get(bucketKey).push(record);
        } else {
          const val = record[m.field];
          if (val !== undefined && val !== null) {
            const num = typeof val === 'number' ? val : Number(val);
            cellBuckets.get(bucketKey).push(isNaN(num) ? val : num);
          }
        }
      });
    }

    const sortedRowKeys = Array.from(rowKeysMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const sortedColKeys = Array.from(colKeysMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    // Build Column Definitions
    const columnDefinitions = [];
    sortedColKeys.forEach(([colKey, parts]) => {
      validMeasures.forEach((m, mIdx) => {
        columnDefinitions.push({
          colKey,
          parts,
          measure: m,
          measureIndex: mIdx,
          headerLabel: columns.length > 0 
            ? `${parts.join(' - ')} (${m.caption || `${m.aggregation.toUpperCase()} ${m.field}`})` 
            : (m.caption || `${m.aggregation.toUpperCase()} ${m.field}`)
        });
      });
    });

    // Compute Matrix
    const matrix = [];
    sortedRowKeys.forEach(([rowKey, rowParts]) => {
      const rowValues = [];
      columnDefinitions.forEach(colDef => {
        const bucketKey = `${rowKey}####${colDef.colKey}####${colDef.measureIndex}`;
        const valuesList = cellBuckets.get(bucketKey) || [];
        const aggResult = this.computeAggregation(valuesList, colDef.measure);
        rowValues.push(aggResult);
      });

      // Calculate Row Totals
      const rowTotalsByMeasure = validMeasures.map((m, mIdx) => {
        const allRowValues = [];
        sortedColKeys.forEach(([cKey]) => {
          const list = cellBuckets.get(`${rowKey}####${cKey}####${mIdx}`) || [];
          allRowValues.push(...list);
        });
        return this.computeAggregation(allRowValues, m);
      });

      matrix.push({
        rowKey,
        rowParts,
        values: rowValues,
        rowTotals: rowTotalsByMeasure
      });
    });

    // Compute Grand Totals
    const grandTotals = columnDefinitions.map(colDef => {
      const allColValues = [];
      sortedRowKeys.forEach(([rKey]) => {
        const list = cellBuckets.get(`${rKey}####${colDef.colKey}####${colDef.measureIndex}`) || [];
        allColValues.push(...list);
      });
      return this.computeAggregation(allColValues, colDef.measure);
    });

    // Grand Grand Totals (Intersections)
    const grandGrandTotals = validMeasures.map(m => {
      if (m.aggregation === 'calc' && m.formula) {
        return this.evaluateFormula(filteredData, m.formula);
      }
      const allValues = filteredData.map(r => {
        const v = r[m.field];
        return typeof v === 'number' ? v : Number(v) || 0;
      });
      return this.computeAggregation(allValues, m);
    });

    return {
      rows,
      columns,
      measures: validMeasures,
      columnDefinitions,
      rowHeaders: sortedRowKeys.map(([k, parts]) => ({ rowKey: k, parts })),
      matrix,
      grandTotals,
      grandGrandTotals,
      rowCount: filteredData.length
    };
  }

  /**
   * Evaluates aggregation or custom formula calculation
   */
  static computeAggregation(values, measure) {
    if (!values || values.length === 0) return 0;
    const agg = (measure.aggregation || 'sum').toLowerCase();

    // Calculated formula field
    if (agg === 'calc' && measure.formula) {
      return this.evaluateFormula(values, measure.formula);
    }

    switch (agg) {
      case 'count':
        return values.length;
      case 'distinct_count':
      case 'unique':
        return new Set(values).size;
      case 'sum':
        return Math.round(values.reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0) * 100) / 100;
      case 'avg':
      case 'average': {
        const nums = values.filter(v => typeof v === 'number');
        if (nums.length === 0) return 0;
        return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
      }
      case 'min': {
        const nums = values.filter(v => typeof v === 'number');
        return nums.length ? Math.min(...nums) : 0;
      }
      case 'max': {
        const nums = values.filter(v => typeof v === 'number');
        return nums.length ? Math.max(...nums) : 0;
      }
      default:
        return values.reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);
    }
  }

  /**
   * Evaluates an arithmetic formula like `([profit] / [sales]) * 100` or `[sales] * 0.19`
   * on an array of raw records
   */
  static evaluateFormula(records, formula) {
    if (!records || records.length === 0) return 0;

    // Identify referenced fields in formula e.g. [sales], [profit], [subCategory]
    const fieldTokens = formula.match(/\[([^\]]+)\]/g) || [];
    const fields = fieldTokens.map(t => t.replace(/^\[|\]$/g, '').trim());

    // Sum up the referenced fields across all records in the bucket
    const sums = {};
    fields.forEach(f => {
      sums[f] = records.reduce((acc, r) => {
        const val = r[f];
        return acc + (typeof val === 'number' ? val : Number(val) || 0);
      }, 0);
    });

    // Replace [field] with its aggregated numeric value
    let evalString = formula;
    fields.forEach(f => {
      const escapedF = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\[${escapedF}\\]`, 'g');
      evalString = evalString.replace(regex, sums[f] ?? 0);
    });

    try {
      // Clean safe arithmetic evaluation
      const sanitized = evalString.replace(/[^0-9+\-*/().\s]/g, '');
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${sanitized})`)();
      if (isNaN(result) || !isFinite(result)) return 0;
      return Math.round(result * 100) / 100;
    } catch {
      return 0;
    }
  }

  /**
   * Extracts distinct values for a given dimension to populate filter dialogs
   */
  static getDistinctValues(data, field) {
    if (!data || !Array.isArray(data)) return [];
    const unique = new Set();
    data.forEach(r => {
      if (r[field] !== undefined && r[field] !== null) {
        unique.add(String(r[field]));
      }
    });
    return Array.from(unique).sort();
  }
}

module.exports = PivotEngine;
