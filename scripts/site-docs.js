#!/usr/bin/env node
// ===== Site Documentation Generator =====
// Crawls the website, screenshots every page, documents all interactive elements
// Usage: node scripts/site-docs.js [--url http://localhost:3000] [--output site-docs]

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ===== CONFIG =====
const args = process.argv.slice(2);
function getArg(name, defaultVal) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const BASE_URL = getArg('url', 'http://localhost:3000');
const OUTPUT_DIR = getArg('output', path.join(__dirname, '..', 'site-docs'));
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');

// Pages to document
const PAGES = [
  { name: 'Landing Page', path: '/', description: 'หน้าแรกเว็บไซต์ — Hero, Services, Portfolio, Testimonials' },
  { name: 'Login Page', path: '/login', description: 'หน้าเข้าสู่ระบบ Admin' },
  { name: 'Admin Dashboard', path: '/admin', description: 'แผงควบคุม CMS — Dashboard, Leads, Pipeline', auth: true },
  { name: 'Admin - Hero Editor', path: '/admin#edit-hero', description: 'แก้ไขส่วน Hero', auth: true },
  { name: 'Admin - Services Editor', path: '/admin#edit-services', description: 'แก้ไขบริการ', auth: true },
  { name: 'Admin - Leads Management', path: '/admin#leads', description: 'จัดการลูกค้าเป้าหมาย', auth: true },
  { name: 'Admin - Reports', path: '/admin#reports', description: 'รายงานสรุป', auth: true },
  { name: 'Admin - Users', path: '/admin#users', description: 'จัดการผู้ใช้', auth: true },
  { name: 'Admin - Media Library', path: '/admin#media', description: 'คลังรูปภาพ', auth: true },
  { name: 'Service Detail Page', path: '/service.html', description: 'หน้ารายละเอียดบริการ' },
];

// ===== HELPERS =====
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ===== MAIN =====
async function main() {
  ensureDir(OUTPUT_DIR);
  ensureDir(SCREENSHOTS_DIR);

  console.log('🚀 Starting Site Documentation Generator...');
  console.log(`   URL: ${BASE_URL}`);
  console.log(`   Output: ${OUTPUT_DIR}`);
  console.log('');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const results = [];

  // Login first for authenticated pages
  const needsAuth = PAGES.some(p => p.auth);
  if (needsAuth) {
    console.log('🔑 Logging in for authenticated pages...');
    const loginPage = await browser.newPage();
    await loginPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
    // Try to fill login form
    try {
      await loginPage.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"], input[name="email"], #email');
        const passInput = document.querySelector('input[type="password"], input[name="password"], #password');
        if (emailInput) emailInput.value = 'admin@nuchainnovation.com';
        if (passInput) passInput.value = 'admin123';
      });
      // Submit login
      const loginResult = await loginPage.evaluate(async () => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@nuchainnovation.com', password: 'admin123' }),
            credentials: 'include'
          });
          return await res.json();
        } catch (e) { return { error: e.message }; }
      });
      console.log(`   🔑 Login: ${loginResult.success ? '✅' : '❌ ' + (loginResult.error || 'failed')}`);
    } catch (e) {
      console.log(`   ⚠️  Login failed: ${e.message}`);
    }
    // Copy cookies to a variable for reuse
    const cookies = await loginPage.cookies();
    await loginPage.close();
    // Store cookies for later use
    browser._authCookies = cookies;
  }

  for (const page of PAGES) {
    const slug = slugify(page.name);
    console.log(`📄 Documenting: ${page.name} (${page.path})`);

    const tab = await browser.newPage();

    // Set auth cookies for authenticated pages
    if (page.auth && browser._authCookies) {
      await tab.setCookie(...browser._authCookies);
    }

    try {
      // Set viewport
      await tab.setViewport({ width: 1440, height: 900 });

      // Navigate
      const url = `${BASE_URL}${page.path}`;
      await tab.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

      // Wait for loader to hide (if any)
      await tab.evaluate(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
      }).catch(() => {});

      // Wait for admin content to load (if authenticated page)
      if (page.auth) {
        await tab.waitForSelector('.admin-layout, .sidebar, .page-section', { timeout: 5000 }).catch(() => {});
        // Trigger the target page/tab if hash is present
        if (page.path.includes('#')) {
          const hash = page.path.split('#')[1];
          await tab.evaluate((h) => {
            if (typeof showPage === 'function') showPage(h);
          }, hash).catch(() => {});
        }
        await new Promise(r => setTimeout(r, 1500));
      }

      await new Promise(r => setTimeout(r, 1000));

      // Take full-page screenshot
      const screenshotPath = path.join(SCREENSHOTS_DIR, `${slug}.png`);
      await tab.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 Screenshot: ${slug}.png`);

      // Extract page info
      const pageInfo = await tab.evaluate(() => {
        const info = {
          title: document.title,
          url: window.location.href,
          sections: [],
          buttons: [],
          links: [],
          forms: [],
          interactiveElements: []
        };

        // === SECTIONS ===
        document.querySelectorAll('section[id], div.page-section[id]').forEach(sec => {
          info.sections.push({
            id: sec.id,
            tag: sec.tagName.toLowerCase(),
            classes: sec.className.split(' ').filter(c => c),
            visible: sec.offsetParent !== null || sec.classList.contains('active'),
            heading: (sec.querySelector('h1, h2, h3') || {}).textContent?.trim() || ''
          });
        });

        // === BUTTONS ===
        document.querySelectorAll('button, .btn, [role="button"], .btn-primary, .btn-outline, .btn-small, .btn-submit, .btn-next, .btn-back').forEach(btn => {
          const text = btn.textContent?.trim().substring(0, 100) || '';
          if (!text && !btn.getAttribute('aria-label')) return;

          const rect = btn.getBoundingClientRect();
          info.buttons.push({
            text: text || btn.getAttribute('aria-label') || '',
            type: btn.type || 'button',
            classes: btn.className.split(' ').filter(c => c).slice(0, 5),
            disabled: btn.disabled || false,
            visible: rect.width > 0 && rect.height > 0,
            position: { x: Math.round(rect.x), y: Math.round(rect.y) },
            size: { w: Math.round(rect.width), h: Math.round(rect.height) },
            onclick: btn.getAttribute('onclick') || '',
            dataAction: btn.dataset.action || '',
            href: btn.href || btn.closest('a')?.href || ''
          });
        });

        // === LINKS ===
        document.querySelectorAll('a[href]').forEach(a => {
          const href = a.getAttribute('href');
          if (!href || href === '#' || href.startsWith('javascript:')) return;

          const rect = a.getBoundingClientRect();
          const text = a.textContent?.trim().substring(0, 100) || '';
          if (!text && !a.querySelector('img') && !a.getAttribute('aria-label')) return;

          info.links.push({
            text: text || a.getAttribute('aria-label') || '[image link]',
            href: href,
            target: a.target || '_self',
            visible: rect.width > 0 && rect.height > 0,
            classes: a.className.split(' ').filter(c => c).slice(0, 5),
            isExternal: href.startsWith('http') && !href.includes(window.location.hostname)
          });
        });

        // === FORMS ===
        document.querySelectorAll('form').forEach(form => {
          const fields = [];
          form.querySelectorAll('input, select, textarea').forEach(input => {
            fields.push({
              type: input.type || input.tagName.toLowerCase(),
              name: input.name || input.id || '',
              placeholder: input.placeholder || '',
              required: input.required || false,
              label: (input.closest('label') || document.querySelector(`label[for="${input.id}"]`))?.textContent?.trim() || ''
            });
          });

          info.forms.push({
            id: form.id || '',
            action: form.action || '',
            method: form.method || 'GET',
            fields: fields
          });
        });

        // === INTERACTIVE ELEMENTS (tabs, accordions, modals, etc.) ===
        // Check for tabs
        document.querySelectorAll('[data-page], [data-tab], [role="tab"]').forEach(el => {
          info.interactiveElements.push({
            type: 'tab',
            text: el.textContent?.trim().substring(0, 50) || '',
            target: el.dataset.page || el.dataset.tab || el.getAttribute('aria-controls') || ''
          });
        });

        // Check for modals
        document.querySelectorAll('.modal, [role="dialog"]').forEach(el => {
          info.interactiveElements.push({
            type: 'modal',
            id: el.id || '',
            classes: el.className.split(' ').filter(c => c).slice(0, 3)
          });
        });

        // Check for accordions / collapsibles
        document.querySelectorAll('[data-toggle], [data-collapse], .accordion-header, summary').forEach(el => {
          info.interactiveElements.push({
            type: 'accordion',
            text: el.textContent?.trim().substring(0, 50) || '',
            target: el.dataset.toggle || el.dataset.collapse || ''
          });
        });

        // Check for hamburger menus
        document.querySelectorAll('.hamburger, .menu-toggle, [aria-expanded]').forEach(el => {
          info.interactiveElements.push({
            type: 'toggle',
            text: el.textContent?.trim().substring(0, 50) || el.getAttribute('aria-label') || 'menu toggle',
            classes: el.className.split(' ').filter(c => c).slice(0, 3)
          });
        });

        // Navigation items
        const navItems = [];
        document.querySelectorAll('.nav-menu a, nav a, .sidebar-link').forEach(a => {
          navItems.push({
            text: a.textContent?.trim().substring(0, 50) || '',
            href: a.getAttribute('href') || a.dataset.page || '',
            active: a.classList.contains('active')
          });
        });
        info.navigation = navItems;

        // Page stats
        info.stats = {
          totalImages: document.querySelectorAll('img').length,
          totalLinks: document.querySelectorAll('a[href]').length,
          totalButtons: document.querySelectorAll('button, .btn, [role="button"]').length,
          totalForms: document.querySelectorAll('form').length,
          totalSections: document.querySelectorAll('section').length,
          pageHeight: document.documentElement.scrollHeight,
          hasLoader: !!document.getElementById('loader'),
          hasCustomCursor: !!document.getElementById('cursor'),
          hasScrollProgress: !!document.getElementById('scrollProgress')
        };

        return info;
      });

      results.push({
        ...page,
        slug,
        screenshot: `${slug}.png`,
        ...pageInfo
      });

    } catch (err) {
      console.log(`   ⚠️  Error: ${err.message}`);
      results.push({
        ...page,
        slug,
        screenshot: `${slug}.png`,
        error: err.message
      });
    }

    await tab.close();
  }

  await browser.close();

  // ===== GENERATE REPORT =====
  console.log('\n📝 Generating report...');

  // Generate JSON data
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'site-data.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );

  // Generate HTML report
  const html = generateHTML(results);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'site-report.html'), html, 'utf8');

  // Generate Markdown summary
  const md = generateMarkdown(results);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'site-report.md'), md, 'utf8');

  console.log(`\n✅ Done! Files generated in: ${OUTPUT_DIR}`);
  console.log(`   📊 site-report.html — Full visual report`);
  console.log(`   📋 site-report.md — Markdown summary`);
  console.log(`   🗂️  site-data.json — Raw data`);
  console.log(`   📸 screenshots/ — Page screenshots`);
}

// ===== HTML REPORT GENERATOR =====
function generateHTML(results) {
  const totalPages = results.length;
  const totalButtons = results.reduce((sum, r) => sum + (r.buttons?.length || 0), 0);
  const totalLinks = results.reduce((sum, r) => sum + (r.links?.length || 0), 0);
  const totalForms = results.reduce((sum, r) => sum + (r.forms?.length || 0), 0);
  const totalErrors = results.filter(r => r.error).length;

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NUCHA INNOVATION — Site Documentation Report</title>
<style>
  :root { --red: #D60000; --bg: #fafafa; --card: #fff; --text: #1a1a1a; --muted: #666; --border: #e5e5e5; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:var(--bg); color:var(--text); line-height:1.6; }
  .header { background: linear-gradient(135deg, #1a1a1a, #333); color:#fff; padding:48px 32px; }
  .header h1 { font-size:2.2rem; margin-bottom:8px; }
  .header p { opacity:0.7; font-size:1rem; }
  .header .meta { margin-top:16px; display:flex; gap:24px; flex-wrap:wrap; font-size:0.85rem; opacity:0.6; }
  .container { max-width:1200px; margin:0 auto; padding:0 24px; }

  /* Stats */
  .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin:-40px auto 32px; position:relative; z-index:1; }
  .stat-card { background:var(--card); border-radius:12px; padding:20px; text-align:center; box-shadow:0 2px 12px rgba(0,0,0,0.06); }
  .stat-card .num { font-size:2rem; font-weight:800; color:var(--red); }
  .stat-card .label { font-size:0.8rem; color:var(--muted); margin-top:4px; }

  /* TOC */
  .toc { background:var(--card); border-radius:12px; padding:24px 32px; margin-bottom:32px; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
  .toc h2 { font-size:1.2rem; margin-bottom:16px; }
  .toc-list { list-style:none; display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:8px; }
  .toc-list a { color:var(--red); text-decoration:none; font-size:0.95rem; display:flex; align-items:center; gap:8px; padding:6px 0; }
  .toc-list a:hover { text-decoration:underline; }
  .toc-list .num { background:var(--red); color:#fff; width:24px; height:24px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; flex-shrink:0; }

  /* Page Section */
  .page-section { background:var(--card); border-radius:16px; margin-bottom:24px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
  .page-header { padding:24px 32px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:16px; }
  .page-header .icon { width:44px; height:44px; background:var(--red); color:#fff; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:800; }
  .page-header h2 { font-size:1.3rem; }
  .page-header p { color:var(--muted); font-size:0.9rem; }
  .page-header .badge { background:#f0f0f0; padding:2px 10px; border-radius:20px; font-size:0.75rem; color:var(--muted); margin-left:auto; }

  .page-body { padding:0; }
  .screenshot-wrap { padding:24px 32px; background:#f8f8f8; }
  .screenshot-wrap img { width:100%; border-radius:8px; box-shadow:0 4px 20px rgba(0,0,0,0.1); cursor:pointer; transition:transform 0.3s; }
  .screenshot-wrap img:hover { transform:scale(1.02); }

  /* Info Grid */
  .info-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:0; }
  .info-block { padding:24px 32px; border-top:1px solid var(--border); }
  .info-block h3 { font-size:0.85rem; text-transform:uppercase; letter-spacing:1px; color:var(--red); margin-bottom:12px; display:flex; align-items:center; gap:8px; }
  .info-block h3 .count { background:var(--red); color:#fff; font-size:0.65rem; padding:2px 8px; border-radius:10px; }

  /* Element Lists */
  .el-list { list-style:none; }
  .el-item { padding:10px 14px; border-radius:8px; margin-bottom:6px; background:#f8f8f8; font-size:0.9rem; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .el-item .tag { font-size:0.7rem; padding:2px 8px; border-radius:4px; font-weight:600; white-space:nowrap; }
  .tag-btn { background:#fff0f0; color:var(--red); }
  .tag-link { background:#f0f0ff; color:#4444cc; }
  .tag-form { background:#f0fff0; color:#228822; }
  .tag-external { background:#fff8f0; color:#cc6600; }
  .tag-disabled { background:#f0f0f0; color:#999; }
  .tag-hidden { background:#f0f0f0; color:#999; text-decoration:line-through; }
  .tag-section { background:#f5f0ff; color:#6633cc; }
  .tag-tab { background:#f0f8ff; color:#0066cc; }
  .tag-nav { background:#f0fff8; color:#006644; }
  .el-dest { color:var(--muted); font-size:0.8rem; margin-left:auto; }
  .el-desc { color:var(--muted); font-size:0.8rem; width:100%; padding-left:4px; }

  /* Error */
  .error-msg { background:#fff5f5; color:#cc0000; padding:16px 24px; border-radius:8px; margin:16px 32px; font-size:0.9rem; }

  /* Footer */
  .footer { text-align:center; padding:40px; color:var(--muted); font-size:0.8rem; }

  /* Lightbox */
  .lightbox { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:9999; cursor:zoom-out; align-items:center; justify-content:center; }
  .lightbox.active { display:flex; }
  .lightbox img { max-width:95vw; max-height:95vh; object-fit:contain; border-radius:8px; }

  @media(max-width:768px) {
    .header { padding:32px 20px; }
    .header h1 { font-size:1.5rem; }
    .info-grid { grid-template-columns:1fr; }
    .stats { grid-template-columns:repeat(2,1fr); }
  }
</style>
</head>
<body>

<div class="header">
  <div class="container">
    <h1>🏗️ NUCHA INNOVATION — Site Documentation</h1>
    <p>รายงานภาพรวมเว็บไซต์ — ทุกหน้า, ทุกองค์ประกอบ, ทุกปุ่ม</p>
    <div class="meta">
      <span>📅 ${new Date().toLocaleString('th-TH')}</span>
      <span>🌐 ${BASE_URL}</span>
      <span>📄 ${totalPages} หน้า</span>
    </div>
  </div>
</div>

<div class="container">
  <div class="stats">
    <div class="stat-card"><div class="num">${totalPages}</div><div class="label">หน้าทั้งหมด</div></div>
    <div class="stat-card"><div class="num">${totalButtons}</div><div class="label">ปุ่ม / Button</div></div>
    <div class="stat-card"><div class="num">${totalLinks}</div><div class="label">ลิงก์ / Link</div></div>
    <div class="stat-card"><div class="num">${totalForms}</div><div class="label">ฟอร์ม / Form</div></div>
    <div class="stat-card"><div class="num">${totalErrors}</div><div class="label">ข้อผิดพลาด</div></div>
  </div>

  <div class="toc">
    <h2>📑 สารบัญ</h2>
    <ul class="toc-list">
      ${results.map((r, i) => `
      <li><a href="#page-${r.slug}"><span class="num">${i + 1}</span>${r.name}</a></li>`).join('')}
    </ul>
  </div>

  ${results.map((r, i) => `
  <div class="page-section" id="page-${r.slug}">
    <div class="page-header">
      <div class="icon">${String(i + 1).padStart(2, '0')}</div>
      <div>
        <h2>${r.name}</h2>
        <p>${r.description || ''}</p>
      </div>
      <span class="badge">${r.path}</span>
    </div>

    ${r.error ? `<div class="error-msg">⚠️ Error: ${r.error}</div>` : ''}

    <div class="page-body">
      ${r.screenshot ? `
      <div class="screenshot-wrap">
        <img src="screenshots/${r.screenshot}" alt="${r.name}" onclick="openLightbox(this.src)">
      </div>` : ''}

      <div class="info-grid">
        ${r.stats ? `
        <div class="info-block">
          <h3>📊 สถิติหน้า</h3>
          <ul class="el-list">
            <li class="el-item"><strong>ความสูงหน้า:</strong> ${r.stats.pageHeight?.toLocaleString() || 0}px</li>
            <li class="el-item"><strong>รูปภาพ:</strong> ${r.stats.totalImages || 0} รูป</li>
            <li class="el-item"><strong>Sections:</strong> ${r.stats.totalSections || 0} ส่วน</li>
            <li class="el-item"><strong>Custom Cursor:</strong> ${r.stats.hasCustomCursor ? '✅ มี' : '❌ ไม่มี'}</li>
            <li class="el-item"><strong>Scroll Progress:</strong> ${r.stats.hasScrollProgress ? '✅ มี' : '❌ ไม่มี'}</li>
            <li class="el-item"><strong>Loading Screen:</strong> ${r.stats.hasLoader ? '✅ มี' : '❌ ไม่มี'}</li>
          </ul>
        </div>` : ''}

        ${r.sections?.length ? `
        <div class="info-block">
          <h3>📦 Sections <span class="count">${r.sections.length}</span></h3>
          <ul class="el-list">
            ${r.sections.map(s => `
            <li class="el-item">
              <span class="tag tag-section">&lt;${s.tag}&gt;</span>
              <strong>${s.heading || s.id || '(no heading)'}</strong>
              ${s.id ? `<span class="el-dest">#${s.id}</span>` : ''}
              ${!s.visible ? '<span class="tag tag-hidden">ซ่อน</span>' : ''}
            </li>`).join('')}
          </ul>
        </div>` : ''}

        ${r.navigation?.length ? `
        <div class="info-block">
          <h3>🧭 Navigation <span class="count">${r.navigation.length}</span></h3>
          <ul class="el-list">
            ${r.navigation.map(n => `
            <li class="el-item">
              <span class="tag tag-nav">nav</span>
              <strong>${n.text || '(empty)'}</strong>
              ${n.href ? `<span class="el-dest">→ ${n.href}</span>` : ''}
              ${n.active ? '<span class="tag tag-btn" style="background:#e8ffe8;color:#228822">active</span>' : ''}
            </li>`).join('')}
          </ul>
        </div>` : ''}

        ${r.buttons?.length ? `
        <div class="info-block">
          <h3>🔘 ปุ่ม (Buttons) <span class="count">${r.buttons.length}</span></h3>
          <ul class="el-list">
            ${r.buttons.map(b => `
            <li class="el-item">
              <span class="tag tag-btn">btn</span>
              <strong>${b.text || '(no text)'}</strong>
              ${b.disabled ? '<span class="tag tag-disabled">disabled</span>' : ''}
              ${!b.visible ? '<span class="tag tag-hidden">ซ่อน</span>' : ''}
              ${b.href ? `<span class="el-dest">→ ${b.href}</span>` : ''}
              ${b.onclick ? `<span class="el-desc">onclick: ${b.onclick.substring(0, 80)}</span>` : ''}
              ${b.dataAction ? `<span class="el-desc">action: ${b.dataAction}</span>` : ''}
            </li>`).join('')}
          </ul>
        </div>` : ''}

        ${r.links?.length ? `
        <div class="info-block">
          <h3>🔗 ลิงก์ (Links) <span class="count">${r.links.length}</span></h3>
          <ul class="el-list">
            ${r.links.map(l => `
            <li class="el-item">
              <span class="tag ${l.isExternal ? 'tag-external' : 'tag-link'}">${l.isExternal ? 'external' : 'link'}</span>
              <strong>${l.text || '(no text)'}</strong>
              ${l.target === '_blank' ? '<span class="tag tag-external">new tab</span>' : ''}
              ${!l.visible ? '<span class="tag tag-hidden">ซ่อน</span>' : ''}
              <span class="el-dest">→ ${l.href}</span>
            </li>`).join('')}
          </ul>
        </div>` : ''}

        ${r.forms?.length ? `
        <div class="info-block">
          <h3>📝 ฟอร์ม (Forms) <span class="count">${r.forms.length}</span></h3>
          ${r.forms.map(f => `
          <ul class="el-list">
            ${f.id ? `<li class="el-item"><strong>Form ID:</strong> ${f.id} <span class="el-dest">${f.method} ${f.action || '(same page)'}</span></li>` : ''}
            ${f.fields.map(field => `
            <li class="el-item">
              <span class="tag tag-form">${field.type}</span>
              <strong>${field.label || field.name || field.placeholder || '(unnamed)'}</strong>
              ${field.required ? '<span class="tag tag-btn" style="background:#fff0f0">required</span>' : ''}
              ${field.placeholder ? `<span class="el-desc">placeholder: "${field.placeholder}"</span>` : ''}
            </li>`).join('')}
          </ul>`).join('')}
        </div>` : ''}

        ${r.interactiveElements?.length ? `
        <div class="info-block">
          <h3>⚡ องค์ประกอบ Interactive <span class="count">${r.interactiveElements.length}</span></h3>
          <ul class="el-list">
            ${r.interactiveElements.map(el => `
            <li class="el-item">
              <span class="tag tag-tab">${el.type}</span>
              <strong>${el.text || el.id || '(unnamed)'}</strong>
              ${el.target ? `<span class="el-dest">→ ${el.target}</span>` : ''}
            </li>`).join('')}
          </ul>
        </div>` : ''}
      </div>
    </div>
  </div>`).join('')}

  <div class="footer">
    <p>🏗️ NUCHA INNOVATION — Site Documentation Report</p>
    <p>Generated on ${new Date().toLocaleString('th-TH')} by site-docs.js</p>
  </div>
</div>

<div class="lightbox" id="lightbox" onclick="this.classList.remove('active')">
  <img id="lightbox-img" src="" alt="Screenshot">
</div>

<script>
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('active');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('lightbox').classList.remove('active');
});
</script>

</body>
</html>`;
}

// ===== MARKDOWN REPORT =====
function generateMarkdown(results) {
  let md = `# 🏗️ NUCHA INNOVATION — Site Documentation\n\n`;
  md += `**Generated:** ${new Date().toLocaleString('th-TH')}\n`;
  md += `**URL:** ${BASE_URL}\n`;
  md += `**Pages:** ${results.length}\n\n`;
  md += `---\n\n`;
  md += `## 📑 Table of Contents\n\n`;
  results.forEach((r, i) => {
    md += `${i + 1}. [${r.name}](#${r.slug}) — ${r.path}\n`;
  });
  md += `\n---\n\n`;

  results.forEach((r, i) => {
    md += `## ${i + 1}. ${r.name}\n\n`;
    md += `**Path:** \`${r.path}\`\n`;
    md += `**Description:** ${r.description || '-'}\n\n`;

    if (r.error) {
      md += `> ⚠️ **Error:** ${r.error}\n\n`;
    }

    if (r.screenshot) {
      md += `![${r.name}](screenshots/${r.screenshot})\n\n`;
    }

    if (r.stats) {
      md += `### 📊 Page Stats\n\n`;
      md += `| Metric | Value |\n|--------|-------|\n`;
      md += `| Height | ${r.stats.pageHeight?.toLocaleString() || 0}px |\n`;
      md += `| Images | ${r.stats.totalImages || 0} |\n`;
      md += `| Sections | ${r.stats.totalSections || 0} |\n`;
      md += `| Custom Cursor | ${r.stats.hasCustomCursor ? '✅' : '❌'} |\n`;
      md += `| Scroll Progress | ${r.stats.hasScrollProgress ? '✅' : '❌'} |\n\n`;
    }

    if (r.sections?.length) {
      md += `### 📦 Sections (${r.sections.length})\n\n`;
      r.sections.forEach(s => {
        md += `- \`<${s.tag}>\` **${s.heading || s.id || '(no heading)'}**${s.id ? ` (#${s.id})` : ''}${!s.visible ? ' *(hidden)*' : ''}\n`;
      });
      md += `\n`;
    }

    if (r.navigation?.length) {
      md += `### 🧭 Navigation (${r.navigation.length})\n\n`;
      r.navigation.forEach(n => {
        md += `- **${n.text}** → \`${n.href || '-'}\`${n.active ? ' *(active)*' : ''}\n`;
      });
      md += `\n`;
    }

    if (r.buttons?.length) {
      md += `### 🔘 Buttons (${r.buttons.length})\n\n`;
      r.buttons.forEach(b => {
        md += `- **${b.text || '(no text)'}**`;
        if (b.href) md += ` → \`${b.href}\``;
        if (b.disabled) md += ` *(disabled)*`;
        if (!b.visible) md += ` *(hidden)*`;
        if (b.onclick) md += ` onclick: \`${b.onclick.substring(0, 60)}\``;
        md += `\n`;
      });
      md += `\n`;
    }

    if (r.links?.length) {
      md += `### 🔗 Links (${r.links.length})\n\n`;
      r.links.forEach(l => {
        md += `- **${l.text || '(no text)'}** → \`${l.href}\`${l.isExternal ? ' *(external)*' : ''}${l.target === '_blank' ? ' *(new tab)*' : ''}\n`;
      });
      md += `\n`;
    }

    if (r.forms?.length) {
      md += `### 📝 Forms (${r.forms.length})\n\n`;
      r.forms.forEach(f => {
        md += `**Form${f.id ? ` #${f.id}` : ''}** (${f.method} ${f.action || 'same page'})\n\n`;
        f.fields.forEach(field => {
          md += `- \`${field.type}\` **${field.label || field.name || field.placeholder || '(unnamed)'}**${field.required ? ' *(required)*' : ''}\n`;
        });
        md += `\n`;
      });
    }

    if (r.interactiveElements?.length) {
      md += `### ⚡ Interactive Elements (${r.interactiveElements.length})\n\n`;
      r.interactiveElements.forEach(el => {
        md += `- \`${el.type}\` **${el.text || el.id || '(unnamed)'}**${el.target ? ` → \`${el.target}\`` : ''}\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

// ===== RUN =====
main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
