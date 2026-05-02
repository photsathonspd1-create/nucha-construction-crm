#!/usr/bin/env node
// ===== Database Repair Script =====
// Usage: node scripts/repair-db.js
// Fixes "database disk image is malformed" errors

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dbPath = path.join(__dirname, '..', 'data', 'nucha.db');

if (!fs.existsSync(dbPath)) {
  console.log('❌ ไม่พบ data/nucha.db — ไม่ต้อง repair ครับ (จะสร้างใหม่ตอน npm start)');
  process.exit(0);
}

const corruptedPath = dbPath + '.corrupted';
const dumpPath = path.join(__dirname, '..', 'data', 'nucha_dump.sql');
const newPath = dbPath + '.recovered';

console.log('🔧 NUCHA CRM — Database Repair Tool');
console.log('====================================\n');

// Step 1: Backup corrupted file
console.log('📦 Step 1: Backup corrupted database...');
fs.copyFileSync(dbPath, corruptedPath);
console.log('   ✅ Backup → data/nucha.db.corrupted\n');

// Step 2: Try to dump recoverable data
console.log('🔍 Step 2: Scanning for recoverable data...');
let dump = '';
let totalRows = 0;
let failedTables = [];

try {
  const db = new Database(dbPath, { fileMustExist: true, readonly: true });

  // Get all tables
  const tables = db.prepare(
    "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all();

  console.log(`   📋 พบ ${tables.length} ตาราง\n`);

  for (const table of tables) {
    try {
      const rows = db.prepare(`SELECT * FROM "${table.name}"`).all();
      const count = rows.length;
      totalRows += count;

      // Add CREATE TABLE
      if (table.sql) {
        dump += table.sql + ';\n\n';
      }

      // Add data
      if (count > 0) {
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

      console.log(`   ✅ ${table.name}: ${count} rows`);
    } catch (e) {
      failedTables.push(table.name);
      console.log(`   ⚠️  ${table.name}: ${e.message.substring(0, 60)}...`);

      // Try row-by-row recovery for failed tables
      try {
        const tableInfo = db.prepare(`PRAGMA table_info("${table.name}")`).all();
        const colNames = tableInfo.map(c => c.name);
        if (table.sql) dump += table.sql + ';\n\n';

        let recovered = 0;
        // Try to get rowids and fetch one by one
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
            } catch (_) { /* skip corrupted row */ }
          }
        } catch (_) { /* table completely unreadable */ }

        if (recovered > 0) {
          dump += '\n';
          console.log(`   🔄 ${table.name}: กู้คืนได้ ${recovered} rows (partial)`);
        } else {
          console.log(`   ❌ ${table.name}: กู้คืนไม่ได้`);
        }
      } catch (_) {
        console.log(`   ❌ ${table.name}: กู้คืนไม่ได้`);
      }
    }
  }

  db.close();
} catch (e) {
  console.log('\n   ❌ ไม่สามารถเปิด database ได้: ' + e.message);
  console.log('   💡 จะสร้าง database ใหม่ทั้งหมด\n');
}

// Step 3: Create new database from dump
if (dump.length > 100) {
  console.log(`\n📊 พบข้อมูลที่กู้ได้: ${totalRows} rows`);
  console.log('🔨 Step 3: สร้าง database ใหม่...');

  try {
    // Save dump
    fs.writeFileSync(dumpPath, dump, 'utf8');
    console.log('   ✅ บันทึก dump → data/nucha_dump.sql');

    // Create new DB
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    const newDb = new Database(newPath);
    newDb.pragma('journal_mode = WAL');
    newDb.exec(dump);
    newDb.close();
    console.log('   ✅ สร้าง database ใหม่สำเร็จ');

    // Replace
    fs.renameSync(dbPath, corruptedPath);
    fs.renameSync(newPath, dbPath);
    console.log('   ✅ แทนที่ database เดิมแล้ว');

    if (failedTables.length > 0) {
      console.log(`\n   ⚠️  ตารางที่กู้ไม่ได้: ${failedTables.join(', ')}`);
      console.log('   💡 ตารางเหล่านี้จะถูกสร้างใหม่ตอน npm start (migrations)');
    }
  } catch (e) {
    console.error('\n   ❌ สร้าง database ใหม่ไม่สำเร็จ: ' + e.message);
    console.log('\n   💡 วิธีแก้: ลบ data/nucha.db แล้วรัน npm start ใหม่');
    console.log('      del data\\nucha.db');
    console.log('      npm start');
    process.exit(1);
  }
} else {
  console.log('\n   ❌ ไม่พบข้อมูลที่กู้ได้');
  console.log('   💡 ลบ database แล้วสร้างใหม่:');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('\   ต้องการลบ data/nucha.db แล้วเริ่มใหม่? (y/N): ', answer => {
    rl.close();
    if (answer.toLowerCase() === 'y') {
      fs.unlinkSync(dbPath);
      console.log('\n   ✅ ลบแล้ว — รัน npm start ได้เลยครับ');
    } else {
      console.log('\n   💡 ลบด้วยมือ: del data\\nucha.db แล้ว npm start');
    }
  });
}

console.log('\n====================================');
console.log('✅ Repair เสร็จสิ้น — ลองรัน npm start ใหม่ครับ');
console.log('   npm start');
