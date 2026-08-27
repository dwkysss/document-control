import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

/**
 * Upload file PDF / Dokumen ke Supabase Storage (Bucket: documents)
 * Agar file dapat diakses secara publik dan permanen oleh orang lain.
 */
export async function uploadDocumentFile(file, docNumber = 'DOC') {
  const fileSize = `${(file.size / 1024).toFixed(0)} KB`;
  const fileType = file.type || 'application/pdf';

  if (!isSupabaseConfigured || !supabase) {
    // Fallback offline / LocalStorage mode via FileReader
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          fileName: file.name,
          fileSize,
          fileType,
          fileUrl: e.target.result
        });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const cleanDocNum = (docNumber || 'DOC').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = `uploads/${cleanDocNum}_${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileType
      });

    if (uploadError) {
      console.warn('Storage upload warning, falling back to data URL:', uploadError);
      // Fallback to FileReader if storage bucket is not configured yet
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            fileName: file.name,
            fileSize,
            fileType,
            fileUrl: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    }

    const { data: publicData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return {
      fileName: file.name,
      fileSize,
      fileType,
      fileUrl: publicData.publicUrl
    };
  } catch (error) {
    console.error('Error in uploadDocumentFile:', error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          fileName: file.name,
          fileSize,
          fileType,
          fileUrl: e.target.result
        });
      };
      reader.readAsDataURL(file);
    });
  }
}
