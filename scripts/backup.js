// ===== Backup Script =====
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const DB_PATH = path.join(DATA_DIR, 'nucha.db');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  try { fs.mkdirSync(BACKUP_DIR, { recursive: true }); } catch (e) { console.warn("Mkdir skipped (read-only):", e.message); }
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `nucha-backup-${timestamp}.db`;
  const backupPath = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(DB_PATH)) {
    throw new Error('Database file not found');
  }

  fs.copyFileSync(DB_PATH, backupPath);
  const stats = fs.statSync(backupPath);

  return {
    filename,
    file_size: stats.size,
    created_at: new Date().toISOString(),
    path: backupPath
  };
}

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.db'));
  return files.map(f => {
    const stats = fs.statSync(path.join(BACKUP_DIR, f));
    return {
      filename: f,
      file_size: stats.size,
      created_at: stats.mtime.toISOString()
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Run if called directly
if (require.main === module) {
  try {
    const backup = createBackup();
    console.log(`✅ Backup created: ${backup.filename} (${backup.file_size} bytes)`);
  } catch (err) {
    console.error('❌ Backup failed:', err.message);
    process.exit(1);
  }
}

module.exports = { createBackup, listBackups };
