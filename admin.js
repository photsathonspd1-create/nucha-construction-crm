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
  // Apply favicon from site config
  const favCfg = allContent.site_config || {};
  if (favCfg.favicon && favCfg.favicon.trim()) {
    let link = document.getElementById('dynamicFavicon');
    if (!link) { link = document.createElement('link'); link.id = 'dynamicFavicon'; link.rel = 'icon'; document.head.appendChild(link); }
    const ext = favCfg.favicon.split('.').pop().split('?')[0].toLowerCase();
    const mimeMap = { 'png': 'image/png', 'svg': 'image/svg+xml', 'ico': 'image/x-icon', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp', 'gif': 'image/gif' };
    link.type = mimeMap[ext] || 'image/x-icon';
    link.href = favCfg.favicon.trim();
  }
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
  // Pre-load DB services data for counts
  try {
    const servicesRes = await api('/api/admin/services');
    allDbServices = servicesRes.data || [];
    dbCategories = servicesRes.categories || [];
    document.getElementById('dbServicesCount').textContent = allDbServices.length;
  } catch {}
  try {
    allDbPackages = await api('/api/admin/service-packages').catch(() => []);
    document.getElementById('dbPackagesCount').textContent = allDbPackages.length;
  } catch {}
  // Pre-load gallery + models counts
  try {
    const galleryRes = await api('/api/admin/gallery').catch(() => []);
    document.getElementById('svcGalleryCount').textContent = galleryRes.length;
  } catch {}
  try {
    const modelsRes = await api('/api/admin/models').catch(() => []);
    document.getElementById('svcModelsCount').textContent = modelsRes.length;
  } catch {}
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
  if (pageId === 'customer-chat') renderCustomerChat();
  if (pageId === 'proposals') renderProposals();
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
  renderTrustBadgesForm();
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
      <div class="form-row">
        <div class="form-group">
          <label>Logo Scale (40–200px)</label>
          <input type="range" id="sc_logo_scale" min="40" max="200" value="${c.logo_scale || 80}" oninput="document.getElementById('logoScaleVal').textContent=this.value+'px'" style="width:100%">
          <small style="color:var(--gray-400)">ขนาดปัจจุบัน: <span id="logoScaleVal">${c.logo_scale || 80}px</span></small>
        </div>
      </div>
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
    logo_scale: parseInt(gv('sc_logo_scale')) || 80,
    phone: gv('sc_phone'), email: gv('sc_email'), address: gv('sc_address'),
    line_id: gv('sc_line_id'), facebook_url: gv('sc_facebook'),
    instagram_url: gv('sc_instagram'), copyright: gv('sc_copyright'),
    favicon: getImageValue('sc_favicon')
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
    image_url: getImageValue('h_image'),
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
            <div class="form-group">
              <label>รูปภาพ (URL)</label>
              <div class="image-upload-row">
                <input type="text" class="sv-item-image" value="${esc(item.image_url || '')}" placeholder="https://... หรืออัพโหลด">
                <input type="file" class="sv-item-image-file" accept="image/*" onchange="uploadServiceImage(this, ${i})">
              </div>
              <div class="image-preview" id="sv-img-preview-${i}">${item.image_url ? `<img src="${esc(item.image_url)}" onerror="this.parentElement.innerHTML=''">` : ''}</div>
            </div>
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
  const idx = list.querySelectorAll('.repeatable-body').length;
  const html = `
    <div class="repeatable-header" onclick="toggleRepeatable(this)"><h4>🔧 บริการใหม่</h4><span class="toggle">▼</span></div>
    <div class="repeatable-body open">
      <div class="form-row">
        <div class="form-group"><label>ไอคอน (emoji)</label><input type="text" class="sv-item-icon" value="🔧"></div>
        <div class="form-group"><label>ชื่อบริการ</label><input type="text" class="sv-item-name" value=""></div>
      </div>
      <div class="form-group"><label>รายละเอียด</label><textarea class="sv-item-desc"></textarea></div>
      <div class="form-group">
        <label>รูปภาพ (URL)</label>
        <div class="image-upload-row">
          <input type="text" class="sv-item-image" value="" placeholder="https://... หรืออัพโหลด">
          <input type="file" class="sv-item-image-file" accept="image/*" onchange="uploadServiceImage(this, ${idx})">
        </div>
        <div class="image-preview" id="sv-img-preview-${idx}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>งบประมาณ</label><input type="text" class="sv-item-budget" value=""></div>
        <div class="form-group"><label>Key</label><input type="text" class="sv-item-key" value=""></div>
      </div>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeRepeatable(this)">🗑️ ลบ</button>
    </div>
  `;
  list.insertAdjacentHTML('beforeend', html);
}

async function uploadServiceImage(input, idx) {
  const file = input.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('image', file);
  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
    const data = await res.json();
    if (data.url) {
      const urlInput = document.querySelectorAll('.sv-item-image')[idx];
      if (urlInput) urlInput.value = data.url;
      const preview = document.getElementById('sv-img-preview-' + idx);
      if (preview) preview.innerHTML = `<img src="${data.url}">`;
      toast('✅ อัพโหลดรูปสำเร็จ');
    }
  } catch (err) {
    toast('❌ อัพโหลดไม่สำเร็จ');
  }
}

async function saveServices() {
  const items = [];
  document.querySelectorAll('.sv-item-name').forEach((el, i) => {
    items.push({
      icon: document.querySelectorAll('.sv-item-icon')[i]?.value || '🔧',
      name: el.value,
      desc: document.querySelectorAll('.sv-item-desc')[i]?.value || '',
      image_url: document.querySelectorAll('.sv-item-image')[i]?.value || '',
      budget: document.querySelectorAll('.sv-item-budget')[i]?.value || '',
      key: document.querySelectorAll('.sv-item-key')[i]?.value || ''
    });
  });
  const data = { section_tag: gv('sv_tag'), section_title: gv('sv_title'), section_desc: gv('sv_desc'), items };
  await api('/api/content/services', { method: 'PUT', body: JSON.stringify(data) });
  allContent.services = data;
  toast('✅ บันทึกบริการสำเร็จ');
}

// ===== DB SERVICES MANAGEMENT =====
let allDbServices = [];
let allDbPackages = [];
let dbCategories = [];

async function loadDbServices() {
  try {
    const [servicesRes, packages] = await Promise.all([
      api('/api/admin/services'),
      api('/api/admin/service-packages').catch(() => [])
    ]);
    allDbServices = servicesRes.data || [];
    dbCategories = servicesRes.categories || [];
    allDbPackages = packages || [];

    // Populate category filter
    const catSelect = document.getElementById('dbServiceCategoryFilter');
    if (catSelect) {
      const current = catSelect.value;
      catSelect.innerHTML = '<option value="">ทุกหมวดหมู่</option>' + dbCategories.map(c => `<option value="${esc(c)}" ${c === current ? 'selected' : ''}>${esc(c)}</option>`).join('');
    }

    document.getElementById('dbServicesCount').textContent = allDbServices.length;
    document.getElementById('dbPackagesCount').textContent = allDbPackages.length;
  } catch (err) {
    console.error('Load DB services error:', err);
  }
}

function switchDbTab(tab) {
  document.getElementById('dbServicesPanel').style.display = tab === 'services' ? '' : 'none';
  document.getElementById('dbPackagesPanel').style.display = tab === 'packages' ? '' : 'none';
  document.getElementById('dbTabServices').className = tab === 'services' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
  document.getElementById('dbTabPackages').className = tab === 'packages' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
  if (tab === 'services') renderDbServices();
  else renderDbPackages();
}

function renderDbServices() {
  const search = document.getElementById('dbServiceSearch')?.value?.toLowerCase() || '';
  const catFilter = document.getElementById('dbServiceCategoryFilter')?.value || '';
  const activeFilter = document.getElementById('dbServiceActiveFilter')?.value ?? '';

  let filtered = allDbServices;
  if (search) filtered = filtered.filter(s => s.name.toLowerCase().includes(search) || (s.description || '').toLowerCase().includes(search));
  if (catFilter) filtered = filtered.filter(s => s.category === catFilter);
  if (activeFilter !== '') filtered = filtered.filter(s => String(s.is_active) === activeFilter);

  document.getElementById('dbServicesBody').innerHTML = filtered.length ? filtered.map(s => `
    <tr>
      <td>${s.sort_order}</td>
      <td style="font-size:1.4rem">${esc(s.icon || '🔧')}</td>
      <td><strong>${esc(s.name)}</strong>${s.image_url ? '<br><small style="color:var(--gray-400)">🖼️ มีรูป</small>' : ''}</td>
      <td><span class="status-badge new">${esc(s.category)}</span></td>
      <td>${s.price_start ? Number(s.price_start).toLocaleString('th-TH') : '-'}</td>
      <td>${esc(s.price_unit || '-')}</td>
      <td><span class="status-badge ${s.is_active ? 'won' : 'lost'}">${s.is_active ? 'เปิด' : 'ปิด'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editDbService(${s.id})">✏️</button>
        <button class="btn btn-sm ${s.is_active ? 'btn-secondary' : 'btn-blue'}" onclick="toggleServiceActive(${s.id}, ${s.is_active ? 0 : 1})">${s.is_active ? '⏸️' : '▶️'}</button>
        <button class="btn btn-sm btn-danger" onclick="deleteDbService(${s.id}, '${esc(s.name)}')">🗑️</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--gray-400);padding:40px">ไม่พบบริการ</td></tr>';
}

function renderDbPackages() {
  document.getElementById('dbPackagesBody').innerHTML = allDbPackages.length ? allDbPackages.map(p => {
    let features = [];
    try { features = typeof p.features === 'string' ? JSON.parse(p.features) : p.features || []; } catch { features = []; }
    return `
    <tr>
      <td>${p.sort_order}</td>
      <td><strong>${esc(p.name)}</strong><br><small style="color:var(--gray-400)">${esc((p.description || '').slice(0, 60))}</small></td>
      <td>${p.price_start ? Number(p.price_start).toLocaleString('th-TH') : '-'}</td>
      <td>${p.is_featured ? '⭐' : '-'}</td>
      <td><span class="status-badge ${p.is_active ? 'won' : 'lost'}">${p.is_active ? 'เปิด' : 'ปิด'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editDbPackage(${p.id})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteDbPackage(${p.id}, '${esc(p.name)}')">🗑️</button>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:40px">ไม่พบแพ็กเกจ</td></tr>';
}

function showAddServiceModal() {
  const catOptions = dbCategories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  document.getElementById('modalTitle').textContent = '➕ เพิ่มบริการใหม่';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-row">
      <div class="form-group"><label>หมวดหมู่</label>
        <div style="display:flex;gap:8px">
          <select id="ns_category" style="flex:1">${catOptions}<option value="__new__">+ หมวดหมู่ใหม่</option></select>
          <input type="text" id="ns_category_new" placeholder="ชื่อหมวดหมู่ใหม่" style="display:none;flex:1">
        </div>
      </div>
      <div class="form-group"><label>ชื่อบริการ *</label><input type="text" id="ns_name" required></div>
    </div>
    <div class="form-group"><label>รายละเอียด</label><textarea id="ns_desc" rows="3"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>ราคาเริ่มต้น</label><input type="number" id="ns_price" value="0" min="0"></div>
      <div class="form-group"><label>หน่วยราคา</label><input type="text" id="ns_unit" value="รายการ" placeholder="รายการ, ห้อง, ตร.ม."></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>ไอคอน (emoji)</label><input type="text" id="ns_icon" value="🔧"></div>
      <div class="form-group"><label>ลำดับ</label><input type="number" id="ns_sort" value="0" min="0"></div>
    </div>
    ${imageField('ns_image', '', 'รูปภาพ')}
    <div class="form-group"><label><input type="checkbox" id="ns_active" checked> เปิดใช้</label></div>
    <button class="btn btn-primary" onclick="createDbService()">💾 สร้างบริการ</button>
  `;
  document.getElementById('leadModal').classList.add('show');
  // Toggle new category input
  document.getElementById('ns_category').addEventListener('change', function() {
    document.getElementById('ns_category_new').style.display = this.value === '__new__' ? '' : 'none';
  });
}

async function createDbService() {
  try {
    let category = gv('ns_category');
    if (category === '__new__') category = gv('ns_category_new').trim();
    if (!category) return toast('❌ กรุณาเลือกหรือกรอกหมวดหมู่', 'error');
    const name = gv('ns_name').trim();
    if (!name) return toast('❌ กรุณากรอกชื่อบริการ', 'error');

    const data = {
      category,
      name,
      description: gv('ns_desc'),
      price_start: parseInt(gv('ns_price')) || 0,
      price_unit: gv('ns_unit') || 'รายการ',
      icon: gv('ns_icon') || '🔧',
      image_url: getImageValue('ns_image'),
      sort_order: parseInt(gv('ns_sort')) || 0,
      is_active: document.getElementById('ns_active')?.checked ? 1 : 0
    };
    await api('/api/admin/services', { method: 'POST', body: JSON.stringify(data) });
    closeModal();
    await loadDbServices();
    renderDbServices();
    toast('✅ สร้างบริการสำเร็จ');
  } catch (err) {
    toast('❌ สร้างไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function editDbService(id) {
  const s = allDbServices.find(x => x.id === id);
  if (!s) return;
  const catOptions = [...new Set([...dbCategories, s.category])].map(c => `<option value="${esc(c)}" ${c === s.category ? 'selected' : ''}>${esc(c)}</option>`).join('');
  document.getElementById('modalTitle').textContent = '✏️ แก้ไขบริการ';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-row">
      <div class="form-group"><label>หมวดหมู่</label>
        <div style="display:flex;gap:8px">
          <select id="es_category" style="flex:1">${catOptions}<option value="__new__">+ หมวดหมู่ใหม่</option></select>
          <input type="text" id="es_category_new" placeholder="ชื่อหมวดหมู่ใหม่" style="display:none;flex:1">
        </div>
      </div>
      <div class="form-group"><label>ชื่อบริการ *</label><input type="text" id="es_name" value="${esc(s.name)}"></div>
    </div>
    <div class="form-group"><label>รายละเอียด</label><textarea id="es_desc" rows="3">${esc(s.description || '')}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>ราคาเริ่มต้น</label><input type="number" id="es_price" value="${s.price_start || 0}" min="0"></div>
      <div class="form-group"><label>หน่วยราคา</label><input type="text" id="es_unit" value="${esc(s.price_unit || 'รายการ')}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>ไอคอน (emoji)</label><input type="text" id="es_icon" value="${esc(s.icon || '')}"></div>
      <div class="form-group"><label>ลำดับ</label><input type="number" id="es_sort" value="${s.sort_order || 0}" min="0"></div>
    </div>
    ${imageField('es_image', s.image_url, 'รูปภาพ')}
    <div class="form-group"><label><input type="checkbox" id="es_active" ${s.is_active ? 'checked' : ''}> เปิดใช้</label></div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary" onclick="saveDbService(${id})">💾 บันทึก</button>
      <button class="btn btn-danger btn-sm" onclick="deleteDbService(${id}, '${esc(s.name)}')">🗑️ ลบ</button>
    </div>
  `;
  document.getElementById('leadModal').classList.add('show');
  document.getElementById('es_category').addEventListener('change', function() {
    document.getElementById('es_category_new').style.display = this.value === '__new__' ? '' : 'none';
  });
}

async function saveDbService(id) {
  try {
    let category = gv('es_category');
    if (category === '__new__') category = gv('es_category_new').trim();
    if (!category) return toast('❌ กรุณาเลือกหมวดหมู่', 'error');

    const data = {
      category,
      name: gv('es_name').trim(),
      description: gv('es_desc'),
      price_start: parseInt(gv('es_price')) || 0,
      price_unit: gv('es_unit') || 'รายการ',
      icon: gv('es_icon') || '',
      image_url: getImageValue('es_image'),
      sort_order: parseInt(gv('es_sort')) || 0,
      is_active: document.getElementById('es_active')?.checked ? 1 : 0
    };
    await api(`/api/admin/services/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    closeModal();
    await loadDbServices();
    renderDbServices();
    toast('✅ บันทึกสำเร็จ');
  } catch (err) {
    toast('❌ บันทึกไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function toggleServiceActive(id, newActive) {
  try {
    await api(`/api/admin/services/${id}`, { method: 'PUT', body: JSON.stringify({ is_active: newActive }) });
    const s = allDbServices.find(x => x.id === id);
    if (s) s.is_active = newActive;
    renderDbServices();
    toast(newActive ? '✅ เปิดใช้บริการ' : '⏸️ ปิดใช้บริการ');
  } catch (err) {
    toast('❌ อัพเดทไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function deleteDbService(id, name) {
  if (!confirm(`ลบบริการ "${name}"?\nการดำเนินการนี้จะลบรูป Gallery และ 3D Models ที่เกี่ยวข้องด้วย`)) return;
  try {
    await api(`/api/admin/services/${id}`, { method: 'DELETE' });
    allDbServices = allDbServices.filter(s => s.id !== id);
    renderDbServices();
    document.getElementById('dbServicesCount').textContent = allDbServices.length;
    toast('🗑️ ลบบริการสำเร็จ');
  } catch (err) {
    toast('❌ ลบไม่สำเร็จ: ' + err.message, 'error');
  }
}

// ===== PACKAGE MANAGEMENT =====
function showAddPackageModal() {
  document.getElementById('modalTitle').textContent = '➕ เพิ่มแพ็กเกจใหม่';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>ชื่อแพ็กเกจ *</label><input type="text" id="np_name"></div>
    <div class="form-group"><label>รายละเอียด</label><textarea id="np_desc" rows="2"></textarea></div>
    <div class="form-row">
      <div class="form-group"><label>ราคาเริ่มต้น</label><input type="number" id="np_price" value="0" min="0"></div>
      <div class="form-group"><label>ลำดับ</label><input type="number" id="np_sort" value="0" min="0"></div>
    </div>
    <div class="form-group"><label>Features (JSON Array)</label><textarea id="np_features" rows="4" placeholder='["แปลนบ้าน 2D","3D Perspective 2 มุม","BOQ / ประมาณราคา"]'>[]</textarea></div>
    <div class="form-group"><label><input type="checkbox" id="np_featured"> ⭐ แนะนำ</label></div>
    <div class="form-group"><label><input type="checkbox" id="np_active" checked> เปิดใช้</label></div>
    <button class="btn btn-primary" onclick="createDbPackage()">💾 สร้างแพ็กเกจ</button>
  `;
  document.getElementById('leadModal').classList.add('show');
}

async function createDbPackage() {
  try {
    const name = gv('np_name').trim();
    if (!name) return toast('❌ กรุณากรอกชื่อแพ็กเกจ', 'error');
    let features = [];
    try { features = JSON.parse(gv('np_features') || '[]'); } catch { return toast('❌ Features ต้องเป็น JSON Array', 'error'); }

    const data = {
      name,
      description: gv('np_desc'),
      price_start: parseInt(gv('np_price')) || 0,
      features,
      is_featured: document.getElementById('np_featured')?.checked ? 1 : 0,
      sort_order: parseInt(gv('np_sort')) || 0,
      is_active: document.getElementById('np_active')?.checked ? 1 : 0
    };
    await api('/api/admin/service-packages', { method: 'POST', body: JSON.stringify(data) });
    closeModal();
    await loadDbServices();
    renderDbPackages();
    toast('✅ สร้างแพ็กเกจสำเร็จ');
  } catch (err) {
    toast('❌ สร้างไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function editDbPackage(id) {
  const p = allDbPackages.find(x => x.id === id);
  if (!p) return;
  let featuresStr = '[]';
  try { featuresStr = JSON.stringify(typeof p.features === 'string' ? JSON.parse(p.features) : p.features || [], null, 2); } catch { featuresStr = p.features || '[]'; }

  document.getElementById('modalTitle').textContent = '✏️ แก้ไขแพ็กเกจ';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>ชื่อแพ็กเกจ *</label><input type="text" id="ep_name" value="${esc(p.name)}"></div>
    <div class="form-group"><label>รายละเอียด</label><textarea id="ep_desc" rows="2">${esc(p.description || '')}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>ราคาเริ่มต้น</label><input type="number" id="ep_price" value="${p.price_start || 0}" min="0"></div>
      <div class="form-group"><label>ลำดับ</label><input type="number" id="ep_sort" value="${p.sort_order || 0}" min="0"></div>
    </div>
    <div class="form-group"><label>Features (JSON Array)</label><textarea id="ep_features" rows="4">${esc(featuresStr)}</textarea></div>
    <div class="form-group"><label><input type="checkbox" id="ep_featured" ${p.is_featured ? 'checked' : ''}> ⭐ แนะนำ</label></div>
    <div class="form-group"><label><input type="checkbox" id="ep_active" ${p.is_active ? 'checked' : ''}> เปิดใช้</label></div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary" onclick="saveDbPackage(${id})">💾 บันทึก</button>
      <button class="btn btn-danger btn-sm" onclick="deleteDbPackage(${id}, '${esc(p.name)}')">🗑️ ลบ</button>
    </div>
  `;
  document.getElementById('leadModal').classList.add('show');
}

async function saveDbPackage(id) {
  try {
    let features = null;
    try { features = JSON.stringify(JSON.parse(gv('ep_features') || '[]')); } catch { return toast('❌ Features ต้องเป็น JSON Array', 'error'); }

    const data = {
      name: gv('ep_name').trim(),
      description: gv('ep_desc'),
      price_start: parseInt(gv('ep_price')) || 0,
      features,
      is_featured: document.getElementById('ep_featured')?.checked ? 1 : 0,
      sort_order: parseInt(gv('ep_sort')) || 0,
      is_active: document.getElementById('ep_active')?.checked ? 1 : 0
    };
    await api(`/api/admin/service-packages/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    closeModal();
    await loadDbServices();
    renderDbPackages();
    toast('✅ บันทึกสำเร็จ');
  } catch (err) {
    toast('❌ บันทึกไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function deleteDbPackage(id, name) {
  if (!confirm(`ลบแพ็กเกจ "${name}"?`)) return;
  try {
    await api(`/api/admin/service-packages/${id}`, { method: 'DELETE' });
    allDbPackages = allDbPackages.filter(p => p.id !== id);
    renderDbPackages();
    document.getElementById('dbPackagesCount').textContent = allDbPackages.length;
    toast('🗑️ ลบแพ็กเกจสำเร็จ');
  } catch (err) {
    toast('❌ ลบไม่สำเร็จ: ' + err.message, 'error');
  }
}

// ===== SERVICE GALLERY MANAGEMENT =====
let allSvcGallery = [];

async function loadSvcGallery() {
  try {
    allSvcGallery = await api('/api/admin/gallery');
    document.getElementById('svcGalleryCount').textContent = allSvcGallery.length;
  } catch { allSvcGallery = []; }
}

function renderSvcGallery() {
  const serviceFilter = document.getElementById('svcGalleryServiceFilter')?.value || '';
  const catFilter = document.getElementById('svcGalleryCategoryFilter')?.value || '';
  const typeFilter = document.getElementById('svcGalleryTypeFilter')?.value || '';

  let filtered = allSvcGallery;
  if (serviceFilter) filtered = filtered.filter(g => String(g.service_id) === serviceFilter);
  if (catFilter) filtered = filtered.filter(g => g.service_category === catFilter);
  if (typeFilter) filtered = filtered.filter(g => g.image_type === typeFilter);

  const body = document.getElementById('svcGalleryBody');
  if (!body) return;
  body.innerHTML = filtered.length === 0
    ? '<tr><td colspan="8" style="text-align:center;color:#999;padding:40px">ไม่พบรูปภาพ</td></tr>'
    : filtered.map(g => `
        <tr>
          <td>${g.id}</td>
          <td><img src="${esc(g.image_url)}" alt="" style="width:64px;height:48px;object-fit:cover;border-radius:8px;cursor:pointer" onclick="window.open('${esc(g.image_url)}','_blank')" onerror="this.style.display='none'"></td>
          <td>${esc(g.title || '-')}</td>
          <td>${esc(g.service_name || '-')}</td>
          <td><span class="badge">${esc(g.service_category || '-')}</span></td>
          <td>${g.image_type === 'render' ? '🖼️ Render' : '📷 Photo'}</td>
          <td>${g.sort_order || 0}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="editSvcGallery(${g.id})">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteSvcGallery(${g.id}, '${esc(g.title || 'รูป ID ' + g.id)}')">🗑️</button>
          </td>
        </tr>
      `).join('');
}

function populateGalleryFilters() {
  const serviceSelect = document.getElementById('svcGalleryServiceFilter');
  const catSelect = document.getElementById('svcGalleryCategoryFilter');
  if (!serviceSelect || !catSelect) return;

  const services = [...new Map(allSvcGallery.map(g => [g.service_id, { id: g.service_id, name: g.service_name || 'ID:' + g.service_id }])).values()].filter(s => s.id);
  const categories = [...new Set(allSvcGallery.map(g => g.service_category).filter(Boolean))];

  serviceSelect.innerHTML = '<option value="">ทุกบริการ</option>' + services.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  catSelect.innerHTML = '<option value="">ทุกหมวดหมู่</option>' + categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
}

function showAddGalleryModal() {
  const serviceOptions = allDbServices.filter(s => s.is_active).map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.category)})</option>`).join('');
  document.getElementById('modalTitle').textContent = '➕ เพิ่มรูป Gallery';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>บริการ *</label><select id="ag_service">${serviceOptions}</select></div>
    <div class="form-group"><label>ชื่อรูป</label><input type="text" id="ag_title" placeholder="เช่น ห้องนั่งเล่น Modern Luxury"></div>
    <div class="form-group"><label>รายละเอียด</label><textarea id="ag_desc" rows="2"></textarea></div>
    <div class="form-group"><label>URL รูปภาพ *</label><input type="text" id="ag_url" placeholder="https://... หรือ /uploads/..."></div>
    <div class="form-group"><label>อัพโหลดไฟล์</label><input type="file" id="ag_file" accept="image/*"></div>
    <div class="form-row">
      <div class="form-group"><label>ประเภท</label>
        <select id="ag_type"><option value="photo">📷 รูปถ่าย</option><option value="render">🖼️ 3D Render</option></select>
      </div>
      <div class="form-group"><label>ลำดับ</label><input type="number" id="ag_sort" value="0" min="0"></div>
    </div>
    <button class="btn btn-primary" onclick="createSvcGallery()">💾 บันทึก</button>
  `;
  document.getElementById('leadModal').classList.add('show');
}

async function createSvcGallery() {
  try {
    const serviceId = gv('ag_service');
    if (!serviceId) return toast('❌ กรุณาเลือกบริการ', 'error');
    const fileInput = document.getElementById('ag_file');
    const hasFile = fileInput && fileInput.files.length > 0;
    const url = gv('ag_url').trim();
    if (!hasFile && !url) return toast('❌ กรุณาอัพโหลดรูปหรือใส่ URL', 'error');

    if (hasFile) {
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
      formData.append('title', gv('ag_title'));
      formData.append('description', gv('ag_desc'));
      formData.append('image_type', gv('ag_type'));
      await fetch(`/api/services/${serviceId}/gallery`, { method: 'POST', body: formData, credentials: 'include' }).then(r => { if (!r.ok) throw new Error('Upload failed'); return r.json(); });
    } else {
      await api(`/api/services/${serviceId}/gallery`, {
        method: 'POST',
        body: JSON.stringify({ title: gv('ag_title'), description: gv('ag_desc'), image_url: url, image_type: gv('ag_type'), sort_order: parseInt(gv('ag_sort')) || 0 })
      });
    }
    closeModal();
    await loadSvcGallery();
    populateGalleryFilters();
    renderSvcGallery();
    toast('✅ เพิ่มรูปสำเร็จ');
  } catch (err) {
    toast('❌ เพิ่มไม่สำเร็จ: ' + err.message, 'error');
  }
}

function editSvcGallery(id) {
  const g = allSvcGallery.find(x => x.id === id);
  if (!g) return;
  document.getElementById('modalTitle').textContent = '✏️ แก้ไขรูป Gallery';
  document.getElementById('modalBody').innerHTML = `
    <div style="margin-bottom:16px;text-align:center">
      <img src="${esc(g.image_url)}" alt="" style="max-width:100%;max-height:200px;border-radius:12px;object-fit:cover" onerror="this.style.display='none'">
    </div>
    <div class="form-group"><label>ชื่อรูป</label><input type="text" id="eg_title" value="${esc(g.title || '')}"></div>
    <div class="form-group"><label>รายละเอียด</label><textarea id="eg_desc" rows="2">${esc(g.description || '')}</textarea></div>
    <div class="form-group"><label>URL รูปภาพ</label><input type="text" id="eg_url" value="${esc(g.image_url)}"></div>
    <div class="form-group"><label>อัพโหลดไฟล์ใหม่</label><input type="file" id="eg_file" accept="image/*"></div>
    <div class="form-row">
      <div class="form-group"><label>ประเภท</label>
        <select id="eg_type"><option value="photo" ${g.image_type === 'photo' ? 'selected' : ''}>📷 รูปถ่าย</option><option value="render" ${g.image_type === 'render' ? 'selected' : ''}>🖼️ 3D Render</option></select>
      </div>
      <div class="form-group"><label>ลำดับ</label><input type="number" id="eg_sort" value="${g.sort_order || 0}" min="0"></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary" onclick="saveSvcGallery(${id})">💾 บันทึก</button>
      <button class="btn btn-danger btn-sm" onclick="deleteSvcGallery(${id}, '${esc(g.title || 'รูป ID ' + g.id)}')">🗑️ ลบ</button>
    </div>
  `;
  document.getElementById('leadModal').classList.add('show');
}

async function saveSvcGallery(id) {
  try {
    const fileInput = document.getElementById('eg_file');
    const hasFile = fileInput && fileInput.files.length > 0;

    if (hasFile) {
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
      formData.append('title', gv('eg_title'));
      formData.append('description', gv('eg_desc'));
      formData.append('image_type', gv('eg_type'));
      formData.append('image_url', gv('eg_url'));
      formData.append('sort_order', gv('eg_sort'));
      await fetch(`/api/gallery/${id}`, { method: 'PUT', body: formData, credentials: 'include' }).then(r => { if (!r.ok) throw new Error('Update failed'); return r.json(); });
    } else {
      await api(`/api/gallery/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: gv('eg_title'), description: gv('eg_desc'), image_url: gv('eg_url'), image_type: gv('eg_type'), sort_order: parseInt(gv('eg_sort')) || 0 })
      });
    }
    closeModal();
    await loadSvcGallery();
    populateGalleryFilters();
    renderSvcGallery();
    toast('✅ บันทึกสำเร็จ');
  } catch (err) {
    toast('❌ บันทึกไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function deleteSvcGallery(id, name) {
  if (!confirm(`ลบรูป "${name}"?`)) return;
  try {
    await api(`/api/gallery/${id}`, { method: 'DELETE' });
    allSvcGallery = allSvcGallery.filter(g => g.id !== id);
    renderSvcGallery();
    document.getElementById('svcGalleryCount').textContent = allSvcGallery.length;
    toast('🗑️ ลบรูปสำเร็จ');
  } catch (err) {
    toast('❌ ลบไม่สำเร็จ: ' + err.message, 'error');
  }
}

// ===== SERVICE 3D MODELS MANAGEMENT =====
let allSvcModels = [];

async function loadSvcModels() {
  try {
    allSvcModels = await api('/api/admin/models');
    document.getElementById('svcModelsCount').textContent = allSvcModels.length;
  } catch { allSvcModels = []; }
}

function renderSvcModels() {
  const serviceFilter = document.getElementById('svcModelsServiceFilter')?.value || '';
  const catFilter = document.getElementById('svcModelsCategoryFilter')?.value || '';

  let filtered = allSvcModels;
  if (serviceFilter) filtered = filtered.filter(m => String(m.service_id) === serviceFilter);
  if (catFilter) filtered = filtered.filter(m => m.service_category === catFilter);

  const body = document.getElementById('svcModelsBody');
  if (!body) return;
  body.innerHTML = filtered.length === 0
    ? '<tr><td colspan="7" style="text-align:center;color:#999;padding:40px">ไม่พบโมเดล 3D</td></tr>'
    : filtered.map(m => `
        <tr>
          <td>${m.id}</td>
          <td>${m.poster_url ? `<img src="${esc(m.poster_url)}" alt="" style="width:64px;height:48px;object-fit:cover;border-radius:8px">` : '<div style="width:64px;height:48px;background:#1a1a2e;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#666;font-size:0.7rem">3D</div>'}</td>
          <td>${esc(m.title || '-')}</td>
          <td>${esc(m.service_name || '-')}</td>
          <td><span class="badge">${esc(m.service_category || '-')}</span></td>
          <td>${esc((m.model_format || 'glb').toUpperCase())}</td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="editSvcModel(${m.id})">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteSvcModel(${m.id}, '${esc(m.title || 'โมเดล ID ' + m.id)}')">🗑️</button>
          </td>
        </tr>
      `).join('');
}

function populateModelsFilters() {
  const serviceSelect = document.getElementById('svcModelsServiceFilter');
  const catSelect = document.getElementById('svcModelsCategoryFilter');
  if (!serviceSelect || !catSelect) return;

  const services = [...new Map(allSvcModels.map(m => [m.service_id, { id: m.service_id, name: m.service_name || 'ID:' + m.service_id }])).values()].filter(s => s.id);
  const categories = [...new Set(allSvcModels.map(m => m.service_category).filter(Boolean))];

  serviceSelect.innerHTML = '<option value="">ทุกบริการ</option>' + services.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  catSelect.innerHTML = '<option value="">ทุกหมวดหมู่</option>' + categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
}

function showAddModelModal() {
  const serviceOptions = allDbServices.filter(s => s.is_active).map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.category)})</option>`).join('');
  document.getElementById('modalTitle').textContent = '➕ เพิ่มโมเดล 3D';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>บริการ *</label><select id="am_service">${serviceOptions}</select></div>
    <div class="form-group"><label>ชื่อโมเดล *</label><input type="text" id="am_title" placeholder="เช่น ห้องนั่งเล่น Modern"></div>
    <div class="form-group"><label>รายละเอียด</label><textarea id="am_desc" rows="2"></textarea></div>
    <div style="background:var(--off-white);border-radius:12px;padding:16px;margin-bottom:16px">
      <div class="form-group"><label>📁 อัพโหลดไฟล์โมเดล (.glb/.gltf)</label><input type="file" id="am_file" accept=".glb,.gltf,.obj"></div>
      <div style="text-align:center;color:var(--gray-300);font-size:0.85rem;margin:8px 0">— หรือใส่ URL —</div>
      <div class="form-group"><label>🔗 URL โมเดล 3D</label><input type="text" id="am_url" placeholder="https://...model.glb"></div>
    </div>
    <div style="background:var(--off-white);border-radius:12px;padding:16px;margin-bottom:16px">
      <div class="form-group"><label>📁 อัพโหลดรูปโปสเตอร์</label><input type="file" id="am_poster_file" accept="image/*"></div>
      <div style="text-align:center;color:var(--gray-300);font-size:0.85rem;margin:8px 0">— หรือใส่ URL —</div>
      <div class="form-group"><label>🔗 URL รูปโปสเตอร์</label><input type="text" id="am_poster" placeholder="https://...poster.jpg"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Format</label>
        <select id="am_format"><option value="glb">GLB</option><option value="gltf">GLTF</option></select>
      </div>
      <div class="form-group"><label>หมุนอัตโนมัติ</label>
        <select id="am_rotate"><option value="1">เปิด</option><option value="0">ปิด</option></select>
      </div>
    </div>
    <div class="form-group"><label>มุมกล้อง</label><input type="text" id="am_orbit" value="0deg 75deg 105%" placeholder="0deg 75deg 105%"></div>
    <button class="btn btn-primary" onclick="createSvcModel()">💾 บันทึก</button>
  `;
  document.getElementById('leadModal').classList.add('show');
}

async function createSvcModel() {
  try {
    const serviceId = gv('am_service');
    const title = gv('am_title').trim();
    const modelFile = document.getElementById('am_file')?.files?.[0];
    const modelUrl = gv('am_url').trim();
    if (!serviceId) return toast('❌ กรุณาเลือกบริการ', 'error');
    if (!title) return toast('❌ กรุณากรอกชื่อโมเดล', 'error');
    if (!modelFile && !modelUrl) return toast('❌ กรุณาอัพโหลดไฟล์โมเดลหรือใส่ URL', 'error');

    const posterFile = document.getElementById('am_poster_file')?.files?.[0];

    if (modelFile || posterFile) {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', gv('am_desc'));
      formData.append('model_format', gv('am_format'));
      formData.append('auto_rotate', gv('am_rotate'));
      formData.append('camera_orbit', gv('am_orbit'));
      if (modelFile) formData.append('model_file', modelFile);
      else if (modelUrl) formData.append('model_url', modelUrl);
      if (posterFile) formData.append('poster_file', posterFile);
      else if (gv('am_poster')) formData.append('poster_url', gv('am_poster'));

      await fetch(`/api/services/${serviceId}/models`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      }).then(r => { if (!r.ok) throw new Error('Upload failed'); return r.json(); });
    } else {
      // URL only — use JSON
      await api(`/api/services/${serviceId}/models`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: gv('am_desc'),
          model_url: modelUrl,
          model_format: gv('am_format'),
          poster_url: gv('am_poster'),
          auto_rotate: parseInt(gv('am_rotate')),
          camera_orbit: gv('am_orbit')
        })
      });
    }
    closeModal();
    await loadSvcModels();
    populateModelsFilters();
    renderSvcModels();
    toast('✅ เพิ่มโมเดลสำเร็จ');
  } catch (err) {
    toast('❌ เพิ่มไม่สำเร็จ: ' + err.message, 'error');
  }
}

function editSvcModel(id) {
  const m = allSvcModels.find(x => x.id === id);
  if (!m) return;
  document.getElementById('modalTitle').textContent = '✏️ แก้ไขโมเดล 3D';
  document.getElementById('modalBody').innerHTML = `
    ${m.poster_url ? `<div style="margin-bottom:16px;text-align:center"><img src="${esc(m.poster_url)}" alt="" style="max-width:100%;max-height:200px;border-radius:12px;object-fit:cover"></div>` : ''}
    <div class="form-group"><label>ชื่อโมเดล *</label><input type="text" id="em_title" value="${esc(m.title || '')}"></div>
    <div class="form-group"><label>รายละเอียด</label><textarea id="em_desc" rows="2">${esc(m.description || '')}</textarea></div>
    <div style="background:var(--off-white);border-radius:12px;padding:16px;margin-bottom:16px">
      <div class="form-group"><label>📁 อัพโหลดไฟล์โมเดลใหม่ (.glb/.gltf)</label><input type="file" id="em_file" accept=".glb,.gltf,.obj"></div>
      <div style="text-align:center;color:var(--gray-300);font-size:0.85rem;margin:8px 0">— หรือแก้ URL —</div>
      <div class="form-group"><label>🔗 URL โมเดล 3D</label><input type="text" id="em_url" value="${esc(m.model_url || '')}"></div>
    </div>
    <div style="background:var(--off-white);border-radius:12px;padding:16px;margin-bottom:16px">
      <div class="form-group"><label>📁 อัพโหลดรูปโปสเตอร์ใหม่</label><input type="file" id="em_poster_file" accept="image/*"></div>
      <div style="text-align:center;color:var(--gray-300);font-size:0.85rem;margin:8px 0">— หรือแก้ URL —</div>
      <div class="form-group"><label>🔗 URL รูปโปสเตอร์</label><input type="text" id="em_poster" value="${esc(m.poster_url || '')}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Format</label>
        <select id="em_format"><option value="glb" ${m.model_format === 'glb' ? 'selected' : ''}>GLB</option><option value="gltf" ${m.model_format === 'gltf' ? 'selected' : ''}>GLTF</option></select>
      </div>
      <div class="form-group"><label>หมุนอัตโนมัติ</label>
        <select id="em_rotate"><option value="1" ${m.auto_rotate ? 'selected' : ''}>เปิด</option><option value="0" ${!m.auto_rotate ? 'selected' : ''}>ปิด</option></select>
      </div>
    </div>
    <div class="form-group"><label>มุมกล้อง</label><input type="text" id="em_orbit" value="${esc(m.camera_orbit || '0deg 75deg 105%')}"></div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary" onclick="saveSvcModel(${id})">💾 บันทึก</button>
      <button class="btn btn-danger btn-sm" onclick="deleteSvcModel(${id}, '${esc(m.title || 'โมเดล ID ' + m.id)}')">🗑️ ลบ</button>
    </div>
  `;
  document.getElementById('leadModal').classList.add('show');
}

async function saveSvcModel(id) {
  try {
    const title = gv('em_title').trim();
    const modelFile = document.getElementById('em_file')?.files?.[0];
    const modelUrl = gv('em_url').trim();
    if (!title) return toast('❌ กรุณากรอกชื่อโมเดล', 'error');
    if (!modelFile && !modelUrl) return toast('❌ กรุณาอัพโหลดไฟล์โมเดลหรือใส่ URL', 'error');

    const posterFile = document.getElementById('em_poster_file')?.files?.[0];

    if (modelFile || posterFile) {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', gv('em_desc'));
      formData.append('model_format', gv('em_format'));
      formData.append('auto_rotate', gv('em_rotate'));
      formData.append('camera_orbit', gv('em_orbit'));
      if (modelFile) formData.append('model_file', modelFile);
      else if (modelUrl) formData.append('model_url', modelUrl);
      if (posterFile) formData.append('poster_file', posterFile);
      else if (gv('em_poster')) formData.append('poster_url', gv('em_poster'));

      await fetch(`/api/models/${id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      }).then(r => { if (!r.ok) throw new Error('Update failed'); return r.json(); });
    } else {
      await api(`/api/models/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title,
          description: gv('em_desc'),
          model_url: modelUrl,
          model_format: gv('em_format'),
          poster_url: gv('em_poster'),
          auto_rotate: parseInt(gv('em_rotate')),
          camera_orbit: gv('em_orbit')
        })
      });
    }
    closeModal();
    await loadSvcModels();
    populateModelsFilters();
    renderSvcModels();
    toast('✅ บันทึกสำเร็จ');
  } catch (err) {
    toast('❌ บันทึกไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function deleteSvcModel(id, name) {
  if (!confirm(`ลบโมเดล "${name}"?`)) return;
  try {
    await api(`/api/models/${id}`, { method: 'DELETE' });
    allSvcModels = allSvcModels.filter(m => m.id !== id);
    renderSvcModels();
    document.getElementById('svcModelsCount').textContent = allSvcModels.length;
    toast('🗑️ ลบโมเดลสำเร็จ');
  } catch (err) {
    toast('❌ ลบไม่สำเร็จ: ' + err.message, 'error');
  }
}

// Hook into showPage to load DB services
const _origShowPage = showPage;
showPage = function(pageId) {
  _origShowPage(pageId);
  if (pageId === 'db-services') {
    loadDbServices().then(() => { renderDbServices(); renderDbPackages(); });
  }
  if (pageId === 'svc-gallery') {
    loadSvcGallery().then(() => { populateGalleryFilters(); renderSvcGallery(); });
  }
  if (pageId === 'svc-models') {
    loadSvcModels().then(() => { populateModelsFilters(); renderSvcModels(); });
  }
};

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

// ===== TRUST BADGES FORM =====
function renderTrustBadgesForm() {
  const b = allContent.trust_badges || {};
  const brands = (b.brands || []).join(', ');
  document.getElementById('badgesForm').innerHTML = `
    <div class="form-section">
      <h3>🏷️ ตั้งค่าแบรนด์</h3>
      <div class="form-group">
        <label>หัวข้อ</label>
        <input type="text" id="b_label" value="${esc(b.label || '')}" placeholder="วัสดุคุณภาพจากแบรนด์ชั้นนำ">
      </div>
      <div class="form-group">
        <label>แบรนด์ (คั่นด้วย comma)</label>
        <input type="text" id="b_brands" value="${esc(brands)}" placeholder="SCG, TOA, COTTO, STIEBEL, DAIKIN, KARAT">
        <small style="color:var(--gray-400);font-size:0.8rem">ใส่ชื่อแบรนด์คั่นด้วยเครื่องหมาย comma (,)</small>
      </div>
      <div style="margin-top:16px;padding:16px;background:var(--gray-50);border-radius:10px">
        <p style="font-size:0.82rem;color:var(--gray-500);margin-bottom:12px">ตัวอย่างการแสดงผล:</p>
        <div id="badgesPreview" style="display:flex;gap:24px;flex-wrap:wrap;align-items:center;justify-content:center"></div>
      </div>
    </div>
    <button type="button" class="btn btn-primary" onclick="saveBadges()" style="margin-top:16px">💾 บันทึกแบรนด์</button>
  `;
  updateBadgesPreview();
  document.getElementById('b_brands').addEventListener('input', updateBadgesPreview);
  document.getElementById('b_label').addEventListener('input', updateBadgesPreview);
}

function updateBadgesPreview() {
  const label = document.getElementById('b_label')?.value || '';
  const brandsStr = document.getElementById('b_brands')?.value || '';
  const brands = brandsStr.split(',').map(s => s.trim()).filter(Boolean);
  const preview = document.getElementById('badgesPreview');
  if (!preview) return;
  preview.innerHTML = `
    <div style="width:100%;text-align:center;font-size:0.72rem;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--gray-500);margin-bottom:8px">${esc(label)}</div>
    ${brands.map(b => `<div style="opacity:0.7;color:var(--gray-600);font-weight:800;font-size:0.9rem;letter-spacing:1px">${esc(b)}</div>`).join('')}
  `;
}

async function saveBadges() {
  const data = {
    label: gv('b_label'),
    brands: gv('b_brands').split(',').map(s => s.trim()).filter(Boolean)
  };
  await api('/api/content/trust_badges', { method: 'PUT', body: JSON.stringify(data) });
  allContent.trust_badges = data;
  toast('✅ บันทึกแบรนด์สำเร็จ');
}

// ===== NOTIFICATIONS FORM =====
function renderNotificationsForm() {
  const n = allContent.notification_settings || {};
  const webhookUrl = window.location.origin + '/api/line/webhook';
  document.getElementById('notificationsForm').innerHTML = `
    <div class="form-section">
      <h3>📱 LINE Messaging API</h3>
      <p style="font-size:0.85rem;color:var(--gray-400);margin-bottom:16px">
        แจ้งเตือนทันทีเมื่อมี Lead ใหม่ผ่าน LINE Messaging API — ไปที่
        <a href="https://developers.line.biz/console/" target="_blank" style="color:var(--red)">LINE Developers Console</a>
        เพื่อสร้าง Channel และรับ Token
      </p>
      <div class="form-group">
        <label>
          <input type="checkbox" id="nt_line_messaging_enabled" ${n.line_messaging_enabled ? 'checked' : ''} style="margin-right:8px">
          เปิดใช้ LINE Messaging API
        </label>
      </div>
      <div class="form-group">
        <label>Channel Access Token</label>
        <input type="text" id="nt_line_channel_access_token" value="${esc(n.line_channel_access_token || '')}" placeholder="ใส่ Channel Access Token จาก LINE Developers">
      </div>
      <div class="form-group">
        <label>Channel Secret (สำหรับ Webhook)</label>
        <input type="text" id="nt_line_channel_secret" value="${esc(n.line_channel_secret || '')}" placeholder="ใส่ Channel Secret จาก LINE Developers">
      </div>
      <div class="form-group">
        <label>LINE User ID หรือ Group ID</label>
        <input type="text" id="nt_line_user_id" value="${esc(n.line_user_id || '')}" placeholder="ใส่ User ID หรือ Group ID สำหรับรับข้อความ">
        <small>สามารถดู User ID ได้จาก webhook หรือ LINE Official Account Manager</small>
      </div>
      <div class="form-group" style="background:#f0fff0;padding:12px 16px;border-radius:8px;border-left:4px solid #4ADE80;">
        <label style="font-weight:600;color:#16a34a;">🔗 LINE Webhook URL</label>
        <code style="display:block;padding:8px;background:#fff;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;margin-top:4px;word-break:break-all;">${webhookUrl}</code>
        <small>ตั้ง Webhook URL นี้ใน LINE Developers Console → Messaging API settings</small>
      </div>
    </div>
    <div class="form-section">
      <h3>📧 Email Notification</h3>
      <p style="font-size:0.85rem;color:var(--gray-400);margin-bottom:16px">
        ส่งอีเมลแจ้งเตือนเมื่อมี Lead ใหม่ + Follow-up Reminder — ใช้ Gmail SMTP หรือ SMTP ใดก็ได้
      </p>
      <div class="form-group">
        <label>
          <input type="checkbox" id="nt_email_enabled" ${n.email_enabled ? 'checked' : ''} style="margin-right:8px">
          เปิดใช้ Email Notification
        </label>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>SMTP Host</label>
          <input type="text" id="nt_smtp_host" value="${esc(n.smtp_host || 'smtp.gmail.com')}" placeholder="smtp.gmail.com">
        </div>
        <div class="form-group">
          <label>SMTP Port</label>
          <input type="text" id="nt_smtp_port" value="${esc(n.smtp_port || '587')}" placeholder="587">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>SMTP Username (อีเมล)</label>
          <input type="email" id="nt_smtp_user" value="${esc(n.smtp_user || '')}" placeholder="your-email@gmail.com">
        </div>
        <div class="form-group">
          <label>SMTP Password (App Password)</label>
          <input type="password" id="nt_smtp_pass" value="${esc(n.smtp_pass || '')}" placeholder="App Password 16 หลัก">
          <small>สำหรับ Gmail: ไปที่ Google Account → Security → 2-Step Verification → App Passwords</small>
        </div>
      </div>
      <div class="form-group">
        <label>อีเมลผู้รับแจ้งเตือน</label>
        <input type="email" id="nt_notify_email" value="${esc(n.notify_email || '')}" placeholder="admin@nuchainnovation.com">
        <small>อีเมลที่จะรับแจ้งเตือนเมื่อมี Lead ใหม่ (ปล่อยว่าง = ใช้ SMTP Username)</small>
      </div>
    </div>
    <div class="form-section">
      <h3>📱 LINE Notify (Legacy)</h3>
      <p style="font-size:0.85rem;color:var(--gray-400);margin-bottom:16px">
        ระบบเก่า — แนะนำใช้ LINE Messaging API ด้านบนแทน
      </p>
      <div class="form-group">
        <label>
          <input type="checkbox" id="nt_line_enabled" ${n.line_notify_enabled !== false ? 'checked' : ''} style="margin-right:8px">
          เปิดใช้ LINE Notify (Legacy)
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
      <button type="button" class="btn btn-outline" onclick="testEmailNotification()" style="margin-left:8px">📧 ทดสอบ Email</button>
    </div>
  `;
}

async function saveNotifications() {
  const data = {
    line_messaging_enabled: document.getElementById('nt_line_messaging_enabled')?.checked ?? false,
    line_channel_access_token: gv('nt_line_channel_access_token'),
    line_channel_secret: gv('nt_line_channel_secret'),
    line_user_id: gv('nt_line_user_id'),
    line_notify_enabled: document.getElementById('nt_line_enabled')?.checked ?? false,
    line_notify_token: gv('nt_line_token'),
    telegram_enabled: document.getElementById('nt_telegram_enabled')?.checked ?? false,
    telegram_bot_token: gv('nt_telegram_bot_token'),
    telegram_chat_id: gv('nt_telegram_chat_id'),
    email_enabled: document.getElementById('nt_email_enabled')?.checked ?? false,
    smtp_host: gv('nt_smtp_host'),
    smtp_port: gv('nt_smtp_port'),
    smtp_user: gv('nt_smtp_user'),
    smtp_pass: gv('nt_smtp_pass'),
    notify_email: gv('nt_notify_email'),
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

async function testEmailNotification() {
  try {
    const res = await api('/api/test-email', { method: 'POST' });
    toast('✅ ส่งอีเมลทดสอบสำเร็จ');
  } catch (err) {
    toast('❌ ส่งอีเมลไม่สำเร็จ: ' + err.message, 'error');
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
let selectedLeadIds = new Set();

function renderLeads() {
  const search = document.getElementById('leadSearch')?.value?.toLowerCase() || '';
  const filter = document.getElementById('leadFilter')?.value || '';
  let filtered = allLeads;
  if (search) filtered = filtered.filter(l => l.name.toLowerCase().includes(search) || l.phone.includes(search));
  if (filter) filtered = filtered.filter(l => l.status === filter);

  const statusClass = s => ({ 'New Lead': 'new', 'Contacted': 'contacted', 'Appointment Set': 'appointment', 'Proposal Sent': 'proposal', 'Closed Won': 'won', 'Closed Lost': 'lost' }[s] || 'new');

  document.getElementById('leadsBody').innerHTML = filtered.map(l => `
    <tr>
      <td><input type="checkbox" class="lead-checkbox" data-id="${l.id}" ${selectedLeadIds.has(l.id) ? 'checked' : ''} onchange="toggleLeadSelect(${l.id}, this.checked)"></td>
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
  updateBulkDeleteBtn();
}

function toggleLeadSelect(id, checked) {
  if (checked) selectedLeadIds.add(id); else selectedLeadIds.delete(id);
  updateBulkDeleteBtn();
}

function toggleSelectAll(checked) {
  if (checked === undefined) checked = selectedLeadIds.size === 0;
  document.querySelectorAll('.lead-checkbox').forEach(cb => {
    cb.checked = checked;
    const id = parseInt(cb.dataset.id);
    if (checked) selectedLeadIds.add(id); else selectedLeadIds.delete(id);
  });
  const master = document.getElementById('leadsSelectAll');
  if (master) master.checked = checked;
  updateBulkDeleteBtn();
}

function updateBulkDeleteBtn() {
  const btn = document.getElementById('bulkDeleteBtn');
  const count = document.getElementById('selectedCount');
  if (btn && count) {
    count.textContent = selectedLeadIds.size;
    btn.style.display = selectedLeadIds.size > 0 ? '' : 'none';
  }
}

async function bulkDeleteLeads() {
  if (selectedLeadIds.size === 0) return;
  if (!confirm(`ลบ ${selectedLeadIds.size} leads ที่เลือก?`)) return;
  try {
    await api('/api/leads/bulk-delete', { method: 'POST', body: JSON.stringify({ ids: [...selectedLeadIds] }) });
    allLeads = allLeads.filter(l => !selectedLeadIds.has(l.id));
    selectedLeadIds.clear();
    renderLeads();
    toast('🗑️ ลบ Leads สำเร็จ');
  } catch (err) {
    toast('❌ ลบไม่สำเร็จ: ' + err.message, 'error');
  }
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
      <span class="status-badge ${b.status === 'Closed Won' ? 'won' : 'new'}">${esc(b.status)}</span>
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
            <button class="copy-url" onclick="copyUrl('${esc(f.url).replace(/'/g, "\\'")}')">📋 Copy URL</button>
            <button class="delete-img" onclick="deleteMedia('${esc(f.name).replace(/'/g, "\\'")}')">🗑️</button>
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
      const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.url) toast('✅ อัพโหลด ' + file.name + ' สำเร็จ');
      else toast('❌ ' + (data.error || 'อัพโหลดล้มเหลว'), 'error');
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
    await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
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

// ===== MEDIA PICKER =====
let _mediaPickerCallback = null;
let _mediaPickerFiles = [];

async function openMediaPicker(callback) {
  _mediaPickerCallback = callback;
  const modal = document.getElementById('mediaPickerModal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  try {
    _mediaPickerFiles = await api('/api/media').catch(() => []);
    renderMediaPickerGrid(_mediaPickerFiles);
  } catch (err) {
    _mediaPickerFiles = [];
    document.getElementById('mediaPickerGrid').innerHTML = '<p style="color:var(--gray-400);text-align:center;grid-column:1/-1;padding:40px">ไม่สามารถโหลดคลังภาพได้</p>';
  }
  document.getElementById('mediaPickerSearch').value = '';
}

function closeMediaPicker() {
  document.getElementById('mediaPickerModal').style.display = 'none';
  document.body.style.overflow = '';
  _mediaPickerCallback = null;
}

function renderMediaPickerGrid(files) {
  const grid = document.getElementById('mediaPickerGrid');
  if (!files.length) {
    grid.innerHTML = '<p style="color:var(--gray-400);text-align:center;grid-column:1/-1;padding:40px">คลังภาพว่าง — อัพโหลดรูปก่อน</p>';
    return;
  }
  grid.innerHTML = files.map(f => `
    <div class="media-picker-item" onclick="selectMediaPicker('${esc(f.url).replace(/'/g, "\\'")}')" style="cursor:pointer;border-radius:10px;overflow:hidden;border:2px solid transparent;transition:all 0.2s;position:relative;aspect-ratio:1;background:var(--gray-100)">
      <img src="${esc(f.url)}" alt="${esc(f.name)}" style="width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.parentElement.style.display='none'">
      <div style="position:absolute;bottom:0;left:0;right:0;padding:6px 8px;background:linear-gradient(transparent,rgba(0,0,0,0.7));font-size:0.7rem;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.name)}</div>
    </div>
  `).join('');
}

function filterMediaPicker(query) {
  const q = query.toLowerCase();
  const filtered = _mediaPickerFiles.filter(f => f.name.toLowerCase().includes(q));
  renderMediaPickerGrid(filtered);
}

function selectMediaPicker(url) {
  if (_mediaPickerCallback) _mediaPickerCallback(url);
  closeMediaPicker();
}

// Add hover effect for media picker items
document.addEventListener('mouseover', (e) => {
  const item = e.target.closest('.media-picker-item');
  if (item) { item.style.borderColor = 'var(--red)'; item.style.transform = 'scale(1.03)'; }
});
document.addEventListener('mouseout', (e) => {
  const item = e.target.closest('.media-picker-item');
  if (item) { item.style.borderColor = 'transparent'; item.style.transform = 'scale(1)'; }
});

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
          <button class="btn btn-sm btn-outline" onclick="editUser(${u.id}, '${esc(u.full_name)}', '${esc(u.role)}')">✏️</button>
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
      <div style="display:flex;gap:8px;margin-top:8px">
        <input type="text" class="url-input" id="url-${id}" value="${esc(currentUrl || '')}" placeholder="หรือใส่ URL รูปภาพ..." oninput="updateImagePreview('${id}', this.value)" style="flex:1;padding:8px 12px;border:2px solid var(--gray-200);border-radius:8px;font-size:0.85rem">
        <button type="button" onclick="openMediaPicker(function(url){document.getElementById('url-${id}').value=url;updateImagePreview('${id}',url)})" style="padding:8px 14px;border:2px solid var(--gray-200);border-radius:8px;background:white;cursor:pointer;font-size:0.82rem;white-space:nowrap;transition:all 0.2s" onmouseover="this.style.borderColor='var(--red)';this.style.color='var(--red)'" onmouseout="this.style.borderColor='var(--gray-200)';this.style.color=''">🖼️ คลังภาพ</button>
      </div>
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
    const res = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
    const data = await res.json();
    if (res.ok && data.url) {
      document.getElementById('url-' + id).value = data.url;
      updateImagePreview(id, data.url);
      toast('✅ อัพโหลดรูปสำเร็จ');
    } else {
      toast('❌ ' + (data.error || 'อัพโหลดล้มเหลว'), 'error');
    }
  } catch (err) {
    toast('❌ อัพโหลดล้มเหลว: ' + err.message, 'error');
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

// ===== CUSTOMER CHAT =====
let currentChatSession = null;
let chatPollInterval = null;
let selectedChatSessions = new Set();

async function renderCustomerChat() {
  try {
    const sessions = await api('/api/chat/sessions');
    const container = document.getElementById('chatSessionsList');
    if (!sessions.length) {
      container.innerHTML = '<div class="chat-session-empty">💬 ยังไม่มีข้อความจากลูกค้า</div>';
      return;
    }
    container.innerHTML = sessions.map(s => {
      const initials = (s.customer_name || 'U').slice(0, 2).toUpperCase();
      const time = s.last_message_at ? new Date(s.last_message_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '';
      return `
        <div class="chat-session-item ${currentChatSession === s.session_id ? 'active' : ''}" style="display:flex;align-items:center;gap:8px">
          <input type="checkbox" class="chat-session-checkbox" data-sid="${esc(s.session_id)}" ${selectedChatSessions.has(s.session_id) ? 'checked' : ''} onclick="event.stopPropagation();toggleChatSessionSelect('${esc(s.session_id)}', this.checked)" style="flex-shrink:0">
          <div style="flex:1;display:flex;align-items:center;gap:10px;cursor:pointer" onclick="openChatSession('${esc(s.session_id)}')">
            <div class="chat-session-avatar">${esc(initials)}</div>
            <div class="chat-session-info">
              <div class="chat-session-name">${esc(s.customer_name || 'ลูกค้าไม่ระบุชื่อ')}</div>
              <div class="chat-session-preview">${esc((s.last_message || '').slice(0, 50))}</div>
            </div>
            <div class="chat-session-meta">
              <div class="chat-session-time">${time}</div>
              ${s.unread_count > 0 ? `<div class="chat-session-unread">${s.unread_count}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
    updateBulkDeleteChatBtn();
  } catch (err) {
    console.error('Chat sessions error:', err);
  }
}

function toggleChatSessionSelect(sid, checked) {
  if (checked) selectedChatSessions.add(sid); else selectedChatSessions.delete(sid);
  updateBulkDeleteChatBtn();
}

function toggleSelectAllChat() {
  const allChecked = document.querySelectorAll('.chat-session-checkbox:checked').length === document.querySelectorAll('.chat-session-checkbox').length;
  document.querySelectorAll('.chat-session-checkbox').forEach(cb => {
    cb.checked = !allChecked;
    const sid = cb.dataset.sid;
    if (!allChecked) selectedChatSessions.add(sid); else selectedChatSessions.delete(sid);
  });
  updateBulkDeleteChatBtn();
}

function updateBulkDeleteChatBtn() {
  const btn = document.getElementById('bulkDeleteChatBtn');
  const count = document.getElementById('chatSelectedCount');
  if (btn && count) {
    count.textContent = selectedChatSessions.size;
    btn.style.display = selectedChatSessions.size > 0 ? '' : 'none';
  }
}

async function bulkDeleteChatSessions() {
  if (selectedChatSessions.size === 0) return;
  if (!confirm(`ลบ ${selectedChatSessions.size} แชทที่เลือก? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return;
  try {
    await api('/api/chat/sessions/bulk-delete', { method: 'POST', body: JSON.stringify({ session_ids: [...selectedChatSessions] }) });
    if (selectedChatSessions.has(currentChatSession)) {
      currentChatSession = null;
      document.getElementById('chatConvMessages').innerHTML = '';
      document.getElementById('chatConvHeader').innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:40px">👈 เลือกแชทจากรายการด้านซ้าย</p>';
      document.getElementById('chatConvInput').style.display = 'none';
    }
    selectedChatSessions.clear();
    renderCustomerChat();
    toast('🗑️ ลบแชทสำเร็จ');
  } catch (err) {
    toast('❌ ลบไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function deleteCurrentChatSession() {
  if (!currentChatSession) return;
  if (!confirm('ลบแชทนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) return;
  try {
    await api(`/api/chat/sessions/${currentChatSession}`, { method: 'DELETE' });
    currentChatSession = null;
    document.getElementById('chatConvMessages').innerHTML = '';
    document.getElementById('chatConvHeader').innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:40px">👈 เลือกแชทจากรายการด้านซ้าย</p>';
    document.getElementById('chatConvInput').style.display = 'none';
    renderCustomerChat();
    toast('🗑️ ลบแชทสำเร็จ');
  } catch (err) {
    toast('❌ ลบไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function openChatSession(sessionId) {
  currentChatSession = sessionId;
  document.getElementById('chatConvInput').style.display = 'flex';
  // Highlight active session
  document.querySelectorAll('.chat-session-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.chat-session-item').forEach(el => {
    if (el.onclick.toString().includes(sessionId)) el.classList.add('active');
  });
  await loadChatMessages(sessionId);
  // Mark as read
  await api(`/api/chat/sessions/${sessionId}/read`, { method: 'PUT' }).catch(() => {});
  // Start polling for new messages
  if (chatPollInterval) clearInterval(chatPollInterval);
  chatPollInterval = setInterval(() => loadChatMessages(sessionId), 5000);
  // Update badge
  updateChatBadge();
  renderCustomerChat();
}

async function loadChatMessages(sessionId) {
  try {
    const messages = await api(`/api/chat/messages/${sessionId}`);
    const container = document.getElementById('chatConvMessages');
    const header = document.getElementById('chatConvHeader');
    const customerName = messages.find(m => m.customer_name)?.customer_name || 'ลูกค้า';
    const customerPhone = messages.find(m => m.customer_phone)?.customer_phone || '';
    header.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><h3>${esc(customerName)}</h3>${customerPhone ? `<p>📞 ${esc(customerPhone)}</p>` : ''}</div><span style="font-size:0.75rem;color:var(--gray-400)">${messages.length} ข้อความ</span></div>`;
    container.innerHTML = messages.map(m => {
      const time = new Date(m.created_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const senderLabel = m.sender === 'admin' && m.admin_name ? `<div style="font-size:0.65rem;color:var(--gray-400);margin-bottom:2px">👩‍💼 ${esc(m.admin_name)}</div>` : '';
      const readIndicator = m.sender === 'customer' && m.is_read ? '<span style="font-size:0.6rem;color:var(--blue)">✓ อ่านแล้ว</span>' : '';
      return `<div class="chat-msg ${m.sender}">${senderLabel}<div>${esc(m.message)}</div><div class="chat-msg-time">${time} ${readIndicator}</div></div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
    // Show session info
    const info = document.getElementById('chatSessionInfo');
    if (info) info.textContent = `Session: ${sessionId} · ${messages.length} ข้อความ`;
  } catch (err) {
    console.error('Load messages error:', err);
  }
}

async function sendAdminChatMessage() {
  if (!currentChatSession) return;
  const input = document.getElementById('adminChatInput');
  const message = input.value.trim();
  if (!message) return;
  input.value = '';
  try {
    await api(`/api/chat/sessions/${currentChatSession}`, { method: 'POST', body: JSON.stringify({ message }) });
    await loadChatMessages(currentChatSession);
  } catch (err) {
    toast('❌ ส่งข้อความไม่สำเร็จ', 'error');
  }
}

async function updateChatBadge() {
  try {
    const result = await api('/api/chat/unread-count');
    const badge = document.getElementById('chatBadge');
    if (badge) {
      if (result.count > 0) {
        badge.textContent = result.count;
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch {}
}

// Admin chat input enter key
document.getElementById('adminChatInput')?.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendAdminChatMessage();
});

// Poll for unread chat count
setInterval(updateChatBadge, 15000);
updateChatBadge();

// ===== PROPOSALS =====
async function renderProposals() {
  try {
    const proposals = await api('/api/proposals');
    document.getElementById('proposalsBody').innerHTML = proposals.length ? proposals.map(p => {
      const statusClass = { draft: 'new', sent: 'contacted', accepted: 'won', rejected: 'lost' }[p.status] || 'new';
      const statusLabel = { draft: 'ฉบับร่าง', sent: 'ส่งแล้ว', accepted: 'ยอมรับ', rejected: 'ปฏิเสธ' }[p.status] || p.status;
      const total = Number(p.total || 0).toLocaleString('th-TH');
      const date = p.created_at ? new Date(p.created_at).toLocaleDateString('th-TH') : '-';
      return `<tr>
        <td><strong>${esc(p.proposal_number)}</strong></td>
        <td>${esc(p.title)}</td>
        <td>${esc(p.lead_name || '-')}</td>
        <td>฿${total}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>${date}</td>
        <td>
          <select class="filter-select" style="width:auto;padding:4px 8px;font-size:0.8rem" onchange="updateProposalStatus(${p.id}, this.value)">
            <option value="draft" ${p.status === 'draft' ? 'selected' : ''}>ฉบับร่าง</option>
            <option value="sent" ${p.status === 'sent' ? 'selected' : ''}>ส่งแล้ว</option>
            <option value="accepted" ${p.status === 'accepted' ? 'selected' : ''}>ยอมรับ</option>
            <option value="rejected" ${p.status === 'rejected' ? 'selected' : ''}>ปฏิเสธ</option>
          </select>
          <button class="btn btn-sm btn-outline" onclick="editProposal(${p.id})" style="margin-left:4px" title="แก้ไข">✏️</button>
          <button class="btn btn-sm btn-outline" onclick="downloadProposalPDF(${p.id})" style="margin-left:4px" title="ดาวน์โหลด PDF">📄</button>
          <button class="btn btn-sm btn-outline" onclick="emailProposal(${p.id})" style="margin-left:4px" title="ส่งอีเมล">📧</button>
        </td>
      </tr>`;
    }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--gray-400);padding:40px">ยังไม่มีใบเสนอราคา</td></tr>';
  } catch (err) {
    console.error('Proposals error:', err);
  }
}

async function updateProposalStatus(id, status) {
  try {
    await api(`/api/proposals/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    toast('✅ อัพเดทสถานะสำเร็จ');
    renderProposals();
  } catch (err) {
    toast('❌ อัพเดทไม่สำเร็จ: ' + err.message, 'error');
  }
}

function showCreateProposalModal() {
  const leads = allLeads.map(l => `<option value="${l.id}">${esc(l.name)} (${esc(l.phone)})</option>`).join('');
  document.getElementById('modalTitle').textContent = '➕ สร้างใบเสนอราคา';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group"><label>ลูกค้า</label><select id="pp_lead_id"><option value="">-- เลือกลูกค้า --</option>${leads}</select></div>
    <div class="form-group"><label>หัวข้อ</label><input type="text" id="pp_title" placeholder="เช่น ใบเสนอราคาออกแบบบ้าน"></div>
    <div class="form-group"><label>รายการ (JSON Array)</label><textarea id="pp_items" rows="4" placeholder='[{"name":"ออกแบบสถาปัตย์","qty":1,"price":30000},{"name":"3D Perspective","qty":3,"price":4000}]'>[]</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Subtotal</label><input type="number" id="pp_subtotal" value="0"></div>
      <div class="form-group"><label>VAT 7%</label><input type="number" id="pp_tax" value="0"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>ยอดรวม</label><input type="number" id="pp_total" value="0"></div>
      <div class="form-group"><label>Valid Until</label><input type="date" id="pp_valid_until"></div>
    </div>
    <div class="form-group"><label>หมายเหตุ</label><textarea id="pp_notes" rows="2"></textarea></div>
    <button class="btn btn-primary" onclick="createProposal()">💾 สร้างใบเสนอราคา</button>
  `;
  document.getElementById('leadModal').classList.add('show');
}

async function createProposal() {
  try {
    let items = [];
    try { items = JSON.parse(document.getElementById('pp_items').value || '[]'); } catch { items = []; }
    const data = {
      lead_id: gv('pp_lead_id') || null,
      title: gv('pp_title'),
      items,
      subtotal: parseFloat(gv('pp_subtotal')) || 0,
      tax: parseFloat(gv('pp_tax')) || 0,
      total: parseFloat(gv('pp_total')) || 0,
      valid_until: gv('pp_valid_until') || null,
      notes: gv('pp_notes')
    };
    await api('/api/proposals', { method: 'POST', body: JSON.stringify(data) });
    closeModal();
    renderProposals();
    toast('✅ สร้างใบเสนอราคาสำเร็จ');
  } catch (err) {
    toast('❌ สร้างไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function editProposal(id) {
  try {
    const proposals = await api('/api/proposals');
    const p = proposals.find(x => x.id === id);
    if (!p) return toast('❌ ไม่พบใบเสนอราคา', 'error');
    const leads = allLeads.map(l => `<option value="${l.id}" ${p.lead_id === l.id ? 'selected' : ''}>${esc(l.name)} (${esc(l.phone)})</option>`).join('');
    let itemsStr = '[]';
    try { itemsStr = JSON.stringify(typeof p.items === 'string' ? JSON.parse(p.items) : p.items, null, 2); } catch { itemsStr = p.items || '[]'; }
    document.getElementById('modalTitle').textContent = '✏️ แก้ไขใบเสนอราคา ' + esc(p.proposal_number);
    document.getElementById('modalBody').innerHTML = `
      <div class="form-group"><label>ลูกค้า</label><select id="ep_lead_id"><option value="">-- เลือกลูกค้า --</option>${leads}</select></div>
      <div class="form-group"><label>หัวข้อ</label><input type="text" id="ep_title" value="${esc(p.title)}"></div>
      <div class="form-group"><label>รายการ (JSON Array)</label><textarea id="ep_items" rows="4">${esc(itemsStr)}</textarea></div>
      <div class="form-row">
        <div class="form-group"><label>Subtotal</label><input type="number" id="ep_subtotal" value="${p.subtotal || 0}"></div>
        <div class="form-group"><label>VAT 7%</label><input type="number" id="ep_tax" value="${p.tax || 0}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>ยอดรวม</label><input type="number" id="ep_total" value="${p.total || 0}"></div>
        <div class="form-group"><label>Valid Until</label><input type="date" id="ep_valid_until" value="${p.valid_until || ''}"></div>
      </div>
      <div class="form-group"><label>หมายเหตุ</label><textarea id="ep_notes" rows="2">${esc(p.notes || '')}</textarea></div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-primary" onclick="saveProposalEdit(${id})">💾 บันทึก</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProposal(${id})">🗑️ ลบ</button>
      </div>
    `;
    document.getElementById('leadModal').classList.add('show');
  } catch (err) {
    toast('❌ โหลดไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function saveProposalEdit(id) {
  try {
    let items = null;
    try { items = JSON.stringify(JSON.parse(document.getElementById('ep_items').value || '[]')); } catch { items = document.getElementById('ep_items').value; }
    const data = {
      lead_id: gv('ep_lead_id') || null,
      title: gv('ep_title'),
      items,
      subtotal: parseFloat(gv('ep_subtotal')) || 0,
      tax: parseFloat(gv('ep_tax')) || 0,
      total: parseFloat(gv('ep_total')) || 0,
      valid_until: gv('ep_valid_until') || null,
      notes: gv('ep_notes')
    };
    await api(`/api/proposals/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    closeModal();
    renderProposals();
    toast('✅ บันทึกสำเร็จ');
  } catch (err) {
    toast('❌ บันทึกไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function deleteProposal(id) {
  if (!confirm('ลบใบเสนอนี้?')) return;
  try {
    await api(`/api/proposals/${id}`, { method: 'DELETE' });
    closeModal();
    renderProposals();
    toast('🗑️ ลบสำเร็จ');
  } catch (err) {
    toast('❌ ลบไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function downloadProposalPDF(id) {
  try {
    toast('⏳ กำลังสร้าง PDF...');
    const res = await fetch(`/api/proposals/${id}/pdf`, { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).error || 'สร้าง PDF ไม่สำเร็จ');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotation-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('✅ ดาวน์โหลด PDF สำเร็จ');
  } catch (err) {
    toast('❌ สร้าง PDF ไม่สำเร็จ: ' + err.message, 'error');
  }
}

function emailProposal(id) {
  const toEmail = prompt('กรอกอีเมลผู้รับ:');
  if (!toEmail) return;
  sendProposalEmail(id, toEmail);
}

async function sendProposalEmail(id, toEmail) {
  try {
    toast('⏳ กำลังส่งอีเมล...');
    await api(`/api/proposals/${id}/email`, { method: 'POST', body: JSON.stringify({ to_email: toEmail }) });
    toast('✅ ส่งอีเมลสำเร็จ');
  } catch (err) {
    toast('❌ ส่งอีเมลไม่สำเร็จ: ' + err.message, 'error');
  }
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
