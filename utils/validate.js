// ===== Server-side Input Validation =====

function validatePhone(phone) {
  if (!phone) return { valid: false, error: 'กรุณากรอกเบอร์โทร' };
  const digits = phone.replace(/[\s\-]/g, '');
  if (!/^\d{10}$/.test(digits)) return { valid: false, error: 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก' };
  return { valid: true, cleaned: digits };
}

function validateEmail(email) {
  if (!email || email.trim() === '') return { valid: true, cleaned: '' }; // email is optional
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) return { valid: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' };
  return { valid: true, cleaned: email.trim() };
}

function validateName(name) {
  if (!name) return { valid: false, error: 'กรุณากรอกชื่อ' };
  if (name.length > 200) return { valid: false, error: 'ชื่อต้องไม่เกิน 200 ตัวอักษร' };
  if (/<script[\s>]/i.test(name) || /<\/script>/i.test(name)) return { valid: false, error: 'ชื่อไม่สามารถมีแท็ก HTML' };
  const cleaned = name.replace(/<[^>]*>/g, '').trim();
  return { valid: true, cleaned };
}

function validateMessage(message) {
  if (!message) return { valid: true, cleaned: '' }; // message is optional
  if (message.length > 5000) return { valid: false, error: 'ข้อความต้องไม่เกิน 5000 ตัวอักษร' };
  return { valid: true, cleaned: message };
}

function validatePassword(password) {
  if (!password) return { valid: false, error: 'กรุณากรอกรหัสผ่าน' };
  if (password.length < 8) return { valid: false, error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' };
  return { valid: true };
}

function validateLead(body) {
  const nameResult = validateName(body.name);
  if (!nameResult.valid) return nameResult;

  const phoneResult = validatePhone(body.phone);
  if (!phoneResult.valid) return phoneResult;

  const emailResult = validateEmail(body.email);
  if (!emailResult.valid) return emailResult;

  const messageResult = validateMessage(body.message);
  if (!messageResult.valid) return messageResult;

  return {
    valid: true,
    data: {
      name: nameResult.cleaned,
      phone: phoneResult.cleaned,
      email: emailResult.cleaned,
      message: messageResult.cleaned
    }
  };
}

module.exports = {
  validatePhone,
  validateEmail,
  validateName,
  validateMessage,
  validatePassword,
  validateLead
};
