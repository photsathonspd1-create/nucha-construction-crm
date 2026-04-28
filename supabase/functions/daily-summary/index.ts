// Supabase Edge Function: daily-summary
// Sends daily CRM summary every evening
// Cron: 0 18 * * * (daily at 6:00 PM)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LINE_NOTIFY_TOKEN = Deno.env.get('LINE_NOTIFY_TOKEN') || ''
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
      { data: todayAppts },
      { data: recentActivities }
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('appointments').select('*').eq('date', today),
      supabase.from('activities').select('*').gte('created_at', today).limit(10)
    ])

    const message = [
      '📊 สรุป CRM วันนี้',
      '',
      `🆕 Lead ใหม่: ${newLeads || 0} ราย`,
      `📋 Lead ทั้งหมด: ${totalLeads || 0} ราย`,
      `📅 นัดหมายวันนี้: ${todayAppts?.length || 0} รายการ`,
      '',
      todayAppts?.length ? '📅 นัดหมาย:' : '',
      ...(todayAppts || []).map(a => `  • ${a.lead_name} ${a.time} (${a.meeting_type})`),
      '',
      '🔗 เปิด CRM Dashboard เพื่อดูรายละเอียด'
    ].filter(Boolean).join('\n')

    if (LINE_NOTIFY_TOKEN) {
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
        message: 'Daily summary sent',
        stats: { newLeads, totalLeads, todayAppts: todayAppts?.length || 0 }
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
