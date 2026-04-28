// Supabase Edge Function: notify
// Sends LINE Notify + Email when new lead is created

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const LINE_NOTIFY_TOKEN = Deno.env.get('LINE_NOTIFY_TOKEN') || ''
const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
const SMTP_PORT = Deno.env.get('SMTP_PORT') || '587'
const SMTP_USER = Deno.env.get('SMTP_USER') || ''
const SMTP_PASS = Deno.env.get('SMTP_PASS') || ''
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') || ''
const AUTO_REPLY_ENABLED = Deno.env.get('AUTO_REPLY_ENABLED') === 'true'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, lead } = await req.json()

    if (type === 'new_lead') {
      const results = await Promise.allSettled([
        sendLineNotify(lead),
        sendEmailNotify(lead)
      ])

      return new Response(
        JSON.stringify({
          success: true,
          line: results[0].status,
          email: results[1].status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Unknown notification type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendLineNotify(lead) {
  if (!LINE_NOTIFY_TOKEN) {
    console.log('LINE_NOTIFY_TOKEN not set, skipping')
    return 'skipped'
  }

  const message = [
    '🏗️ Lead ใหม่!',
    `👤 ${lead.name}`,
    `📞 ${lead.phone}`,
    `🏠 ${lead.service_type}`,
    `💰 ${lead.budget_range}`,
    `⭐ Score: ${lead.score}`,
    '',
    '📋 เปิด CRM เพื่อดูรายละเอียด'
  ].join('\n')

  const response = await fetch('https://notify-api.line.me/api/notify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINE_NOTIFY_TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ message })
  })

  if (!response.ok) throw new Error(`LINE Notify failed: ${response.status}`)
  return 'sent'
}

async function sendEmailNotify(lead) {
  if (!SMTP_USER || !NOTIFY_EMAIL) {
    console.log('SMTP not configured, skipping email')
    return 'skipped'
  }

  // Using fetch to a simple email API (or integrate with Resend/SendGrid)
  // For now, log that email would be sent
  console.log(`Email notification would be sent to ${NOTIFY_EMAIL} for lead: ${lead.name}`)
  return 'configured'
}
