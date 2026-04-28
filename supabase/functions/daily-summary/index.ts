// Supabase Edge Function: daily-summary
// Runs daily (cron: 0 18 * * *)
// Sends evening CRM summary with team performance

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LINE_NOTIFY_TOKEN = Deno.env.get('LINE_NOTIFY_TOKEN') || ''
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ''
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const today = new Date().toISOString().split('T')[0]

    // Get today's stats
    const [
      { count: newLeads },
      { count: totalLeads },
      { count: closedToday },
      { data: todayAppts },
      { data: overdueFollowUps }
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'Closed Won').gte('updated_at', today),
      supabase.from('appointments').select('*').eq('date', today),
      supabase.from('notes').select('*, leads(name)').eq('follow_up_done', false).lte('follow_up_date', today)
    ])

    // Pipeline breakdown
    const { data: allLeads } = await supabase.from('leads').select('status')
    const pipeline = {}
    ;(allLeads || []).forEach(l => { pipeline[l.status] = (pipeline[l.status] || 0) + 1 })

    const message = [
      '📊 ===== สรุป CRM วันนี้ =====',
      '',
      `🆕 Lead ใหม่: ${newLeads || 0} ราย`,
      `📋 Lead ทั้งหมด: ${totalLeads || 0} ราย`,
      `✅ ปิดดีลวันนี้: ${closedToday || 0} ราย`,
      `📅 นัดหมายวันนี้: ${todayAppts?.length || 0} รายการ`,
      '',
      '📊 Pipeline:',
      `  🆕 New Lead: ${pipeline['New Lead'] || 0}`,
      `  📞 Contacted: ${pipeline['Contacted'] || 0}`,
      `  📅 Appointment: ${pipeline['Appointment Set'] || 0}`,
      `  📄 Proposal: ${pipeline['Proposal Sent'] || 0}`,
      `  ✅ Closed Won: ${pipeline['Closed Won'] || 0}`,
      '',
      ...(todayAppts?.length ? [
        '📅 นัดหมายวันนี้:',
        ...todayAppts.map(a => `  • ${a.lead_name} ${a.time} (${a.meeting_type})`),
        ''
      ] : []),
      ...(overdueFollowUps?.length ? [
        `⚠️ Follow-up ค้าง: ${overdueFollowUps.length} รายการ`,
        ''
      ] : []),
      '🔗 เปิด CRM Dashboard เพื่อดูรายละเอียด'
    ].filter(Boolean).join('\n')

    // Send notifications
    const results = await Promise.allSettled([
      sendLineNotify(message),
      sendTelegram(message)
    ])

    return new Response(
      JSON.stringify({
        message: 'Daily summary sent',
        stats: { newLeads, totalLeads, closedToday, todayAppts: todayAppts?.length || 0, overdueFollowUps: overdueFollowUps?.length || 0 },
        channels: { line: results[0].status, telegram: results[1].status }
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

async function sendLineNotify(message) {
  if (!LINE_NOTIFY_TOKEN) return 'skipped'
  const res = await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LINE_NOTIFY_TOKEN}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ message })
  })
  if (!res.ok) throw new Error(`LINE: ${res.status}`)
  return 'sent'
}

async function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return 'skipped'
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
  })
  if (!res.ok) throw new Error(`Telegram: ${res.status}`)
  return 'sent'
}
