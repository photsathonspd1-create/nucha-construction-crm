// ============================================
// NUCHA CRM — Admin CMS (No Supabase needed)
// ============================================

let allContent = {};
let allLeads = [];
let allNav = [];

// ===== INIT =====
(async () => {
  try {
    const me = await api('/api/auth/me');
    document.getElementById('userName').textContent = me.full_name || 'Admin';
  } catch {
    window.location.href = '/login';
    return;
  }
  await loadAll();
  renderDashboard();
  renderAllForms();
})();

async function loadAll() {
  const [content, leadsRes, nav] = await Promise.all([
    api('/api/content'),
    api('/api/leads'),
    api('/api/nav')
  ]);
  allContent = content;
  allLeads = leadsRes.data || leadsRes; // extract .data array
  allNav = nav;
}

// ===== API HELPER =====
async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    cache: 'no-store',
    ...opts
  });
  if (res.status === 401) { window.location.href = '/login'; throw new Error('Unauthorized'); }
  if (res.status === 304) {
    // 304 has no body — re-fetch without cache
    const retry = await fetch(url, { ...opts, cache: 'no-store', headers: { 'Content-Type': 'application/json', ...opts.headers } });
    if (!retry.ok) throw new Error('API Error');
    return retry.json();
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
}

// ===== TOAST =====
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ===== PAGE NAVIGATION =====
function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + pageId)?.classList.add('active');
  document.querySelector(`.sidebar-link[data-page="${pageId}"]`)?.classList.add('active');
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  // Refresh data on page change
  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'leads') renderLeads();
  if (pageId === 'bookings') renderBookings();
  if (pageId === 'media') renderMedia();
  if (pageId === 'reports') renderReports();
  if (pageId === 'users') renderUsers();
  if (pageId === 'site-docs') checkSiteDocs();
  if (pageId === 'chatbot') renderChatbotForm();
}

// ===== LOGOUT =====
async function logout() {
  await api('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
}

// ===== DASHBOARD =====
async function renderDashboard() {
  try {
    const stats = await api('/api/stats');
    const pipeline = await api('/api/pipeline');
    const bookings = allLeads.filter(l => l.appointment_date).sort((a, b) => a.appointment_date.localeCompare(b.appointment_date)).slice(0, 5);

    document.getElementById('dashStats').innerHTML = `
      <div class="stat-card"><div class="label">Leads ทั้งหมด</div><div class="value">${esc(String(stats.totalLeads))}</div></div>
      <div class="stat-card"><div class="label">ปิดดีลสำเร็จ</div><div class="value green">${esc(String(stats.closedDeals))}</div></div>
      <div class="stat-card"><div class="label">นัดวันนี้</div><div class="value">${esc(String(stats.todayAppts))}</div></div>
      <div class="stat-card"><div class="label">Lead ใหม่</div><div class="value red">${esc(String(stats.newLeads))}</div></div>
    `;

    const colors = { 'New Lead': '#3b82f6', 'Contacted': '#eab308', 'Appointment Set': '#16a34a', 'Proposal Sent': '#8b5cf6', 'Closed Won': '#22c55e', 'Closed Lost': '#ef4444' };
    document.getElementById('dashPipeline').innerHTML = pipeline.map(p => `
      <div class="pipeline-bar">
        <div class="pipeline-dot" style="background:${colors[p.stage] || '#999'}"></div>
        <div class="pipeline-name">${esc(p.stage)}</div>
        <div class="pipeline-count">${esc(String(p.count))}</div>
      </div>
    `).join('');

    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    document.getElementById('dashRecentBookings').innerHTML = bookings.length ? bookings.map(b => {
      const d = new Date(b.appointment_date);
      return `<div class="booking-item">
        <div class="booking-date">${d.getDate()} ${months[d.getMonth()]}</div>
        <div><div class="booking-name">${esc(b.name)}</div><div class="booking-service">${esc(b.service_type)} · ${esc(b.appointment_time || '')}</div></div>
      </div>`;
    }).join('') : '<p style="color:var(--gray-400);font-size:0.85rem">ยังไม่มีนัดหมาย</p>';

    document.getElementById('leadsCount').textContent = allLeads.length;
    document.getElementById('bookingsCount').textContent = allLeads.filter(l => l.appointment_date).length;
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

// ===== RENDER ALL CMS FORMS =====
function renderAllForms() {
  renderSiteConfigForm();
  renderHeroForm();
  renderServicesForm();
  renderProcessForm();
  renderPortfolioForm();
  renderTestimonialsForm();
  renderClosingForm();
  renderFooterForm();
  renderNavForm();
  renderNotificationsForm();
  renderLeads();
  renderBookings();
  renderChatbotForm();
}

// ===== SITE CONFIG FORM =====
function renderSiteConfigForm() {
  const c = allContent.site_config || {};
  document.getElementById('siteConfigForm').innerHTML = `
    <div class="form-section">
      <h3>🏷️ ข้อมูลเว็บไซต์</h3>
      <div class="form-row">
        <div class="form-group"><label>ชื่อเว็บ</label><input type="text" id="sc_site_name" value="${esc(c.site_name || '')}"></div>
        <div class="form-group"><label>Tagline</label><input type="text" id="sc_site_tagline" value="${esc(c.site_tagline || '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Logo Text (ตัวอักษร — ใช้ถ้าไม่มีรูป)</label><input type="text" id="sc_logo_text" value="${esc(c.logo_text || '')}"></div>
        <div class="form-group"><label>Logo Full (ใช้ \\n ขึ้นบรรทัดใหม่)</label><input type="text" id="sc_logo_full" value="${esc(c.logo_full || '')}"></div>
      </div>
      ${imageField('sc_logo_url', c.logo_url, 'Logo Image (ถ้ามีรูปจะใช้รูปแทนตัวอักษร)')}
      ${imageField('sc_favicon', c.favicon, 'Favicon URL')}
    </div>
    <div class="form-section">
      <h3>📞 ข้อมูลติดต่อ</h3>
      <div class="form-row">
        <div class="form-group"><label>เบอร์โทร</label><input type="text" id="sc_phone" value="${esc(c.phone || '')}"></div>
        <div class="form-group"><label>Email</label><input type="text" id="sc_email" value="${esc(c.email || '')}"></div>
      </div>
      <div class="form-group"><label>ที่อยู่</label><input type="text" id="sc_address" value="${esc(c.address || '')}"></div>
      <div class="form-group"><label>LINE ID</label><input type="text" id="sc_line_id" value="${esc(c.line_id || '')}"></div>
    </div>
    <div class="form-section">
      <h3>🔗 Social Media</h3>
      <div class="form-row">
        <div class="form-group"><label>Facebook URL</label><input type="text" id="sc_facebook" value="${esc(c.facebook_url || '')}"></div>
        <div class="form-group"><label>Instagram URL</label><input type="text" id="sc_instagram" value="${esc(c.instagram_url || '')}"></div>
      </div>
      <div class="form-group"><label>Copyright</label><input type="text" id="sc_copyright" value="${esc(c.copyright || '')}"></div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" onclick="saveSiteConfig()">💾 บันทึก</button>
    </div>
  `;
}

async function saveSiteConfig() {
  const data = {
    site_name: gv('sc_site_name'), site_tagline: gv('sc_site_tagline'),
    logo_text: gv('sc_logo_text'), logo_full: gv('sc_logo_full'),
    logo_url: getImageValue('sc_logo_url'),
    phone: gv('sc_phone'), email: gv('sc_email'), address: gv('sc_address'),
    line_id: gv('sc_line_id'), facebook_url: gv('sc_facebook'),
    instagram_url: gv('sc_instagram'), copyright: gv('sc_copyright'),
    favicon: gv('sc_favicon')
  };
  await api('/api/content/site_config', { method: 'PUT', body: JSON.stringify(data) });
  allContent.site_config = data;
  toast('✅ บันทึกข้อมูลเว็บไซต์สำเร็จ');
}

// ===== HERO FORM =====
function renderHeroForm() {
  const h = allContent.hero || {};
  document.getElementById('heroForm').innerHTML = `
    <div class="form-section">
      <h3>🏠 Hero Section</h3>
      <div class="form-group"><label>Badge Text</label><input type="text" id="h_badge" value="${esc(h.badge || '')}"></div>
      <div class="form-row">
        <div class="form-group"><label>Title บรรทัด 1</label><input type="text" id="h_title1" value="${esc(h.title_line1 || '')}"></div>
        <div class="form-group"><label>Title บรรทัด 2 (สี accent)</label><input type="text" id="h_title2" value="${esc(h.title_line2 || '')}"></div>
      </div>
      <div class="form-group"><label>Subtitle</label><input type="text" id="h_subtitle" value="${esc(h.subtitle || '')}"></div>
      <div class="form-group"><label>Description</label><textarea id="h_desc">${esc(h.description || '')}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>CTA ปุ่มหลัก</label><input type="text" id="h_cta1" value="${esc(h.cta_primary || '')}"></div>
        <div class="form-group"><label>CTA ปุ่มรอง</label><input type="text" id="h_cta2" value="${esc(h.cta_secondary || '')}"></div>
      </div>
      ${imageField('h_image', h.image_url, 'รูป Hero')}
    </div>
    <div class="form-section">
      <h3>📊 สถิติ Hero</h3>
      <div class="form-row">
        <div class="form-group"><label>สถิติ 1 ตัวเลข</label><input type="text" id="h_s1n" value="${esc(h.stat1_number || '')}"></div>
        <div class="form-group"><label>สถิติ 1 ป้าย</label><input type="text" id="h_s1l" value="${esc(h.stat1_label || '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>สถิติ 2 ตัวเลข</label><input type="text" id="h_s2n" value="${esc(h.stat2_number || '')}"></div>
        <div class="form-group"><label>สถิติ 2 ป้าย</label><input type="text" id="h_s2l" value="${esc(h.stat2_label || '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>สถิติ 3 ตัวเลข</label><input type="text" id="h_s3n" value="${esc(h.stat3_number || '')}"></div>
        <div class="form-group"><label>สถิติ 3 ป้าย</label><input type="text" id="h_s3l" value="${esc(h.stat3_label || '')}"></div>
      </div>
    </div>
    <div class="form-section">
      <h3>🃏 Float Card</h3>
      <div class="form-row">
        <div class="form-group"><label>Title</label><input type="text" id="h_ft" value="${esc(h.float_title || '')}"></div>
        <div class="form-group"><label>Description</label><input type="text" id="h_fd" value="${esc(h.float_desc || '')}"></div>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" onclick="saveHero()">💾 บันทึก</button>
    </div>
  `;
}

async function saveHero() {
  const data = {
    badge: gv('h_badge'), title_line1: gv('h_title1'), title_line2: gv('h_title2'),
    subtitle: gv('h_subtitle'), description: gv('h_desc'),
    cta_primary: gv('h_cta1'), cta_secondary: gv('h_cta2'),
    image_url: gv('h_image'),
    stat1_number: gv('h_s1n'), stat1_label: gv('h_s1l'),
    stat2_number: gv('h_s2n'), stat2_label: gv('h_s2l'),
    stat3_number: gv('h_s3n'), stat3_label: gv('h_s3l'),
    float_title: gv('h_ft'), float_desc: gv('h_fd')
  };
  await api('/api/content/hero', { method: 'PUT', body: JSON.stringify(data) });
  allContent.hero = data;
  toast('✅ บันทึก Hero สำเร็จ');
}

// ===== SERVICES FORM =====
function renderServicesForm() {
  const s = allContent.services || {};
  const items = s.items || [];
  document.getElementById('servicesForm').innerHTML = `
    <div class="form-section">
      <h3>📝 หัวข้อบริการ</h3>
      <div class="form-group"><label>Section Tag</label><input type="text" id="sv_tag" value="${esc(s.section_tag || '')}"></div>
      <div class="form-group"><label>Section Title</label><input type="text" id="sv_title" value="${esc(s.section_title || '')}"></div>
      <div class="form-group"><label>Section Description</label><textarea id="sv_desc">${esc(s.section_desc || '')}</textarea></div>
    </div>
    <div class="form-section">
      <h3>📋 รายการบริการ</h3>
      <div id="servicesItemsList">
        ${items.map((item, i) => `
          <div class="repeatable-header" onclick="toggleRepeatable(this)">
            <h4>${item.icon || '🔧'} ${esc(item.name || 'บริการ ' + (i + 1))}</h4>
            <span class="toggle">▼</span>
          </div>
          <div class="repeatable-body">
            <div class="form-row">
              <div class="form-group"><label>ไอคอน (emoji)</label><input type="text" class="sv-item-icon" value="${esc(item.icon || '')}"></div>
              <div class="form-group"><label>ชื่อบริการ</label><input type="text" class="sv-item-name" value="${esc(item.name || '')}"></div>
            </div>
            <div class="form-group"><label>รายละเอียด</label><textarea class="sv-item-desc">${esc(item.desc || '')}</textarea></div>
            <div class="form-row">
              <div class="form-group"><label>งบประมาณ</label><input type="text" class="sv-item-budget" value="${esc(item.budget || '')}"></div>
              <div class="form-group"><label>Key (ภาษาอังกฤษ)</label><input type="text" class="sv-item-key" value="${esc(item.key || '')}"></div>
            </div>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addServiceItem()" style="margin-top:12px">+ เพิ่มบริการ</button>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" onclick="saveServices()">💾 บันทึก</button>
    </div>
  `;
}

function addServiceItem() {
  const list = document.getElementById('servicesItemsList');
  const html = `
    <div class="repeatable-header" onclick="toggleRepeatable(this)"><h4>🔧 บริการใหม่</h4><span class="toggle">▼</span></div>
    <div class="repeatable-body open">
      <div class="form-row">
        <div class="form-group"><label>ไอคอน (emoji)</label><input type="text" class="sv-item-icon" value="🔧"></div>
        <div class="form-group"><label>ชื่อบริการ</label><input type="text" class="sv-item-name" value=""></div>
      </div>
      <div class="form-group"><label>รายละเอียด</label><textarea class="sv-item-desc"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>งบประมาณ</label><input type="text" class="sv-item-budget" value=""></div>
        <div class="form-group"><label>Key</label><input type="text" class="sv-item-key" value=""></div>
      </div>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
    </div>
  `;
  list.insertAdjacentHTML('beforeend', html);
}

async function saveServices() {
  const items = [];
  document.querySelectorAll('.sv-item-name').forEach((el, i) => {
    items.push({
      icon: document.querySelectorAll('.sv-item-icon')[i]?.value || '🔧',
      name: el.value,
      desc: document.querySelectorAll('.sv-item-desc')[i]?.value || '',
      budget: document.querySelectorAll('.sv-item-budget')[i]?.value || '',
      key: document.querySelectorAll('.sv-item-key')[i]?.value || ''
    });
  });
  const data = { section_tag: gv('sv_tag'), section_title: gv('sv_title'), section_desc: gv('sv_desc'), items };
  await api('/api/content/services', { method: 'PUT', body: JSON.stringify(data) });
  allContent.services = data;
  toast('✅ บันทึกบริการสำเร็จ');
}

// ===== PROCESS FORM =====
function renderProcessForm() {
  const p = allContent.process || {};
  const steps = p.steps || [];
  document.getElementById('processForm').innerHTML = `
    <div class="form-section">
      <h3>📝 หัวข้อกระบวนการ</h3>
      <div class="form-group"><label>Section Title (ใช้ \\n ขึ้นบรรทัดใหม่)</label><input type="text" id="pr_title" value="${esc(p.section_title || '')}"></div>
    </div>
    <div class="form-section">
      <h3>📋 ขั้นตอน</h3>
      <div id="processStepsList">
        ${steps.map((step, i) => `
          <div class="repeatable-header" onclick="toggleRepeatable(this)"><h4>${esc(step.tag || 'STEP ' + (i + 1))}</h4><span class="toggle">▼</span></div>
          <div class="repeatable-body">
            <div class="form-row">
              <div class="form-group"><label>Tag</label><input type="text" class="pr-step-tag" value="${esc(step.tag || '')}"></div>
              <div class="form-group"><label>Title (ใช้ \\n ขึ้นบรรทัดใหม่)</label><input type="text" class="pr-step-title" value="${esc(step.title || '')}"></div>
            </div>
            <div class="form-group"><label>Description</label><textarea class="pr-step-desc">${esc(step.desc || '')}</textarea></div>
            ${imageField('pr-step-img-' + i, step.image, 'รูปขั้นตอน')}
            <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addProcessStep()" style="margin-top:12px">+ เพิ่มขั้นตอน</button>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" onclick="saveProcess()">💾 บันทึก</button>
    </div>
  `;
}

function addProcessStep() {
  const list = document.getElementById('processStepsList');
  const i = document.querySelectorAll('.pr-step-tag').length;
  list.insertAdjacentHTML('beforeend', `
    <div class="repeatable-header" onclick="toggleRepeatable(this)"><h4>STEP ใหม่</h4><span class="toggle">▼</span></div>
    <div class="repeatable-body open">
      <div class="form-row">
        <div class="form-group"><label>Tag</label><input type="text" class="pr-step-tag" value=""></div>
        <div class="form-group"><label>Title</label><input type="text" class="pr-step-title" value=""></div>
      </div>
      <div class="form-group"><label>Description</label><textarea class="pr-step-desc"></textarea></div>
      ${imageField('pr-step-img-' + i, '', 'รูปขั้นตอน')}
      <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
    </div>
  `);
}

async function saveProcess() {
  const steps = [];
  document.querySelectorAll('.pr-step-tag').forEach((el, i) => {
    steps.push({
      tag: el.value,
      title: document.querySelectorAll('.pr-step-title')[i]?.value || '',
      desc: document.querySelectorAll('.pr-step-desc')[i]?.value || '',
      image: getImageValue('pr-step-img-' + i)
    });
  });
  const data = { section_title: gv('pr_title'), steps };
  await api('/api/content/process', { method: 'PUT', body: JSON.stringify(data) });
  allContent.process = data;
  toast('✅ บันทึกกระบวนการสำเร็จ');
}

// ===== PORTFOLIO FORM =====
function renderPortfolioForm() {
  const p = allContent.portfolio || {};
  const items = p.items || [];
  document.getElementById('portfolioForm').innerHTML = `
    <div class="form-section">
      <h3>📝 หัวข้อผลงาน</h3>
      <div class="form-row">
        <div class="form-group"><label>Section Tag</label><input type="text" id="pf_tag" value="${esc(p.section_tag || '')}"></div>
        <div class="form-group"><label>Section Title</label><input type="text" id="pf_title" value="${esc(p.section_title || '')}"></div>
      </div>
      <div class="form-group"><label>Section Description</label><textarea id="pf_desc">${esc(p.section_desc || '')}</textarea></div>
    </div>
    <div class="form-section">
      <h3>🖼️ ผลงาน</h3>
      <div id="portfolioItemsList">
        ${items.map((item, i) => `
          <div class="repeatable-header" onclick="toggleRepeatable(this)"><h4>${esc(item.title || 'ผลงาน ' + (i + 1))}</h4><span class="toggle">▼</span></div>
          <div class="repeatable-body">
            ${imageField('pf-item-img-' + i, item.image, 'รูปผลงาน')}
            <div class="form-row">
              <div class="form-group"><label>Tag</label><input type="text" class="pf-item-tag" value="${esc(item.tag || '')}"></div>
              <div class="form-group"><label>Title</label><input type="text" class="pf-item-title" value="${esc(item.title || '')}"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Description</label><input type="text" class="pf-item-desc" value="${esc(item.desc || '')}"></div>
              <div class="form-group"><label>Size</label><select class="pf-item-size"><option value="normal" ${item.size !== 'large' ? 'selected' : ''}>ปกติ</option><option value="large" ${item.size === 'large' ? 'selected' : ''}>ใหญ่</option></select></div>
            </div>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addPortfolioItem()" style="margin-top:12px">+ เพิ่มผลงาน</button>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" onclick="savePortfolio()">💾 บันทึก</button>
    </div>
  `;
}

function addPortfolioItem() {
  const list = document.getElementById('portfolioItemsList');
  const i = document.querySelectorAll('.pf-item-tag').length;
  list.insertAdjacentHTML('beforeend', `
    <div class="repeatable-header" onclick="toggleRepeatable(this)"><h4>ผลงานใหม่</h4><span class="toggle">▼</span></div>
    <div class="repeatable-body open">
      ${imageField('pf-item-img-' + i, '', 'รูปผลงาน')}
      <div class="form-row">
        <div class="form-group"><label>Tag</label><input type="text" class="pf-item-tag" value=""></div>
        <div class="form-group"><label>Title</label><input type="text" class="pf-item-title" value=""></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Description</label><input type="text" class="pf-item-desc" value=""></div>
        <div class="form-group"><label>Size</label><select class="pf-item-size"><option value="normal">ปกติ</option><option value="large">ใหญ่</option></select></div>
      </div>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
    </div>
  `);
}

async function savePortfolio() {
  const items = [];
  document.querySelectorAll('.pf-item-tag').forEach((el, i) => {
    items.push({
      image: getImageValue('pf-item-img-' + i),
      tag: el.value,
      title: document.querySelectorAll('.pf-item-title')[i]?.value || '',
      desc: document.querySelectorAll('.pf-item-desc')[i]?.value || '',
      size: document.querySelectorAll('.pf-item-size')[i]?.value || 'normal'
    });
  });
  const data = { section_tag: gv('pf_tag'), section_title: gv('pf_title'), section_desc: gv('pf_desc'), items };
  await api('/api/content/portfolio', { method: 'PUT', body: JSON.stringify(data) });
  allContent.portfolio = data;
  toast('✅ บันทึกผลงานสำเร็จ');
}

// ===== TESTIMONIALS FORM =====
function renderTestimonialsForm() {
  const t = allContent.testimonials || {};
  const items = t.items || [];
  document.getElementById('testimonialsForm').innerHTML = `
    <div class="form-section">
      <h3>📝 หัวข้อรีวิว</h3>
      <div class="form-row">
        <div class="form-group"><label>Section Tag</label><input type="text" id="tm_tag" value="${esc(t.section_tag || '')}"></div>
        <div class="form-group"><label>Section Title</label><input type="text" id="tm_title" value="${esc(t.section_title || '')}"></div>
      </div>
      <div class="form-group"><label>Section Description</label><textarea id="tm_desc">${esc(t.section_desc || '')}</textarea></div>
    </div>
    <div class="form-section">
      <h3>⭐ รีวิว</h3>
      <div id="testimonialsList">
        ${items.map((item, i) => `
          <div class="repeatable-header" onclick="toggleRepeatable(this)"><h4>⭐ ${esc(item.name || 'รีวิว ' + (i + 1))}</h4><span class="toggle">▼</span></div>
          <div class="repeatable-body">
            <div class="form-row">
              <div class="form-group"><label>ชื่อ</label><input type="text" class="tm-item-name" value="${esc(item.name || '')}"></div>
              <div class="form-group"><label>Avatar (2 ตัวอักษร)</label><input type="text" class="tm-item-avatar" value="${esc(item.avatar || '')}"></div>
            </div>
            <div class="form-group"><label>Role</label><input type="text" class="tm-item-role" value="${esc(item.role || '')}"></div>
            <div class="form-group"><label>คำรีวิว</label><textarea class="tm-item-quote">${esc(item.quote || '')}</textarea></div>
            <div class="form-group"><label>ดาว (1-5)</label><input type="number" class="tm-item-stars" min="1" max="5" value="${item.stars || 5}"></div>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addTestimonial()" style="margin-top:12px">+ เพิ่มรีวิว</button>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" onclick="saveTestimonials()">💾 บันทึก</button>
    </div>
  `;
}

function addTestimonial() {
  const list = document.getElementById('testimonialsList');
  list.insertAdjacentHTML('beforeend', `
    <div class="repeatable-header" onclick="toggleRepeatable(this)"><h4>⭐ รีวิวใหม่</h4><span class="toggle">▼</span></div>
    <div class="repeatable-body open">
      <div class="form-row">
        <div class="form-group"><label>ชื่อ</label><input type="text" class="tm-item-name" value=""></div>
        <div class="form-group"><label>Avatar</label><input type="text" class="tm-item-avatar" value=""></div>
      </div>
      <div class="form-group"><label>Role</label><input type="text" class="tm-item-role" value=""></div>
      <div class="form-group"><label>คำรีวิว</label><textarea class="tm-item-quote"></textarea></div>
      <div class="form-group"><label>ดาว</label><input type="number" class="tm-item-stars" min="1" max="5" value="5"></div>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
    </div>
  `);
}

async function saveTestimonials() {
  const items = [];
  document.querySelectorAll('.tm-item-name').forEach((el, i) => {
    items.push({
      name: el.value,
      avatar: document.querySelectorAll('.tm-item-avatar')[i]?.value || '',
      role: document.querySelectorAll('.tm-item-role')[i]?.value || '',
      quote: document.querySelectorAll('.tm-item-quote')[i]?.value || '',
      stars: parseInt(document.querySelectorAll('.tm-item-stars')[i]?.value) || 5
    });
  });
  const data = { section_tag: gv('tm_tag'), section_title: gv('tm_title'), section_desc: gv('tm_desc'), items };
  await api('/api/content/testimonials', { method: 'PUT', body: JSON.stringify(data) });
  allContent.testimonials = data;
  toast('✅ บันทึกรีวิวสำเร็จ');
}

// ===== CLOSING FORM =====
function renderClosingForm() {
  const c = allContent.closing || {};
  const guarantees = c.guarantees || [];
  document.getElementById('closingForm').innerHTML = `
    <div class="form-section">
      <h3>🔚 ปิดท้าย</h3>
      <div class="form-row">
        <div class="form-group"><label>Tag</label><input type="text" id="cl_tag" value="${esc(c.tag || '')}"></div>
        <div class="form-group"><label>CTA Text</label><input type="text" id="cl_cta" value="${esc(c.cta_text || '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Title บรรทัด 1</label><input type="text" id="cl_t1" value="${esc(c.title_line1 || '')}"></div>
        <div class="form-group"><label>Title บรรทัด 2 (accent)</label><input type="text" id="cl_t2" value="${esc(c.title_line2 || '')}"></div>
      </div>
      <div class="form-group"><label>Description</label><textarea id="cl_desc">${esc(c.description || '')}</textarea></div>
      <div class="form-group"><label>Proof Text</label><input type="text" id="cl_proof" value="${esc(c.proof_text || '')}"></div>
    </div>
    <div class="form-section">
      <h3>🛡️ ข้อรับประกัน</h3>
      <div id="guaranteesList">
        ${guarantees.map((g, i) => `
          <div class="repeatable-header" onclick="toggleRepeatable(this)"><h4>🛡️ ${esc(g.title || '')}</h4><span class="toggle">▼</span></div>
          <div class="repeatable-body">
            <div class="form-row">
              <div class="form-group"><label>Icon (shield/check/heart)</label><input type="text" class="cl-g-icon" value="${esc(g.icon || '')}"></div>
              <div class="form-group"><label>Title</label><input type="text" class="cl-g-title" value="${esc(g.title || '')}"></div>
            </div>
            <div class="form-group"><label>Description</label><input type="text" class="cl-g-desc" value="${esc(g.desc || '')}"></div>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addGuarantee()" style="margin-top:12px">+ เพิ่มข้อรับประกัน</button>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" onclick="saveClosing()">💾 บันทึก</button>
    </div>
  `;
}

function addGuarantee() {
  document.getElementById('guaranteesList').insertAdjacentHTML('beforeend', `
    <div class="repeatable-header" onclick="toggleRepeatable(this)"><h4>🛡️ ใหม่</h4><span class="toggle">▼</span></div>
    <div class="repeatable-body open">
      <div class="form-row">
        <div class="form-group"><label>Icon</label><input type="text" class="cl-g-icon" value="shield"></div>
        <div class="form-group"><label>Title</label><input type="text" class="cl-g-title" value=""></div>
      </div>
      <div class="form-group"><label>Description</label><input type="text" class="cl-g-desc" value=""></div>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
    </div>
  `);
}

async function saveClosing() {
  const guarantees = [];
  document.querySelectorAll('.cl-g-title').forEach((el, i) => {
    guarantees.push({
      icon: document.querySelectorAll('.cl-g-icon')[i]?.value || 'shield',
      title: el.value,
      desc: document.querySelectorAll('.cl-g-desc')[i]?.value || ''
    });
  });
  const data = {
    tag: gv('cl_tag'), title_line1: gv('cl_t1'), title_line2: gv('cl_t2'),
    description: gv('cl_desc'), cta_text: gv('cl_cta'), proof_text: gv('cl_proof'), guarantees
  };
  await api('/api/content/closing', { method: 'PUT', body: JSON.stringify(data) });
  allContent.closing = data;
  toast('✅ บันทึกปิดท้ายสำเร็จ');
}

// ===== FOOTER FORM =====
function renderFooterForm() {
  const f = allContent.footer || {};
  document.getElementById('footerForm').innerHTML = `
    <div class="form-section">
      <h3>📎 Footer</h3>
      <div class="form-group"><label>Description</label><textarea id="ft_desc">${esc(f.description || '')}</textarea></div>
    </div>
    <div class="form-section">
      <h3>🔗 เมนูลัด</h3>
      <div id="ftQuickLinks">
        ${(f.quick_links || []).map((l, i) => `
          <div class="form-row" style="margin-bottom:8px">
            <div class="form-group"><label>Label</label><input type="text" class="ft-ql-label" value="${esc(l.label || '')}"></div>
            <div class="form-group"><label>Href</label><input type="text" class="ft-ql-href" value="${esc(l.href || '')}"></div>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addFooterLink('ftQuickLinks', 'ft-ql')">+ เพิ่มลิงก์</button>
    </div>
    <div class="form-section">
      <h3>🔧 ลิงก์บริการ</h3>
      <div id="ftServiceLinks">
        ${(f.service_links || []).map(l => `
          <div class="form-row" style="margin-bottom:8px">
            <div class="form-group"><label>Label</label><input type="text" class="ft-sl-label" value="${esc(l.label || '')}"></div>
            <div class="form-group"><label>Href</label><input type="text" class="ft-sl-href" value="${esc(l.href || '')}"></div>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addFooterLink('ftServiceLinks', 'ft-sl')">+ เพิ่มลิงก์</button>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" onclick="saveFooter()">💾 บันทึก</button>
    </div>
  `;
}

function addFooterLink(containerId, prefix) {
  document.getElementById(containerId).insertAdjacentHTML('beforeend', `
    <div class="form-row" style="margin-bottom:8px">
      <div class="form-group"><label>Label</label><input type="text" class="${prefix}-label" value=""></div>
      <div class="form-group"><label>Href</label><input type="text" class="${prefix}-href" value=""></div>
    </div>
  `);
}

async function saveFooter() {
  const quick_links = collectLinks('ft-ql-label', 'ft-ql-href');
  const service_links = collectLinks('ft-sl-label', 'ft-sl-href');
  const data = { description: gv('ft_desc'), quick_links, service_links, legal_links: allContent.footer?.legal_links || [] };
  await api('/api/content/footer', { method: 'PUT', body: JSON.stringify(data) });
  allContent.footer = data;
  toast('✅ บันทึก Footer สำเร็จ');
}

// ===== NOTIFICATIONS FORM =====
function renderNotificationsForm() {
  const n = allContent.notification_settings || {};
  document.getElementById('notificationsForm').innerHTML = `
    <div class="form-section">
      <h3>📱 LINE Notify</h3>
      <p style="font-size:0.85rem;color:var(--gray-400);margin-bottom:16px">
        แจ้งเตือนทันทีเมื่อมี Lead ใหม่ผ่าน LINE — ไปที่
        <a href="https://notify-bot.line.me/my/" target="_blank" style="color:var(--red)">notify-bot.line.me</a>
        เพื่อสร้าง Token
      </p>
      <div class="form-group">
        <label>
          <input type="checkbox" id="nt_line_enabled" ${n.line_notify_enabled !== false ? 'checked' : ''} style="margin-right:8px">
          เปิดใช้ LINE Notify
        </label>
      </div>
      <div class="form-group">
        <label>LINE Notify Token</label>
        <input type="text" id="nt_line_token" value="${esc(n.line_notify_token || '')}" placeholder="ใส่ Token จาก LINE Notify">
      </div>
    </div>
    <div class="form-section">
      <h3>✈️ Telegram</h3>
      <p style="font-size:0.85rem;color:var(--gray-400);margin-bottom:16px">
        แจ้งเตือนผ่าน Telegram Bot — สร้าง Bot ผ่าน
        <a href="https://t.me/BotFather" target="_blank" style="color:var(--red)">@BotFather</a>
      </p>
      <div class="form-group">
        <label>
          <input type="checkbox" id="nt_telegram_enabled" ${n.telegram_enabled ? 'checked' : ''} style="margin-right:8px">
          เปิดใช้ Telegram
        </label>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Telegram Bot Token</label>
          <input type="text" id="nt_telegram_bot_token" value="${esc(n.telegram_bot_token || '')}" placeholder="123456:ABC-DEF...">
        </div>
        <div class="form-group">
          <label>Telegram Chat ID</label>
          <input type="text" id="nt_telegram_chat_id" value="${esc(n.telegram_chat_id || '')}" placeholder="-1001234567890">
        </div>
      </div>
    </div>
    <div class="form-section">
      <h3>💬 Auto Reply</h3>
      <p style="font-size:0.85rem;color:var(--gray-400);margin-bottom:16px">
        ตอบกลับอัตโนมัติเมื่อมี Lead ใหม่ (ใช้ {name} แทนชื่อลูกค้า)
      </p>
      <div class="form-group">
        <label>
          <input type="checkbox" id="nt_auto_reply_enabled" ${n.auto_reply_enabled ? 'checked' : ''} style="margin-right:8px">
          เปิดใช้ Auto Reply
        </label>
      </div>
      <div class="form-group">
        <label>LINE Template</label>
        <textarea id="nt_ar_line" rows="2" placeholder="สวัสดีคุณ {name} ขอบคุณที่สนใจบริการของเรา">${esc((n.auto_reply_templates || {}).line || '')}</textarea>
      </div>
      <div class="form-group">
        <label>SMS Template</label>
        <textarea id="nt_ar_sms" rows="2" placeholder="สวัสดีคุณ {name} เราได้รับข้อมูลของท่านแล้ว">${esc((n.auto_reply_templates || {}).sms || '')}</textarea>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" onclick="saveNotifications()">💾 บันทึก</button>
      <button type="button" class="btn btn-outline" onclick="testNotification('all')" style="margin-left:8px">🧪 ทดสอบส่งทั้งหมด</button>
      <button type="button" class="btn btn-outline" onclick="testNotification('line')" style="margin-left:8px">📱 ทดสอบ LINE</button>
      <button type="button" class="btn btn-outline" onclick="testNotification('telegram')" style="margin-left:8px">✈️ ทดสอบ Telegram</button>
    </div>
  `;
}

async function saveNotifications() {
  const data = {
    line_notify_enabled: document.getElementById('nt_line_enabled')?.checked ?? false,
    line_notify_token: gv('nt_line_token'),
    telegram_enabled: document.getElementById('nt_telegram_enabled')?.checked ?? false,
    telegram_bot_token: gv('nt_telegram_bot_token'),
    telegram_chat_id: gv('nt_telegram_chat_id'),
    auto_reply_enabled: document.getElementById('nt_auto_reply_enabled')?.checked ?? false,
    auto_reply_templates: {
      line: gv('nt_ar_line'),
      sms: gv('nt_ar_sms')
    }
  };
  await api('/api/content/notification_settings', { method: 'PUT', body: JSON.stringify(data) });
  allContent.notification_settings = data;
  toast('✅ บันทึกการแจ้งเตือนสำเร็จ');
}

async function testNotification(channel) {
  try {
    await api('/api/test-notification', { method: 'POST', body: JSON.stringify({ channel: channel || 'all' }) });
    toast('✅ ส่งทดสอบสำเร็จ');
  } catch (err) {
    toast('❌ ส่งไม่สำเร็จ: ' + err.message, 'error');
  }
}

// ===== CHATBOT FAQ FORM =====
function renderChatbotForm() {
  const faq = allContent.chatbot_faq || {};
  const keys = Object.keys(faq);
  document.getElementById('chatbotForm').innerHTML = `
    <div class="form-section">
      <h3>💬 รายการ FAQ (${keys.length} หัวข้อ)</h3>
      <p style="font-size:0.82rem;color:var(--gray-400);margin-bottom:16px">แต่ละหัวข้อมี: คำถาม, คำตอบ, ปุ่มต่อ, คำค้นหา — user พิมพ์คำค้นหาแล้ว Bot จะตอบอัตโนมัติ</p>
      <div id="chatbotFaqList">
        ${keys.map((key, i) => {
          const item = faq[key];
          return `
            <div class="repeatable-header" onclick="toggleRepeatable(this)">
              <h4>${esc(item.q || key)}</h4>
              <span class="toggle">▼</span>
            </div>
            <div class="repeatable-body">
              <div class="form-row">
                <div class="form-group"><label>Key (ID)</label><input type="text" class="cb-faq-key" value="${esc(key)}"></div>
                <div class="form-group"><label>คำถาม (ปุ่ม Quick Reply)</label><input type="text" class="cb-faq-q" value="${esc(item.q || '')}"></div>
              </div>
              <div class="form-group"><label>คำตอบ</label><textarea class="cb-faq-a" rows="4">${esc(item.a || '')}</textarea></div>
              <div class="form-group"><label>ปุ่มต่อ (คั่นด้วย comma ,)</label><input type="text" class="cb-faq-f" value="${esc((item.f || []).join(', '))}"></div>
              <div class="form-group"><label>คำค้นหา (คั่นด้วย comma ,)</label><input type="text" class="cb-faq-k" value="${esc((item.k || []).join(', '))}"></div>
              <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
            </div>
          `;
        }).join('')}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addChatbotFAQItem()" style="margin-top:12px">+ เพิ่ม FAQ</button>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" onclick="saveChatbotFAQ()">💾 บันทึก Chatbot FAQ</button>
    </div>
  `;
}

function addChatbotFAQItem() {
  const list = document.getElementById('chatbotFaqList');
  list.insertAdjacentHTML('beforeend', `
    <div class="repeatable-header" onclick="toggleRepeatable(this)"><h4>❓ FAQ ใหม่</h4><span class="toggle">▼</span></div>
    <div class="repeatable-body open">
      <div class="form-row">
        <div class="form-group"><label>Key (ID)</label><input type="text" class="cb-faq-key" value=""></div>
        <div class="form-group"><label>คำถาม (ปุ่ม Quick Reply)</label><input type="text" class="cb-faq-q" value=""></div>
      </div>
      <div class="form-group"><label>คำตอบ</label><textarea class="cb-faq-a" rows="4"></textarea></div>
      <div class="form-group"><label>ปุ่มต่อ (คั่นด้วย comma ,)</label><input type="text" class="cb-faq-f" value=""></div>
      <div class="form-group"><label>คำค้นหา (คั่นด้วย comma ,)</label><input type="text" class="cb-faq-k" value=""></div>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
    </div>
  `);
}

async function saveChatbotFAQ() {
  const faq = {};
  const keys = document.querySelectorAll('.cb-faq-key');
  const qs = document.querySelectorAll('.cb-faq-q');
  const as = document.querySelectorAll('.cb-faq-a');
  const fs = document.querySelectorAll('.cb-faq-f');
  const ks = document.querySelectorAll('.cb-faq-k');

  keys.forEach((el, i) => {
    const key = el.value.trim();
    const q = qs[i]?.value.trim();
    const a = as[i]?.value.trim();
    if (!key || !q || !a) return; // skip incomplete
    faq[key] = {
      q: q,
      a: a,
      f: (fs[i]?.value || '').split(',').map(s => s.trim()).filter(Boolean),
      k: (ks[i]?.value || '').split(',').map(s => s.trim()).filter(Boolean)
    };
  });

  await api('/api/content/chatbot_faq', { method: 'PUT', body: JSON.stringify(faq) });
  allContent.chatbot_faq = faq;
  toast('✅ บันทึก Chatbot FAQ สำเร็จ');
}

// ===== NAV FORM =====
function renderNavForm() {
  document.getElementById('navForm').innerHTML = `
    <div class="form-section">
      <h3>📑 เมนูนำทาง (Navbar)</h3>
      <div id="navItemsList">
        ${allNav.map((n, i) => `
          <div class="form-row" style="margin-bottom:8px;align-items:end">
            <div class="form-group"><label>Label</label><input type="text" class="nav-label" value="${esc(n.label || '')}"></div>
            <div class="form-group"><label>Href</label><input type="text" class="nav-href" value="${esc(n.href || '')}"></div>
            <div class="form-group"><label>แสดง</label><select class="nav-visible"><option value="1" ${n.is_visible ? 'selected' : ''}>✅</option><option value="0" ${!n.is_visible ? 'selected' : ''}>❌</option></select></div>
            <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.form-row').remove()">🗑️</button>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn btn-outline btn-sm" onclick="addNavItem()" style="margin-top:12px">+ เพิ่มเมนู</button>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-primary" onclick="saveNav()">💾 บันทึก</button>
    </div>
  `;
}

function addNavItem() {
  document.getElementById('navItemsList').insertAdjacentHTML('beforeend', `
    <div class="form-row" style="margin-bottom:8px;align-items:end">
      <div class="form-group"><label>Label</label><input type="text" class="nav-label" value=""></div>
      <div class="form-group"><label>Href</label><input type="text" class="nav-href" value="#"></div>
      <div class="form-group"><label>แสดง</label><select class="nav-visible"><option value="1">✅</option><option value="0">❌</option></select></div>
      <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.form-row').remove()">🗑️</button>
    </div>
  `);
}

async function saveNav() {
  const items = [];
  document.querySelectorAll('.nav-label').forEach((el, i) => {
    items.push({
      label: el.value,
      href: document.querySelectorAll('.nav-href')[i]?.value || '#',
      sort_order: i + 1,
      is_visible: parseInt(document.querySelectorAll('.nav-visible')[i]?.value) || 1
    });
  });
  await api('/api/nav', { method: 'PUT', body: JSON.stringify({ items }) });
  allNav = items;
  toast('✅ บันทึกเมนูสำเร็จ');
}

// ===== LEADS =====
function renderLeads() {
  const search = document.getElementById('leadSearch')?.value?.toLowerCase() || '';
  const filter = document.getElementById('leadFilter')?.value || '';
  let filtered = allLeads;
  if (search) filtered = filtered.filter(l => l.name.toLowerCase().includes(search) || l.phone.includes(search));
  if (filter) filtered = filtered.filter(l => l.status === filter);

  const statusClass = s => ({ 'New Lead': 'new', 'Contacted': 'contacted', 'Appointment Set': 'appointment', 'Proposal Sent': 'proposal', 'Closed Won': 'won', 'Closed Lost': 'lost' }[s] || 'new');

  document.getElementById('leadsBody').innerHTML = filtered.map(l => `
    <tr>
      <td><strong>${esc(l.name)}</strong></td>
      <td>${esc(l.phone)}</td>
      <td>${esc(l.service_type)}</td>
      <td>${esc(l.budget_range)}</td>
      <td><span class="score-dot ${l.score >= 5 ? 'high' : l.score >= 3 ? 'mid' : 'low'}"></span>${l.score}</td>
      <td><span class="status-badge ${statusClass(l.status)}">${esc(l.status)}</span></td>
      <td>${new Date(l.created_at).toLocaleDateString('th-TH')}</td>
      <td><button class="btn btn-sm btn-outline" onclick="openLeadModal(${l.id})">📝</button></td>
    </tr>
  `).join('');
}

// Lead search/filter event listeners
document.getElementById('leadSearch')?.addEventListener('input', renderLeads);
document.getElementById('leadFilter')?.addEventListener('change', renderLeads);

// ===== LEAD MODAL =====
async function openLeadModal(id) {
  const lead = allLeads.find(l => l.id === id);
  if (!lead) return;

  const notes = await api(`/api/leads/${id}/notes`).catch(() => []);

  document.getElementById('modalTitle').textContent = `📝 ${lead.name}`;
  document.getElementById('modalBody').innerHTML = `
    <div class="form-row">
      <div class="form-group"><label>ชื่อ</label><input type="text" id="lm_name" value="${esc(lead.name)}"></div>
      <div class="form-group"><label>โทร</label><input type="text" id="lm_phone" value="${esc(lead.phone)}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>บริการ</label><input type="text" id="lm_service" value="${esc(lead.service_type)}"></div>
      <div class="form-group"><label>งบ</label><input type="text" id="lm_budget" value="${esc(lead.budget_range)}"></div>
    </div>
    <div class="form-group"><label>สถานะ</label>
      <select id="lm_status">
        ${['New Lead', 'Contacted', 'Appointment Set', 'Proposal Sent', 'Closed Won', 'Closed Lost'].map(s => `<option value="${s}" ${lead.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label>ข้อความ</label><textarea id="lm_message">${esc(lead.message || '')}</textarea></div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary btn-sm" onclick="updateLead(${id})">💾 บันทึก</button>
      <button class="btn btn-danger btn-sm" onclick="deleteLead(${id})">🗑️ ลบ Lead</button>
    </div>
    <hr style="margin:20px 0;border:none;border-top:2px solid var(--gray-100)">
    <h4 style="margin-bottom:12px">📝 บันทึก (${notes.length})</h4>
    <div style="margin-bottom:12px">
      <textarea id="newNote" placeholder="เพิ่มบันทึก..." rows="2" style="width:100%;padding:8px;border:2px solid var(--gray-200);border-radius:8px;font-family:var(--font)"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px;align-items:end">
        <div style="flex:1"><label style="font-size:0.75rem;color:var(--gray-400)">Follow-up Date</label><input type="date" id="newFollowUp" style="width:100%;padding:6px;border:1px solid var(--gray-200);border-radius:6px"></div>
        <button class="btn btn-sm btn-blue" onclick="addNote(${id})">+ เพิ่ม</button>
      </div>
    </div>
    <div>${notes.map(n => `
      <div style="padding:8px;background:var(--gray-50);border-radius:8px;margin-bottom:8px;font-size:0.82rem">
        <div style="color:var(--gray-400);font-size:0.7rem;margin-bottom:4px">${new Date(n.created_at).toLocaleString('th-TH')} ${n.follow_up_date ? '· 📅 ' + n.follow_up_date : ''} ${n.follow_up_done ? '· ✅ done' : ''}</div>
        ${esc(n.note)}
      </div>
    `).join('')}</div>
  `;
  document.getElementById('leadModal').classList.add('show');
}

function closeModal() {
  document.getElementById('leadModal').classList.remove('show');
}

async function updateLead(id) {
  const data = {
    name: gv('lm_name'), phone: gv('lm_phone'), service_type: gv('lm_service'),
    budget_range: gv('lm_budget'), status: gv('lm_status'), message: gv('lm_message')
  };
  await api(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  Object.assign(allLeads.find(l => l.id === id), data);
  renderLeads();
  toast('✅ อัพเดท Lead สำเร็จ');
}

async function deleteLead(id) {
  if (!confirm('ลบ Lead นี้?')) return;
  await api(`/api/leads/${id}`, { method: 'DELETE' });
  allLeads = allLeads.filter(l => l.id !== id);
  closeModal();
  renderLeads();
  toast('🗑️ ลบ Lead สำเร็จ');
}

async function addNote(leadId) {
  const note = document.getElementById('newNote').value.trim();
  if (!note) return;
  const follow_up_date = document.getElementById('newFollowUp').value || null;
  await api(`/api/leads/${leadId}/notes`, { method: 'POST', body: JSON.stringify({ note, follow_up_date }) });
  toast('✅ เพิ่มบันทึกสำเร็จ');
  openLeadModal(leadId);
}

// ===== BOOKINGS =====
function renderBookings() {
  const bookings = allLeads.filter(l => l.appointment_date).sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  document.getElementById('bookingsList').innerHTML = bookings.length ? bookings.map(b => {
    const d = new Date(b.appointment_date);
    return `<div class="booking-card">
      <div class="date-badge"><div class="day">${d.getDate()}</div><div class="month">${months[d.getMonth()]}</div></div>
      <div class="info">
        <h4>${esc(b.name)}</h4>
        <p>${esc(b.service_type)} · ${esc(b.appointment_time || '')} · ${esc(b.meeting_type || 'onsite')} · ${esc(b.phone)}</p>
      </div>
      <span class="status-badge ${b.status === 'Closed Won' ? 'won' : 'new'}">${b.status}</span>
    </div>`;
  }).join('') : '<p style="color:var(--gray-400);text-align:center;padding:40px">ยังไม่มีการจองคิว</p>';
}

// ===== MEDIA LIBRARY =====
async function renderMedia() {
  try {
    const files = await api('/api/media').catch(() => []);
    document.getElementById('mediaGrid').innerHTML = files.map(f => `
      <div class="media-item">
        <img src="${esc(f.url)}" alt="${esc(f.name)}" loading="lazy">
        <div class="media-info">
          <div class="media-name">${esc(f.name)}</div>
          <div class="media-actions">
            <button class="copy-url" onclick="copyUrl('${esc(f.url)}')">📋 Copy URL</button>
            <button class="delete-img" onclick="deleteMedia('${esc(f.name)}')">🗑️</button>
          </div>
        </div>
      </div>
    `).join('') || '<p style="color:var(--gray-400);text-align:center;padding:40px">ยังไม่มีรูปอัพโหลด</p>';
  } catch {}
}

// Media upload
document.getElementById('mediaFileInput')?.addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) toast('✅ อัพโหลด ' + file.name + ' สำเร็จ');
    } catch (err) {
      toast('❌ อัพโหลดล้มเหลว: ' + err.message, 'error');
    }
  }
  renderMedia();
  e.target.value = '';
});

// Drag and drop
document.getElementById('mediaUploadArea')?.addEventListener('dragover', (e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--red)'; });
document.getElementById('mediaUploadArea')?.addEventListener('dragleave', (e) => { e.currentTarget.style.borderColor = 'var(--gray-300)'; });
document.getElementById('mediaUploadArea')?.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.currentTarget.style.borderColor = 'var(--gray-300)';
  for (const file of e.dataTransfer.files) {
    if (!file.type.startsWith('image/')) continue;
    const formData = new FormData();
    formData.append('image', file);
    await fetch('/api/upload', { method: 'POST', body: formData });
  }
  renderMedia();
});

function copyUrl(url) {
  navigator.clipboard.writeText(window.location.origin + url);
  toast('📋 คัดลอก URL แล้ว');
}

async function deleteMedia(name) {
  if (!confirm('ลบรูปนี้?')) return;
  await api('/api/media/' + encodeURIComponent(name), { method: 'DELETE' }).catch(() => {});
  renderMedia();
  toast('🗑️ ลบรูปสำเร็จ');
}

// ===== REPORTS =====
async function renderReports() {
  try {
    const summary = await api('/api/reports/summary');
    document.getElementById('reportStats').innerHTML = `
      <div class="stat-card"><div class="label">Leads ทั้งหมด</div><div class="value">${esc(String(summary.total_leads))}</div></div>
      <div class="stat-card"><div class="label">เดือนนี้</div><div class="value">${esc(String(summary.monthly_leads))}</div></div>
      <div class="stat-card"><div class="label">ปิดดีล</div><div class="value green">${esc(String(summary.closed_won))}</div></div>
      <div class="stat-card"><div class="label">Conversion</div><div class="value">${esc(String(summary.conversion_rate))}%</div></div>
    `;
    const byService = await api('/api/reports/by-service');
    document.getElementById('reportByService').innerHTML = byService.map(s => `
      <div class="pipeline-bar">
        <div class="pipeline-name">${esc(s.service_type || 'ไม่ระบุ')}</div>
        <div class="pipeline-count">${esc(String(s.count))} (ปิด: ${esc(String(s.closed))})</div>
      </div>
    `).join('') || '<p style="color:var(--gray-400)">ยังไม่มีข้อมูล</p>';
    const byDate = await api('/api/reports/by-date');
    document.getElementById('reportByDate').innerHTML = byDate.slice(-10).map(d => `
      <div class="pipeline-bar">
        <div class="pipeline-name">${esc(d.date)}</div>
        <div class="pipeline-count">${esc(String(d.count))} (ปิด: ${esc(String(d.closed))})</div>
      </div>
    `).join('') || '<p style="color:var(--gray-400)">ยังไม่มีข้อมูล</p>';
  } catch (err) {
    console.error('Reports error:', err);
  }
}

// ===== USERS =====
async function renderUsers() {
  try {
    const users = await api('/api/users');
    document.getElementById('usersBody').innerHTML = users.map(u => `
      <tr>
        <td><strong>${esc(u.full_name || '-')}</strong></td>
        <td>${esc(u.email)}</td>
        <td><span class="status-badge ${u.role === 'admin' ? 'won' : 'new'}">${esc(u.role)}</span></td>
        <td>${new Date(u.created_at).toLocaleDateString('th-TH')}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="editUser(${u.id}, '${esc(u.full_name)}', '${u.role}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Users error:', err);
  }
}

function showAddUserModal() {
  document.getElementById('modalTitle').textContent = '➕ เพิ่มผู้ใช้';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>อีเมล</label><input type="email" id="nu_email" required></div>
    <div class="form-group"><label>รหัสผ่าน</label><input type="password" id="nu_password" required></div>
    <div class="form-group"><label>ชื่อเต็ม</label><input type="text" id="nu_name"></div>
    <div class="form-group"><label>บทบาท</label>
      <select id="nu_role"><option value="sales">Sales</option><option value="manager">Manager</option><option value="admin">Admin</option></select>
    </div>
    <button class="btn btn-primary" onclick="createUser()">💾 สร้างผู้ใช้</button>
  `;
  document.getElementById('leadModal').classList.add('show');
}

async function createUser() {
  const data = {
    email: gv('nu_email'),
    password: gv('nu_password'),
    full_name: gv('nu_name'),
    role: gv('nu_role')
  };
  await api('/api/users', { method: 'POST', body: JSON.stringify(data) });
  closeModal();
  renderUsers();
  toast('✅ สร้างผู้ใช้สำเร็จ');
}

function editUser(id, name, role) {
  document.getElementById('modalTitle').textContent = '✏️ แก้ไขผู้ใช้';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>ชื่อเต็ม</label><input type="text" id="eu_name" value="${esc(name)}"></div>
    <div class="form-group"><label>บทบาท</label>
      <select id="eu_role">
        <option value="sales" ${role === 'sales' ? 'selected' : ''}>Sales</option>
        <option value="manager" ${role === 'manager' ? 'selected' : ''}>Manager</option>
        <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
      </select>
    </div>
    <div class="form-group"><label>รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</label><input type="password" id="eu_password"></div>
    <button class="btn btn-primary" onclick="updateUser(${id})">💾 บันทึก</button>
  `;
  document.getElementById('leadModal').classList.add('show');
}

async function updateUser(id) {
  const data = { full_name: gv('eu_name'), role: gv('eu_role') };
  const pw = gv('eu_password');
  if (pw) data.password = pw;
  await api('/api/users/' + id, { method: 'PUT', body: JSON.stringify(data) });
  closeModal();
  renderUsers();
  toast('✅ อัพเดทผู้ใช้สำเร็จ');
}

async function deleteUser(id) {
  if (!confirm('ลบผู้ใช้นี้?')) return;
  await api('/api/users/' + id, { method: 'DELETE' });
  renderUsers();
  toast('🗑️ ลบผู้ใช้สำเร็จ');
}

// ===== EXPORT & BACKUP =====
function exportCSV() {
  window.open('/api/reports/export/csv', '_blank');
}

async function createBackup() {
  try {
    const res = await fetch('/api/admin/backup', { cache: 'no-store', credentials: 'include' });
    if (!res.ok) throw new Error('Backup failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nucha-backup-${new Date().toISOString().slice(0,10)}.db`;
    a.click();
    URL.revokeObjectURL(url);
    toast('✅ สำรองข้อมูลสำเร็จ');
  } catch (err) {
    toast('❌ สำรองข้อมูลล้มเหลว: ' + err.message, 'error');
  }
}

// ===== SITE DOCS =====
async function generateSiteDocs() {
  const btn = document.getElementById('btnGenerateDocs');
  btn.disabled = true;
  btn.textContent = '⏳ กำลังสร้าง...';
  try {
    const result = await api('/api/admin/generate-docs', { method: 'POST', body: JSON.stringify({ url: window.location.origin }) });
    toast(`✅ สร้างรายงานสำเร็จ ${result.pages} หน้า`);
    checkSiteDocs();
  } catch (err) {
    toast('❌ สร้างรายงานล้มเหลว: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🚀 สร้างรายงาน';
  }
}

async function checkSiteDocs() {
  try {
    const status = await api('/api/admin/docs-status');
    const el = document.getElementById('siteDocsStatus');
    if (status.exists) {
      el.innerHTML = `✅ มีรายงานแล้ว (${status.pages} หน้า, สร้างเมื่อ ${new Date(status.generated_at).toLocaleString('th-TH')})`;
      document.getElementById('btnViewDocsHTML').style.display = '';
      document.getElementById('btnViewDocsMD').style.display = '';
      document.getElementById('btnViewDocsJSON').style.display = '';
    } else {
      el.innerHTML = '📋 ยังไม่มีรายงาน — กดปุ่มเพื่อสร้าง';
    }
  } catch {
    document.getElementById('siteDocsStatus').innerHTML = '📋 ยังไม่มีรายงาน';
  }
}

// ===== IMAGE UPLOAD HELPER =====
function imageField(id, currentUrl, label) {
  const hasImage = currentUrl && currentUrl.trim();
  return `
    <div class="form-group">
      <label>${label}</label>
      <div class="image-upload ${hasImage ? 'has-image' : ''}" id="upload-${id}" onclick="triggerUpload('${id}')">
        ${hasImage ? `<img src="${esc(currentUrl)}" id="preview-${id}"><button type="button" class="remove-btn" onclick="event.stopPropagation();clearImage('${id}')">✕</button>` : `<div class="upload-icon">📤</div><div class="upload-text">คลิกเพื่ออัพโหลด หรือใส่ URL ด้านล่าง</div>`}
        <input type="file" id="file-${id}" accept="image/*" onchange="handleImageUpload('${id}', this)" style="display:none">
      </div>
      <input type="text" class="url-input" id="url-${id}" value="${esc(currentUrl || '')}" placeholder="หรือใส่ URL รูปภาพ..." oninput="updateImagePreview('${id}', this.value)" style="margin-top:8px;width:100%;padding:8px 12px;border:2px solid var(--gray-200);border-radius:8px;font-size:0.85rem">
    </div>
  `;
}

function triggerUpload(id) {
  document.getElementById('file-' + id)?.click();
}

async function handleImageUpload(id, input) {
  const file = input.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('image', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) {
      document.getElementById('url-' + id).value = data.url;
      updateImagePreview(id, data.url);
      toast('✅ อัพโหลดรูปสำเร็จ');
    }
  } catch (err) {
    toast('❌ อัพโหลดล้มเหลว', 'error');
  }
}

function updateImagePreview(id, url) {
  const container = document.getElementById('upload-' + id);
  if (!container) return;
  if (url && url.trim()) {
    container.classList.add('has-image');
    container.innerHTML = `<img src="${esc(url)}" id="preview-${id}"><button type="button" class="remove-btn" onclick="event.stopPropagation();clearImage('${id}')">✕</button><input type="file" id="file-${id}" accept="image/*" onchange="handleImageUpload('${id}', this)" style="display:none">`;
  } else {
    container.classList.remove('has-image');
    container.innerHTML = `<div class="upload-icon">📤</div><div class="upload-text">คลิกเพื่ออัพโหลด</div><input type="file" id="file-${id}" accept="image/*" onchange="handleImageUpload('${id}', this)" style="display:none">`;
  }
}

function clearImage(id) {
  document.getElementById('url-' + id).value = '';
  updateImagePreview(id, '');
}

function getImageValue(id) {
  return document.getElementById('url-' + id)?.value || '';
}

// ===== HELPERS =====
function gv(id) { return document.getElementById(id)?.value || ''; }
function esc(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}
function toggleRepeatable(header) {
  header.classList.toggle('open');
  const body = header.nextElementSibling;
  if (body) body.classList.toggle('open');
}
function removeRepeatable(btn) {
  const body = btn.closest('.repeatable-body');
  const header = body?.previousElementSibling;
  body?.remove();
  header?.remove();
}
function collectLinks(labelClass, hrefClass) {
  const links = [];
  document.querySelectorAll('.' + labelClass).forEach((el, i) => {
    if (el.value) links.push({ label: el.value, href: document.querySelectorAll('.' + hrefClass)[i]?.value || '#' });
  });
  return links;
}

// ===== MOBILE SIDEBAR =====
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});
document.getElementById('sidebarClose')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
});

// Close modal on overlay click
document.getElementById('leadModal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});
