// Supabase Edge Function: ai-reply
// Uses PromptDee AI (GPT-4o-mini) to generate sales replies
// Supports: auto_reply, follow_up, copilot, analyze_lead, close, strategy

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PROMPTDEE_API_URL = 'https://www.promptdee.net/api/ai-chat'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

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
    const { type, lead, context } = body

    // Fetch full context from DB if needed
    let fullContext = context || {}
    if (lead?.id && SUPABASE_URL) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const [notesRes, activitiesRes] = await Promise.all([
        supabase.from('notes').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('activities').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }).limit(10)
      ])
      fullContext.notes = notesRes.data || []
      fullContext.activities = activitiesRes.data || []
    }

    let systemPrompt = ''
    let userMessage = ''

    switch (type) {
      case 'auto_reply': {
        const urgency = lead.score >= 5 ? 'ด่วนมาก ต้องตอบภายใน 5 นาที' : lead.score >= 3 ? 'ปานกลาง' : 'ปกติ'
        systemPrompt = `คุณคือเซลบริษัทก่อสร้าง NUCHA INNOVATION ระดับมืออาชีพ

หน้าที่:
- สร้างความน่าเชื่อถือ
- เข้าใจความต้องการลูกค้า
- ชวนไปขั้นตอนถัดไป (นัดคุย / โทร)

กฎ:
- ตอบไม่เกิน 4 บรรทัด
- สุภาพ เป็นกันเอง
- ถามคำถาม 1 ข้อท้ายข้อความ
- ห้ามขายแรงเกินไป
- ตอบเป็นภาษาไทย`

        const notesContext = fullContext.notes?.length > 0
          ? `\nบันทึกล่าสุด: ${fullContext.notes.map(n => n.note).join(' | ')}`
          : ''

        userMessage = `ข้อมูลลูกค้า:
- ชื่อ: ${lead.name}
- บริการ: ${lead.service_type}
- งบประมาณ: ${lead.budget_range}
- ข้อความ: ${lead.message || 'ไม่ได้ระบุ'}
- ความสำคัญ: ${urgency}
${notesContext}

สร้างข้อความตอบกลับอัตโนมัติ สั้นๆ สุภาพ ให้ลูกรู้สึกว่าเราใส่ใจ`
        break
      }

      case 'follow_up': {
        const daysSince = context?.daysSince || 3
        systemPrompt = `คุณคือเซลบริษัทก่อสร้าง NUCHA INNOVATION

หน้าที่: สร้างข้อความ follow-up ที่ไม่ทำให้ลูกรู้สึกรำคาญ

กฎ:
- ไม่เกิน 3 บรรทัด
- สุภาพ ไม่กดดัน
- ให้เหตุผลว่าทำไมควรคุยต่อ
- ถามคำถาม 1 ข้อ
- ตอบเป็นภาษาไทย`

        const historyContext = fullContext.notes?.length > 0
          ? `\nประวัติคุย:\n${fullContext.notes.map(n => `- [${n.note_type}] ${n.note}`).join('\n')}`
          : ''

        userMessage = `ข้อมูล:
- ชื่อ: ${lead.name}
- บริการ: ${lead.service_type}
- งบ: ${lead.budget_range}
- ไม่ตอบมา: ${daysSince} วัน
${historyContext}

สร้างข้อความ follow-up ที่เหมาะสมกับระยะเวลาและประวัติ`
        break
      }

      case 'follow_up_sequence': {
        const day = context?.day || 1
        systemPrompt = `คุณคือเซลบริษัทก่อสร้าง NUCHA INNOVATION

สร้างข้อความ follow-up วันที่ ${day} จากทั้งหมด 7 วัน

กฎ:
- ไม่เกิน 3 บรรทัด
- แต่ละวันต้องไม่ซ้ำกัน
- วันที่ 1-2: ส่งผลงาน
- วันที่ 3-4: เสนอข้อเสนอพิเศษ
- วันที่ 5-6: ถามความต้องการ
- วันที่ 7: ครั้งสุดท้าย สุภาพ
- ตอบเป็นภาษาไทย`

        userMessage = `ข้อมูล:
- ชื่อ: ${lead.name}
- บริการ: ${lead.service_type}
- งบ: ${lead.budget_range}

สร้างข้อความ follow-up สำหรับวันที่ ${day}`
        break
      }

      case 'copilot': {
        systemPrompt = `คุณคือเซลบริษัทก่อสร้าง NUCHA INNOVATION ช่วยทีมขายเขียนข้อความ

กฎ:
- ตอบตาม tone ที่ขอ
- ถ้าไม่ระบุ tone ใช้สุภาพ เป็นกันเอง
- ไม่เกิน 4 บรรทัด
- มีคำถาม 1 ข้อท้าย
- ตอบเป็นภาษาไทย`

        userMessage = context?.prompt || 'เขียนข้อความทักทายลูกค้าใหม่'
        break
      }

      case 'analyze_lead': {
        systemPrompt = `คุณคือนักวิเคราะห์ขายบริษัทก่อสร้างอาวุโส

วิเคราะห์ lead แบบลึก แล้วให้กลยุทธ์ปิดดีล

ตอบเป็น JSON เท่านั้น:
{
  "approach": "วิธีติดต่อที่ดีที่สุด",
  "talking_points": ["ประเด็น1", "ประเด็น2", "ประเด็น3"],
  "risk": "ความเสี่ยงที่จะเสีย lead",
  "suggestion": "คำแนะนำเชิงกลยุทธ์",
  "priority": "high/medium/low",
  "next_action": "สิ่งที่ควรทำต่อไปทันที",
  "estimated_close_probability": "เปอร์เซ็นต์ที่จะปิดได้"
}`

        const notesHistory = fullContext.notes?.length > 0
          ? `\nบันทึกทั้งหมด:\n${fullContext.notes.map(n => `- [${n.note_type}${n.follow_up_date ? ' follow-up:' + n.follow_up_date : ''}] ${n.note}`).join('\n')}`
          : ''
        const activityHistory = fullContext.activities?.length > 0
          ? `\nกิจกรรมล่าสุด:\n${fullContext.activities.map(a => `- ${a.action}: ${JSON.stringify(a.details)}`).join('\n')}`
          : ''

        userMessage = `ข้อมูล:
- ชื่อ: ${lead.name}
- บริการ: ${lead.service_type}
- งบ: ${lead.budget_range}
- ข้อความ: ${lead.message || 'ไม่ได้ระบุ'}
- Score: ${lead.score}
- สถานะ: ${lead.status}
- สร้างเมื่อ: ${lead.created_at}
- มอบหมาย: ${lead.assigned_to || 'ไม่ระบุ'}
${notesHistory}${activityHistory}

วิเคราะห์ lead นี้แบบเจาะลึก`
        break
      }

      case 'close': {
        systemPrompt = `คุณคือเซลบริษัทก่อสร้าง NUCHA INNOVATION ระดับ senior closer

หน้าที่: สร้างข้อความ "ปิดดีล" ที่ทำให้ลูกค้าตัดสินใจ

กฎ:
- ไม่เกิน 4 บรรทัด
- สร้าง urgency แต่ไม่กดดัน
- เสนอสิ่งจูงใจ (ส่วนลด/ของแถม/ล็อคราคา)
- มี call to action ชัดเจน
- ตอบเป็นภาษาไทย`

        const closeNotes = fullContext.notes?.length > 0
          ? `\nสิ่งที่คุยมา:\n${fullContext.notes.slice(0, 3).map(n => `- ${n.note}`).join('\n')}`
          : ''

        userMessage = `ข้อมูล:
- ชื่อ: ${lead.name}
- บริการ: ${lead.service_type}
- งบ: ${lead.budget_range}
- สถานะ: ${lead.status}
- Score: ${lead.score}
${closeNotes}

สร้างข้อความปิดดีลที่เหมาะกับสถานการณ์`
        break
      }

      case 'strategy': {
        systemPrompt = `คุณคือ Sales Director บริษัทก่อสร้าง NUCHA INNOVATION

หน้าที่: วางแผนกลยุทธ์ปิดดีลแบบเจาะลึก

ตอบเป็น JSON เท่านั้น:
{
  "priority": "high/medium/low",
  "strategy": "กลยุทธ์หลัก",
  "next_action": "สิ่งที่ควรทำทันที",
  "timeline": "กรอบเวลาที่เหมาะสม",
  "risk": "ความเสี่ยงหลัก",
  "mitigation": "วิธีลดความเสี่ยง",
  "closing_tactic": "เทคนิคปิดดีลเฉพาะ",
  "estimated_value": "มูลค่าที่คาดหวัง",
  "close_probability": "เปอร์เซ็นต์ที่จะปิดได้"
}`

        const stratNotes = fullContext.notes?.length > 0
          ? `\nประวัติ:\n${fullContext.notes.map(n => `- ${n.note}`).join('\n')}`
          : ''

        userMessage = `ข้อมูล:
- ชื่อ: ${lead.name}
- บริการ: ${lead.service_type}
- งบ: ${lead.budget_range}
- ข้อความ: ${lead.message || 'ไม่ได้ระบุ'}
- Score: ${lead.score}
- สถานะ: ${lead.status}
- สร้างเมื่อ: ${lead.created_at}
${stratNotes}

วางแผนกลยุทธ์ปิดดีลนี้`
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown AI type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Call PromptDee AI API
    const aiRes = await fetch(PROMPTDEE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `${systemPrompt}\n\n---\n\n${userMessage}`
      })
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      throw new Error(`PromptDee API error (${aiRes.status}): ${errText}`)
    }

    const aiData = await aiRes.json()
    const aiReply = aiData.reply || aiData.message || aiData.text || aiData.response || aiData.result || JSON.stringify(aiData)

    // Try to parse JSON for structured responses
    let parsed = null
    try {
      const jsonMatch = aiReply.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch {}

    return new Response(
      JSON.stringify({
        success: true,
        type: type,
        reply: aiReply.trim(),
        parsed: parsed,
        raw: aiData
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
