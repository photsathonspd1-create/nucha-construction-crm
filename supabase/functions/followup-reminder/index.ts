// Supabase Edge Function: followup-reminder
// Scheduled function that checks for overdue follow-ups
// Set up via Supabase Dashboard > Edge Functions > Schedules
// Cron: 0 9 * * * (daily at 9:00 AM)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LINE_NOTIFY_TOKEN = Deno.env.get('LINE_NOTIFY_TOKEN') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const today = new Date().toISOString().split('T')[0]

    // Find overdue follow-ups
    const { data: overdueNotes, error } = await supabase
      .from('notes')
      .select('*, leads(name, phone, service_type, status)')
      .eq('follow_up_done', false)
      .lte('follow_up_date', today)
      .order('follow_up_date', { ascending: true })

    if (error) throw error

    if (!overdueNotes || overdueNotes.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending follow-ups', count: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Send LINE notification summary
    if (LINE_NOTIFY_TOKEN) {
      const message = [
        '⏰ สรุป Follow-up วันนี้',
        `📋 ${overdueNotes.length} รายการที่ต้องติดตาม`,
        '',
        ...overdueNotes.slice(0, 5).map(n =>
          `• ${n.leads?.name || 'N/A'} — ${n.note.substring(0, 30)}...`
        ),
        overdueNotes.length > 5 ? `\n... และอีก ${overdueNotes.length - 5} รายการ` : '',
        '',
        '🔗 เปิด CRM เพื่อดูทั้งหมด'
      ].join('\n')

      await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LINE_NOTIFY_TOKEN}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ message })
      })
    }

    return new Response(
      JSON.stringify({
        message: 'Follow-up reminders sent',
        count: overdueNotes.length,
        leads: overdueNotes.map(n => n.leads?.name).filter(Boolean)
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
