const supabase = require('./supabase_client');
const crypto = require('crypto');
const path = require('path');
const BUCKET = 'uploads';

async function uploadToStorage(file, folder = 'images') {
  const ext = path.extname(file.originalname);
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  const storagePath = `${folder}/${filename}`;
  const { data, error } = await supabase.storage.from(BUCKET).upload(storagePath, file.buffer, { contentType: file.mimetype });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { url: urlData.publicUrl, path: storagePath };
}

async function deleteFromStorage(path) {
  if (!path) return;
  let p = path;
  if (path.startsWith('http')) {
    const parts = path.split('/public/uploads/');
    if (parts.length > 1) p = parts[1];
  }
  p = p.replace(/^\/+/, '');
  console.log('Deleting:', p);
  const { data, error } = await supabase.storage.from(BUCKET).remove([p, `images/${p}`]);
  if (error) throw error;
  return data;
}

async function listStorageFiles(folder = '') {
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) return [];
  return (data || []).map(f => {
      const fp = folder ? `${folder}/${f.name}` : f.name;
      return { name: f.name, url: supabase.storage.from(BUCKET).getPublicUrl(fp).data.publicUrl, path: fp };
  });
}

module.exports = { uploadToStorage, deleteFromStorage, listStorageFiles };
