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

    // 2. Discover Unique Column & Row Combinations & Hierarchy Levels
    const colKeysMap = new Map();
    const cellBuckets = new Map();
    const hierarchyNodesMap = new Map();

    const levelsCount = Math.max(rows.length, 1);

    for (const record of filteredData) {
      const rowKeyParts = rows.length > 0 ? rows.map(r => String(record[r] ?? '(blank)')) : ['Total'];
      const colKeyParts = columns.length > 0 ? columns.map(c => String(record[c] ?? '(blank)')) : ['Total'];

      const colKey = colKeyParts.join(' >>>> ');
      if (!colKeysMap.has(colKey)) colKeysMap.set(colKey, colKeyParts);

      // Register and bucket for each hierarchical level (Level 0 ... N-1)
      for (let lvl = 0; lvl < levelsCount; lvl++) {
        const prefixParts = rowKeyParts.slice(0, lvl + 1);
        const prefixKey = prefixParts.join(' >>>> ');
        const parentKey = lvl === 0 ? null : rowKeyParts.slice(0, lvl).join(' >>>> ');

        if (!hierarchyNodesMap.has(prefixKey)) {
          hierarchyNodesMap.set(prefixKey, {
            key: prefixKey,
            parentKey,
            rowParts: prefixParts,
            level: lvl,
            label: rowKeyParts[lvl],
            dimension: rows[lvl] || 'Total',
            isLeaf: lvl === levelsCount - 1,
            hasChildren: lvl < levelsCount - 1,
            childrenKeys: new Set()
          });
        }

        if (parentKey && hierarchyNodesMap.has(parentKey)) {
          hierarchyNodesMap.get(parentKey).childrenKeys.add(prefixKey);
        }

        // Store cell values per measure at this level
        validMeasures.forEach((m, mIdx) => {
          const bucketKey = `${prefixKey}####${colKey}####${mIdx}`;
          if (!cellBuckets.has(bucketKey)) cellBuckets.set(bucketKey, []);

          if (m.aggregation === 'calc' && m.formula) {
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
    }

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

    // Helper to compute node metrics
    const computeNodeMetrics = (node) => {
      const rowValues = [];
      columnDefinitions.forEach(colDef => {
        const bucketKey = `${node.key}####${colDef.colKey}####${colDef.measureIndex}`;
        const valuesList = cellBuckets.get(bucketKey) || [];
        rowValues.push(this.computeAggregation(valuesList, colDef.measure));
      });

      const rowTotalsByMeasure = validMeasures.map((m, mIdx) => {
        const allRowValues = [];
        sortedColKeys.forEach(([cKey]) => {
          const list = cellBuckets.get(`${node.key}####${cKey}####${mIdx}`) || [];
          allRowValues.push(...list);
        });
        return this.computeAggregation(allRowValues, m);
      });

      return { rowValues, rowTotalsByMeasure };
    };

    // Calculate metrics for all nodes in the hierarchy
    for (const node of hierarchyNodesMap.values()) {
      const { rowValues, rowTotalsByMeasure } = computeNodeMetrics(node);
      node.values = rowValues;
      node.rowTotals = rowTotalsByMeasure;
      node.childrenCount = node.childrenKeys.size;
    }

    // Build flattened hierarchical tree in pre-order traversal
    const tree = [];
    const traverseHierarchy = (parentKey) => {
      const siblings = Array.from(hierarchyNodesMap.values())
        .filter(n => n.parentKey === parentKey)
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));

      for (const node of siblings) {
        tree.push({
          key: node.key,
          parentKey: node.parentKey,
          label: node.label,
          dimension: node.dimension,
          level: node.level,
          rowParts: node.rowParts,
          isLeaf: node.isLeaf,
          hasChildren: node.hasChildren,
          childrenCount: node.childrenCount,
          values: node.values,
          rowTotals: node.rowTotals
        });
        if (node.hasChildren) {
          traverseHierarchy(node.key);
        }
      }
    };
    traverseHierarchy(null);

    // Leaf Matrix (for flat/chart views and backwards compatibility)
    const matrix = tree.filter(n => n.isLeaf).map(n => ({
      rowKey: n.key,
      parentKey: n.parentKey,
      level: n.level,
      rowParts: n.rowParts,
      values: n.values,
      rowTotals: n.rowTotals
    }));

    // Compute Grand Totals across all column definitions
    const grandTotals = columnDefinitions.map((colDef) => {
      const m = colDef.measure;
      const agg = (m.aggregation || 'sum').toLowerCase();

      if (agg === 'calc' && m.formula) {
        return this.evaluateFormula(filteredData, m.formula);
      }

      // Filter data for this column's members if column dimensions exist
      const colRecords = filteredData.filter(record => {
        if (!colDef.parts || colDef.parts.length === 0 || colDef.colKey === 'Total') return true;
        return columns.every((cField, idx) => String(record[cField] ?? '(blank)') === colDef.parts[idx]);
      });

      const values = colRecords.map(r => r[m.field]).filter(v => v !== undefined && v !== null).map(v => typeof v === 'number' ? v : Number(v)).filter(v => !isNaN(v));
      return this.computeAggregation(values, m);
    });

    // Grand Grand Totals (Intersections)
    const grandGrandTotals = validMeasures.map((m) => {
      const agg = (m.aggregation || 'sum').toLowerCase();
      if (agg === 'calc' && m.formula) {
        return this.evaluateFormula(filteredData, m.formula);
      }
      const values = filteredData.map(r => r[m.field]).filter(v => v !== undefined && v !== null).map(v => typeof v === 'number' ? v : Number(v)).filter(v => !isNaN(v));
      return this.computeAggregation(values, m);
    });

    return {
      rows,
      columns,
      measures: validMeasures,
      columnDefinitions,
      rowHeaders: matrix.map(m => ({ rowKey: m.rowKey, parts: m.rowParts })),
      matrix,
      tree,
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

    // Identify referenced fields in formula e.g. [sales], [profit] or bare field names
    const fieldTokens = formula.match(/\[([^\]]+)\]/g) || [];
    let fields = fieldTokens.map(t => t.replace(/^\[|\]$/g, '').trim());

    if (fields.length === 0 && records[0]) {
      const words = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
      const recordKeys = Object.keys(records[0]);
      fields = words.filter(w => recordKeys.includes(w));
    }

    // Sum up the referenced fields across all records in the bucket
    const sums = {};
    fields.forEach(f => {
      sums[f] = records.reduce((acc, r) => {
        const val = r[f];
        return acc + (typeof val === 'number' ? val : Number(val) || 0);
      }, 0);
    });

    // Replace [field] or bare field with its aggregated numeric value
    let evalString = formula;
    fields.forEach(f => {
      const escapedF = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      evalString = evalString.replace(new RegExp(`\\[${escapedF}\\]`, 'g'), sums[f] ?? 0);
      evalString = evalString.replace(new RegExp(`\\b${escapedF}\\b`, 'g'), sums[f] ?? 0);
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
