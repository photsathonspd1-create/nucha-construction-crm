// Supabase Edge Function: sla-check
// Runs every 5 minutes (cron: */5 * * * *)
// Checks for SLA breaches and sends LINE/Telegram alert

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

    // Get SLA breaches using the DB function
    const { data: breaches, error } = await supabase.rpc('get_sla_breaches')

    if (error) throw error

    if (!breaches || breaches.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No SLA breaches', count: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build alert message
    const lines = [
      '🚨 ===== SLA BREACH ALERT =====',
      '',
      `⚠️ ${breaches.length} leads ที่เกิน SLA!`,
      ''
    ]

    breaches.forEach(b => {
      const urgency = b.lead_score >= 5 ? '🔴 ด่วน!' : b.lead_score >= 3 ? '🟡 ปานกลาง' : '🟢 ปกติ'
      const timeStr = b.minutes_since_created >= 1440
        ? `${Math.round(b.minutes_since_created / 1440)} วัน`
        : b.minutes_since_created >= 60
          ? `${Math.round(b.minutes_since_created / 60)} ชั่วโมง`
          : `${Math.round(b.minutes_since_created)} นาที`

      lines.push(`${urgency} ${b.lead_name}`)
      lines.push(`   📞 ${b.lead_phone}`)
      lines.push(`   ⏰ สร้างมา ${timeStr} แล้ว — ยังไม่มีการติดต่อ!`)
      lines.push(`   👤 มอบหมาย: ${b.assigned_name || 'ไม่ระบุ'}`)
      lines.push('')
    })

    lines.push('🔗 เปิด CRM → โทรทันที!')

    const message = lines.join('\n')

    // Send alerts
    const results = await Promise.allSettled([
      sendLineNotify(message),
      sendTelegram(message)
    ])

    return new Response(
      JSON.stringify({
        message: 'SLA alerts sent',
        count: breaches.length,
        leads: breaches.map(b => b.lead_name),
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
