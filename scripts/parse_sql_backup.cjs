const fs = require('fs');

function parseSqlInserts(sqlContent) {
  // Regex to match each INSERT statement
  // INSERT INTO public.<table> ("col1", "col2", ...) VALUES (val1, val2, ...) ON CONFLICT ...;
  const insertRegex = /INSERT INTO public\.(\w+)\s*\((.*?)\)\s*VALUES\s*\(([\s\S]*?)\)\s*ON CONFLICT/gi;
  
  const tables = {};
  let match;
  
  // Custom CSV / SQL values parser that handles strings with quotes, escaped quotes, nulls, ::jsonb, etc.
  function parseSqlValues(valStr) {
    const values = [];
    let cur = '';
    let inQuote = false;
    let quoteChar = '';
    
    for (let i = 0; i < valStr.length; i++) {
      const c = valStr[i];
      if (inQuote) {
        if (c === quoteChar) {
          if (i + 1 < valStr.length && valStr[i + 1] === quoteChar) {
            // Escaped quote ''
            cur += c;
            i++;
          } else {
            // End quote
            inQuote = false;
          }
        } else {
          cur += c;
        }
      } else {
        if (c === "'" || c === '"') {
          inQuote = true;
          quoteChar = c;
        } else if (c === ',') {
          values.push(cleanVal(cur));
          cur = '';
        } else {
          cur += c;
        }
      }
    }
    values.push(cleanVal(cur));
    return values;
  }
  
  function cleanVal(v) {
    let t = v.trim();
    // remove ::jsonb, ::text, etc
    t = t.replace(/::\w+$/g, '').trim();
    if (t.toUpperCase() === 'NULL') return null;
    if (t.toUpperCase() === 'TRUE') return true;
    if (t.toUpperCase() === 'FALSE') return false;
    // If it was wrapped in single quotes, remove them if needed, but parseSqlValues already handled quote boundary
    // Actually cur holds characters inside quotes
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        return JSON.parse(t);
      } catch (e) {
        return t;
      }
    }
    return t;
  }

  // Iterate over matches
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const colStr = match[2];
    const valStr = match[3];

    const cols = colStr.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const vals = parseSqlValues(valStr);

    if (!tables[tableName]) {
      tables[tableName] = [];
    }

    const row = {};
    cols.forEach((col, idx) => {
      row[col] = vals[idx] !== undefined ? vals[idx] : null;
    });

    tables[tableName].push(row);
  }

  return tables;
}

const sql = fs.readFileSync('backend/backup_latest.sql', 'utf8');
const tables = parseSqlInserts(sql);

console.log('Tables found:');
Object.keys(tables).forEach(k => {
  console.log(`- ${k}: ${tables[k].length} rows`);
});

// Convert snake_case documents to camelCase matching frontend DocumentControlContext
function toCamelCaseDoc(d) {
  let revHist = d.revision_history;
  if (typeof revHist === 'string') {
    try { revHist = JSON.parse(revHist); } catch (e) {}
  }
  
  const compCode = (d.company_code || d.doc_number?.split('-')[0] || 'DJI').toUpperCase();

  return {
    id: d.id,
    companyCode: compCode,
    docNumber: d.doc_number,
    title: d.title,
    type: d.type,
    typeName: d.type_name,
    department: d.department,
    creator: d.creator,
    creatorNik: d.creator_nik,
    creatorPosition: d.creator_position,
    seqNumber: d.seq_number,
    revision: d.revision,
    status: d.status,
    createdDate: d.created_date,
    createdTime: d.created_time,
    effectiveDate: d.effective_date,
    verifierTeam: d.verifier_team,
    notes: d.notes,
    content: d.content,
    fileName: d.file_name,
    fileSize: d.file_size,
    fileUrl: d.file_url,
    fileType: d.file_type,
    supersededBy: d.superseded_by,
    obsoleteDate: d.obsolete_date,
    changeReason: d.change_reason,
    changeDescription: d.change_description,
    rejectionReason: d.rejection_reason,
    rejectedBy: d.rejected_by,
    rejectedDate: d.rejected_date,
    approvedBy: d.approved_by,
    approvedDate: d.approved_date,
    revisionHistory: Array.isArray(revHist) ? revHist : []
  };
}

const documents = (tables['documents'] || []).map(toCamelCaseDoc);
const auditLogs = (tables['audit_logs'] || []).map(l => ({
  id: l.id,
  timestamp: l.timestamp || l.created_at,
  user: l.user_name || l.user,
  nik: l.nik,
  action: l.action,
  docNumber: l.doc_number,
  docTitle: l.doc_title,
  details: l.details,
  companyCode: l.company_code || l.doc_number?.split('-')[0] || 'DJI'
}));

// Read base backup structure
const existingBackup = JSON.parse(fs.readFileSync('database_backup.json', 'utf8'));

existingBackup.documents = documents;
existingBackup.auditLogs = auditLogs;
existingBackup.exportedAt = new Date().toISOString();

fs.writeFileSync('database_backup.json', JSON.stringify(existingBackup, null, 2), 'utf8');
console.log(`Successfully written database_backup.json with ${documents.length} documents and ${auditLogs.length} audit logs!`);
