// ===== Config =====
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

// ===== CRM Data Store (localStorage) =====
const CRM = {
    KEY: 'nucha_crm_leads',
    APPT_KEY: 'nucha_crm_appointments',
    NOTES_KEY: 'nucha_crm_notes',

    getLeads() {
        try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; }
    },
    saveLead(lead) {
        const leads = this.getLeads();
        lead.id = 'LEAD-' + Date.now();
        lead.created_at = new Date().toISOString();
        lead.status = 'New Lead';
        lead.score = this.calculateScore(lead);
        leads.unshift(lead);
        localStorage.setItem(this.KEY, JSON.stringify(leads));
        this.notifyNewLead(lead);
        return lead;
    },
    updateLeadStatus(id, status) {
        const leads = this.getLeads();
        const lead = leads.find(l => l.id === id);
        if (lead) {
            lead.status = status;
            lead.updated_at = new Date().toISOString();
            localStorage.setItem(this.KEY, JSON.stringify(leads));
        }
    },
    addNote(leadId, note) {
        const notes = JSON.parse(localStorage.getItem(this.NOTES_KEY)) || [];
        notes.push({
            id: 'NOTE-' + Date.now(),
            lead_id: leadId,
            note: note,
            created_at: new Date().toISOString()
        });
        localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
    },
    getNotes(leadId) {
        const notes = JSON.parse(localStorage.getItem(this.NOTES_KEY)) || [];
        return notes.filter(n => n.lead_id === leadId);
    },
    getAppointments() {
        try { return JSON.parse(localStorage.getItem(this.APPT_KEY)) || []; } catch { return []; }
    },
    saveAppointment(appt) {
        const appts = this.getAppointments();
        appt.id = 'APT-' + Date.now();
        appt.status = 'confirmed';
        appt.created_at = new Date().toISOString();
        appts.unshift(appt);
        localStorage.setItem(this.APPT_KEY, JSON.stringify(appts));
        return appt;
    },
    calculateScore(lead) {
        let score = 0;
        // Budget scoring
        const budgetScores = {
            'มากกว่า 10,000,000': 5,
            '5,000,000 - 10,000,000': 4,
            '3,000,000 - 5,000,000': 3,
            '1,000,000 - 3,000,000': 2,
            '500,000 - 1,000,000': 1,
            'ต่ำกว่า 500,000': 0.5
        };
        score += budgetScores[lead.budget_range] || 0;
        // Service clarity
        if (lead.service_type && lead.service_type !== 'อื่นๆ') score += 2;
        // Has message = engaged
        if (lead.message && lead.message.length > 10) score += 1;
        // Has appointment
        if (lead.date) score += 2;
        return Math.round(score * 10) / 10;
    },
    notifyNewLead(lead) {
        // Auto-reply simulation
        console.log(`[CRM] New lead: ${lead.name} | ${lead.service_type} | Score: ${lead.score}`);
        // In production: send LINE notification, email, etc.
    },
    getPipelineStats() {
        const leads = this.getLeads();
        const stages = ['New Lead', 'Contacted', 'Appointment Set', 'Proposal Sent', 'Closed', 'Lost'];
        return stages.map(stage => ({
            stage,
            count: leads.filter(l => l.status === stage).length,
            leads: leads.filter(l => l.status === stage)
        }));
    }
};

// ===== Loader =====
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.classList.add('hidden');
        initAnimations();
    }, 2000);
});

// ===== Custom Cursor (desktop only) =====
let cursor, follower;
if (!isMobile) {
    cursor = document.getElementById('cursor');
    follower = document.getElementById('cursorFollower');
} else {
    document.querySelectorAll('.cursor, .cursor-follower').forEach(el => el.remove());
}

let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;
let rafId = null;

if (!isMobile) {
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
        if (!rafId) rafId = requestAnimationFrame(animateFollower);
    });
}

function animateFollower() {
    const dx = mouseX - followerX;
    const dy = mouseY - followerY;
    followerX += dx * 0.12;
    followerY += dy * 0.12;
    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        rafId = requestAnimationFrame(animateFollower);
    } else {
        rafId = null;
    }
}

if (!isMobile) {
    const hoverTargets = document.querySelectorAll('a, button, .service-card, .portfolio-item, .magnetic-btn');
    hoverTargets.forEach(el => {
        el.addEventListener('mouseenter', () => { cursor.classList.add('hover'); follower.classList.add('hover'); });
        el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); follower.classList.remove('hover'); });
    });
} else {
    document.querySelectorAll('.cursor, .cursor-follower').forEach(el => el.remove());
}

// ===== Magnetic Button (desktop only) =====
if (!isMobile) {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, { x: x * 0.2, y: y * 0.2, duration: 0.3, ease: 'power2.out' });
        });
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
        });
    });
}

// ===== Mobile Menu =====
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ===== Navbar & Progress =====
const navbar = document.getElementById('navbar');
const scrollProgress = document.getElementById('scrollProgress');
const signatureLine = document.getElementById('signatureLine');

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollY / docHeight) * 100;

    if (scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    scrollProgress.style.width = scrollPercent + '%';
    if (signatureLine) signatureLine.style.height = scrollPercent + '%';
}, { passive: true });

// ===== Floating CTA — show at 40% scroll =====
const floatingCta = document.getElementById('floatingCta');
window.addEventListener('scroll', () => {
    if (!floatingCta) return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = window.scrollY / docHeight;
    if (scrollPercent > 0.4) {
        floatingCta.classList.add('visible');
    } else {
        floatingCta.classList.remove('visible');
    }
}, { passive: true });

// ===== Active Nav =====
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    let current = '';
    const offset = window.innerHeight * 0.3;
    sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - offset) {
            current = section.getAttribute('id');
        }
    });
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
    });
}, { passive: true });

// ===== Multi-Step Booking Form =====
const bookingForm = document.getElementById('bookingForm');
const formSteps = document.querySelectorAll('.form-step');
const stepIndicators = document.querySelectorAll('.booking-step');

function goToStep(stepNum) {
    formSteps.forEach(s => s.classList.remove('active'));
    stepIndicators.forEach(s => s.classList.remove('active'));

    const target = document.querySelector(`.form-step[data-step="${stepNum}"]`);
    if (target) target.classList.add('active');

    stepIndicators.forEach(s => {
        const sn = parseInt(s.dataset.step);
        if (sn <= stepNum) s.classList.add('active');
    });
}

// Next buttons
document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
        const currentStep = btn.closest('.form-step');
        const currentStepNum = parseInt(currentStep.dataset.step);

        // Validate current step
        if (currentStepNum === 1) {
            const selected = currentStep.querySelector('input[name="service_type"]:checked');
            if (!selected) {
                showFormError(currentStep, 'กรุณาเลือกบริการ');
                return;
            }
        }
        if (currentStepNum === 2) {
            const name = document.getElementById('bookingName').value.trim();
            const phone = document.getElementById('bookingPhone').value.trim();
            if (!name || !phone) {
                showFormError(currentStep, 'กรุณากรอกชื่อและเบอร์โทร');
                return;
            }
        }

        goToStep(currentStepNum + 1);
    });
});

// Back buttons
document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetStep = parseInt(btn.dataset.back);
        goToStep(targetStep);
    });
});

function showFormError(step, msg) {
    let errEl = step.querySelector('.form-error');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'form-error';
        step.querySelector('.form-step-nav').before(errEl);
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
    gsap.from(errEl, { opacity: 0, y: -10, duration: 0.3 });
    setTimeout(() => errEl.style.display = 'none', 3000);
}

// Service card links → pre-select service
document.querySelectorAll('[data-booking-service]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const service = link.dataset.bookingService;
        const serviceMap = {
            'construction': 'รับเหมาก่อสร้าง',
            'builtin': 'บิ้วอิน',
            'design': 'ออกแบบ',
            'decoration': 'ตกแต่ง',
            'project-management': 'บริหารโครงการ'
        };
        const radio = document.querySelector(`input[name="service_type"][value="${serviceMap[service]}"]`);
        if (radio) radio.checked = true;
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    });
});

// Set min date to today
const dateInput = document.getElementById('bookingDate');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Form submission
if (bookingForm) {
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const lead = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            service_type: formData.get('service_type'),
            budget_range: formData.get('budget_range') || 'ไม่ระบุ',
            message: formData.get('message') || '',
            date: formData.get('date'),
            time: formData.get('time'),
            meeting_type: formData.get('meeting_type') || 'onsite'
        };

        // Save to CRM
        const savedLead = CRM.saveLead(lead);

        // Save appointment
        if (lead.date && lead.time) {
            CRM.saveAppointment({
                lead_id: savedLead.id,
                lead_name: lead.name,
                date: lead.date,
                time: lead.time,
                meeting_type: lead.meeting_type,
                service_type: lead.service_type
            });
        }

        // Show success
        formSteps.forEach(s => s.classList.remove('active'));
        const successEl = document.getElementById('formSuccess');
        successEl.classList.add('active');

        const summary = document.getElementById('successSummary');
        summary.innerHTML = `
            <div class="success-detail"><strong>บริการ:</strong> ${lead.service_type}</div>
            <div class="success-detail"><strong>งบประมาณ:</strong> ${lead.budget_range}</div>
            ${lead.date ? `<div class="success-detail"><strong>วันนัด:</strong> ${formatDate(lead.date)} เวลา ${lead.time}</div>` : ''}
            <div class="success-detail"><strong>รูปแบบ:</strong> ${getMeetingTypeLabel(lead.meeting_type)}</div>
        `;

        // Reset form after delay
        setTimeout(() => {
            bookingForm.reset();
            successEl.classList.remove('active');
            goToStep(1);
        }, 8000);
    });
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function getMeetingTypeLabel(type) {
    const labels = { 'onsite': 'เข้าดูหน้างาน', 'online': 'วิดีโอคอล', 'phone': 'โทรศัพท์' };
    return labels[type] || type;
}

// ===== GSAP ANIMATIONS =====
function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    const blurAmt = isMobile ? 'none' : 'blur(6px)';
    const blurSmall = isMobile ? 'none' : 'blur(4px)';
    const blurMed = isMobile ? 'none' : 'blur(5px)';

    // === HERO ===
    const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    heroTl
        .from('.hero-badge', { opacity: 0, y: 40, duration: 1, delay: 0.2 })
        .from('.title-line', {
            y: '120%', skewY: 6, letterSpacing: '0.3em', opacity: 0,
            duration: 1.4, stagger: 0.12, ease: 'power4.out'
        }, '-=0.6')
        .to('.title-line', { skewY: 0, letterSpacing: '-0.05em', duration: 0.6, ease: 'power2.out' }, '-=0.4')
        .from('.hero-subtitle', { y: 40, opacity: 0, duration: 0.9 }, '-=0.5')
        .from('.hero-desc', { y: 30, opacity: 0, duration: 0.8 }, '-=0.4')
        .from('.hero-buttons .btn', { y: 30, opacity: 0, duration: 0.7, stagger: 0.1 }, '-=0.3')
        .from('.hero-stats-row', { y: 20, opacity: 0, duration: 0.6 }, '-=0.2')
        .from('.hero-image-wrapper', { scale: 1.2, opacity: 0, duration: 1.8, ease: 'power2.out' }, '-=1.4')
        .from('.hero-float-card', { x: -40, opacity: 0, duration: 0.9 }, '-=0.6')
        .from('.scroll-indicator', { opacity: 0, y: 10, duration: 0.6 }, '-=0.3');

    // Hero parallax
    gsap.to('.hero-diagonal', {
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 },
        y: -120, x: 40, ease: 'none'
    });
    gsap.to('.hero-dots', {
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
        y: -80, ease: 'none'
    });
    gsap.to('.hero-sweep', {
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
        scale: 1.5, opacity: 0, ease: 'none'
    });
    gsap.to('.hero-img', {
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 },
        scale: 1.15, ease: 'none'
    });
    gsap.to('.hero-content', {
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '50% top', scrub: 0.5 },
        y: -80, opacity: 0, ease: 'none'
    });
    gsap.to('.hero-float-card', {
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 },
        y: -40, ease: 'none'
    });
    gsap.to('.hero', {
        scrollTrigger: { trigger: '.hero', start: 'bottom 80%', end: 'bottom top', scrub: true },
        scale: 0.96, opacity: 0, ease: 'none'
    });

    // === BREAK SCENE ===
    const breakTl = gsap.timeline({
        scrollTrigger: { trigger: '.break-scene', start: 'top 70%', toggleActions: 'play none none none' }
    });
    breakTl
        .from('.break-scene-tag', { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' })
        .from('.break-line', {
            opacity: 0, scale: 0.6, filter: 'blur(8px)', letterSpacing: '0.3em',
            duration: 1.2, stagger: 0.2, ease: 'power4.out'
        }, '-=0.4')
        .to('.break-line', { filter: 'blur(0px)', letterSpacing: '-0.03em', duration: 0.6, ease: 'power2.out' }, '-=0.3')
        .from('.break-scene-sub', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' }, '-=0.3')
        .from('.break-scene-line', { scaleX: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3');

    if (!isMobile) {
        gsap.to('.break-scene-text', {
            scrollTrigger: { trigger: '.break-scene', start: 'top 30%', end: 'top top', scrub: 1 },
            scale: 1.15, ease: 'power2.out'
        });
    }

    gsap.to('.break-scene-content', {
        scrollTrigger: { trigger: '.break-scene', start: 'top top', end: 'bottom top', scrub: 0.5 },
        y: -60, opacity: 0, ease: 'none'
    });

    // === SERVICES ===
    gsap.from('.services', {
        scrollTrigger: { trigger: '.services', start: 'top 90%', end: 'top 50%', scrub: 0.8 },
        scale: 0.98, opacity: 0.5, ease: 'none'
    });
    gsap.from('.services .section-header', {
        scrollTrigger: { trigger: '.services', start: 'top 80%', toggleActions: 'play none none none' },
        opacity: 0, y: 60, filter: blurAmt, duration: 1.2, ease: 'power3.out'
    });
    gsap.utils.toArray('.service-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
            opacity: 0, y: 80, filter: blurSmall, duration: 1, delay: i * 0.12, ease: 'power3.out'
        });
    });

    // === STORY ===
    gsap.from('.story', {
        scrollTrigger: { trigger: '.story', start: 'top 90%', end: 'top 50%', scrub: 0.8 },
        scale: 0.98, opacity: 0.5, ease: 'none'
    });

    const storySection = document.querySelector('.story');
    const storySteps = document.querySelectorAll('.story-step');
    const storyImages = document.querySelectorAll('.story-img-wrapper');
    const storyProgressBar = document.querySelector('.story-progress-bar');
    const totalSteps = storySteps.length;

    if (storySection && totalSteps > 0) {
        ScrollTrigger.create({
            trigger: storySection,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                const progress = self.progress;
                const stepIndex = Math.min(Math.floor(progress * totalSteps), totalSteps - 1);

                if (storyProgressBar) {
                    storyProgressBar.style.width = (progress * 100) + '%';
                }

                storySteps.forEach((step, i) => {
                    if (i === stepIndex) {
                        if (!step.classList.contains('active')) {
                            step.classList.remove('exit-up');
                            step.classList.add('active');
                        }
                    } else if (i < stepIndex) {
                        step.classList.remove('active');
                        step.classList.add('exit-up');
                    } else {
                        step.classList.remove('active', 'exit-up');
                    }
                });

                storyImages.forEach((img, i) => {
                    if (i === stepIndex) {
                        img.classList.add('active');
                        const localProgress = (progress * totalSteps) - i;
                        const parallaxY = (localProgress - 0.5) * 30;
                        if (!isMobile) {
                            img.style.transform = `scale(1) translateY(${parallaxY}px)`;
                        }
                    } else {
                        img.classList.remove('active');
                    }
                });
            }
        });
    }

    // === PORTFOLIO ===
    gsap.from('.portfolio .section-header', {
        scrollTrigger: { trigger: '.portfolio', start: 'top 80%', toggleActions: 'play none none none' },
        opacity: 0, y: 50, filter: blurMed, duration: 1.1, ease: 'power3.out'
    });
    gsap.utils.toArray('.portfolio-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none none' },
            opacity: 0, y: 60, scale: 0.94, filter: blurSmall,
            duration: 1.1, delay: i * 0.1, ease: 'power3.out'
        });
    });

    // === BOOKING ===
    gsap.from('.booking-info', {
        scrollTrigger: { trigger: '.booking', start: 'top 80%', toggleActions: 'play none none none' },
        opacity: 0, x: -60, duration: 1.2, ease: 'power3.out'
    });
    gsap.from('.booking-form-container', {
        scrollTrigger: { trigger: '.booking', start: 'top 80%', toggleActions: 'play none none none' },
        opacity: 0, x: 60, duration: 1.2, ease: 'power3.out'
    });

    // === STATS ===
    gsap.utils.toArray('.stat-item').forEach((item, i) => {
        const numEl = item.querySelector('.stat-number');
        const target = parseInt(numEl.dataset.count);
        gsap.from(item, {
            scrollTrigger: {
                trigger: item, start: 'top 85%', toggleActions: 'play none none none',
                onEnter: () => {
                    gsap.to({ val: 0 }, {
                        val: target, duration: 2.2, delay: i * 0.15, ease: 'power2.out',
                        onUpdate: function() { numEl.textContent = Math.round(this.targets()[0].val); }
                    });
                }, once: true
            }, opacity: 0, y: 40, scale: 0.9, duration: 1, delay: i * 0.1, ease: 'power3.out'
        });
    });

    // === TRUST ===
    gsap.from('.trust .section-header', {
        scrollTrigger: { trigger: '.trust', start: 'top 80%', toggleActions: 'play none none none' },
        opacity: 0, y: 50, filter: blurMed, duration: 1.1, ease: 'power3.out'
    });
    gsap.utils.toArray('.testimonial-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
            opacity: 0, y: 50, scale: 0.95, filter: blurSmall,
            duration: 1, delay: i * 0.15, ease: 'power3.out'
        });
    });

    // === CLOSING ===
    gsap.from('.closing-tag', {
        scrollTrigger: { trigger: '.closing', start: 'top 75%', toggleActions: 'play none none none' },
        opacity: 0, y: 30, duration: 0.8, ease: 'power3.out'
    });
    gsap.from('.closing-title', {
        scrollTrigger: { trigger: '.closing', start: 'top 75%', toggleActions: 'play none none none' },
        opacity: 0, y: 50, scale: 0.95, duration: 1.2, delay: 0.15, ease: 'power4.out'
    });
    gsap.from('.closing-desc', {
        scrollTrigger: { trigger: '.closing', start: 'top 70%', toggleActions: 'play none none none' },
        opacity: 0, y: 30, duration: 0.9, delay: 0.3, ease: 'power3.out'
    });
    gsap.utils.toArray('.guarantee-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: { trigger: '.closing-guarantee', start: 'top 85%', toggleActions: 'play none none none' },
            opacity: 0, y: 30, x: -20, duration: 0.8, delay: i * 0.15, ease: 'power3.out'
        });
    });
    gsap.from('.closing-cta', {
        scrollTrigger: { trigger: '.closing-cta', start: 'top 90%', toggleActions: 'play none none none' },
        opacity: 0, y: 20, scale: 0.95, duration: 0.8, ease: 'back.out(1.7)'
    });

    // === TRUST BADGES ===
    gsap.from('.trust-badges-label', {
        scrollTrigger: { trigger: '.trust-badges', start: 'top 90%', toggleActions: 'play none none none' },
        opacity: 0, y: 15, duration: 0.6, ease: 'power3.out'
    });
    gsap.utils.toArray('.trust-badge-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: { trigger: '.trust-badges-row', start: 'top 90%', toggleActions: 'play none none none' },
            opacity: 0, y: 20, duration: 0.6, delay: i * 0.08, ease: 'power3.out'
        });
    });

    // Floating CTA
    gsap.from('.floating-cta .fab', {
        scrollTrigger: { trigger: '.hero', start: 'bottom 60%', toggleActions: 'play none none none' },
        opacity: 0, y: 30, scale: 0.5, duration: 0.8, stagger: 0.15, ease: 'back.out(1.7)'
    });

    // Footer
    gsap.from('.footer-top > *', {
        scrollTrigger: { trigger: '.footer-top', start: 'top 88%', toggleActions: 'play none none none' },
        opacity: 0, y: 40, duration: 0.8, stagger: 0.1, ease: 'power3.out'
    });
}

// ===== Ripple on Click =====
document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute; width: 0; height: 0; border-radius: 50%;
            background: rgba(255,255,255,0.3);
            left: ${e.clientX - rect.left}px; top: ${e.clientY - rect.top}px;
            transform: translate(-50%, -50%); pointer-events: none;
        `;
        this.appendChild(ripple);
        gsap.to(ripple, {
            width: 300, height: 300, opacity: 0,
            duration: 0.8, ease: 'power2.out',
            onComplete: () => ripple.remove()
        });
    });
});

// ===== Service option selection visual feedback =====
document.querySelectorAll('.service-option input').forEach(input => {
    input.addEventListener('change', () => {
        document.querySelectorAll('.service-option-card').forEach(c => c.classList.remove('selected'));
        input.closest('.service-option').querySelector('.service-option-card').classList.add('selected');
    });
});

document.querySelectorAll('.budget-option input').forEach(input => {
    input.addEventListener('change', () => {
        document.querySelectorAll('.budget-tag').forEach(t => t.classList.remove('selected'));
        input.closest('.budget-option').querySelector('.budget-tag').classList.add('selected');
    });
});

document.querySelectorAll('.meeting-option input').forEach(input => {
    input.addEventListener('change', () => {
        document.querySelectorAll('.meeting-option-card').forEach(c => c.classList.remove('selected'));
        input.closest('.meeting-option').querySelector('.meeting-option-card').classList.add('selected');
    });
});
