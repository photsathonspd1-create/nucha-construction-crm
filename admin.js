// ============================================
// NUCHA CRM — Admin Dashboard (Enhanced)
// Features: Kanban DnD, Analytics, Priority, Toast
// ============================================

// ===== Cached Data =====
let cachedLeads = [];
let cachedAppts = [];
let cachedProposals = [];
let cachedUsers = [];
let currentUserId = null;

// ===== Auth Check =====
(async () => {
    const session = await Auth.requireAuth();
    if (!session) return;
    currentUserId = session.user.id;
    const profile = await Auth.getProfile();
    if (profile) {
        document.getElementById('userName').textContent = profile.full_name || 'Admin';
        document.getElementById('userRole').textContent = profile.role || 'admin';
    }
    // Load team members
    cachedUsers = await CRM.getUsers();
    await refreshData();
    hideLoading();
})();

function showLoading() { document.getElementById('loadingOverlay')?.classList.add('show'); }
function hideLoading() { document.getElementById('loadingOverlay')?.classList.remove('show'); }

// ===== Toast =====
function showToast(msg, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== Page Navigation =====
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.getElementById('page-' + pageId)?.classList.add('active');
    document.querySelector(`.sidebar-link[data-page="${pageId}"]`)?.classList.add('active');
    refreshData();
}

// ===== Refresh All Data =====
async function refreshData() {
    try {
        [cachedLeads, cachedAppts, cachedProposals] = await Promise.all([
            CRM.getLeads(),
            CRM.getAppointments(),
            CRM.getProposals()
        ]);
        const today = new Date().toISOString().split('T')[0];

        // Stats
        document.getElementById('totalLeads').textContent = cachedLeads.length;
        document.getElementById('closedDeals').textContent = cachedLeads.filter(l => l.status === 'Closed Won').length;
        document.getElementById('todayAppts').textContent = cachedAppts.filter(a => a.date === today).length;
        document.getElementById('newLeads').textContent = cachedLeads.filter(l => l.status === 'New Lead').length;
        document.getElementById('leadsCount').textContent = cachedLeads.length;
        document.getElementById('apptsCount').textContent = cachedAppts.length;

        // Mini funnel on dashboard
        renderMiniFunnel('dashMiniFunnel');

        renderRecentLeads(cachedLeads.slice(0, 5));
        renderLeadsTable();
        renderPipeline();
        renderAppointments();
        renderProposals();
        renderFollowUps();
        renderActivities();
        renderAnalytics();
        renderTeam();
    } catch (err) {
        console.error('refreshData:', err);
    }
}

// ===== Lead Priority =====
function getPriority(score) {
    if (score >= 5) return 'high';
    if (score >= 3) return 'mid';
    return 'low';
}
function getPriorityLabel(score) {
    if (score >= 5) return '🔴 สูง';
    if (score >= 3) return '🟡 กลาง';
    return '🟢 ต่ำ';
}

// ===== Mini Funnel =====
function renderMiniFunnel(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const stages = ['New Lead', 'Contacted', 'Appointment Set', 'Proposal Sent', 'Closed Won'];
    const colors = ['#2563EB', '#F59E0B', '#7C3AED', '#D97706', '#06C755'];
    const total = cachedLeads.length || 1;
    el.innerHTML = stages.map((s, i) => {
        const count = cachedLeads.filter(l => l.status === s).length;
        const pct = Math.max((count / total) * 100, 2);
        return `<div class="mini-funnel-seg" style="width:${pct}%; background:${colors[i]}"></div>`;
    }).join('');
}

// ===== Render Recent Leads =====
function renderRecentLeads(leads) {
    const c = document.getElementById('recentLeadsList');
    if (leads.length === 0) { c.innerHTML = '<div class="empty-state"><h3>ยังไม่มี Lead</h3></div>'; return; }
    c.innerHTML = leads.map(l => {
        const p = getPriority(l.score);
        return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gray-100);">
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="priority-dot ${p}"></span>
                <div>
                    <div style="font-weight:700;">${esc(l.name)}</div>
                    <div style="font-size:0.82rem;color:var(--gray-400);">${esc(l.service_type)} · ${esc(l.phone)}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <span class="status-badge ${getStatusClass(l.status)}">${esc(l.status)}</span>
                ${getScoreHTML(l.score)}
            </div>
        </div>`;
    }).join('');
}

// ===== Render Leads Table =====
function renderLeadsTable() {
    let leads = [...cachedLeads];
    const search = document.getElementById('leadSearch')?.value?.toLowerCase() || '';
    const statusF = document.getElementById('statusFilter')?.value || '';
    const serviceF = document.getElementById('serviceFilter')?.value || '';
    if (search) leads = leads.filter(l => l.name?.toLowerCase().includes(search) || l.phone?.includes(search));
    if (statusF) leads = leads.filter(l => l.status === statusF);
    if (serviceF) leads = leads.filter(l => l.service_type === serviceF);

    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    if (leads.length === 0) { tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><h3>ไม่พบข้อมูล</h3></div></td></tr>'; return; }

    tbody.innerHTML = leads.map(l => {
        const p = getPriority(l.score);
        return `
        <tr>
            <td><span class="priority-dot ${p}"></span><strong>${esc(l.name)}</strong></td>
            <td>${esc(l.phone)}</td>
            <td>${esc(l.service_type || '-')}</td>
            <td>${esc(l.budget_range || '-')}</td>
            <td>${getScoreHTML(l.score)}</td>
            <td>
                <select class="filter-select" style="padding:4px 8px;font-size:0.78rem;" onchange="changeStatus('${l.id}',this.value)">
                    ${['New Lead','Contacted','Appointment Set','Proposal Sent','Closed Won','Closed Lost'].map(s =>
                        `<option value="${s}" ${l.status === s ? 'selected' : ''}>${s}</option>`
                    ).join('')}
                </select>
            </td>
            <td style="font-size:0.82rem;color:var(--gray-400);">${CRM.formatDate(l.created_at)}</td>
            <td>
                <button class="table-btn table-btn-note" onclick="openNoteModal('${l.id}')">📝</button>
                <button class="table-btn table-btn-edit" onclick="openEditLeadModal('${l.id}')">แก้ไข</button>
                <button class="table-btn table-btn-delete" onclick="deleteLeadConfirm('${l.id}')">ลบ</button>
            </td>
        </tr>`;
    }).join('');
}

// ===== Kanban Pipeline with Drag & Drop =====
function renderPipeline() {
    const stages = ['New Lead', 'Contacted', 'Appointment Set', 'Proposal Sent', 'Closed Won', 'Closed Lost'];
    const grid = document.getElementById('pipelineGrid');
    if (!grid) return;

    grid.innerHTML = stages.map(stage => {
        const stageLeads = cachedLeads.filter(l => l.status === stage);
        return `
        <div class="pipeline-col" data-status="${stage}"
             ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event)">
            <div class="pipeline-col-header">
                <span class="pipeline-col-title">${stage}</span>
                <span class="pipeline-col-count">${stageLeads.length}</span>
            </div>
            ${stageLeads.map(l => {
                const p = getPriority(l.score);
                return `
                <div class="pipeline-card priority-${p}" draggable="true"
                     data-id="${l.id}" ondragstart="handleDragStart(event)"
                     onclick="openEditLeadModal('${l.id}')">
                    ${l.score >= 5 ? '<span class="pipeline-card-score">🔥 ' + l.score + '</span>' : ''}
                    <div class="pipeline-card-name">${esc(l.name)}</div>
                    <div class="pipeline-card-service">${esc(l.service_type || '-')}</div>
                    <span class="pipeline-card-budget">${esc(l.budget_range || 'ไม่ระบุ')}</span>
                    <div class="pipeline-card-phone">📞 ${esc(l.phone)}</div>
                </div>`;
            }).join('')}
        </div>`;
    }).join('');
}

// Drag & Drop handlers
let draggedId = null;
function handleDragStart(e) {
    draggedId = e.target.dataset.id;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}
function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}
async function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const newStatus = e.currentTarget.dataset.status;
    if (!draggedId || !newStatus) return;
    document.querySelectorAll('.pipeline-card.dragging').forEach(el => el.classList.remove('dragging'));

    try {
        await CRM.updateLead(draggedId, { status: newStatus });
        showToast(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`, 'success');
        await refreshData();
    } catch (err) {
        showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
    draggedId = null;
}

// ===== Render Appointments =====
function renderAppointments() {
    const grid = document.getElementById('apptsGrid');
    if (!grid) return;
    if (cachedAppts.length === 0) { grid.innerHTML = '<div class="empty-state"><h3>ยังไม่มีนัดหมาย</h3></div>'; return; }
    grid.innerHTML = cachedAppts.map(a => `
        <div class="appt-card">
            <div class="appt-card-date">📅 ${CRM.formatDate(a.date)} เวลา ${a.time}</div>
            <div class="appt-card-name">${esc(a.lead_name || 'ไม่ระบุ')}</div>
            <div class="appt-card-detail">${esc(a.service_type || '')} · ${CRM.getMeetingLabel(a.meeting_type)}</div>
        </div>
    `).join('');
}

// ===== Render Proposals (with Accept/Reject) =====
function renderProposals() {
    const tbody = document.getElementById('proposalsTableBody');
    if (!tbody) return;
    if (cachedProposals.length === 0) { tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><h3>ยังไม่มีใบเสนอราคา</h3></div></td></tr>'; return; }

    tbody.innerHTML = cachedProposals.map(p => {
        const statusMap = { draft: 'new', sent: 'contacted', accepted: 'closed', rejected: 'lost', expired: 'lost' };
        const statusLabel = { draft: 'ร่าง', sent: 'ส่งแล้ว', accepted: 'ยอมรับ', rejected: 'ปฏิเสธ', expired: 'หมดอายุ' };
        return `
        <tr>
            <td><strong>${esc(p.proposal_number)}</strong></td>
            <td>${esc(p.title)}</td>
            <td style="font-size:0.82rem;">${esc(p.lead_id || '-')}</td>
            <td style="font-weight:700;color:var(--red);">฿${Number(p.total).toLocaleString()}</td>
            <td><span class="status-badge ${statusMap[p.status] || 'new'}">${statusLabel[p.status] || p.status}</span></td>
            <td style="font-size:0.82rem;color:var(--gray-400);">${CRM.formatDate(p.created_at)}</td>
            <td>
                <div class="proposal-actions">
                    ${p.status === 'draft' ? `<button class="table-btn btn-accept" onclick="updateProposalStatus('${p.id}','sent')">📤 ส่ง</button>` : ''}
                    ${p.status === 'sent' ? `
                        <button class="table-btn btn-accept" onclick="updateProposalStatus('${p.id}','accepted')">✅ ยอมรับ</button>
                        <button class="table-btn btn-reject" onclick="updateProposalStatus('${p.id}','rejected')">❌ ปฏิเสธ</button>
                    ` : ''}
                    ${p.status === 'accepted' ? '<span style="color:var(--green);font-weight:700;">✅ ปิดดีล</span>' : ''}
                    ${p.status === 'rejected' ? '<span style="color:var(--gray-400);">❌ ถูกปฏิเสธ</span>' : ''}
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ===== Render Follow-ups =====
async function renderFollowUps() {
    const c = document.getElementById('followupsList');
    if (!c) return;
    const followUps = await CRM.getPendingFollowUps();
    document.getElementById('followupCount').textContent = followUps.length;

    if (followUps.length === 0) { c.innerHTML = '<div class="empty-state"><h3>ไม่มีรายการติดตาม</h3></div>'; return; }

    // Sort by priority
    followUps.sort((a, b) => (b.leads?.score || 0) - (a.leads?.score || 0));

    c.innerHTML = followUps.map(n => {
        const p = getPriority(n.leads?.score || 0);
        return `
        <div class="followup-item priority-${p}">
            <div class="followup-info">
                <div class="followup-name"><span class="priority-dot ${p}"></span>${esc(n.leads?.name || 'N/A')}</div>
                <div class="followup-detail">${esc(n.note)} · ${esc(n.leads?.service_type || '')}</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <span class="followup-date">📅 ${CRM.formatDate(n.follow_up_date)}</span>
                <a href="tel:${n.leads?.phone}" class="table-btn table-btn-edit" style="text-decoration:none;">📞 โทร</a>
                <button class="table-btn table-btn-note" onclick="markFollowUpDone('${n.id}')">✓ เสร็จ</button>
            </div>
        </div>`;
    }).join('');
}

// ===== Render Activities =====
async function renderActivities() {
    const c = document.getElementById('activitiesList');
    if (!c) return;
    const activities = await CRM.getActivities(null, 30);
    if (activities.length === 0) { c.innerHTML = '<div class="empty-state"><h3>ยังไม่มีกิจกรรม</h3></div>'; return; }
    c.innerHTML = activities.map(a => {
        let desc = a.action;
        if (a.action === 'status_changed' && a.details) desc = `เปลี่ยนสถานะ: ${a.details.old_status} → ${a.details.new_status}`;
        else if (a.action === 'lead_created') desc = 'สร้าง Lead ใหม่';
        return `
        <div class="activity-item">
            <div class="activity-dot"></div>
            <div>
                <div class="activity-text">${esc(desc)}</div>
                <div class="activity-time">${CRM.formatDate(a.created_at)}</div>
            </div>
        </div>`;
    }).join('');
}

// ===== Analytics =====
function renderAnalytics() {
    renderConversionRate();
    renderLeadsPerDay();
    renderAvgCloseTime();
    renderPipelineValue();
    renderMiniFunnel('miniFunnel');
    renderConversionFunnel();
    renderLeadsByDayChart();
    renderServicePopularity();
    renderBudgetDistribution();
    renderLeadSources();
}

function renderConversionRate() {
    const el = document.getElementById('conversionRate');
    if (!el) return;
    const total = cachedLeads.length;
    const closed = cachedLeads.filter(l => l.status === 'Closed Won').length;
    el.textContent = total > 0 ? Math.round((closed / total) * 100) + '%' : '0%';
}

function renderLeadsPerDay() {
    const el = document.getElementById('avgLeadsPerDay');
    if (!el) return;
    const now = Date.now();
    const weekAgo = now - 7 * 86400000;
    const recent = cachedLeads.filter(l => new Date(l.created_at).getTime() > weekAgo);
    el.textContent = (recent.length / 7).toFixed(1);
}

function renderAvgCloseTime() {
    const el = document.getElementById('avgResponseTime');
    if (!el) return;
    const closed = cachedLeads.filter(l => l.status === 'Closed Won' && l.updated_at && l.created_at);
    if (closed.length === 0) { el.textContent = '-'; return; }
    const avgDays = closed.reduce((sum, l) => {
        return sum + (new Date(l.updated_at) - new Date(l.created_at)) / 86400000;
    }, 0) / closed.length;
    el.textContent = Math.round(avgDays);
}

function renderPipelineValue() {
    const el = document.getElementById('totalRevenue');
    if (!el) return;
    const budgetValues = {
        'มากกว่า 10,000,000': 12000000,
        '5,000,000 - 10,000,000': 7500000,
        '3,000,000 - 5,000,000': 4000000,
        '1,000,000 - 3,000,000': 2000000,
        '500,000 - 1,000,000': 750000,
        'ต่ำกว่า 500,000': 300000
    };
    const active = cachedLeads.filter(l => !['Closed Won', 'Closed Lost'].includes(l.status));
    const total = active.reduce((sum, l) => sum + (budgetValues[l.budget_range] || 0), 0);
    el.textContent = '฿' + (total / 1000000).toFixed(1) + 'M';
}

function renderLeadsByDayChart() {
    const c = document.getElementById('leadsByDayChart');
    if (!c) return;
    const days = [];
    const labels = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const count = cachedLeads.filter(l => l.created_at?.startsWith(dateStr)).length;
        days.push({ label: labels[d.getDay()], count });
    }
    const max = Math.max(...days.map(d => d.count), 1);
    c.innerHTML = days.map(d => `
        <div class="bar-item">
            <div class="bar-fill" style="height:${(d.count / max) * 150}px" data-value="${d.count}"></div>
            <div class="bar-label">${d.label}</div>
        </div>
    `).join('');
}

function renderConversionFunnel() {
    const c = document.getElementById('conversionFunnel');
    if (!c) return;
    const stages = [
        { label: 'New Lead', color: '#2563EB' },
        { label: 'Contacted', color: '#F59E0B' },
        { label: 'Appointment', color: '#7C3AED' },
        { label: 'Proposal', color: '#D97706' },
        { label: 'Closed Won', color: '#06C755' }
    ];
    const total = cachedLeads.length || 1;
    c.innerHTML = stages.map(s => {
        const count = cachedLeads.filter(l => l.status === s.label).length;
        const pct = Math.max((count / total) * 100, 3);
        return `
        <div class="funnel-row">
            <div class="funnel-label">${s.label}</div>
            <div class="funnel-bar-wrap">
                <div class="funnel-bar" style="width:${pct}%;background:${s.color}">${count}</div>
            </div>
            <div class="funnel-count">${Math.round(pct)}%</div>
        </div>`;
    }).join('');
}

function renderServicePopularity() {
    const c = document.getElementById('servicePopularity');
    if (!c) return;
    const services = {};
    cachedLeads.forEach(l => { services[l.service_type] = (services[l.service_type] || 0) + 1; });
    const sorted = Object.entries(services).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1;
    c.innerHTML = sorted.map(([name, count]) => `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
            <div style="width:100px;font-size:0.82rem;font-weight:600;text-align:right;">${esc(name)}</div>
            <div style="flex:1;height:24px;background:var(--gray-100);border-radius:6px;overflow:hidden;">
                <div style="height:100%;width:${(count/max)*100}%;background:linear-gradient(90deg,var(--red),var(--red-light));border-radius:6px;display:flex;align-items:center;padding-left:8px;">
                    <span style="font-size:0.72rem;font-weight:700;color:white;">${count}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderBudgetDistribution() {
    const c = document.getElementById('budgetDistribution');
    if (!c) return;
    const budgets = {};
    cachedLeads.forEach(l => { budgets[l.budget_range || 'ไม่ระบุ'] = (budgets[l.budget_range || 'ไม่ระบุ'] || 0) + 1; });
    const sorted = Object.entries(budgets).sort((a, b) => b[1] - a[1]);
    const total = cachedLeads.length || 1;
    c.innerHTML = sorted.map(([name, count]) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-100);">
            <span style="font-size:0.85rem;">${esc(name)}</span>
            <span style="font-weight:700;font-family:var(--font-display);">${count} (${Math.round(count/total*100)}%)</span>
        </div>
    `).join('');
}

function renderLeadSources() {
    const c = document.getElementById('leadSources');
    if (!c) return;
    const sources = {};
    cachedLeads.forEach(l => { sources[l.source || 'website'] = (sources[l.source || 'website'] || 0) + 1; });
    const total = cachedLeads.length || 1;
    c.innerHTML = Object.entries(sources).map(([src, count]) => `
        <div style="text-align:center;padding:16px 24px;background:var(--white);border-radius:12px;border:1px solid var(--gray-100);">
            <div style="font-size:1.8rem;font-weight:900;color:var(--red);font-family:var(--font-display);">${count}</div>
            <div style="font-size:0.78rem;color:var(--gray-400);margin-top:4px;">${esc(src)}</div>
            <div style="font-size:0.72rem;color:var(--gray-300);">${Math.round(count/total*100)}%</div>
        </div>
    `).join('');
}

// ===== Helpers =====
function getStatusClass(s) {
    return { 'New Lead':'new','Contacted':'contacted','Appointment Set':'appointment','Proposal Sent':'proposal','Closed Won':'closed','Closed Lost':'lost','Closed':'closed' }[s]||'new';
}
function getScoreHTML(score) {
    if (!score) return '';
    const cls = score >= 5 ? 'score-high' : score >= 3 ? 'score-mid' : 'score-low';
    return `<span class="score-badge ${cls}"><span class="score-dot"></span>${score}</span>`;
}
function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ===== Modal: Lead =====
function openAddLeadModal() {
    document.getElementById('modalTitle').textContent = 'เพิ่ม Lead ใหม่';
    document.getElementById('modalLeadForm').reset();
    document.getElementById('editLeadId').value = '';
    populateTeamDropdown();
    document.getElementById('leadModal').classList.add('active');
}

async function openEditLeadModal(id) {
    const lead = await CRM.getLeadById(id);
    if (!lead) return;
    document.getElementById('modalTitle').textContent = 'แก้ไข Lead';
    document.getElementById('editLeadId').value = id;
    document.getElementById('modalName').value = lead.name || '';
    document.getElementById('modalPhone').value = lead.phone || '';
    document.getElementById('modalEmail').value = lead.email || '';
    document.getElementById('modalService').value = lead.service_type || 'อื่นๆ';
    document.getElementById('modalBudget').value = lead.budget_range || 'ไม่ระบุ';
    document.getElementById('modalStatus').value = lead.status || 'New Lead';
    document.getElementById('modalNote').value = '';
    document.getElementById('modalFollowUpDate').value = '';
    populateTeamDropdown(lead.assigned_to);
    document.getElementById('leadModal').classList.add('active');
}

function closeLeadModal() { document.getElementById('leadModal').classList.remove('active'); }

document.getElementById('modalLeadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editLeadId').value;
    const data = {
        name: document.getElementById('modalName').value,
        phone: document.getElementById('modalPhone').value,
        email: document.getElementById('modalEmail').value || null,
        service_type: document.getElementById('modalService').value,
        budget_range: document.getElementById('modalBudget').value,
        status: document.getElementById('modalStatus').value,
        assigned_to: document.getElementById('modalAssignedTo').value || null
    };
    const note = document.getElementById('modalNote').value.trim();
    const followUpDate = document.getElementById('modalFollowUpDate').value || null;
    try {
        if (editId) {
            await CRM.updateLead(editId, data);
            if (note) await CRM.addNote(editId, note, 'general', followUpDate);
            showToast('อัพเดท Lead สำเร็จ', 'success');
        } else {
            const lead = await CRM.saveLead({ ...data, source: 'admin' });
            if (note) await CRM.addNote(lead.id, note, 'general', followUpDate);
            showToast('สร้าง Lead ใหม่สำเร็จ', 'success');
        }
        closeLeadModal();
        await refreshData();
    } catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message, 'error'); }
});

async function changeStatus(id, status) {
    try { await CRM.updateLead(id, { status }); showToast(`เปลี่ยนสถานะเป็น "${status}"`, 'success'); await refreshData(); }
    catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message, 'error'); }
}

async function deleteLeadConfirm(id) {
    if (!confirm('ลบ Lead นี้?')) return;
    try { await CRM.deleteLead(id); showToast('ลบ Lead สำเร็จ', 'success'); await refreshData(); }
    catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message, 'error'); }
}

// ===== Modal: Notes =====
async function openNoteModal(leadId) {
    document.getElementById('noteLeadId').value = leadId;
    const notes = await CRM.getNotes(leadId);
    const c = document.getElementById('noteModalContent');
    if (notes.length === 0) { c.innerHTML = '<p style="color:var(--gray-400);text-align:center;padding:20px;">ยังไม่มีบันทึก</p>'; }
    else {
        c.innerHTML = notes.map(n => `
            <div class="note-item">
                <div class="note-text">${esc(n.note)}</div>
                <div class="note-meta">
                    ${n.note_type !== 'general' ? `<span class="status-badge new" style="margin-right:8px">${n.note_type}</span>` : ''}
                    ${n.follow_up_date ? `📅 Follow-up: ${CRM.formatDate(n.follow_up_date)}` : ''}
                    · ${CRM.formatDate(n.created_at)} ${n.follow_up_done ? ' ✅' : ''}
                </div>
            </div>
        `).join('');
    }
    document.getElementById('noteModal').classList.add('active');
}
function closeNoteModal() { document.getElementById('noteModal').classList.remove('active'); }

document.getElementById('noteForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const leadId = document.getElementById('noteLeadId').value;
    const note = document.getElementById('newNoteText').value.trim();
    if (!note) return;
    try {
        await CRM.addNote(leadId, note, document.getElementById('newNoteType').value, document.getElementById('newNoteFollowUp').value || null);
        document.getElementById('newNoteText').value = '';
        document.getElementById('newNoteFollowUp').value = '';
        showToast('เพิ่มบันทึกสำเร็จ', 'success');
        await openNoteModal(leadId);
        await refreshData();
    } catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message, 'error'); }
});

async function markFollowUpDone(noteId) {
    try { await CRM.markFollowUpDone(noteId); showToast('ทำเครื่องหมายเสร็จแล้ว', 'success'); await refreshData(); }
    catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message, 'error'); }
}

// ===== Modal: Proposal =====
async function openNewProposalModal() {
    const select = document.getElementById('proposalLead');
    select.innerHTML = '<option value="">-- เลือก Lead --</option>' + cachedLeads.map(l => `<option value="${l.id}">${esc(l.name)} (${esc(l.service_type)})</option>`).join('');
    document.getElementById('proposalForm').reset();
    document.getElementById('proposalItems').innerHTML = `
        <div class="proposal-item-row">
            <input type="text" placeholder="รายการ" class="proposal-item-name" style="flex:2">
            <input type="number" placeholder="จำนวน" class="proposal-item-qty" style="flex:1" value="1">
            <input type="number" placeholder="ราคา/หน่วย" class="proposal-item-price" style="flex:1">
            <button type="button" class="table-btn table-btn-delete" onclick="removeProposalItem(this)">ลบ</button>
        </div>`;
    updateProposalTotal();
    document.getElementById('proposalModal').classList.add('active');
}
function closeProposalModal() { document.getElementById('proposalModal').classList.remove('active'); }

function addProposalItem() {
    const row = document.createElement('div'); row.className = 'proposal-item-row';
    row.innerHTML = `
        <input type="text" placeholder="รายการ" class="proposal-item-name" style="flex:2">
        <input type="number" placeholder="จำนวน" class="proposal-item-qty" style="flex:1" value="1">
        <input type="number" placeholder="ราคา/หน่วย" class="proposal-item-price" style="flex:1">
        <button type="button" class="table-btn table-btn-delete" onclick="removeProposalItem(this)">ลบ</button>`;
    document.getElementById('proposalItems').appendChild(row);
    row.querySelectorAll('input').forEach(i => i.addEventListener('input', updateProposalTotal));
}
function removeProposalItem(btn) { if (document.querySelectorAll('.proposal-item-row').length > 1) { btn.closest('.proposal-item-row').remove(); updateProposalTotal(); } }
function updateProposalTotal() {
    let t = 0;
    document.querySelectorAll('.proposal-item-row').forEach(r => {
        t += (parseFloat(r.querySelector('.proposal-item-qty').value)||0) * (parseFloat(r.querySelector('.proposal-item-price').value)||0);
    });
    document.getElementById('proposalTotal').textContent = `฿${t.toLocaleString()}`; return t;
}
document.addEventListener('input', e => { if (e.target.classList.contains('proposal-item-qty') || e.target.classList.contains('proposal-item-price')) updateProposalTotal(); });

document.getElementById('proposalForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const items = [];
    document.querySelectorAll('.proposal-item-row').forEach(r => {
        const name = r.querySelector('.proposal-item-name').value;
        const qty = parseFloat(r.querySelector('.proposal-item-qty').value)||0;
        const price = parseFloat(r.querySelector('.proposal-item-price').value)||0;
        if (name) items.push({ name, qty, price, total: qty*price });
    });
    const total = items.reduce((s, i) => s + i.total, 0);
    try {
        await CRM.saveProposal({
            lead_id: document.getElementById('proposalLead').value || null,
            title: document.getElementById('proposalTitle').value,
            items, subtotal: total, tax: 0, total,
            valid_until: document.getElementById('proposalValidUntil').value || null,
            notes: document.getElementById('proposalNotes').value || null
        });
        closeProposalModal();
        showToast('สร้างใบเสนอราคาสำเร็จ', 'success');

        // Notify new proposal
        const leadName = cachedLeads.find(l => l.id === document.getElementById('proposalLead').value)?.name || 'N/A';
        CRM.notifyNewProposal({ proposal_number: 'NP-xxxx', title: document.getElementById('proposalTitle').value, total }, leadName);

        await refreshData();
    } catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message, 'error'); }
});

async function updateProposalStatus(id, newStatus) {
    try {
        await CRM.updateProposal(id, { status: newStatus });
        const labels = { sent: 'ส่งใบเสนอราคาแล้ว', accepted: 'ยอมรับใบเสนอราคา', rejected: 'ปฏิเสธใบเสนอราคา' };
        showToast(labels[newStatus] || 'อัพเดทสถานะ', 'success');
        // If accepted, update lead status to Closed Won
        if (newStatus === 'accepted') {
            const proposal = cachedProposals.find(p => p.id === id);
            if (proposal?.lead_id) {
                await CRM.updateLead(proposal.lead_id, { status: 'Closed Won' });
            }
        }
        await refreshData();
    } catch (err) { showToast('เกิดข้อผิดพลาด: ' + err.message, 'error'); }
}

// ===== Team Performance =====
async function renderTeam() {
    // Team stats cards
    const statsEl = document.getElementById('teamStats');
    const tableEl = document.getElementById('teamTableBody');
    if (!statsEl || !tableEl) return;

    const teamData = await CRM.getTeamPerformance();

    // Stats cards for each team member
    statsEl.innerHTML = teamData.map(u => `
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-card-icon ${u.conversionRate >= 30 ? 'green' : u.conversionRate >= 15 ? 'blue' : 'orange'}">
                    <span style="font-weight:900;font-size:1rem;">${(u.full_name || 'A')[0].toUpperCase()}</span>
                </div>
            </div>
            <div class="stat-card-num">${u.totalLeads}</div>
            <div class="stat-card-label">${esc(u.full_name || 'Unnamed')}</div>
            <div style="margin-top:8px;font-size:0.78rem;">
                <span style="color:var(--green);font-weight:700;">${u.closedDeals} ปิดดีล</span>
                <span style="color:var(--gray-400);margin-left:8px;">${u.conversionRate}%</span>
            </div>
        </div>
    `).join('');

    // Table
    tableEl.innerHTML = teamData.map(u => `
        <tr>
            <td><strong>${esc(u.full_name || 'Unnamed')}</strong></td>
            <td><span class="status-badge new">${esc(u.role)}</span></td>
            <td>${u.totalLeads}</td>
            <td style="color:var(--green);font-weight:700;">${u.closedDeals}</td>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;height:6px;background:var(--gray-100);border-radius:3px;overflow:hidden;">
                        <div style="height:100%;width:${u.conversionRate}%;background:${u.conversionRate >= 30 ? 'var(--green)' : u.conversionRate >= 15 ? 'var(--blue)' : 'var(--orange)'};border-radius:3px;"></div>
                    </div>
                    <span style="font-weight:700;font-size:0.82rem;">${u.conversionRate}%</span>
                </div>
            </td>
            <td style="font-size:0.78rem;color:var(--gray-400);">
                🆕${u.pipeline.new} · 📞${u.pipeline.contacted} · 📅${u.pipeline.appointment} · 📄${u.pipeline.proposal}
            </td>
        </tr>
    `).join('');
}

// Populate team assignment dropdown
function populateTeamDropdown(selectedId = null) {
    const select = document.getElementById('modalAssignedTo');
    if (!select) return;
    select.innerHTML = '<option value="">-- ไม่ระบุ --</option>' +
        cachedUsers.map(u =>
            `<option value="${u.id}" ${selectedId === u.id ? 'selected' : ''}>${esc(u.full_name || u.id.substring(0, 8))}</option>`
        ).join('');
}

// ===== Export CSV =====
function exportLeadsCSV() {
    if (cachedLeads.length === 0) { alert('ไม่มีข้อมูลให้ export'); return; }
    const headers = ['ชื่อ','เบอร์โทร','อีเมล','บริการ','งบประมาณ','สถานะ','คะแนน','แหล่งที่มา','วันที่'];
    const rows = cachedLeads.map(l => [l.name, l.phone, l.email||'', l.service_type, l.budget_range, l.status, l.score, l.source||'website', l.created_at]);
    const csv = '\uFEFF' + [headers,...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `nucha-leads-${new Date().toISOString().split('T')[0]}.csv`; a.click();
}
