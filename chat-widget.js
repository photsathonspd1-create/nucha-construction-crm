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
  const S = { open: false, step: 'welcome', history: [] };

  // ===== FAQ =====
  const FAQ = {
    services: { q: 'มีบริการอะไรบ้าง?', a: 'เรามีบริการ 5 อย่าง:\n\n🏗️ รับเหมาก่อสร้าง\n🪑 บิ้วอิน\n✏️ ออกแบบ\n🎨 ตกแต่ง\n📋 บริหารโครงการ\n\nสนใจบริการไหนครับ?', f: ['ดูรายละเอียดแต่ละบริการ', 'ขอใบเสนอราคา'] },
    price: { q: 'ราคาเท่าไหร่?', a: 'ราคาขึ้นอยู่กับขนาดและประเภทโครงการ:\n\n🏠 บ้าน: เริ่มต้น 500,000 บ.\n🪑 บิ้วอิน: เริ่มต้น 200,000 บ.\n✏️ ออกแบบ: เริ่มต้น 100,000 บ.\n🎨 ตกแต่ง: เริ่มต้น 150,000 บ.\n\n💡 ปรึกษาฟรี ไม่มีค่าใช้จ่าย!', f: ['จองคิวปรึกษาฟรี', 'ดูผลงาน'] },
    booking: { q: 'จองคิวอย่างไร?', a: 'จองคิวง่ายๆ 3 ขั้นตอน:\n\n1️⃣ เลือกบริการที่สนใจ\n2️⃣ กรอกชื่อ-เบอร์โทร\n3️⃣ เลือกวัน-เวลาสะดวก\n\nทีมงานจะติดต่อกลับภายใน 24 ชม. ครับ', f: ['จองคิวเลย', 'ดูบริการ'] },
    works: { q: 'ดูผลงาน', a: 'ดูผลงานของเราได้ที่หน้าเว็บเลยครับ มีทั้งบ้านโมเดิร์น คอนโด ลักชัวรี่ และโครงการรีโนเวท\n\n🌐 ดูผลงานทั้งหมด', f: ['ขอใบเสนอราคา', 'จองคิวปรึกษาฟรี'] },
    warranty: { q: 'รับประกันอย่างไร?', a: 'เรารับประกัน:\n\n🛡️ โครงสร้าง — ทั้งโครงการ\n✅ ส่งมอบตรงเวลา — ไม่เลื่อน ไม่บวกราคา\n❤️ ดูแลหลังส่งมอบ — ทีม Service ตลอดอายุใช้งาน', f: ['จองคิวปรึกษาฟรี', 'มีบริการอะไรบ้าง?'] },
    contact: { q: 'ติดต่ออย่างไร?', a: '📞 โทร: 02-123-4567\n📱 LINE: @nuchainnovation\n📧 Email: info@nuchainnovation.com\n\n⏰ เปิดทำการ: จันทร์-เสาร์ 09:00-18:00', f: ['จองคิวปรึกษาฟรี', 'ดูบริการ'] },
    duration: { q: 'ใช้เวลานานแค่ไหน?', a: 'ระยะเวลาขึ้นอยู่กับขนาดโครงการ:\n\n🏠 บ้าน 2 ชั้น: 6-10 เดือน\n🪑 บิ้วอิน: 2-4 สัปดาห์\n✏️ ออกแบบ: 2-4 สัปดาห์\n🎨 ตกแต่ง: 1-3 เดือน\n\nจะแจ้งไทม์ไลน์ที่ชัดเจนหลังสำรวจหน้างานครับ', f: ['จองคิวปรึกษาฟรี', 'ราคาเท่าไหร่?'] }
  };

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
    d.innerHTML = text + `<div class="msg-time">${time()}</div>`;
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

  // ===== QR Handler =====
  function handleQR(text) {
    document.querySelectorAll('.quick-replies').forEach(el => el.remove());
    userMsg(text);

    const map = {
      'มีบริการอะไรบ้าง?': 'services', 'ราคาเท่าไหร่?': 'price',
      'จองคิวอย่างไร?': 'booking', 'ดูผลงาน': 'works',
      'รับประกันอย่างไร?': 'warranty', 'ติดต่ออย่างไร?': 'contact',
      'ใช้เวลานานแค่ไหน?': 'duration'
    };

    if (map[text]) {
      const faq = FAQ[map[text]];
      botMsg(faq.a, 200);
      setTimeout(() => addQR(faq.f), 1000);
    } else if (text === 'จองคิวปรึกษาฟรี' || text === 'จองคิวเลย' || text === 'ขอใบเสนอราคา') {
      botMsg('กรอกข้อมูลด้านล่างเลยครับ ทีมงานจะติดต่อกลับภายใน 24 ชม. 📞', 200);
      setTimeout(() => { $('chatFormArea').classList.add('show'); $('chatInputArea').style.display = 'none'; scrollB(); }, 800);
    } else if (text === 'ดูรายละเอียดแต่ละบริการ') {
      botMsg('เลือกบริการที่สนใจได้เลยครับ 👇', 200);
      setTimeout(() => addQR(['🏗️ รับเหมาก่อสร้าง', '🪑 บิ้วอิน', '✏️ ออกแบบ', '🎨 ตกแต่ง', '📋 บริหารโครงการ']), 800);
    } else if (/^[🏗️🪑✏️🎨📋]/.test(text)) {
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
    } else if (text === 'ดูบริการ') {
      addQR(['มีบริการอะไรบ้าง?', 'ราคาเท่าไหร่?', 'จองคิวเลย', 'ดูผลงาน', 'รับประกันอย่างไร?', 'ติดต่ออย่างไร?']);
    } else {
      botMsg('ขอบคุณครับ มีอะไรให้ช่วยเพิ่มเติมมั้ยครับ?', 200);
      setTimeout(() => addQR(['มีบริการอะไรบ้าง?', 'ราคาเท่าไหร่?', 'จองคิวเลย']), 800);
    }
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
      botMsg(`ขอบคุณครับคุณ ${name}! 🙏`, 200);
      botMsg('ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมงครับ', 800);
      S.step = 'done';
      setTimeout(() => addQR(['ดูบริการ', 'ดูผลงาน']), 1800);
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
    finally { btn.disabled = false; btn.textContent = 'ส่งข้อมูล'; }
  }

  // ===== Toggle =====
  function toggle() {
    S.open = !S.open;
    $('chatPanel').classList.toggle('open', S.open);
    $('chatTrigger').classList.toggle('active', S.open);
    if (S.open) {
      $('chatBadge').style.display = 'none';
      if (!S.history.length) {
        botMsg('สวัสดีครับ! 👋 ผมผู้ช่วย NUCHA INNOVATION', 300);
        botMsg('มีอะไรให้ช่วยครับ? เลือกหัวข้อด้านล่างได้เลย', 800);
        setTimeout(() => addQR(['มีบริการอะไรบ้าง?', 'ราคาเท่าไหร่?', 'จองคิวเลย', 'ดูผลงาน', 'รับประกันอย่างไร?', 'ติดต่ออย่างไร?']), 1200);
      }
    }
  }

  // ===== Text Input =====
  function sendText() {
    const input = $('chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    document.querySelectorAll('.quick-replies').forEach(el => el.remove());
    userMsg(text);

    const lower = text.toLowerCase();
    const kw = [
      [/บริการ|service/, 'มีบริการอะไรบ้าง?'],
      [/ราคา|price|เท่าไหร่|cost/, 'ราคาเท่าไหร่?'],
      [/จอง|นัด|book|ปรึกษา/, 'จองคิวเลย'],
      [/ผลงาน|portfolio|งาน/, 'ดูผลงาน'],
      [/รับประกัน|warranty|การันตี/, 'รับประกันอย่างไร?'],
      [/ติดต่อ|contact|โทร|line/, 'ติดต่ออย่างไร?'],
      [/นาน|เวลา|duration|กี่วัน/, 'ใช้เวลานานแค่ไหน?']
    ];
    const match = kw.find(([re]) => re.test(lower));
    if (match) handleQR(match[1]);
    else {
      botMsg('ขอบคุณครับ ผมช่วยเรื่องไหนได้บ้าง?', 200);
      setTimeout(() => addQR(['มีบริการอะไรบ้าง?', 'ราคาเท่าไหร่?', 'จองคิวเลย']), 800);
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
