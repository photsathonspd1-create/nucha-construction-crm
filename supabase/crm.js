// ============================================
// NUCHA CRM — Supabase-powered CRM Module
// Drop-in replacement for localStorage CRM
// ============================================

const CRM = {
    // ===== LEADS =====
    async getLeads() {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) { console.error('getLeads:', error); return []; }
        return data || [];
    },

    async getLeadById(id) {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();
        if (error) { console.error('getLeadById:', error); return null; }
        return data;
    },

    async saveLead(lead) {
        // Calculate score
        lead.score = this.calculateScore(lead);
        lead.status = lead.status || 'New Lead';

        const { data, error } = await supabase
            .from('leads')
            .insert([lead])
            .select()
            .single();
        if (error) { console.error('saveLead:', error); throw error; }

        // Log activity
        await this.logActivity(data.id, 'lead_created', { source: lead.source || 'website' });

        // Trigger notification
        await this.notifyNewLead(data);

        return data;
    },

    async updateLead(id, updates) {
        if (updates.budget_range || updates.service_type || updates.message) {
            const lead = await this.getLeadById(id);
            if (lead) {
                updates.score = this.calculateScore({ ...lead, ...updates });
            }
        }

        const { data, error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) { console.error('updateLead:', error); throw error; }
        return data;
    },

    async deleteLead(id) {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);
        if (error) { console.error('deleteLead:', error); throw error; }
    },

    async searchLeads(query, filters = {}) {
        let q = supabase.from('leads').select('*');

        if (query) {
            q = q.or(`name.ilike.%${query}%,phone.ilike.%${query}%`);
        }
        if (filters.status) {
            q = q.eq('status', filters.status);
        }
        if (filters.service_type) {
            q = q.eq('service_type', filters.service_type);
        }

        q = q.order('created_at', { ascending: false });

        const { data, error } = await q;
        if (error) { console.error('searchLeads:', error); return []; }
        return data || [];
    },

    // ===== APPOINTMENTS =====
    async getAppointments() {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('date', { ascending: true });
        if (error) { console.error('getAppointments:', error); return []; }
        return data || [];
    },

    async getTodayAppointments() {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('date', today)
            .order('time', { ascending: true });
        if (error) { console.error('getTodayAppointments:', error); return []; }
        return data || [];
    },

    async saveAppointment(appt) {
        appt.status = appt.status || 'confirmed';

        const { data, error } = await supabase
            .from('appointments')
            .insert([appt])
            .select()
            .single();
        if (error) { console.error('saveAppointment:', error); throw error; }

        // Update lead status if linked
        if (appt.lead_id) {
            await this.updateLead(appt.lead_id, { status: 'Appointment Set' });
        }

        return data;
    },

    async updateAppointment(id, updates) {
        const { data, error } = await supabase
            .from('appointments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) { console.error('updateAppointment:', error); throw error; }
        return data;
    },

    // ===== NOTES =====
    async getNotes(leadId) {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });
        if (error) { console.error('getNotes:', error); return []; }
        return data || [];
    },

    async addNote(leadId, note, noteType = 'general', followUpDate = null) {
        const { data, error } = await supabase
            .from('notes')
            .insert([{
                lead_id: leadId,
                note: note,
                note_type: noteType,
                follow_up_date: followUpDate
            }])
            .select()
            .single();
        if (error) { console.error('addNote:', error); throw error; }
        return data;
    },

    async getPendingFollowUps() {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('notes')
            .select('*, leads(name, phone, service_type)')
            .eq('follow_up_done', false)
            .lte('follow_up_date', today)
            .order('follow_up_date', { ascending: true });
        if (error) { console.error('getPendingFollowUps:', error); return []; }
        return data || [];
    },

    async markFollowUpDone(noteId) {
        const { error } = await supabase
            .from('notes')
            .update({ follow_up_done: true })
            .eq('id', noteId);
        if (error) { console.error('markFollowUpDone:', error); throw error; }
    },

    // ===== PROPOSALS =====
    async getProposals(leadId = null) {
        let q = supabase.from('proposals').select('*').order('created_at', { ascending: false });
        if (leadId) q = q.eq('lead_id', leadId);
        const { data, error } = await q;
        if (error) { console.error('getProposals:', error); return []; }
        return data || [];
    },

    async saveProposal(proposal) {
        // Generate proposal number
        const count = await this.getProposalCount();
        proposal.proposal_number = `NP-${String(count + 1).padStart(4, '0')}`;
        proposal.status = proposal.status || 'draft';

        const { data, error } = await supabase
            .from('proposals')
            .insert([proposal])
            .select()
            .single();
        if (error) { console.error('saveProposal:', error); throw error; }

        // Update lead status
        if (proposal.lead_id) {
            await this.updateLead(proposal.lead_id, { status: 'Proposal Sent' });
        }

        return data;
    },

    async updateProposal(id, updates) {
        const { data, error } = await supabase
            .from('proposals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) { console.error('updateProposal:', error); throw error; }
        return data;
    },

    async getProposalCount() {
        const { count, error } = await supabase
            .from('proposals')
            .select('*', { count: 'exact', head: true });
        return count || 0;
    },

    // ===== ACTIVITIES =====
    async logActivity(leadId, action, details = {}) {
        const { error } = await supabase
            .from('activities')
            .insert([{
                lead_id: leadId,
                action: action,
                details: details
            }]);
        if (error) console.error('logActivity:', error);
    },

    async getActivities(leadId = null, limit = 50) {
        let q = supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(limit);
        if (leadId) q = q.eq('lead_id', leadId);
        const { data, error } = await q;
        if (error) { console.error('getActivities:', error); return []; }
        return data || [];
    },

    // ===== STATS =====
    async getStats() {
        const leads = await this.getLeads();
        const appts = await this.getAppointments();
        const today = new Date().toISOString().split('T')[0];

        return {
            totalLeads: leads.length,
            closedDeals: leads.filter(l => l.status === 'Closed Won').length,
            todayAppts: appts.filter(a => a.date === today).length,
            newLeads: leads.filter(l => l.status === 'New Lead').length,
            conversionRate: leads.length > 0
                ? Math.round((leads.filter(l => l.status === 'Closed Won').length / leads.length) * 100)
                : 0
        };
    },

    // ===== PIPELINE =====
    async getPipelineStats() {
        const leads = await this.getLeads();
        const stages = ['New Lead', 'Contacted', 'Appointment Set', 'Proposal Sent', 'Closed Won', 'Closed Lost'];
        return stages.map(stage => ({
            stage,
            count: leads.filter(l => l.status === stage).length,
            leads: leads.filter(l => l.status === stage)
        }));
    },

    // ===== LEAD SCORING =====
    calculateScore(lead) {
        let score = 0;
        const budgetScores = {
            'มากกว่า 10,000,000': 5,
            '5,000,000 - 10,000,000': 4,
            '3,000,000 - 5,000,000': 3,
            '1,000,000 - 3,000,000': 2,
            '500,000 - 1,000,000': 1,
            'ต่ำกว่า 500,000': 0.5
        };
        score += budgetScores[lead.budget_range] || 0;
        if (lead.service_type && lead.service_type !== 'อื่นๆ') score += 2;
        if (lead.message && lead.message.length > 10) score += 1;
        if (lead.date) score += 2;
        return Math.round(score * 10) / 10;
    },

    // ===== TEAM / USER MANAGEMENT =====
    async getUsers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name');
        if (error) { console.error('getUsers:', error); return []; }
        return data || [];
    },

    async assignLead(leadId, userId) {
        const { data, error } = await supabase
            .from('leads')
            .update({ assigned_to: userId })
            .eq('id', leadId)
            .select()
            .single();
        if (error) { console.error('assignLead:', error); throw error; }

        // Log activity
        await this.logActivity(leadId, 'lead_assigned', { assigned_to: userId });
        return data;
    },

    async getMyLeads(userId) {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('assigned_to', userId)
            .order('created_at', { ascending: false });
        if (error) { console.error('getMyLeads:', error); return []; }
        return data || [];
    },

    async getTeamPerformance() {
        const users = await this.getUsers();
        const leads = await this.getLeads();
        return users.map(u => {
            const userLeads = leads.filter(l => l.assigned_to === u.id);
            const closed = userLeads.filter(l => l.status === 'Closed Won').length;
            return {
                ...u,
                totalLeads: userLeads.length,
                closedDeals: closed,
                conversionRate: userLeads.length > 0 ? Math.round((closed / userLeads.length) * 100) : 0,
                pipeline: {
                    new: userLeads.filter(l => l.status === 'New Lead').length,
                    contacted: userLeads.filter(l => l.status === 'Contacted').length,
                    appointment: userLeads.filter(l => l.status === 'Appointment Set').length,
                    proposal: userLeads.filter(l => l.status === 'Proposal Sent').length,
                }
            };
        });
    },

    // ===== NOTIFICATIONS (Enhanced) =====
    async notifyNewLead(lead) {
        try {
            const { error } = await supabase.functions.invoke('notify', {
                body: {
                    type: 'new_lead',
                    lead: {
                        id: lead.id,
                        name: lead.name,
                        phone: lead.phone,
                        service_type: lead.service_type,
                        budget_range: lead.budget_range,
                        score: lead.score,
                        message: lead.message
                    }
                }
            });
            if (error) console.error('notifyNewLead:', error);
        } catch (e) {
            console.warn('Notification failed:', e.message);
        }
    },

    async notifyFollowUpReminder(notes) {
        try {
            const { error } = await supabase.functions.invoke('notify', {
                body: {
                    type: 'followup_reminder',
                    notes: notes.map(n => ({
                        lead_name: n.leads?.name || 'N/A',
                        lead_phone: n.leads?.phone || '',
                        note: n.note,
                        follow_up_date: n.follow_up_date,
                        service_type: n.leads?.service_type || ''
                    }))
                }
            });
            if (error) console.error('notifyFollowUpReminder:', error);
        } catch (e) {
            console.warn('Follow-up notification failed:', e.message);
        }
    },

    async notifyNewProposal(proposal, leadName) {
        try {
            const { error } = await supabase.functions.invoke('notify', {
                body: {
                    type: 'new_proposal',
                    proposal: {
                        number: proposal.proposal_number,
                        title: proposal.title,
                        total: proposal.total,
                        lead_name: leadName
                    }
                }
            });
            if (error) console.error('notifyNewProposal:', error);
        } catch (e) {
            console.warn('Proposal notification failed:', e.message);
        }
    },

    // ===== HELPER: Format date for Thai display =====
    formatDate(iso) {
        if (!iso) return '-';
        const d = new Date(iso);
        const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
    },

    getMeetingLabel(type) {
        const labels = { 'onsite': 'เข้าดูหน้างาน', 'online': 'วิดีโอคอล', 'phone': 'โทรศัพท์' };
        return labels[type] || type || '-';
    }
};

// Export globally
window.CRM = CRM;
