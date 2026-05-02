// ===== NUCHA Chat Widget — Embeddable Version =====
// Include this script before </body> on any page to add the chat widget
// <script src="/chat-widget.js"><\/script>

(function() {
  // Prevent double-load
  if (window.__nuchaChatLoaded) return;
  window.__nuchaChatLoaded = true;

  // ===== Styles =====
  const style = document.createElement('style');
  style.textContent = `
    .chat-widget{position:fixed;bottom:24px;right:24px;z-index:9999;font-family:'Noto Sans Thai','Inter',sans-serif}
    .chat-trigger{width:60px;height:60px;border-radius:50%;background:#D60000;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(214,0,0,0.35);transition:all .3s ease;position:relative}
    .chat-trigger:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(214,0,0,0.45)}
    .chat-trigger svg{width:28px;height:28px}
    .chat-trigger .chat-close{display:none}
    .chat-trigger.active .chat-icon{display:none}
    .chat-trigger.active .chat-close{display:block}
    .chat-trigger .badge{position:absolute;top:-4px;right:-4px;width:20px;height:20px;background:#FFB800;border-radius:50%;font-size:.65rem;font-weight:800;display:flex;align-items:center;justify-content:center;color:#4A4543;border:2px solid #fff;animation:badgeP 2s ease-in-out infinite}
    @keyframes badgeP{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
    .chat-panel{position:absolute;bottom:72px;right:0;width:380px;max-height:520px;background:#fff;border-radius:20px;box-shadow:0 12px 40px rgba(0,0,0,0.15);overflow:hidden;display:none;flex-direction:column;animation:chatUp .3s ease}
    .chat-panel.open{display:flex}
    @keyframes chatUp{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
    .chat-header{background:#D60000;color:#fff;padding:18px 20px;display:flex;align-items:center;gap:12px}
    .chat-header-avatar{width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem}
    .chat-header-info h3{font-size:.95rem;font-weight:700;margin-bottom:2px}
    .chat-header-info p{font-size:.75rem;opacity:.8}
    .chat-header-status{width:8px;height:8px;background:#4ADE80;border-radius:50%;display:inline-block;margin-right:4px;animation:sB 2s infinite}
    @keyframes sB{0%,100%{opacity:1}50%{opacity:.4}}
    .chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;max-height:340px;min-height:280px;background:#F7F5F4}
    .chat-body::-webkit-scrollbar{width:4px}.chat-body::-webkit-scrollbar-thumb{background:#C8C2BF;border-radius:2px}
    .msg{max-width:85%;padding:10px 14px;border-radius:16px;font-size:.88rem;line-height:1.6;animation:mIn .3s ease}
    @keyframes mIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .msg.bot{background:#fff;color:#4A4543;border:1px solid #E4E0DE;align-self:flex-start;border-bottom-left-radius:4px}
    .msg.user{background:#D60000;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
    .msg-time{font-size:.65rem;color:#9B9593;margin-top:4px;text-align:right}
    .msg.bot .msg-time{text-align:left;color:#C8C2BF}
    .typing{display:flex;gap:4px;padding:10px 14px;background:#fff;border:1px solid #E4E0DE;border-radius:16px;border-bottom-left-radius:4px;align-self:flex-start;max-width:60px}
    .typing span{width:7px;height:7px;background:#C8C2BF;border-radius:50%;animation:tD 1.2s infinite}
    .typing span:nth-child(2){animation-delay:.2s}.typing span:nth-child(3){animation-delay:.4s}
    @keyframes tD{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}
    .quick-replies{display:flex;flex-wrap:wrap;gap:8px;padding:4px 0}
    .quick-reply{padding:8px 16px;background:#fff;border:2px solid #D60000;color:#D60000;border-radius:50px;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .3s ease;font-family:inherit}
    .quick-reply:hover{background:#D60000;color:#fff}
    .chat-input-area{padding:12px 16px;background:#fff;border-top:1px solid #F0EDEB;display:flex;gap:8px;align-items:center}
    .chat-input-area input{flex:1;padding:10px 14px;border:2px solid #E4E0DE;border-radius:50px;font-size:.88rem;font-family:inherit;color:#4A4543;outline:none;transition:border-color .3s}
    .chat-input-area input:focus{border-color:#D60000}
    .chat-input-area input::placeholder{color:#C8C2BF}
    .chat-send{width:40px;height:40px;border-radius:50%;background:#D60000;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .3s;flex-shrink:0}
    .chat-send:hover{background:#B00000;transform:scale(1.05)}
    .chat-send svg{width:18px;height:18px}
    .chat-form-area{padding:16px;background:#fff;border-top:1px solid #F0EDEB;display:none}
    .chat-form-area.show{display:block}
    .chat-form-area h4{font-size:.9rem;font-weight:700;color:#4A4543;margin-bottom:12px}
    .chat-form-area input,.chat-form-area select{width:100%;padding:10px 14px;border:2px solid #E4E0DE;border-radius:10px;font-size:.85rem;font-family:inherit;color:#4A4543;margin-bottom:8px;outline:none;transition:border-color .3s}
    .chat-form-area input:focus,.chat-form-area select:focus{border-color:#D60000}
    .chat-form-btn{width:100%;padding:12px;background:#D60000;color:#fff;border:none;border-radius:50px;font-size:.9rem;font-weight:700;font-family:inherit;cursor:pointer;transition:all .3s}
    .chat-form-btn:hover{background:#B00000}
    .chat-form-btn:disabled{opacity:.6;cursor:not-allowed}
    .chat-powered{text-align:center;padding:6px;font-size:.65rem;color:#C8C2BF;background:#fff}
    @media(max-width:480px){.chat-panel{width:calc(100vw - 32px);right:-8px;max-height:70vh}.chat-widget{bottom:16px;right:16px}}
  `;
  document.head.appendChild(style);

  // ===== HTML =====
  const widget = document.createElement('div');
  widget.className = 'chat-widget';
  widget.id = 'chatWidget';
  widget.innerHTML = `
    <div class="chat-panel" id="chatPanel">
      <div class="chat-header">
        <div class="chat-header-avatar">N</div>
        <div class="chat-header-info">
          <h3>NUCHA INNOVATION</h3>
          <p><span class="chat-header-status"></span>ออนไลน์ — ตอบกลับทันที</p>
        </div>
      </div>
      <div class="chat-body" id="chatBody"></div>
      <div class="chat-form-area" id="chatFormArea">
        <h4>📝 กรอกข้อมูลติดต่อ</h4>
        <input type="text" id="chatName" placeholder="ชื่อ-นามสกุล">
        <input type="tel" id="chatPhone" placeholder="เบอร์โทรศัพท์">
        <select id="chatService">
          <option value="">เลือกบริการที่สนใจ</option>
          <option value="รับเหมาก่อสร้าง">🏗️ รับเหมาก่อสร้าง</option>
          <option value="บิ้วอิน">🪑 บิ้วอิน</option>
          <option value="ออกแบบ">✏️ ออกแบบ</option>
          <option value="ตกแต่ง">🎨 ตกแต่ง</option>
          <option value="บริหารงานขายโครงการ">📋 บริหารโครงการ</option>
          <option value="อื่นๆ">💬 อื่นๆ</option>
        </select>
        <button class="chat-form-btn" id="chatFormBtn">ส่งข้อมูล</button>
      </div>
      <div class="chat-input-area" id="chatInputArea">
        <input type="text" id="chatInput" placeholder="พิมพ์ข้อความ..." autocomplete="off">
        <button class="chat-send" id="chatSendBtn">
          <svg viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="chat-powered">Powered by NUCHA CRM</div>
    </div>
    <button class="chat-trigger" id="chatTrigger">
      <svg class="chat-icon" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <svg class="chat-close" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="badge" id="chatBadge">1</span>
    </button>
  `;
  document.body.appendChild(widget);

  // ===== State =====
  const S = {
    open: false, step: 'welcome', history: [], faqLoaded: false,
    sessionId: localStorage.getItem('nucha_chat_session') || 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    customerName: localStorage.getItem('nucha_chat_name') || '',
    customerPhone: localStorage.getItem('nucha_chat_phone') || '',
    isLiveChat: false, pollInterval: null
  };
  // Persist session ID
  localStorage.setItem('nucha_chat_session', S.sessionId);

  // ===== DEFAULT FAQ (ใช้ถ้า API ไม่ตอบ) =====
  const DEFAULT_FAQ = {
    services: {
      q: 'มีบริการอะไรบ้าง?',
      a: 'เรามีบริการ 5 อย่าง:\n\n🏗️ รับเหมาก่อสร้าง\n🪑 บิ้วอิน\n✏️ ออกแบบ\n🎨 ตกแต่ง\n📋 บริหารโครงการ\n\nสนใจบริการไหนครับ?',
      f: ['ดูรายละเอียดแต่ละบริการ', 'ขอใบเสนอราคา'],
      k: ['บริการ', 'service', 'ทำอะไร', 'มีอะไร', 'รับทำ', 'รับอะไร']
    },
    price: {
      q: 'ราคาเท่าไหร่?',
      a: 'ราคาขึ้นอยู่กับขนาดและประเภทโครงการ:\n\n🏠 บ้าน: เริ่มต้น 500,000 บ.\n🪑 บิ้วอิน: เริ่มต้น 200,000 บ.\n✏️ ออกแบบ: เริ่มต้น 100,000 บ.\n🎨 ตกแต่ง: เริ่มต้น 150,000 บ.\n\n💡 ปรึกษาฟรี ไม่มีค่าใช้จ่าย!',
      f: ['จองคิวปรึกษาฟรี', 'ดูผลงาน'],
      k: ['ราคา', 'price', 'เท่าไหร่', 'cost', 'ค่าใช้จ่าย', 'budget', 'งบ', 'กี่บาท']
    },
    booking: {
      q: 'จองคิวอย่างไร?',
      a: 'จองคิวง่ายๆ 3 ขั้นตอน:\n\n1️⃣ เลือกบริการที่สนใจ\n2️⃣ กรอกชื่อ-เบอร์โทร\n3️⃣ เลือกวัน-เวลาสะดวก\n\nทีมงานจะติดต่อกลับภายใน 24 ชม. ครับ',
      f: ['จองคิวเลย', 'ดูบริการ'],
      k: ['จอง', 'นัด', 'book', 'ปรึกษา', 'คิว', 'นัดหมาย', 'consult']
    },
    works: {
      q: 'ดูผลงาน',
      a: 'ดูผลงานของเราได้ที่หน้าเว็บเลยครับ มีทั้งบ้านโมเดิร์น คอนโด ลักชัวรี่ และโครงการรีโนเวท\n\n🌐 ดูผลงานทั้งหมด',
      f: ['ขอใบเสนอราคา', 'จองคิวปรึกษาฟรี'],
      k: ['ผลงาน', 'portfolio', 'งาน', 'project', 'gallery', 'รูป', 'ตัวอย่าง']
    },
    warranty: {
      q: 'รับประกันอย่างไร?',
      a: 'เรารับประกัน:\n\n🛡️ โครงสร้าง — ทั้งโครงการ\n✅ ส่งมอบตรงเวลา — ไม่เลื่อน ไม่บวกราคา\n❤️ ดูแลหลังส่งมอบ — ทีม Service ตลอดอายุใช้งาน',
      f: ['จองคิวปรึกษาฟรี', 'มีบริการอะไรบ้าง?'],
      k: ['รับประกัน', 'warranty', 'การันตี', 'garantie', 'ประกัน', 'รับผิดชอบ']
    },
    contact: {
      q: 'ติดต่ออย่างไร?',
      a: '📞 โทร: 02-123-4567\n📱 LINE: @nuchainnovation\n📧 Email: info@nuchainnovation.com\n\n⏰ เปิดทำการ: จันทร์-เสาร์ 09:00-18:00',
      f: ['จองคิวปรึกษาฟรี', 'ดูบริการ'],
      k: ['ติดต่อ', 'contact', 'โทร', 'line', 'เบอร์', 'phone', 'email', 'แอดเดรส', 'address', 'ที่อยู่', 'location', 'ที่ตั้ง']
    },
    duration: {
      q: 'ใช้เวลานานแค่ไหน?',
      a: 'ระยะเวลาขึ้นอยู่กับขนาดโครงการ:\n\n🏠 บ้าน 2 ชั้น: 6-10 เดือน\n🪑 บิ้วอิน: 2-4 สัปดาห์\n✏️ ออกแบบ: 2-4 สัปดาห์\n🎨 ตกแต่ง: 1-3 เดือน\n\nจะแจ้งไทม์ไลน์ที่ชัดเจนหลังสำรวจหน้างานครับ',
      f: ['จองคิวปรึกษาฟรี', 'ราคาเท่าไหร่?'],
      k: ['นาน', 'เวลา', 'duration', 'กี่วัน', 'กี่เดือน', 'เสร็จ', 'timeline', 'ไทม์ไลน์']
    },
    area: {
      q: 'รับงานพื้นที่ไหน?',
      a: 'เรารับงานทั่วกรุงเทพฯ และปริมณฑล:\n\n📍 กรุงเทพฯ ทุกเขต\n📍 นนทบุรี ปทุมธานี สมุทรปราการ\n📍 นครปฐม สมุทรสาคร\n\nพื้นที่อื่นๆ สอบถามได้ครับ',
      f: ['จองคิวปรึกษาฟรี', 'ดูบริการ'],
      k: ['พื้นที่', 'area', 'zone', 'เขต', 'จังหวัด', 'ที่ไหน', 'ไหน', 'กรุงเทพ', 'กทม', 'ปริมณฑล']
    },
    process: {
      q: 'ขั้นตอนการทำงาน?',
      a: 'ขั้นตอนการทำงานของเรา:\n\n📋 STEP 01: รับฟังและวางแผน\n📐 STEP 02: ออกแบบและเสนอราคา\n🏗️ STEP 03: ก่อสร้างและส่งมอบ\n\nทุกขั้นตอนมี QC ตรวจสอบคุณภาพครับ',
      f: ['จองคิวปรึกษาฟรี', 'ดูผลงาน'],
      k: ['ขั้นตอน', 'step', 'process', 'ทำงาน', 'ขั้น', 'ลำดับ', 'procedure']
    },
    team: {
      q: 'ทีมงานเป็นอย่างไร?',
      a: 'ทีมงานของเรา:\n\n👷 วิศวกรประจำโครงการ\n🎨 สถาปนิกและดีไซเนอร์\n🔨 ทีมช่างมืออาชีพ\n📋 ผู้จัดการโครงการดูแลใกล้ชิด\n\nประสบการณ์ 10+ ปี ครับ',
      f: ['ดูผลงาน', 'จองคิวปรึกษาฟรี'],
      k: ['ทีม', 'team', 'คน', 'ช่าง', 'วิศวกร', 'สถาปนิก', 'designer', 'ประสบการณ์', 'experience']
    },
    material: {
      q: 'ใช้วัสดุอะไร?',
      a: 'เราใช้วัสดุคุณภาพจากแบรนด์ชั้นนำ:\n\n🏗️ SCG — ปูน หลังคา\n🎨 TOA — สี\n🚿 COTTO — สุขภัณฑ์\n❄️ DAIKIN — แอร์\n🔥 STIEBEL — เครื่องทำน้ำอุ่น\n\nลูกค้าเลือกแบรนด์เองได้ครับ',
      f: ['ราคาเท่าไหร่?', 'จองคิวปรึกษาฟรี'],
      k: ['วัสดุ', 'material', 'brand', 'แบรนด์', 'scg', 'toa', 'cotto', 'คุณภาพ', 'เกรด']
    },
    renovation: {
      q: 'รับรีโนเวทไหม?',
      a: 'รับครับ! บริการรีโนเวทของเรา:\n\n🏠 บ้านเก่า → ใหม่\n🏢 สำนักงาน\n🍳 ห้องครัว\n🛁 ห้องน้ำ\n🪑 เฟอร์นิเจอร์\n\nสำรวจหน้างานฟรี ไม่มีค่าใช้จ่าย',
      f: ['จองคิวปรึกษาฟรี', 'ดูผลงาน'],
      k: ['รีโนเวท', 'renovate', 'renovation', 'ต่อเติม', 'ซ่อม', 'ปรับปรุง', 'remodel', 'รีโน']
    },
    quote: {
      q: 'ขอใบเสนอราคา',
      a: 'ขอใบเสนอราคาได้ง่ายๆ ครับ:\n\n📞 โทร: 02-123-4567\n📱 LINE: @nuchainnovation\n📝 หรือกรอกฟอร์มด้านล่าง\n\nประเมินราคาเบื้องต้นฟรี!',
      f: ['จองคิวเลย'],
      k: ['ใบเสนอราคา', 'quote', 'เสนอราคา', 'estimate', 'ประเมิน', 'quotation']
    },
    promotion: {
      q: 'มีโปรโมชั่นไหม?',
      a: 'โปรโมชั่นตอนนี้:\n\n🎉 ปรึกษาฟรี ไม่มีค่าใช้จ่าย\n💰 ส่วนลดพิเศษสำหรับโครงการใหญ่\n🎁 ฟรี! ออกแบบ 3D เมื่อเซ็นสัญญา\n\nติดต่อสอบถามรายละเอียดได้เลยครับ',
      f: ['จองคิวปรึกษาฟรี', 'ดูบริการ'],
      k: ['โปรโมชั่น', 'promotion', 'pro', 'ส่วนลด', 'discount', 'ลด', 'ของแถม', 'free', 'ฟรี']
    },
    payment: {
      q: 'ชำระเงินอย่างไร?',
      a: 'วิธีชำระเงิน:\n\n💳 โอนเงินธนาคาร\n💰 เงินสด\n📄 เช็ค\n\nชำระเป็นงวดตามความคืบหน้างาน ไม่ต้องจ่ายทั้งก้อนครับ',
      f: ['จองคิวปรึกษาฟรี', 'ราคาเท่าไหร่?'],
      k: ['ชำระ', 'pay', 'payment', 'เงิน', 'โอน', 'จ่าย', 'ผ่อน', 'installment', 'งวด']
    },
    location: {
      q: 'สำนักงานอยู่ที่ไหน?',
      a: '📍 สำนักงาน NUCHA INNOVATION\n\n123 ถนนสุขุมวิท แขวงคลองเตย\nเขตคลองเตย กรุงเทพฯ 10110\n\n🚇 ใกล้ BTS อโศก / MRT สุขุมวิท\n⏰ จันทร์-เสาร์ 09:00-18:00',
      f: ['ติดต่ออย่างไร?', 'จองคิวปรึกษาฟรี'],
      k: ['สำนักงาน', 'office', 'map', 'แผนที่', 'google', 'bts', 'mrt', 'ทางมา']
    },
    greeting: {
      q: 'สวัสดี',
      a: 'สวัสดีครับ! 👋 ยินดีต้อนรับสู่ NUCHA INNOVATION\n\nผมเป็นผู้ช่วยอัจฉริยะ ช่วยเรื่องไหนได้บ้างครับ?',
      f: ['มีบริการอะไรบ้าง?', 'ราคาเท่าไหร่?', 'จองคิวเลย'],
      k: ['สวัสดี', 'hello', 'hi', 'hey', 'ดีจ้า', 'หวัดดี', 'ครับ', 'ค่ะ']
    },
    thanks: {
      q: 'ขอบคุณ',
      a: 'ยินดีครับ! 🙏 มีอะไรให้ช่วยเพิ่มเติมถามได้เลยนะครับ',
      f: ['มีบริการอะไรบ้าง?', 'จองคิวเลย'],
      k: ['ขอบคุณ', 'thank', 'thanks', 'thx', 'คุณ']
    }
  };

  let FAQ = { ...DEFAULT_FAQ };

  // ===== LOAD FAQ FROM API =====
  async function loadFAQ() {
    try {
      const res = await fetch('/api/content/chatbot_faq', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          // Merge API data with defaults (API overrides)
          Object.keys(data).forEach(key => {
            if (data[key] && data[key].q && data[key].a) {
              FAQ[key] = data[key];
              // Ensure keywords exist
              if (!FAQ[key].k || !FAQ[key].k.length) {
                FAQ[key].k = DEFAULT_FAQ[key]?.k || [];
              }
            }
          });
          S.faqLoaded = true;
        }
      }
    } catch (e) {
      console.warn('Chat FAQ load failed, using defaults:', e);
    }
  }

  // ===== Helpers =====
  const $ = id => document.getElementById(id);
  function time() { return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); }
  function scrollB() { const b = $('chatBody'); setTimeout(() => b.scrollTop = b.scrollHeight, 50); }

  function botMsg(text, delay) {
    setTimeout(() => {
      showTyping();
      setTimeout(() => {
        removeTyping();
        const d = document.createElement('div');
        d.className = 'msg bot';
        d.innerHTML = text.replace(/\n/g, '<br>') + `<div class="msg-time">${time()}</div>`;
        $('chatBody').appendChild(d);
        S.history.push({ r: 'bot', t: text });
        scrollB();
      }, 500 + Math.random() * 300);
    }, delay);
  }

  function userMsg(text) {
    const d = document.createElement('div');
    d.className = 'msg user';
    d.textContent = text;
    const t = document.createElement('div');
    t.className = 'msg-time';
    t.textContent = time();
    d.appendChild(t);
    $('chatBody').appendChild(d);
    S.history.push({ r: 'user', t: text });
    scrollB();
  }

  function showTyping() {
    if (document.querySelector('.typing')) return;
    const t = document.createElement('div');
    t.className = 'typing';
    t.innerHTML = '<span></span><span></span><span></span>';
    $('chatBody').appendChild(t);
    scrollB();
  }
  function removeTyping() { const t = document.querySelector('.typing'); if (t) t.remove(); }

  function addQR(options) {
    const c = document.createElement('div');
    c.className = 'quick-replies';
    options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'quick-reply';
      b.textContent = opt;
      b.onclick = () => handleQR(opt);
      c.appendChild(b);
    });
    $('chatBody').appendChild(c);
    scrollB();
  }

  // ===== KEYWORD MATCHING ENGINE =====
  function findFAQByKeyword(text) {
    const lower = text.toLowerCase();

    // 1. Exact match by quick-reply label
    const exactKey = Object.keys(FAQ).find(k => FAQ[k].q === text);
    if (exactKey) return exactKey;

    // 2. Keyword match — find best match (most keywords matched)
    let bestMatch = null;
    let bestScore = 0;

    Object.keys(FAQ).forEach(key => {
      const faq = FAQ[key];
      const keywords = faq.k || [];
      let score = 0;
      keywords.forEach(kw => {
        if (lower.includes(kw.toLowerCase())) score++;
      });
      if (score > bestScore) {
        bestScore = score;
        bestMatch = key;
      }
    });

    return bestScore > 0 ? bestMatch : null;
  }

  // ===== CONTEXTUAL FALLBACK RESPONSES =====
  const FALLBACKS = [
    { a: 'ขอบคุณครับ ผมช่วยเรื่องไหนได้บ้าง?', f: ['มีบริการอะไรบ้าง?', 'ราคาเท่าไหร่?', 'จองคิวเลย'] },
    { a: 'ยินดีให้บริการครับ เลือกหัวข้อด้านล่างได้เลย', f: ['ดูผลงาน', 'ดูบริการ', 'ติดต่ออย่างไร?'] },
    { a: 'ผมช่วยเรื่องข้อมูลบริการ ราคา และการจองคิวได้ครับ ลองเลือกดูนะครับ', f: ['มีบริการอะไรบ้าง?', 'จองคิวปรึกษาฟรี', 'รับประกันอย่างไร?'] }
  ];

  // ===== QR Handler =====
  function handleQR(text) {
    document.querySelectorAll('.quick-replies').forEach(el => el.remove());
    userMsg(text);

    // Action triggers
    if (text === 'จองคิวปรึกษาฟรี' || text === 'จองคิวเลย' || text === 'ขอใบเสนอราคา') {
      botMsg('กรอกข้อมูลด้านล่างเลยครับ ทีมงานจะติดต่อกลับภายใน 24 ชม. 📞', 200);
      setTimeout(() => { $('chatFormArea').classList.add('show'); $('chatInputArea').style.display = 'none'; scrollB(); }, 800);
      return;
    }

    if (text === 'ดูรายละเอียดแต่ละบริการ') {
      botMsg('เลือกบริการที่สนใจได้เลยครับ 👇', 200);
      setTimeout(() => addQR(['🏗️ รับเหมาก่อสร้าง', '🪑 บิ้วอิน', '✏️ ออกแบบ', '🎨 ตกแต่ง', '📋 บริหารโครงการ']), 800);
      return;
    }

    // Service emoji links
    if (/^[🏗️🪑✏️🎨📋]/.test(text)) {
      const keyMap = { '🏗️': 'construction', '🪑': 'builtin', '✏️': 'design', '🎨': 'decoration', '📋': 'project-management' };
      const key = keyMap[text.charAt(0)];
      if (key) {
        botMsg(`ดูรายละเอียดบริการ ${text} ได้ที่หน้าเว็บเลยครับ 👇`, 200);
        setTimeout(() => {
          const c = document.createElement('div');
          c.className = 'quick-replies';
          c.innerHTML = `<a href="/service.html?key=${key}" target="_blank" class="quick-reply" style="text-decoration:none">🔗 ดูหน้าบริการ</a><button class="quick-reply" onclick="window.__nuchaChatQR('จองคิวเลย')">📅 จองคิวเลย</button>`;
          $('chatBody').appendChild(c);
          scrollB();
        }, 800);
      }
      return;
    }

    // Quick menu
    if (text === 'ดูบริการ') {
      addQR(['มีบริการอะไรบ้าง?', 'ราคาเท่าไหร่?', 'จองคิวเลย', 'ดูผลงาน', 'รับประกันอย่างไร?', 'ติดต่ออย่างไร?']);
      return;
    }

    // FAQ match
    const faqKey = findFAQByKeyword(text);
    if (faqKey && FAQ[faqKey]) {
      const faq = FAQ[faqKey];
      botMsg(faq.a, 200);
      if (faq.f && faq.f.length) {
        setTimeout(() => addQR(faq.f), 1000);
      }
      return;
    }

    // Fallback
    const fb = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    botMsg(fb.a, 200);
    setTimeout(() => addQR(fb.f), 800);
  }

  // Expose for inline onclick
  window.__nuchaChatQR = handleQR;

  // ===== Submit Lead =====
  async function submitLead() {
    const name = $('chatName').value.trim();
    const phone = $('chatPhone').value.trim();
    const service = $('chatService').value;
    if (!name || !phone) { alert('กรุณากรอกชื่อและเบอร์โทร'); return; }
    const btn = $('chatFormBtn');
    btn.disabled = true; btn.textContent = 'กำลังส่ง...';
    try {
      const res = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, service_type: service || 'อื่นๆ', message: 'ส่งจาก Chat Bot', budget_range: 'ไม่ระบุ' })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      $('chatFormArea').classList.remove('show');
      $('chatInputArea').style.display = 'flex';
      S.customerName = name;
      S.customerPhone = phone;
      localStorage.setItem('nucha_chat_name', name);
      localStorage.setItem('nucha_chat_phone', phone);
      botMsg(`ขอบคุณครับคุณ ${name.replace(/</g, '&lt;').replace(/>/g, '&gt;')}! 🙏`, 200);
      botMsg('ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมงครับ', 800);
      botMsg('หากมีคำถามเพิ่มเติม พิมพ์ได้เลยครับ — แอดมินจะตอบกลับเร็วๆ นี้ 💬', 1400);
      S.step = 'done';
      // Send lead info to chat system too
      sendToServer(`[ข้อมูลติดต่อ] ชื่อ: ${name}, โทร: ${phone}, บริการ: ${service || 'อื่นๆ'}`);
      setTimeout(() => addQR(['ดูบริการ', 'ดูผลงาน']), 2200);
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
    finally { btn.disabled = false; btn.textContent = 'ส่งข้อมูล'; }
  }

  // ===== Toggle =====
  async function toggle() {
    S.open = !S.open;
    $('chatPanel').classList.toggle('open', S.open);
    $('chatTrigger').classList.toggle('active', S.open);
    if (S.open) {
      $('chatBadge').style.display = 'none';
      if (!S.faqLoaded) await loadFAQ();
      // Load previous messages from server if we have a session
      if (S.history.length === 0) {
        const loaded = await loadHistory();
        if (!loaded) {
          botMsg('สวัสดีครับ! 👋 ผมผู้ช่วย NUCHA INNOVATION', 300);
          botMsg('มีอะไรให้ช่วยครับ? เลือกหัวข้อด้านล่างได้เลย', 800);
          setTimeout(() => addQR(['มีบริการอะไรบ้าง?', 'ราคาเท่าไหร่?', 'จองคิวเลย', 'ดูผลงาน', 'รับประกันอย่างไร?', 'ติดต่ออย่างไร?']), 1200);
        }
      }
      // Start polling for admin responses
      startPolling();
    }
  }

  // ===== Load chat history from server =====
  async function loadHistory() {
    try {
      const res = await fetch(`/api/chat/messages/${S.sessionId}`, { cache: 'no-store' });
      if (!res.ok) return false;
      const messages = await res.json();
      if (!messages.length) return false;
      // Restore customer info from first message
      const first = messages.find(m => m.customer_name);
      if (first) {
        S.customerName = first.customer_name || '';
        S.customerPhone = first.customer_phone || '';
      }
      // Render all messages
      messages.forEach(m => {
        if (m.sender === 'customer') {
          const d = document.createElement('div');
          d.className = 'msg user';
          d.textContent = m.message;
          const t = document.createElement('div');
          t.className = 'msg-time';
          t.textContent = new Date(m.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
          d.appendChild(t);
          $('chatBody').appendChild(d);
          S.history.push({ r: 'user', t: m.message });
        } else if (m.sender === 'bot') {
          const d = document.createElement('div');
          d.className = 'msg bot';
          d.innerHTML = m.message.replace(/\n/g, '<br>') + `<div class="msg-time">${new Date(m.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>`;
          $('chatBody').appendChild(d);
          S.history.push({ r: 'bot', t: m.message });
        } else if (m.sender === 'admin') {
          const d = document.createElement('div');
          d.className = 'msg bot';
          d.innerHTML = '👩‍💼 ' + m.message.replace(/\n/g, '<br>') + `<div class="msg-time">${new Date(m.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>`;
          $('chatBody').appendChild(d);
          S.history.push({ r: 'admin', t: m.message });
        }
      });
      scrollB();
      S.isLiveChat = true;
      // Show quick replies after history
      setTimeout(() => addQR(['มีบริการอะไรบ้าง?', 'จองคิวเลย', 'ติดต่ออย่างไร?']), 500);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ===== Send chat message to server =====
  async function sendToServer(message, sender) {
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: S.sessionId,
          message: message,
          sender: sender || 'customer',
          customer_name: S.customerName || null,
          customer_phone: S.customerPhone || null
        })
      });
    } catch (e) {
      console.warn('Failed to send chat to server:', e);
    }
  }

  // ===== Poll for admin responses =====
  function startPolling() {
    if (S.pollInterval) return;
    S.pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/messages/${S.sessionId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const messages = await res.json();
        // Find admin messages not yet shown
        const adminMsgs = messages.filter(m => m.sender === 'admin');
        const shownCount = S.history.filter(h => h.r === 'admin').length;
        if (adminMsgs.length > shownCount) {
          // Show new admin messages
          for (let i = shownCount; i < adminMsgs.length; i++) {
            botMsg(adminMsgs[i].message, 200);
          }
        }
      } catch {}
    }, 5000);
  }

  // ===== Text Input =====
  function sendText() {
    const input = $('chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    document.querySelectorAll('.quick-replies').forEach(el => el.remove());
    userMsg(text);

    // Send EVERY user message to server for admin visibility
    sendToServer(text, 'customer');

    // Use the same keyword matching engine
    const faqKey = findFAQByKeyword(text);
    if (faqKey && FAQ[faqKey]) {
      const faq = FAQ[faqKey];
      if (faqKey === 'quote' || faqKey === 'booking') {
        botMsg(faq.a, 200);
        // Also send bot response to server
        setTimeout(() => sendToServer(faq.a, 'bot'), 300);
        setTimeout(() => addQR(faq.f || ['จองคิวเลย']), 1000);
      } else {
        botMsg(faq.a, 200);
        setTimeout(() => sendToServer(faq.a, 'bot'), 300);
        if (faq.f && faq.f.length) {
          setTimeout(() => addQR(faq.f), 1000);
        }
      }
    } else {
      // No FAQ match — notify admin
      botMsg('ส่งข้อความถึงแอดมินแล้ว รอสักครู่... 💬', 200);
      if (!S.isLiveChat) {
        S.isLiveChat = true;
        startPolling();
      }
    }
  }

  // ===== Events =====
  $('chatTrigger').onclick = toggle;
  $('chatSendBtn').onclick = sendText;
  $('chatFormBtn').onclick = submitLead;
  $('chatInput').addEventListener('keypress', e => { if (e.key === 'Enter') sendText(); });

  // Show badge after 5s
  setTimeout(() => { if (!S.open && $('chatBadge')) $('chatBadge').style.display = 'flex'; }, 5000);
})();
