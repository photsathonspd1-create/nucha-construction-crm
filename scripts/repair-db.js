#!/usr/bin/env node
// ===== Database Repair Script =====
// Usage: node scripts/repair-db.js
// Fixes "database disk image is malformed" errors

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'nucha.db');
const dumpPath = path.join(__dirname, '..', 'data', 'nucha_dump.sql');
const corruptedPath = dbPath + '.corrupted';
const newPath = dbPath + '.recovered';

if (!fs.existsSync(dbPath)) {
  console.log('❌ ไม่พบ data/nucha.db — ไม่ต้อง repair (จะสร้างใหม่ตอน npm start)');
  process.exit(0);
}

console.log('🔧 NUCHA CRM — Database Repair Tool');
console.log('====================================\n');

// Step 1: Backup
console.log('📦 Step 1: Backup corrupted database...');
fs.copyFileSync(dbPath, corruptedPath);
console.log('   ✅ Backup → data/nucha.db.corrupted\n');

// Step 2: Dump data
console.log('🔍 Step 2: Scanning for recoverable data...');
let dump = 'PRAGMA journal_mode=WAL;\nPRAGMA foreign_keys=OFF;\n\n';
let totalRows = 0;
let failedTables = [];

try {
  const db = new Database(dbPath, { fileMustExist: true, readonly: true });
  const tables = db.prepare(
    "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all();

  console.log(`   📋 พบ ${tables.length} ตาราง\n`);

  for (const table of tables) {
    try {
      const rows = db.prepare(`SELECT * FROM "${table.name}"`).all();
      totalRows += rows.length;

      // Add DROP + CREATE TABLE
      dump += `DROP TABLE IF EXISTS "${table.name}";\n`;
      if (table.sql) dump += table.sql + ';\n\n';

      // Add data
      if (rows.length > 0) {
        const cols = Object.keys(rows[0]);
        for (const row of rows) {
          const vals = cols.map(c => {
            const v = row[c];
            if (v === null) return 'NULL';
            if (typeof v === 'number') return String(v);
            if (typeof v === 'string') return "'" + v.replace(/'/g, "''") + "'";
            if (Buffer.isBuffer(v)) return "X'" + v.toString('hex') + "'";
            return "'" + String(v).replace(/'/g, "''") + "'";
          });
          dump += `INSERT INTO "${table.name}" (${cols.map(c => '"' + c + '"').join(',')}) VALUES (${vals.join(',')});\n`;
        }
        dump += '\n';
      }

      console.log(`   ✅ ${table.name}: ${rows.length} rows`);
    } catch (e) {
      failedTables.push(table.name);
      console.log(`   ⚠️  ${table.name}: ${e.message.substring(0, 80)}`);

      // Row-by-row recovery
      try {
        const tableInfo = db.prepare(`PRAGMA table_info("${table.name}")`).all();
        const colNames = tableInfo.map(c => c.name);
        dump += `DROP TABLE IF EXISTS "${table.name}";\n`;
        if (table.sql) dump += table.sql + ';\n\n';

        let recovered = 0;
        try {
          const rowids = db.prepare(`SELECT rowid FROM "${table.name}"`).all();
          for (const { rowid } of rowids) {
            try {
              const row = db.prepare(`SELECT * FROM "${table.name}" WHERE rowid = ?`).get(rowid);
              if (row) {
                const vals = colNames.map(c => {
                  const v = row[c];
                  if (v === null) return 'NULL';
                  if (typeof v === 'number') return String(v);
                  if (typeof v === 'string') return "'" + v.replace(/'/g, "''") + "'";
                  return "'" + String(v).replace(/'/g, "''") + "'";
                });
                dump += `INSERT INTO "${table.name}" (${colNames.map(c => '"' + c + '"').join(',')}) VALUES (${vals.join(',')});\n`;
                recovered++;
              }
            } catch (_) {}
          }
        } catch (_) {}

        if (recovered > 0) {
          dump += '\n';
          console.log(`   🔄 ${table.name}: กู้ได้ ${recovered} rows (partial)`);
          totalRows += recovered;
        } else {
          console.log(`   ❌ ${table.name}: กู้ไม่ได้`);
        }
      } catch (_) {
        console.log(`   ❌ ${table.name}: กู้ไม่ได้`);
      }
    }
  }

  db.close();
} catch (e) {
  console.log('\n   ❌ เปิด database ไม่ได้: ' + e.message);
}

// Step 3: Create new database
if (totalRows > 0) {
  console.log(`\n📊 ข้อมูลที่กู้ได้: ${totalRows} rows`);
  console.log('🔨 Step 3: สร้าง database ใหม่...');

  try {
    // Save dump
    fs.writeFileSync(dumpPath, dump, 'utf8');
    console.log('   ✅ บันทึก dump → data/nucha_dump.sql');

    // Create new DB
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    const newDb = new Database(newPath);
    newDb.pragma('journal_mode = WAL');
    newDb.pragma('foreign_keys = OFF');

    // Execute dump
    newDb.exec(dump);

    // Verify
    const count = newDb.prepare("SELECT COUNT(*) as c FROM sqlite_master WHERE type='table'").get();
    console.log(`   ✅ สร้าง database ใหม่สำเร็จ (${count.c} tables)`);

    // Check data
    try {
      const leads = newDb.prepare('SELECT COUNT(*) as c FROM leads').get();
      const content = newDb.prepare('SELECT COUNT(*) as c FROM site_content').get();
      const users = newDb.prepare('SELECT COUNT(*) as c FROM users').get();
      const chat = newDb.prepare('SELECT COUNT(*) as c FROM chat_messages').get();
      console.log(`   📊 Leads: ${leads.c}, Content: ${content.c}, Users: ${users.c}, Chat: ${chat.c}`);
    } catch (_) {}

    newDb.close();

    // Replace old with new
    fs.unlinkSync(dbPath);
    fs.renameSync(newPath, dbPath);
    console.log('   ✅ แทนที่ database เดิมแล้ว\n');

    if (failedTables.length > 0) {
      console.log(`   ⚠️  ตารางที่กู้ไม่ได้: ${failedTables.join(', ')}`);
      console.log('   💡 ตารางเหล่านี้จะถูกสร้างใหม่ตอน npm start (migrations)');
    }
  } catch (e) {
    console.error('\n   ❌ สร้าง database ใหม่ไม่สำเร็จ: ' + e.message);

    // Fallback: just delete and let npm start recreate
    console.log('\n   💡 ลบ database แล้วสร้างใหม่...');
    try {
      fs.unlinkSync(dbPath);
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
      console.log('   ✅ ลบแล้ว — รัน npm start ได้เลย (ข้อมูลจะหาย แต่ระบบจะสร้างใหม่)');
    } catch (e2) {
      console.log('   ❌ ลบไม่ได้: ' + e2.message);
      console.log('   💡 ลบด้วยมือ: del data\\nucha.db แล้ว npm start');
    }
  }
} else {
  console.log('\n   ❌ ไม่พบข้อมูลที่กู้ได้');
  console.log('   💡 ลบ database แล้วสร้างใหม่:');
  try {
    fs.unlinkSync(dbPath);
    console.log('   ✅ ลบแล้ว — รัน npm start ได้เลย');
  } catch (e) {
    console.log('   💡 ลบด้วยมือ: del data\\nucha.db แล้ว npm start');
  }
}

console.log('\n====================================');
console.log('✅ Repair เสร็จสิ้น — รัน npm start ใหม่ครับ');
