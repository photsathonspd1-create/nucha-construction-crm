// ============================================
// NUCHA CRM — Admin Dashboard Logic (Supabase)
// ============================================

// ===== Cached Data =====
let cachedLeads = [];
let cachedAppts = [];
let cachedProposals = [];

// ===== Auth Check =====
(async () => {
    const session = await Auth.requireAuth();
    if (!session) return;

    // Load user profile
    const profile = await Auth.getProfile();
    if (profile) {
        document.getElementById('userName').textContent = profile.full_name || 'Admin';
        document.getElementById('userRole').textContent = profile.role || 'admin';
    }

    // Initial data load
    await refreshData();
    hideLoading();
})();

function showLoading() {
    document.getElementById('loadingOverlay')?.classList.add('show');
}
function hideLoading() {
    document.getElementById('loadingOverlay')?.classList.remove('show');
}

// ===== Page Navigation =====
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');

    const link = document.querySelector(`.sidebar-link[data-page="${pageId}"]`);
    if (link) link.classList.add('active');

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

        // Recent leads
        renderRecentLeads(cachedLeads.slice(0, 5));

        // Leads table
        renderLeadsTable();

        // Pipeline
        renderPipeline();

        // Appointments
        renderAppointments();

        // Proposals
        renderProposals();

        // Follow-ups
        renderFollowUps();

        // Activities
        renderActivities();

    } catch (err) {
        console.error('refreshData error:', err);
    }
}

// ===== Render Recent Leads =====
function renderRecentLeads(leads) {
    const container = document.getElementById('recentLeadsList');
    if (leads.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>ยังไม่มี Lead</h3><p>Lead จะปรากฏที่นี่เมื่อมีลูกค้ากรอกฟอร์ม</p></div>';
        return;
    }
    container.innerHTML = leads.map(l => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--gray-100);">
            <div>
                <div style="font-weight: 700;">${escHtml(l.name)}</div>
                <div style="font-size: 0.82rem; color: var(--gray-400);">${escHtml(l.service_type)} · ${escHtml(l.phone)}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <span class="status-badge ${getStatusClass(l.status)}">${escHtml(l.status)}</span>
                ${getScoreHTML(l.score)}
            </div>
        </div>
    `).join('');
}

// ===== Render Leads Table =====
function renderLeadsTable() {
    let leads = [...cachedLeads];
    const search = document.getElementById('leadSearch')?.value?.toLowerCase() || '';
    const statusF = document.getElementById('statusFilter')?.value || '';
    const serviceF = document.getElementById('serviceFilter')?.value || '';

    if (search) leads = leads.filter(l =>
        l.name?.toLowerCase().includes(search) || l.phone?.includes(search)
    );
    if (statusF) leads = leads.filter(l => l.status === statusF);
    if (serviceF) leads = leads.filter(l => l.service_type === serviceF);

    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;

    if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><h3>ไม่พบข้อมูล</h3></div></td></tr>';
        return;
    }

    tbody.innerHTML = leads.map(l => `
        <tr>
            <td><strong>${escHtml(l.name)}</strong></td>
            <td>${escHtml(l.phone)}</td>
            <td>${escHtml(l.service_type || '-')}</td>
            <td>${escHtml(l.budget_range || '-')}</td>
            <td>${getScoreHTML(l.score)}</td>
            <td>
                <select class="filter-select" style="padding:4px 8px; font-size:0.78rem;" onchange="changeStatus('${l.id}', this.value)">
                    ${['New Lead','Contacted','Appointment Set','Proposal Sent','Closed Won','Closed Lost'].map(s =>
                        `<option value="${s}" ${l.status === s ? 'selected' : ''}>${s}</option>`
                    ).join('')}
                </select>
            </td>
            <td style="font-size: 0.82rem; color: var(--gray-400);">${CRM.formatDate(l.created_at)}</td>
            <td>
                <button class="table-btn table-btn-note" onclick="openNoteModal('${l.id}')">📝</button>
                <button class="table-btn table-btn-edit" onclick="openEditLeadModal('${l.id}')">แก้ไข</button>
                <button class="table-btn table-btn-delete" onclick="deleteLeadConfirm('${l.id}')">ลบ</button>
            </td>
        </tr>
    `).join('');
}

// ===== Render Pipeline =====
function renderPipeline() {
    const stages = ['New Lead', 'Contacted', 'Appointment Set', 'Proposal Sent', 'Closed Won', 'Closed Lost'];
    const grid = document.getElementById('pipelineGrid');
    if (!grid) return;

    grid.innerHTML = stages.map(stage => {
        const stageLeads = cachedLeads.filter(l => l.status === stage);
        return `
            <div class="pipeline-col">
                <div class="pipeline-col-header">
                    <span class="pipeline-col-title">${stage}</span>
                    <span class="pipeline-col-count">${stageLeads.length}</span>
                </div>
                ${stageLeads.map(l => `
                    <div class="pipeline-card" onclick="openEditLeadModal('${l.id}')">
                        ${l.score >= 5 ? '<span class="pipeline-card-score">🔥 ' + l.score + '</span>' : ''}
                        <div class="pipeline-card-name">${escHtml(l.name)}</div>
                        <div class="pipeline-card-service">${escHtml(l.service_type || '-')}</div>
                        <span class="pipeline-card-budget">${escHtml(l.budget_range || 'ไม่ระบุ')}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

// ===== Render Appointments =====
function renderAppointments() {
    const grid = document.getElementById('apptsGrid');
    if (!grid) return;

    if (cachedAppts.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>ยังไม่มีนัดหมาย</h3></div>';
        return;
    }

    grid.innerHTML = cachedAppts.map(a => `
        <div class="appt-card">
            <div class="appt-card-date">📅 ${CRM.formatDate(a.date)} เวลา ${a.time}</div>
            <div class="appt-card-name">${escHtml(a.lead_name || 'ไม่ระบุ')}</div>
            <div class="appt-card-detail">${escHtml(a.service_type || '')} · ${CRM.getMeetingLabel(a.meeting_type)}</div>
        </div>
    `).join('');
}

// ===== Render Proposals =====
function renderProposals() {
    const tbody = document.getElementById('proposalsTableBody');
    if (!tbody) return;

    if (cachedProposals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><h3>ยังไม่มีใบเสนอราคา</h3></div></td></tr>';
        return;
    }

    tbody.innerHTML = cachedProposals.map(p => `
        <tr>
            <td><strong>${escHtml(p.proposal_number)}</strong></td>
            <td>${escHtml(p.title)}</td>
            <td>${escHtml(p.lead_id || '-')}</td>
            <td style="font-weight:700; color:var(--red);">฿${Number(p.total).toLocaleString()}</td>
            <td><span class="status-badge ${p.status === 'accepted' ? 'closed' : p.status === 'sent' ? 'contacted' : 'new'}">${escHtml(p.status)}</span></td>
            <td style="font-size:0.82rem; color:var(--gray-400);">${CRM.formatDate(p.created_at)}</td>
            <td>
                <button class="table-btn table-btn-edit" onclick="updateProposalStatus('${p.id}', '${p.status === 'draft' ? 'sent' : p.status === 'sent' ? 'accepted' : p.status}')">
                    ${p.status === 'draft' ? 'ส่ง' : p.status === 'sent' ? 'ยอมรับ' : '✓'}
                </button>
            </td>
        </tr>
    `).join('');
}

// ===== Render Follow-ups =====
async function renderFollowUps() {
    const container = document.getElementById('followupsList');
    if (!container) return;

    const followUps = await CRM.getPendingFollowUps();
    document.getElementById('followupCount').textContent = followUps.length;

    if (followUps.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>ไม่มีรายการติดตาม</h3><p>Follow-up จะปรากฏที่นี่เมื่อถึงกำหนด</p></div>';
        return;
    }

    container.innerHTML = followUps.map(n => `
        <div class="followup-item">
            <div class="followup-info">
                <div class="followup-name">${escHtml(n.leads?.name || 'N/A')}</div>
                <div class="followup-detail">${escHtml(n.note)}</div>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
                <span class="followup-date">📅 ${CRM.formatDate(n.follow_up_date)}</span>
                <button class="table-btn table-btn-note" onclick="markFollowUpDone('${n.id}')">✓ เสร็จ</button>
            </div>
        </div>
    `).join('');
}

// ===== Render Activities =====
async function renderActivities() {
    const container = document.getElementById('activitiesList');
    if (!container) return;

    const activities = await CRM.getActivities(null, 30);

    if (activities.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>ยังไม่มีกิจกรรม</h3></div>';
        return;
    }

    container.innerHTML = activities.map(a => {
        let desc = a.action;
        if (a.action === 'status_changed' && a.details) {
            desc = `เปลี่ยนสถานะ: ${a.details.old_status} → ${a.details.new_status}`;
        } else if (a.action === 'lead_created') {
            desc = 'สร้าง Lead ใหม่';
        }
        return `
            <div class="activity-item">
                <div class="activity-dot"></div>
                <div>
                    <div class="activity-text">${escHtml(desc)}</div>
                    <div class="activity-time">${CRM.formatDate(a.created_at)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Helpers =====
function getStatusClass(status) {
    const map = {
        'New Lead': 'new', 'Contacted': 'contacted',
        'Appointment Set': 'appointment', 'Proposal Sent': 'proposal',
        'Closed Won': 'closed', 'Closed Lost': 'lost',
        'Closed': 'closed'
    };
    return map[status] || 'new';
}

function getScoreHTML(score) {
    if (!score) return '';
    const cls = score >= 5 ? 'score-high' : score >= 3 ? 'score-mid' : 'score-low';
    return `<span class="score-badge ${cls}"><span class="score-dot"></span>${score}</span>`;
}

function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== Modal: Lead =====
function openAddLeadModal() {
    document.getElementById('modalTitle').textContent = 'เพิ่ม Lead ใหม่';
    document.getElementById('modalLeadForm').reset();
    document.getElementById('editLeadId').value = '';
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

    document.getElementById('leadModal').classList.add('active');
}

function closeLeadModal() {
    document.getElementById('leadModal').classList.remove('active');
}

// Lead form submit
document.getElementById('modalLeadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editLeadId').value;
    const data = {
        name: document.getElementById('modalName').value,
        phone: document.getElementById('modalPhone').value,
        email: document.getElementById('modalEmail').value || null,
        service_type: document.getElementById('modalService').value,
        budget_range: document.getElementById('modalBudget').value,
        status: document.getElementById('modalStatus').value
    };
    const note = document.getElementById('modalNote').value.trim();
    const followUpDate = document.getElementById('modalFollowUpDate').value || null;

    try {
        if (editId) {
            await CRM.updateLead(editId, data);
            if (note) await CRM.addNote(editId, note, 'general', followUpDate);
        } else {
            const lead = await CRM.saveLead({ ...data, source: 'admin' });
            if (note) await CRM.addNote(lead.id, note, 'general', followUpDate);
        }
        closeLeadModal();
        await refreshData();
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
});

async function changeStatus(id, status) {
    try {
        await CRM.updateLead(id, { status });
        await refreshData();
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
}

async function deleteLeadConfirm(id) {
    if (!confirm('ลบ Lead นี้?')) return;
    try {
        await CRM.deleteLead(id);
        await refreshData();
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
}

// ===== Modal: Notes =====
async function openNoteModal(leadId) {
    document.getElementById('noteLeadId').value = leadId;
    const notes = await CRM.getNotes(leadId);
    const content = document.getElementById('noteModalContent');

    if (notes.length === 0) {
        content.innerHTML = '<p style="color:var(--gray-400); text-align:center; padding:20px;">ยังไม่มีบันทึก</p>';
    } else {
        content.innerHTML = notes.map(n => `
            <div class="note-item">
                <div class="note-text">${escHtml(n.note)}</div>
                <div class="note-meta">
                    ${n.note_type !== 'general' ? `<span class="status-badge new" style="margin-right:8px">${n.note_type}</span>` : ''}
                    ${n.follow_up_date ? `📅 Follow-up: ${CRM.formatDate(n.follow_up_date)}` : ''}
                    · ${CRM.formatDate(n.created_at)}
                    ${n.follow_up_done ? ' ✅' : ''}
                </div>
            </div>
        `).join('');
    }

    document.getElementById('noteModal').classList.add('active');
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.remove('active');
}

document.getElementById('noteForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const leadId = document.getElementById('noteLeadId').value;
    const note = document.getElementById('newNoteText').value.trim();
    const noteType = document.getElementById('newNoteType').value;
    const followUpDate = document.getElementById('newNoteFollowUp').value || null;

    if (!note) return;

    try {
        await CRM.addNote(leadId, note, noteType, followUpDate);
        document.getElementById('newNoteText').value = '';
        document.getElementById('newNoteFollowUp').value = '';
        await openNoteModal(leadId); // Refresh notes
        await refreshData();
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
});

async function markFollowUpDone(noteId) {
    try {
        await CRM.markFollowUpDone(noteId);
        await refreshData();
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
}

// ===== Modal: Proposal =====
async function openNewProposalModal() {
    // Populate lead dropdown
    const select = document.getElementById('proposalLead');
    select.innerHTML = '<option value="">-- เลือก Lead --</option>' +
        cachedLeads.map(l => `<option value="${l.id}">${escHtml(l.name)} (${escHtml(l.service_type)})</option>`).join('');

    document.getElementById('proposalForm').reset();
    document.getElementById('proposalItems').innerHTML = `
        <div class="proposal-item-row">
            <input type="text" placeholder="รายการ" class="proposal-item-name" style="flex:2">
            <input type="number" placeholder="จำนวน" class="proposal-item-qty" style="flex:1" value="1">
            <input type="number" placeholder="ราคา/หน่วย" class="proposal-item-price" style="flex:1">
            <button type="button" class="table-btn table-btn-delete" onclick="removeProposalItem(this)">ลบ</button>
        </div>
    `;
    updateProposalTotal();
    document.getElementById('proposalModal').classList.add('active');
}

function closeProposalModal() {
    document.getElementById('proposalModal').classList.remove('active');
}

function addProposalItem() {
    const container = document.getElementById('proposalItems');
    const row = document.createElement('div');
    row.className = 'proposal-item-row';
    row.innerHTML = `
        <input type="text" placeholder="รายการ" class="proposal-item-name" style="flex:2">
        <input type="number" placeholder="จำนวน" class="proposal-item-qty" style="flex:1" value="1">
        <input type="number" placeholder="ราคา/หน่วย" class="proposal-item-price" style="flex:1">
        <button type="button" class="table-btn table-btn-delete" onclick="removeProposalItem(this)">ลบ</button>
    `;
    container.appendChild(row);
    // Attach listeners for total calculation
    row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', updateProposalTotal));
}

function removeProposalItem(btn) {
    const rows = document.querySelectorAll('.proposal-item-row');
    if (rows.length <= 1) return;
    btn.closest('.proposal-item-row').remove();
    updateProposalTotal();
}

function updateProposalTotal() {
    let total = 0;
    document.querySelectorAll('.proposal-item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.proposal-item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.proposal-item-price').value) || 0;
        total += qty * price;
    });
    document.getElementById('proposalTotal').textContent = `฿${total.toLocaleString()}`;
    return total;
}

// Listen for input changes
document.addEventListener('input', (e) => {
    if (e.target.classList.contains('proposal-item-qty') || e.target.classList.contains('proposal-item-price')) {
        updateProposalTotal();
    }
});

document.getElementById('proposalForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const items = [];
    document.querySelectorAll('.proposal-item-row').forEach(row => {
        const name = row.querySelector('.proposal-item-name').value;
        const qty = parseFloat(row.querySelector('.proposal-item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.proposal-item-price').value) || 0;
        if (name) items.push({ name, qty, price, total: qty * price });
    });

    const total = items.reduce((sum, item) => sum + item.total, 0);
    const leadId = document.getElementById('proposalLead').value;

    try {
        await CRM.saveProposal({
            lead_id: leadId || null,
            title: document.getElementById('proposalTitle').value,
            items: items,
            subtotal: total,
            tax: 0,
            total: total,
            valid_until: document.getElementById('proposalValidUntil').value || null,
            notes: document.getElementById('proposalNotes').value || null
        });
        closeProposalModal();
        await refreshData();
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
});

async function updateProposalStatus(id, newStatus) {
    try {
        await CRM.updateProposal(id, { status: newStatus });
        await refreshData();
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
}

// ===== Export CSV =====
function exportLeadsCSV() {
    if (cachedLeads.length === 0) {
        alert('ไม่มีข้อมูลให้ export');
        return;
    }

    const headers = ['ชื่อ', 'เบอร์โทร', 'อีเมล', 'บริการ', 'งบประมาณ', 'สถานะ', 'คะแนน', 'วันที่'];
    const rows = cachedLeads.map(l => [
        l.name, l.phone, l.email || '', l.service_type, l.budget_range,
        l.status, l.score, l.created_at
    ]);

    // BOM for Thai Excel compatibility
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nucha-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
