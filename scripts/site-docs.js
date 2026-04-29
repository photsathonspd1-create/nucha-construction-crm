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
    await loginPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
      await tab.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Wait for network to settle (best-effort, don't fail on timeout)
      await tab.waitForNetworkIdle({ timeout: 10000 }).catch(() => {});

      // Wait for loader to hide (if any)
      await tab.evaluate(() => {
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
      }).catch(() => {});

      // Wait for admin content to load (if authenticated page)
      if (page.auth) {
        await tab.waitForSelector('.admin-layout, .sidebar, .page-section', { timeout: 10000 }).catch(() => {});
        // Trigger the target page/tab if hash is present
        if (page.path.includes('#')) {
          const hash = page.path.split('#')[1];
          await tab.evaluate((h) => {
            if (typeof showPage === 'function') showPage(h);
          }, hash).catch(() => {});
        }
        await new Promise(r => setTimeout(r, 2000));
      }

      // Extra settle time for animations and images
      await new Promise(r => setTimeout(r, 2000));

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
  const totalErrors = results.filter(r => r.error).length;

  // Count only VISIBLE items
  const totalButtons = results.reduce((sum, r) => sum + (r.buttons?.filter(b => b.visible !== false).length || 0), 0);
  const totalLinks = results.reduce((sum, r) => sum + (r.links?.filter(l => l.visible !== false).length || 0), 0);
  const totalForms = results.reduce((sum, r) => sum + (r.forms?.length || 0), 0);

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NUCHA INNOVATION — Site Documentation Report</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #f5f5f7; --card: #fff; --header: #1a1a1a; --accent: #D60000;
  --text: #1d1d1f; --muted: #86868b; --border: #e5e5e7;
  --shadow: 0 1px 3px rgba(0,0,0,0.08); --shadow-lg: 0 8px 30px rgba(0,0,0,0.12);
  --radius: 16px; --radius-sm: 10px;
}
html { scroll-behavior: smooth; }
body { font-family: 'Inter', 'Noto Sans Thai', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; -webkit-font-smoothing: antialiased; }

.header { background: var(--header); color: #fff; padding: 56px 40px 48px; position: relative; overflow: hidden; }
.header::after { content: ''; position: absolute; top: 0; right: 0; width: 500px; height: 100%; background: linear-gradient(135deg, transparent, rgba(214,0,0,0.12)); pointer-events: none; }
.header-inner { max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }
.header h1 { font-size: 36px; font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
.header h1 span { color: var(--accent); }
.header .sub { font-size: 16px; color: rgba(255,255,255,0.55); font-weight: 400; }
.header .meta { margin-top: 24px; display: flex; gap: 32px; font-size: 13px; color: rgba(255,255,255,0.45); }
.header .meta strong { color: rgba(255,255,255,0.75); }

.export-btn { position: fixed; top: 24px; right: 24px; z-index: 1000; background: var(--accent); color: #fff; border: none; padding: 14px 28px; border-radius: 50px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 24px rgba(214,0,0,0.35); transition: all 0.2s; font-family: inherit; }
.export-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(214,0,0,0.45); }

.stats { max-width: 1100px; margin: -36px auto 0; padding: 0 40px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; position: relative; z-index: 2; }
.stat { background: var(--card); border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow-lg); text-align: center; }
.stat .num { font-size: 42px; font-weight: 800; color: var(--accent); line-height: 1; }
.stat .label { font-size: 13px; color: var(--muted); margin-top: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

.main { max-width: 1100px; margin: 0 auto; padding: 40px; }

.toc { background: var(--card); border-radius: var(--radius); padding: 32px; margin-bottom: 40px; box-shadow: var(--shadow); }
.toc h2 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
.toc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
.toc a { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--radius-sm); text-decoration: none; color: var(--text); font-size: 15px; font-weight: 500; transition: background 0.15s; }
.toc a:hover { background: #f0f0f2; }
.toc .dot { width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
.toc a.is-admin .dot { background: #007aff; }

.page { background: var(--card); border-radius: var(--radius); margin-bottom: 36px; box-shadow: var(--shadow); overflow: hidden; }
.page-head { padding: 28px 36px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.page-num { width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; flex-shrink: 0; }
.page-title { font-size: 24px; font-weight: 700; }
.page-path { margin-left: auto; background: #f0f0f2; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; color: var(--muted); font-family: 'SF Mono', monospace; }
.auth-tag { background: #ff9500; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.page-desc { padding: 0 36px 20px; font-size: 15px; color: var(--muted); }

.screenshot-area { padding: 0 36px 28px; }
.screenshot-area img { width: 100%; border-radius: var(--radius-sm); box-shadow: var(--shadow-lg); cursor: pointer; transition: transform 0.3s; }
.screenshot-area img:hover { transform: scale(1.01); }

.what-this { padding: 0 36px 28px; }
.what-this h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 14px; font-weight: 700; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.feature { background: #f8f8fa; padding: 14px 18px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 10px; }
.feature .ico { font-size: 20px; }

.nav-pills { display: flex; gap: 8px; flex-wrap: wrap; padding: 0 36px 28px; }
.nav-pill { padding: 8px 18px; border-radius: 24px; font-size: 13px; font-weight: 600; background: #f0f0f2; color: var(--muted); }
.nav-pill.active { background: var(--accent); color: #fff; }

.footer { text-align: center; padding: 48px; color: var(--muted); font-size: 13px; border-top: 1px solid var(--border); margin-top: 48px; }
.footer strong { color: var(--text); }

.lightbox { display: none; position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.92); cursor: zoom-out; align-items: center; justify-content: center; }
.lightbox.show { display: flex; }
.lightbox img { max-width: 92vw; max-height: 92vh; border-radius: var(--radius); box-shadow: 0 24px 80px rgba(0,0,0,0.6); }

@media (max-width: 768px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .header { padding: 36px 20px; }
  .main { padding: 20px; }
  .page-head { padding: 20px; }
  .screenshot-area, .what-this { padding: 0 20px 20px; }
}
@media print {
  .export-btn, .lightbox { display: none !important; }
  body { background: #fff; }
  .header::after { display: none; }
  .page { box-shadow: none; border: 1px solid #ddd; break-inside: avoid; }
  .stat { box-shadow: none; border: 1px solid #ddd; }
  .screenshot-area img { max-height: 350px; object-fit: cover; }
  .main { padding: 16px 20px; }
}
</style>
</head>
<body>

<button class="export-btn" onclick="window.print()">🖨️ Export PDF</button>

<div class="lightbox" id="lb" onclick="this.classList.remove('show')">
  <img id="lb-img" src="">
</div>

<div class="header">
  <div class="header-inner">
    <h1>NUCHA <span>INNOVATION</span></h1>
    <div class="sub">รายงานภาพรวมเว็บไซต์ — ดูครบทุกหน้าในที่เดียว</div>
    <div class="meta">
      <div>📅 <strong>${new Date().toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' })}</strong></div>
      <div>🌐 <strong>${BASE_URL}</strong></div>
      <div>📄 <strong>${totalPages} หน้า</strong></div>
    </div>
  </div>
</div>

<div class="stats">
  <div class="stat"><div class="num">${totalPages}</div><div class="label">หน้าเว็บ</div></div>
  <div class="stat"><div class="num">${totalButtons}</div><div class="label">ปุ่มกด</div></div>
  <div class="stat"><div class="num">${totalLinks}</div><div class="label">ลิงก์</div></div>
  <div class="stat"><div class="num">${totalForms}</div><div class="label">ฟอร์ม</div></div>
</div>

<div class="main">
  <div class="toc">
    <h2>📑 สารบัญ</h2>
    <div class="toc-grid">
      ${results.map((r, i) => `
      <a href="#p-${r.slug}" class="${r.auth ? 'is-admin' : ''}">
        <span class="dot">${i + 1}</span>
        <span>${r.name}</span>
      </a>`).join('')}
    </div>
  </div>

  ${results.map((r, i) => {
    // Build simple feature list based on what's actually on the page
    const features = [];
    const visSections = r.sections?.filter(s => s.visible !== false) || [];
    const visButtons = r.buttons?.filter(b => b.visible !== false) || [];
    const visLinks = r.links?.filter(l => l.visible !== false) || [];

    if (r.stats?.hasLoader) features.push({ ico: '⏳', text: 'หน้าโหลด (Loading Screen)' });
    if (r.stats?.hasCustomCursor) features.push({ ico: '🖱️', text: 'เมาส์แบบพิเศษ' });
    if (r.stats?.hasScrollProgress) features.push({ ico: '📊', text: 'แถบแสดงความคืบหน้า' });
    if (visSections.length > 0) features.push({ ico: '📦', text: visSections.length + ' ส่วนเนื้อหา' });
    if (visButtons.length > 0) features.push({ ico: '🔘', text: visButtons.length + ' ปุ่มกด' });
    if (visLinks.length > 0) features.push({ ico: '🔗', text: visLinks.length + ' ลิงก์' });
    if (r.forms?.length > 0) features.push({ ico: '📝', text: r.forms.length + ' ฟอร์มกรอกข้อมูล' });
    if (r.stats?.totalImages > 0) features.push({ ico: '🖼️', text: r.stats.totalImages + ' รูปภาพ' });
    if (r.stats?.pageHeight > 5000) features.push({ ico: '📏', text: 'หน้ายาว ' + Math.round(r.stats.pageHeight / 1000) + ' เมตร' });

    const nav = r.navigation || [];

    return `
  <div class="page" id="p-${r.slug}">
    <div class="page-head">
      <div class="page-num">${i + 1}</div>
      <div>
        <div class="page-title">${r.name}</div>
      </div>
      ${r.auth ? '<span class="auth-tag">🔒 ต้อง Login</span>' : ''}
      <span class="page-path">${r.path}</span>
    </div>

    ${r.description ? `<div class="page-desc">${r.description}</div>` : ''}

    ${r.error ? `<div style="padding:0 36px 20px;color:#cc0000;font-size:14px">⚠️ เกิดข้อผิดพลาด: ${r.error}</div>` : ''}

    ${r.screenshot ? `
    <div class="screenshot-area">
      <img src="screenshots/${r.screenshot}" alt="${r.name}" onclick="document.getElementById('lb-img').src=this.src;document.getElementById('lb').classList.add('show')">
    </div>` : ''}

    ${features.length > 0 ? `
    <div class="what-this">
      <h3>✨ สิ่งที่มีในหน้านี้</h3>
      <div class="feature-grid">
        ${features.map(f => `<div class="feature"><span class="ico">${f.ico}</span>${f.text}</div>`).join('')}
      </div>
    </div>` : ''}

    ${nav.length > 0 ? `
    <div style="padding:0 36px 8px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;font-weight:700">🧭 เมนูนำทาง</div>
    <div class="nav-pills" style="padding-bottom:28px">
      ${nav.map(n => `<span class="nav-pill ${n.active ? 'active' : ''}">${n.text}</span>`).join('')}
    </div>` : ''}
  </div>`;}).join('')}
</div>

<div class="footer">
  <strong>NUCHA INNOVATION</strong> — รายงานภาพรวมเว็บไซต์<br>
  สร้างเมื่อ ${new Date().toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}
</div>

<script>
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('lb').classList.remove('show'); });
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
