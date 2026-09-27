// Đo lượt bấm liên hệ bằng Umami — dùng chung cho mọi trang chính thức.
//
// Một listener duy nhất bắt mọi link tel:, zalo.me, mailto:, #dat-lich, nên nút mới
// thêm sau này tự được đếm, không phải nhớ gắn thuộc tính từng nút.
// Umami bị chặn (adblock) hoặc chưa tải xong thì bỏ qua — nút vẫn chạy bình thường.
//
// Tên sự kiện và ý nghĩa: docs/do-luong.md
(function () {
  // Tên vị trí đọc được trong báo cáo, ưu tiên từ khối cụ thể tới chung chung.
  var VI_TRI = [
    ['.quick-bar', 'thanh-nhanh'],
    ['.article-cta', 'cuoi-bai'],
    ['.booking-result', 'form-dat-lich'],
    ['.hero', 'dau-trang'], // section đầu trang chủ không có id
    ['.tim-kiem', 'tim-kiem'], // gợi ý Zalo khi tìm không ra bài
    ['.site-header', 'header'],
    ['.site-footer', 'footer'],
  ];

  function viTri(el) {
    for (var i = 0; i < VI_TRI.length; i++) {
      if (el.closest(VI_TRI[i][0])) return VI_TRI[i][1];
    }
    // Trang chủ: tên section (gioi-thieu, phong-kham, hoi-dap…)
    var section = el.closest('section[id]');
    return section ? section.id : 'khac';
  }

  function suKien(href) {
    if (href.indexOf('tel:') === 0) return 'bam-goi';
    if (href.indexOf('zalo.me') !== -1) return 'bam-zalo';
    if (href.indexOf('mailto:') === 0) return 'bam-email';
    if (/#dat-lich$/.test(href)) return 'bam-dat-lich';
    return null;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var ten = suKien(a.getAttribute('href'));
    if (ten && window.umami) window.umami.track(ten, { vi_tri: viTri(a) });
  });
})();
