/**
 * OData V4 Query → SQL Translator
 */

function toDbField(fieldName) {
  return fieldName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function parseFilter(filterString) {
  if (!filterString) return { sql: '', params: [] };

  let sql = filterString;
  const params = [];
  let paramIndex = 1;

  // Extract string literals
  const stringRegex = /'([^']*)'/g;
  let match;
  while ((match = stringRegex.exec(filterString)) !== null) {
    params.push(match[1]);
  }
  sql = sql.replace(stringRegex, () => `$${paramIndex++}`);

  // Replace operators
  sql = sql.replace(/\beq\b/g, '=')
           .replace(/\bne\b/g, '<>')
           .replace(/\bgt\b/g, '>')
           .replace(/\bge\b/g, '>=')
           .replace(/\blt\b/g, '<')
           .replace(/\ble\b/g, '<=')
           .replace(/\band\b/g, 'AND')
           .replace(/\bor\b/g, 'OR');

  // Convert PascalCase fields to snake_case
  sql = sql.replace(/\b([A-Z][a-zA-Z]+)\b/g, (match) => {
    if (['AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE', 'LIKE', 'ILIKE'].includes(match)) return match;
    if (match.startsWith('$')) return match;
    return toDbField(match);
  });

  return { sql: sql.trim(), params };
}

function parseOrderBy(orderByString) {
  if (!orderByString) return '';
  return orderByString.split(',').map(part => {
    const [field, dir] = part.trim().split(/\s+/);
    return `${toDbField(field)} ${dir?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'}`;
  }).join(', ');
}

function parseSelect(selectString, entitySet) {
  if (!selectString) return '*';
  return selectString.split(',').map(f => {
    const field = f.trim();
    const cfg = entitySet.fields[field];
    return cfg ? (cfg.dbField || toDbField(field)) : toDbField(field);
  }).join(', ');
}

module.exports = { parseFilter, parseOrderBy, parseSelect, toDbField };
