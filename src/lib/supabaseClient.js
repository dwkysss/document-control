/**
 * Re-export self-hosted API client for backward compatibility
 * Eliminates external Supabase Cloud dependency
 */
export {
  API_BASE_URL,
  isSupabaseConfigured,
  uploadDocumentFile,
  supabase,
  default
} from './apiClient';
