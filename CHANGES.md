# วิธีแก้ไขให้รูปอยู่ถาวรบน Vercel

## ปัญหา
Vercel filesystem เป็น read-only → ไฟล์ใน `uploads/` หายทุกครั้งที่ deploy

## วิธีแก้
เปลี่ยนจากเก็บไฟล์บน local disk → **Supabase Storage** (cloud CDN, อยู่ถาวร)

---

## ขั้นตอนที่ 1: สร้าง Storage Bucket ใน Supabase

1. ไปที่ **Supabase Dashboard → Storage**
2. คลิก **New Bucket**
   - Name: `uploads`
   - Public: ✅ (เปิด public access)
3. คลิก **Create Bucket**

## ขั้นตอนที่ 2: เพิ่มไฟล์ `server/upload.js`

คัดลอกไฟล์ `server/upload.js` ที่เตรียมไว้เข้าโปรเจค

## ขั้นตอนที่ 3: แก้ไข `api/index.js`

### 3.1 เปลี่ยน import ด้านบน (หลัง require อื่นๆ)

```js
// เพิ่ม 2 บรรทัดนี้
const { uploadToStorage, deleteFromStorage, listStorageFiles, extractStoragePath } = require('./server/upload');
```

### 3.2 เปลี่ยน multer storage (แทนที่ 3 blocks)

**ลบ** blocks เหล่านี้ทั้งหมด:
- `const storage = multer.diskStorage({...})`
- `const attachmentStorage = multer.diskStorage({...})`
- `const modelStorage = multer.diskStorage({...})`

**แทนที่ด้วย:**
```js
// All uploads use memory storage → then upload to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(null, false);
  }
});

const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const modelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.glb', '.gltf', '.obj', '.mtl', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('อนุญาตเฉพาะไฟล์ .glb, .gltf, .obj, .jpg, .png, .webp เท่านั้น'));
  }
});
```

### 3.3 แก้ไข `/api/upload` (รูปภาพทั่วไป)

**เดิม:**
```js
app.post('/api/upload', authMiddleware, uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' });
    res.json({ url: '/uploads/' + req.file.filename });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});
```

**ใหม่:**
```js
app.post('/api/upload', authMiddleware, uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' });
    const result = await uploadToStorage(req.file, 'images');
    res.json({ url: result.url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message });
  }
});
```

### 3.4 แก้ไข lead attachments (POST)

**เดิม:**
```js
app.post('/api/leads/:id/attachments', authMiddleware, uploadLimiter, attachmentUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' });
    const result = await db.prepare('INSERT INTO lead_attachments (lead_id, filename, original_name, url, file_size) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, req.file.filename, req.file.originalname, '/uploads/' + req.file.filename, req.file.size);
    res.json({ success: true, id: result.lastInsertRowid, url: '/uploads/' + req.file.filename });
  } catch (err) {
    console.error('Upload attachment error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});
```

**ใหม่:**
```js
app.post('/api/leads/:id/attachments', authMiddleware, uploadLimiter, attachmentUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ไม่พบไฟล์' });
    const uploaded = await uploadToStorage(req.file, 'attachments');
    const result = await db.prepare('INSERT INTO lead_attachments (lead_id, filename, original_name, url, file_size) VALUES (?, ?, ?, ?, ?)')
      .run(req.params.id, req.file.originalname, req.file.originalname, uploaded.url, req.file.size);
    res.json({ success: true, id: result.lastInsertRowid, url: uploaded.url });
  } catch (err) {
    console.error('Upload attachment error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด: ' + err.message });
  }
});
```

### 3.5 แก้ไข delete attachment

**เดิม:**
```js
// Delete file from disk
const filePath = path.join(uploadsDir, attachment.filename);
if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
```

**ใหม่:**
```js
// Delete file from Supabase Storage
await deleteFromStorage(attachment.url);
```

### 3.6 แก้ไข media list

**เดิม:**
```js
app.get('/api/media', authMiddleware, async (req, res) => {
  try {
    if (!fs.existsSync(uploadsDir)) try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (e) { console.warn("Mkdir skipped (read-only):", e.message); }
    const files = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));
    res.json(files.map(f => ({ name: f, url: '/uploads/' + f })));
  } catch { res.json([]); }
});
```

**ใหม่:**
```js
app.get('/api/media', authMiddleware, async (req, res) => {
  try {
    const files = await listStorageFiles('images');
    res.json(files);
  } catch { res.json([]); }
});
```

### 3.7 แก้ไข media delete

**เดิม:**
```js
app.delete('/api/media/:name', authMiddleware, async (req, res) => {
  try {
    const safeName = path.basename(req.params.name);
    // ... local file delete logic
  }
});
```

**ใหม่:**
```js
app.delete('/api/media/:name(*)', authMiddleware, async (req, res) => {
  try {
    await deleteFromStorage(req.params.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});
```

### 3.8 ลบ/แทนที่ route `/uploads/:name`

**เดิม:**
```js
app.get('/uploads/:name', async (req, res) => {
  // ... local file serving
});
```

**ใหม่ (redirect ไป Supabase Storage):**
```js
// Redirect old /uploads/ URLs to Supabase Storage
app.get('/uploads/:name(*)', async (req, res) => {
  // If there are old local files, they won't exist on Vercel
  // New uploads already use full Supabase URLs
  res.status(404).json({ error: 'ไฟล์นี้ถูกย้ายไป Supabase Storage แล้ว กรุณาอัพโหลดใหม่' });
});
```

### 3.9 แก้ไข gallery upload

**เดิม:**
```js
if (req.file) imageUrl = `/uploads/${req.file.filename}`;
```

**ใหม่:**
```js
if (req.file) {
  const uploaded = await uploadToStorage(req.file, 'gallery');
  imageUrl = uploaded.url;
}
```

### 3.10 แก้ไข gallery delete

**เดิม:**
```js
if (item.image_url && item.image_url.startsWith('/uploads/')) {
  const filepath = path.join(__dirname, item.image_url);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
}
```

**ใหม่:**
```js
if (item.image_url) {
  await deleteFromStorage(item.image_url);
}
```

### 3.11 แก้ไข gallery update

**เดิม:**
```js
if (req.file) newImageUrl = `/uploads/${req.file.filename}`;
```

**ใหม่:**
```js
if (req.file) {
  const uploaded = await uploadToStorage(req.file, 'gallery');
  newImageUrl = uploaded.url;
  // Delete old image if it was on storage
  if (item.image_url) await deleteFromStorage(item.image_url);
}
```

### 3.12 แก้ไข model uploads

**เดิม:**
```js
finalModelUrl = '/uploads/' + path.basename(filePath);
// ...
finalPosterUrl = '/uploads/' + req.files.poster_file[0].filename;
```

**ใหม่:**
```js
const modelUploaded = await uploadToStorage({ buffer: fs.readFileSync(filePath), originalname: path.basename(filePath), mimetype: 'model/gltf-binary' }, 'models');
finalModelUrl = modelUploaded.url;
// ...
const posterUploaded = await uploadToStorage(req.files.poster_file[0], 'models');
finalPosterUrl = posterUploaded.url;
```

---

## ขั้นตอนที่ 4: ลบไฟล์ที่ไม่ใช้

- `server/db_bridge.js` — ซ้ำซ้อน
- `server/db_supabase.js` — merge เข้า db.js แล้ว
- ไฟล์ fix_*.js, repair_*.js, refactor_*.js ทั้งหมดใน root

## ขั้นตอนที่ 5: Deploy

```bash
git add .
git commit -m "fix: use Supabase Storage for uploads (Vercel compatible)"
git push
```

ใน Vercel ตั้ง Environment Variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (หรือ `SUPABASE_SERVICE_ROLE_KEY`)
- `JWT_SECRET`
