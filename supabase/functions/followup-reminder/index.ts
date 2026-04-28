// Supabase Edge Function: followup-reminder
// Runs daily (cron: 0 9 * * *)
// Checks for overdue follow-ups and sends LINE/Telegram reminder

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

    // Find overdue follow-ups (today and earlier, not done)
    const { data: overdueNotes, error } = await supabase
      .from('notes')
      .select('*, leads(name, phone, service_type, status, score)')
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

    // Sort by priority (score high first)
    overdueNotes.sort((a, b) => (b.leads?.score || 0) - (a.leads?.score || 0))

    // Build notification message
    const lines = [
      '⏰ ===== FOLLOW-UP วันนี้ =====',
      '',
      `📋 ${overdueNotes.length} รายการที่ต้องติดตาม`,
      ''
    ]

    overdueNotes.forEach((n, i) => {
      if (i >= 8) return // Limit to 8 items in notification
      const priority = (n.leads?.score || 0) >= 5 ? '🔴' : (n.leads?.score || 0) >= 3 ? '🟡' : '🟢'
      lines.push(`${priority} ${n.leads?.name || 'N/A'} — ${n.leads?.service_type || ''}`)
      lines.push(`   📞 ${n.leads?.phone || ''}`)
      lines.push(`   📝 ${n.note.substring(0, 40)}${n.note.length > 40 ? '...' : ''}`)
      lines.push(`   📅 ${n.follow_up_date} · Status: ${n.leads?.status || ''}`)
      lines.push('')
    })

    if (overdueNotes.length > 8) {
      lines.push(`... และอีก ${overdueNotes.length - 8} รายการ`)
      lines.push('')
    }

    lines.push('🔗 เปิด CRM → Follow-up เพื่อดูทั้งหมด')

    const message = lines.join('\n')

    // Send notifications
    const results = await Promise.allSettled([
      sendLineNotify(message),
      sendTelegram(message)
    ])

    return new Response(
      JSON.stringify({
        message: 'Follow-up reminders sent',
        count: overdueNotes.length,
        leads: overdueNotes.map(n => n.leads?.name).filter(Boolean),
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
