// ============================================
// Site Loader — Loads dynamic content from API
// ============================================

(function loadSiteContent() {
  // Expose a promise so script.js can wait for us
  let _resolve;
  window.__siteContentLoaded = new Promise(r => { _resolve = r; });

  (async function() {
    try {
      // Fetch all content + nav in parallel (no-store to prevent 304 issues)
      const [contentRes, navRes] = await Promise.all([
        fetch('/api/content', { cache: 'no-store' }).then(r => r.json()),
        fetch('/api/nav', { cache: 'no-store' }).then(r => r.json())
      ]);

      // ===== NAV =====
      const navMenu = document.getElementById('navMenu');
      if (navMenu && navRes.length > 0) {
        // Deduplicate nav items by href to prevent duplicate menu entries
        const seen = new Set();
        const uniqueNav = navRes.filter(n => {
          if (!n.is_visible) return false;
          if (seen.has(n.href)) return false;
          seen.add(n.href);
          return true;
        });
        // Preserve login link for mobile — add it back after API nav items
        navMenu.innerHTML = uniqueNav
          .map(n => {
            const safeHref = esc(n.href);
            const safeLabel = esc(n.label);
            return `<li><a href="${safeHref}" class="${safeHref === '#home' ? 'active' : ''}">${safeLabel}</a></li>`;
          })
          .join('') +
          '<li class="nav-menu-login"><a href="/login">🔑 เข้าสู่ระบบ</a></li>';
      }

      // ===== SITE CONFIG =====
      const config = contentRes.site_config || {};
      // Logo — support both image and text
      const logoUrl = config.logo_url && config.logo_url.trim() ? config.logo_url.trim() : '';
      if (logoUrl) {
        // Image logo — replace text icon with <img> and hide text labels
        ['loaderLogo', 'navLogoIcon', 'footerLogoIcon'].forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.innerHTML = `<img src="${esc(logoUrl)}" alt="Logo" style="width:100%;height:100%;object-fit:contain">`;
            el.style.padding = '0';
          }
        });
        // Hide logo text when image logo is present
        ['loaderText', 'navLogoText', 'footerLogoText'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });
      } else if (config.logo_text) {
        const el = document.getElementById('loaderLogo');
        if (el) el.textContent = config.logo_text;
        const navIcon = document.getElementById('navLogoIcon');
        if (navIcon) navIcon.textContent = config.logo_text;
        const footerIcon = document.getElementById('footerLogoIcon');
        if (footerIcon) footerIcon.textContent = config.logo_text;
      }
      if (config.logo_full) {
        const html = config.logo_full.replace(/\n/g, '<br>');
        const el = document.getElementById('loaderText');
        if (el) el.innerHTML = html.replace(/<br>/, ' ');
        const navText = document.getElementById('navLogoText');
        if (navText) navText.innerHTML = html;
        const footerText = document.getElementById('footerLogoText');
        if (footerText) footerText.innerHTML = html;
      }
      if (config.site_name) document.title = config.site_name + ' - ' + (config.site_tagline || '');
      if (config.phone) {
        const footerPhone = document.getElementById('footerPhone');
        if (footerPhone) footerPhone.textContent = config.phone;
        const fabCall = document.getElementById('fabCall');
        if (fabCall) fabCall.href = 'tel:' + config.phone;
        const closingNote = document.getElementById('closingNote');
        if (closingNote) {
          closingNote.textContent = '';
          const span1 = document.createTextNode('📞 หรือโทร ');
          const link = document.createElement('a');
          link.href = 'tel:' + config.phone;
          link.textContent = config.phone;
          const span2 = document.createTextNode(' — พร้อมให้คำปรึกษาทุกวัน 09:00–18:00');
          closingNote.appendChild(span1);
          closingNote.appendChild(link);
          closingNote.appendChild(span2);
        }
      }
      if (config.email) {
        const el = document.getElementById('footerEmail');
        if (el) el.textContent = config.email;
      }
      if (config.address) {
        const el = document.getElementById('footerAddress');
        if (el) el.textContent = config.address;
      }
      if (config.copyright) {
        const el = document.getElementById('footerCopyright');
        if (el) el.textContent = config.copyright;
      }
      if (config.facebook_url) {
        const el = document.getElementById('footerFacebook');
        if (el) el.href = config.facebook_url;
      }
      if (config.instagram_url) {
        const el = document.getElementById('footerInstagram');
        if (el) el.href = config.instagram_url;
      }
      if (config.line_id) {
        const lineUrl = 'https://line.me/ti/p/~' + config.line_id.replace('@', '');
        const footerLine = document.getElementById('footerLine');
        if (footerLine) footerLine.href = lineUrl;
        const fabLine = document.getElementById('fabLine');
        if (fabLine) fabLine.href = lineUrl;
      }

      // ===== HERO =====
      const hero = contentRes.hero || {};
      setText('heroBadge', hero.badge);
      setText('heroTitle1', hero.title_line1);
      setText('heroTitle2', hero.title_line2);
      setText('heroSubtitle', hero.subtitle);
      setText('heroDesc', hero.description);
      setText('heroCta1', hero.cta_primary);
      setText('heroCta2', hero.cta_secondary);
      setText('heroStat1Num', hero.stat1_number);
      setText('heroStat1Label', hero.stat1_label);
      setText('heroStat2Num', hero.stat2_number);
      setText('heroStat2Label', hero.stat2_label);
      setText('heroStat3Num', hero.stat3_number);
      setText('heroStat3Label', hero.stat3_label);
      setText('floatTitle', hero.float_title);
      setText('floatDesc', hero.float_desc);
      if (hero.image_url && hero.image_url.trim()) {
        const img = document.getElementById('heroImage');
        if (img) img.src = hero.image_url;
      }

      // ===== SERVICES =====
      const services = contentRes.services || {};
      setText('servicesTag', services.section_tag);
      setText('servicesTitle', services.section_title);
      setText('servicesDesc', services.section_desc);
      if (services.items) {
        const grid = document.getElementById('servicesGrid');
        if (grid) {
          grid.innerHTML = services.items.map((s, i) => {
            const safeImage = esc(s.image || '');
            const imgHtml = safeImage ? `<img src="${safeImage}" alt="${esc(s.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" onerror="this.style.display='none'">` : '';
            const serviceKey = esc(s.key || '');
            return `
              <div class="service-card${i === services.items.length - 1 ? ' service-card-highlight' : ''}" data-animate="fade-up" data-service="${serviceKey}">
                <div class="service-number">${String(i + 1).padStart(2, '0')}</div>
                <div class="service-icon" style="font-size:2.5rem">${esc(s.icon || '🏗️')}</div>
                <h3>${esc(s.name)}</h3>
                <p>${esc(s.desc)}</p>
                <div class="service-budget">${esc(s.budget)}</div>
                <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                  <a href="/service.html?key=${serviceKey}" class="service-link magnetic-btn">
                    <span>ดูรายละเอียด</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </a>
                  <a href="#booking" class="service-link magnetic-btn" data-booking-service="${serviceKey}" style="color:var(--gray-400)">
                    <span>จองคิว</span>
                  </a>
                </div>
              </div>
            `;
          }).join('');
        }
        // Service select grid in booking form
        const selectGrid = document.getElementById('serviceSelectGrid');
        if (selectGrid) {
          const emojis = { 'รับเหมาก่อสร้าง': '🏗️', 'บิ้วอิน': '🪑', 'ออกแบบ': '✏️', 'ตกแต่ง': '🎨', 'บริหารโครงการ': '📋', 'อื่นๆ': '💬', 'บริหารงานขายโครงการ': '📋' };
          selectGrid.innerHTML = services.items.map(s => `
            <label class="service-option">
              <input type="radio" name="service_type" value="${esc(s.name)}" required>
              <div class="service-option-card">
                <div class="service-option-icon">${emojis[s.name] || esc(s.icon) || '💬'}</div>
                <div class="service-option-name">${esc(s.name)}</div>
                <div class="service-option-desc">${esc(s.budget)}</div>
              </div>
            </label>
          `).join('') + `
            <label class="service-option">
              <input type="radio" name="service_type" value="อื่นๆ">
              <div class="service-option-card">
                <div class="service-option-icon">💬</div>
                <div class="service-option-name">อื่นๆ</div>
                <div class="service-option-desc">ปรึกษาเรื่องอื่น</div>
              </div>
            </label>
          `;
        }
      }

      // ===== PROCESS =====
      const process = contentRes.process || {};
      if (process.steps) {
        const storyContent = document.getElementById('storyContent');
        const storyVisual = document.getElementById('storyVisual');
        if (storyContent) {
          storyContent.innerHTML = `
            <div class="story-step active" data-step="0">
              <span class="story-tag">OUR PROCESS</span>
              <h2 class="story-title">${esc(process.section_title || 'ขั้นตอนการทำงาน\nที่คุณวางใจได้').replace(/\n/g, '<br>')}</h2>
              <p class="story-desc">ทุกโครงการเริ่มต้นจากการรับฟัง — เข้าใจความต้องการ เข้าใจงบประมาณ เข้าใจคุณ</p>
            </div>
            ${process.steps.map((s, i) => `
              <div class="story-step" data-step="${i + 1}">
                <span class="story-tag">${esc(s.tag)}</span>
                <h2 class="story-title">${esc(s.title || '').replace(/\n/g, '<br>')}</h2>
                <p class="story-desc">${esc(s.desc)}</p>
              </div>
            `).join('')}
          `;
        }
        if (storyVisual) {
          storyVisual.innerHTML = `
            <div class="story-image-stack">
              <div class="story-img-wrapper active" data-step="0">
                ${process.steps[0]?.image ? `<img src="${esc(process.steps[0].image)}" alt="Process" onerror="this.parentElement.style.background='linear-gradient(135deg,#f5f0ee,#e8e0dc)'">` : '<div style="width:100%;height:100%;background:linear-gradient(135deg,#f5f0ee,#e8e0dc)"></div>'}
              </div>
              ${process.steps.map((s, i) => `
                <div class="story-img-wrapper" data-step="${i + 1}">
                  ${s.image ? `<img src="${esc(s.image)}" alt="${esc(s.tag)}" onerror="this.parentElement.style.background='linear-gradient(135deg,#f5f0ee,#e8e0dc)'">` : '<div style="width:100%;height:100%;background:linear-gradient(135deg,#f5f0ee,#e8e0dc)"></div>'}
                </div>
              `).join('')}
            </div>
          `;
        }
      }

      // ===== PORTFOLIO =====
      const portfolio = contentRes.portfolio || {};
      setText('portfolioTag', portfolio.section_tag);
      setText('portfolioTitle', portfolio.section_title);
      setText('portfolioDesc', portfolio.section_desc);
      if (portfolio.items) {
        const grid = document.getElementById('portfolioGrid');
        if (grid) {
          grid.innerHTML = portfolio.items.map(item => {
            const safeImage = esc(item.image || '');
            return `
              <div class="portfolio-item${item.size === 'large' ? ' portfolio-large' : ''}">
                ${safeImage ? `<img src="${safeImage}" alt="${esc(item.title)}" onerror="this.style.display='none'">` : ''}
                <div class="portfolio-overlay">
                  <span class="portfolio-tag">${esc(item.tag)}</span>
                  <h3>${esc(item.title)}</h3>
                  ${item.desc ? `<p>${esc(item.desc)}</p>` : ''}
                </div>
              </div>
            `;
          }).join('');
        }
      }

      // ===== BOOKING =====
      const booking = contentRes.booking || {};
      setText('bookingTag', booking.section_tag);
      if (booking.title) {
        const el = document.getElementById('bookingTitle');
        if (el) el.innerHTML = esc(booking.title).replace(/\n/g, '<br>');
      }
      setText('bookingDesc', booking.description);
      if (booking.benefits) {
        const el = document.getElementById('bookingBenefits');
        if (el) {
          el.innerHTML = booking.benefits.map(b => `
            <div class="booking-benefit">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>${esc(b)}</span>
            </div>
          `).join('');
        }
      }

      // ===== STATS =====
      const stats = contentRes.stats || {};
      if (stats.items) {
        const grid = document.getElementById('statsGrid');
        if (grid) {
          grid.innerHTML = stats.items.map(s => `
            <div class="stat-item">
              <div class="stat-number" data-count="${s.number}">0</div>
              <div class="stat-suffix">${esc(s.suffix)}</div>
              <div class="stat-label">${esc(s.label)}</div>
            </div>
          `).join('');
        }
      }

      // ===== TESTIMONIALS =====
      const testimonials = contentRes.testimonials || {};
      setText('testimonialsTag', testimonials.section_tag);
      setText('testimonialsTitle', testimonials.section_title);
      setText('testimonialsDesc', testimonials.section_desc);
      if (testimonials.items) {
        const grid = document.getElementById('testimonialsGrid');
        if (grid) {
          grid.innerHTML = testimonials.items.map(t => `
            <div class="testimonial-card" data-animate="fade-up">
              <div class="testimonial-stars">${'★'.repeat(Math.min(Math.max(parseInt(t.stars) || 5, 1), 5))}</div>
              <p class="testimonial-quote">"${esc(t.quote)}"</p>
              <div class="testimonial-author">
                <div class="testimonial-avatar">${esc(t.avatar)}</div>
                <div>
                  <div class="testimonial-name">${esc(t.name)}</div>
                  <div class="testimonial-role">${esc(t.role)}</div>
                </div>
              </div>
            </div>
          `).join('');
        }
      }

      // ===== CLOSING =====
      const closing = contentRes.closing || {};
      setText('closingTag', closing.tag);
      if (closing.title_line1) {
        const el = document.getElementById('closingTitle');
        if (el) {
          el.textContent = '';
          const line1 = document.createTextNode(closing.title_line1);
          const br = document.createElement('br');
          const span = document.createElement('span');
          span.className = 'accent';
          span.textContent = closing.title_line2 || '';
          el.appendChild(line1);
          el.appendChild(br);
          el.appendChild(span);
        }
      }
      setText('closingDesc', closing.description);
      setText('closingCta', closing.cta_text);
      setText('closingProof', closing.proof_text);
      if (closing.guarantees) {
        const el = document.getElementById('closingGuarantees');
        if (el) {
          const icons = {
            shield: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            check: '<svg viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            heart: '<svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          };
          el.innerHTML = closing.guarantees.map(g => `
            <div class="guarantee-item">
              <div class="guarantee-icon">${icons[g.icon] || icons.shield}</div>
              <div>
                <strong>${esc(g.title)}</strong>
                <span>${esc(g.desc)}</span>
              </div>
            </div>
          `).join('');
        }
      }

      // ===== TRUST BADGES =====
      const badges = contentRes.trust_badges || {};
      setText('badgesLabel', badges.label);
      if (badges.brands) {
        const row = document.getElementById('badgesRow');
        if (row) {
          row.innerHTML = badges.brands.map(b => {
            const safe = esc(b);
            return `
            <div class="trust-badge-item">
              <svg viewBox="0 0 120 40" fill="currentColor" opacity="0.35">
                <text x="10" y="28" font-family="Inter,sans-serif" font-weight="800" font-size="${safe.length > 4 ? '14' : '16'}">${safe}</text>
              </svg>
            </div>
          `}).join('');
        }
      }

      // ===== FOOTER =====
      const footer = contentRes.footer || {};
      setText('footerDesc', footer.description);
      if (footer.quick_links) {
        const el = document.getElementById('footerQuickLinks');
        if (el) el.innerHTML = footer.quick_links.map(l => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('');
      }
      if (footer.service_links) {
        const el = document.getElementById('footerServiceLinks');
        if (el) el.innerHTML = footer.service_links.map(l => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('');
      }
      if (footer.legal_links) {
        const el = document.getElementById('footerLegal');
        if (el) el.innerHTML = footer.legal_links.map(l => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('');
      }

    } catch (err) {
      console.warn('Site content load failed, using defaults:', err);
    }

    // Signal completion — script.js will handle initAnimations() after this resolves
    // Re-bind event listeners for dynamically replaced elements (cursor, magnetic, ripple)
    if (typeof rebindEventListeners === 'function') {
      rebindEventListeners();
    }
    _resolve();
  })();
})();

function setText(id, text) {
  if (!text) return;
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function esc(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}
