// server/upload.js — Supabase Storage upload helper
// Replaces local filesystem uploads for Vercel compatibility
const supabase = require('./supabase_client');
const crypto = require('crypto');
const path = require('path');

const BUCKET = 'uploads'; // Create this bucket in Supabase Dashboard

/**
 * Upload file buffer to Supabase Storage
 * @param {Object} file - multer file object (from memoryStorage)
 * @param {string} folder - subfolder path (e.g. 'images', 'attachments', 'models')
 * @returns {Promise<{url: string, path: string}>}
 */
async function uploadToStorage(file, folder = 'images') {
  const ext = path.extname(file.originalname);
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  const storagePath = `${folder}/${filename}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return {
    url: urlData.publicUrl,
    path: storagePath
  };
}

/**
 * Delete file from Supabase Storage
 * @param {string} storagePath - path returned from uploadToStorage
 */
async function deleteFromStorage(storagePath) {
  if (!storagePath) return;

  // If it's a full URL, extract the path
  let path = storagePath;
  if (storagePath.includes('/storage/v1/object/public/uploads/')) {
    path = storagePath.split('/storage/v1/object/public/uploads/')[1];
  } else if (storagePath.startsWith('http')) {
    return; // Not a Supabase storage URL, skip
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) console.warn('Storage delete warning:', error.message);
}

/**
 * List files in Supabase Storage
 * @param {string} folder
 * @returns {Promise<Array>}
 */
async function listStorageFiles(folder = '') {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) return [];
  return (data || []).map(f => ({
    name: f.name,
    url: supabase.storage.from(BUCKET).getPublicUrl(`${folder}/${f.name}`).data.publicUrl,
    size: f.metadata?.size || 0,
    created_at: f.created_at
  }));
}

/**
 * Extract storage path from a Supabase Storage URL
 * @param {string} url
 * @returns {string|null}
 */
function extractStoragePath(url) {
  if (!url) return null;
  const match = url.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
  return match ? match[1] : null;
}

module.exports = {
  uploadToStorage,
  deleteFromStorage,
  listStorageFiles,
  extractStoragePath,
  BUCKET
};
