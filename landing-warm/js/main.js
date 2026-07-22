// Cấu hình liên hệ của phòng khám
const CONTACT = {
  phone: '0776196601',
  zalo: 'https://zalo.me/0776196601',
  email: 'bsquyen1407@gmail.com',
};

// ===== Menu mobile =====
const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

navToggle.addEventListener('click', () => {
  const open = siteNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

// Đóng menu khi chọn một mục
siteNav.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// ===== Hiệu ứng xuất hiện khi cuộn =====
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// ===== Form đặt lịch =====
// Website tĩnh không có backend: form soạn sẵn nội dung đặt lịch,
// bệnh nhân gửi qua Zalo (sao chép + mở chat), email hoặc gọi trực tiếp.
const form = document.getElementById('bookingForm');
const formError = document.getElementById('formError');
const resultBox = document.getElementById('bookingResult');
const composedEl = document.getElementById('composedMessage');
const copyZaloBtn = document.getElementById('copyZaloBtn');
const emailBtn = document.getElementById('emailBtn');
const copyNote = document.getElementById('copyNote');

function formatDate(value) {
  if (!value) return 'Chưa chọn (phòng khám sẽ tư vấn)';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const fullName = form.fullName.value.trim();
  const phone = form.phone.value.trim();
  const service = form.service.value;

  // Đánh dấu ô còn thiếu
  [form.fullName, form.phone, form.service].forEach((field) => {
    field.classList.toggle('invalid', !field.value.trim());
  });

  const phoneOk = /^[0-9+\s().-]{8,15}$/.test(phone);
  if (!fullName || !phone || !service || !phoneOk) {
    if (phone && !phoneOk) form.phone.classList.add('invalid');
    formError.hidden = false;
    return;
  }
  formError.hidden = true;

  const message = [
    'YÊU CẦU ĐẶT LỊCH HẸN',
    `- Họ tên: ${fullName}`,
    `- SĐT: ${phone}`,
    `- Dịch vụ: ${service}`,
    `- Ngày mong muốn: ${formatDate(form.preferredDate.value)}`,
    form.message.value.trim() ? `- Lời nhắn: ${form.message.value.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  composedEl.textContent = message;

  // Nút email với nội dung soạn sẵn
  emailBtn.href =
    `mailto:${CONTACT.email}` +
    `?subject=${encodeURIComponent('Đặt lịch hẹn - ' + fullName)}` +
    `&body=${encodeURIComponent(message)}`;

  resultBox.hidden = false;
  copyNote.hidden = true;
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// Sao chép nội dung rồi mở Zalo
copyZaloBtn.addEventListener('click', async () => {
  const text = composedEl.textContent;
  try {
    await navigator.clipboard.writeText(text);
    copyNote.hidden = false;
  } catch {
    // Trình duyệt cũ không hỗ trợ clipboard API — vẫn mở Zalo
  }
  window.open(CONTACT.zalo, '_blank', 'noopener');
});

// Bỏ đánh dấu lỗi khi người dùng sửa lại
form.addEventListener('input', (e) => {
  if (e.target.classList.contains('invalid') && e.target.value.trim()) {
    e.target.classList.remove('invalid');
  }
});
