// Supabase Edge Function: notify
// Handles: new_lead, followup_reminder, new_proposal
// Sends LINE Notify + Email

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const LINE_NOTIFY_TOKEN = Deno.env.get('LINE_NOTIFY_TOKEN') || ''
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || ''
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    let message = ''

    switch (body.type) {
      case 'new_lead': {
        const { lead } = body
        const urgency = lead.score >= 5 ? '🔥 ด่วน!' : lead.score >= 3 ? '⚡ ปานกลาง' : '📋 ปกติ'
        message = [
          '🏗️ ===== LEAD ใหม่! =====',
          '',
          `${urgency} (Score: ${lead.score})`,
          '',
          `👤 ชื่อ: ${lead.name}`,
          `📞 โทร: ${lead.phone}`,
          `🏠 บริการ: ${lead.service_type}`,
          `💰 งบ: ${lead.budget_range}`,
          lead.message ? `💬 ข้อความ: ${lead.message}` : '',
          '',
          '🔗 เปิด CRM เพื่อดูรายละเอียด'
        ].filter(Boolean).join('\n')
        break
      }

      case 'followup_reminder': {
        const { notes } = body
        message = [
          '⏰ ===== FOLLOW-UP วันนี้ =====',
          '',
          `📋 ${notes.length} รายการที่ต้องติดตาม`,
          '',
          ...notes.slice(0, 8).map(n =>
            `• ${n.lead_name} (${n.lead_phone})\n  📝 ${n.note}\n  🏠 ${n.service_type} · 📅 ${n.follow_up_date}`
          ),
          notes.length > 8 ? `\n... และอีก ${notes.length - 8} รายการ` : '',
          '',
          '🔗 เปิด CRM → Follow-up เพื่อดูทั้งหมด'
        ].filter(Boolean).join('\n')
        break
      }

      case 'new_proposal': {
        const { proposal } = body
        message = [
          '💰 ===== ใบเสนอราคาใหม่ =====',
          '',
          `📋 เลขที่: ${proposal.number}`,
          `📄 หัวข้อ: ${proposal.title}`,
          `👤 ลูกค้า: ${proposal.lead_name}`,
          `💵 ยอดรวม: ฿${Number(proposal.total).toLocaleString()}`,
          '',
          '🔗 เปิด CRM → ใบเสนอราคา'
        ].join('\n')
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown notification type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Send to all configured channels
    const results = await Promise.allSettled([
      sendLineNotify(message),
      sendTelegram(message)
    ])

    return new Response(
      JSON.stringify({
        success: true,
        type: body.type,
        channels: {
          line: results[0].status,
          telegram: results[1].status
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendLineNotify(message) {
  if (!LINE_NOTIFY_TOKEN) {
    console.log('LINE_NOTIFY_TOKEN not set, skipping')
    return 'skipped'
  }

  const response = await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINE_NOTIFY_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ message })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`LINE Notify failed (${response.status}): ${err}`)
  }

  return 'sent'
}

async function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Telegram not configured, skipping')
    return 'skipped'
  }

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Telegram failed (${response.status}): ${err}`)
  }

  return 'sent'
}
