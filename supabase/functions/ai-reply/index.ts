// Supabase Edge Function: ai-reply
// Uses PromptDee AI (GPT-4o-mini) to generate sales replies
// Supports: auto_reply, follow_up, copilot

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const PROMPTDEE_API_URL = 'https://www.promptdee.net/api/ai-chat'
const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || ''
const LINE_NOTIFY_TOKEN = Deno.env.get('LINE_NOTIFY_TOKEN') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, lead, context } = await req.json()

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

        userMessage = `ข้อมูลลูกค้า:
- ชื่อ: ${lead.name}
- บริการ: ${lead.service_type}
- งบประมาณ: ${lead.budget_range}
- ข้อความ: ${lead.message || 'ไม่ได้ระบุ'}
- ความสำคัญ: ${urgency}

สร้างข้อความตอบกลับอัตโนมัติ สั้นๆ สุภาพ ให้ลูกรู้สึกว่าเราใส่ใจ`
        break
      }

      case 'follow_up': {
        const daysSince = context?.daysSince || 3
        const lastNote = context?.lastNote || ''
        systemPrompt = `คุณคือเซลบริษัทก่อสร้าง NUCHA INNOVATION

หน้าที่: สร้างข้อความ follow-up ที่ไม่ทำให้ลูกรู้สึกรำคาญ

กฎ:
- ไม่เกิน 3 บรรทัด
- สุภาพ ไม่กดดัน
- ให้เหตุผลว่าทำไมควรคุยต่อ
- ถามคำถาม 1 ข้อ
- ตอบเป็นภาษาไทย`

        userMessage = `ข้อมูล:
- ชื่อ: ${lead.name}
- บริการ: ${lead.service_type}
- งบ: ${lead.budget_range}
- ไม่ตอบมา: ${daysSince} วัน
- บันทึกล่าสุด: ${lastNote}

สร้างข้อความ follow-up ที่เหมาะสมกับระยะเวลาที่ไม่ตอบ`
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
        systemPrompt = `คุณคือนักวิเคราะห์ขายบริษัทก่อสร้าง

วิเคราะห์ lead แล้วให้คำแนะนำ:
1. ควรติดต่อด้วยวิธีไหน (โทร/LINE/นัด)
2. ควรพูดเรื่องอะไร
3. ความเสี่ยงที่จะเสีย lead

ตอบเป็น JSON:
{
  "approach": "วิธีติดต่อ",
  "talking_points": ["จุด1", "จุด2"],
  "risk": "ความเสี่ยง",
  "suggestion": "คำแนะนำ"
}`

        userMessage = `ข้อมูล:
- ชื่อ: ${lead.name}
- บริการ: ${lead.service_type}
- งบ: ${lead.budget_range}
- ข้อความ: ${lead.message || 'ไม่ได้ระบุ'}
- Score: ${lead.score}
- สถานะ: ${lead.status}
- สร้างเมื่อ: ${lead.created_at}`
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
    // Try common response fields
    const aiReply = aiData.reply || aiData.message || aiData.text || aiData.response || aiData.result || JSON.stringify(aiData)

    return new Response(
      JSON.stringify({
        success: true,
        type: type,
        reply: aiReply.trim(),
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
