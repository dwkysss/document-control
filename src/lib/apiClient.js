/**
 * Document Control System - Internal API Client & PostgreSQL Adapter
 * Replaces external Supabase Cloud with self-hosted VPS PostgreSQL & Node.js backend.
 * ISO 9001:2015 Clause 7.5
 */

// Base URL: relative in production (Nginx reverse proxy), or configurable via VITE_API_BASE_URL
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // In browser, relative URL works with Nginx reverse proxy and Vite proxy
    return import.meta.env.VITE_API_BASE_URL || '';
  }
  return 'http://backend:5001';
};

export const API_BASE_URL = getBaseUrl();

// Always enabled for self-hosted VPS backend
export const isSupabaseConfigured = true;

const tableToEndpoint = {
  documents: '/api/documents',
  departments: '/api/departments',
  document_types: '/api/document-types',
  employees: '/api/employees',
  companies: '/api/companies',
  verifier_teams: '/api/verifier-teams',
  audit_logs: '/api/audit-logs',
  system_settings: '/api/system-settings',
};

function getEndpoint(table) {
  return tableToEndpoint[table] || `/api/${table.replace(/_/g, '-')}`;
}

/**
 * Upload file PDF / Dokumen ke VPS Storage Lokal (Backend /api/upload)
 * Fallback to FileReader if offline/unreachable
 */
export async function uploadDocumentFile(file, docNumber = 'DOC') {
  const fileSize = file.size > 1024 * 1024
    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(file.size / 1024)} KB`;
  const fileType = file.type || 'application/pdf';

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docNumber', docNumber || 'DOC');

    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return {
        fileName: data.fileName || file.name,
        fileSize: data.fileSize || fileSize,
        fileType: data.fileType || fileType,
        fileUrl: data.fileUrl, // e.g. /uploads/DOC_12345_file.pdf
      };
    }
    console.warn('[Upload] Backend returned non-200, falling back to data URL:', res.statusText);
  } catch (err) {
    console.warn('[Upload] Backend upload error, falling back to data URL:', err);
  }

  // Fallback offline / LocalStorage mode via FileReader
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        fileName: file.name,
        fileSize,
        fileType,
        fileUrl: e.target.result,
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fluent Query Builder compatible with Supabase PostgREST syntax
 * Translates queries directly to REST calls on the self-hosted backend.
 */
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.endpoint = getEndpoint(table);
    this.action = 'SELECT';
    this.id = null;
    this.payload = null;
    this.orderField = null;
    this.orderAscending = true;
    this.limitCount = null;
  }

  select(fields = '*') {
    this.action = 'SELECT';
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.orderField = field;
    this.orderAscending = ascending;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  upsert(records) {
    this.action = 'UPSERT';
    this.payload = records;
    return this;
  }

  insert(records) {
    this.action = 'INSERT';
    this.payload = records;
    return this;
  }

  update(updates) {
    this.action = 'UPDATE';
    this.payload = updates;
    return this;
  }

  delete() {
    this.action = 'DELETE';
    return this;
  }

  eq(column, value) {
    if (column === 'id') {
      this.id = value;
    } else {
      if (!this.params) this.params = {};
      this.params[column] = value;
    }
    return this;
  }

  async execute() {
    try {
      let url = `${API_BASE_URL}${this.endpoint}`;
      let options = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (this.action === 'SELECT') {
        options.method = 'GET';
        if (this.params && Object.keys(this.params).length > 0) {
          const qs = new URLSearchParams(this.params).toString();
          url += (url.includes('?') ? '&' : '?') + qs;
        }
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        let data = await res.json();
        if (this.limitCount && Array.isArray(data)) {
          data = data.slice(0, this.limitCount);
        }
        return { data, error: null };
      }

      if (this.action === 'UPSERT' || this.action === 'INSERT') {
        options.method = 'POST';
        options.body = JSON.stringify(this.payload);
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        return { data, error: null };
      }

      if (this.action === 'UPDATE') {
        options.method = 'PUT';
        const targetUrl = this.id ? `${url}/${this.id}` : url;
        options.body = JSON.stringify(this.payload);
        const res = await fetch(targetUrl, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        return { data, error: null };
      }

      if (this.action === 'DELETE') {
        options.method = 'DELETE';
        const targetUrl = this.id ? `${url}/${this.id}` : url;
        const res = await fetch(targetUrl, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        return { data, error: null };
      }

      return { data: null, error: null };
    } catch (error) {
      console.warn(`[API Client Error on ${this.table}]`, error.message);
      return { data: null, error };
    }
  }

  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

/**
 * Universal Client Interface
 */
export const supabase = {
  from: (table) => new QueryBuilder(table),
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};

export default supabase;
