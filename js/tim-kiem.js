// Ô tìm kiếm ở /kien-thuc/ — chạy hoàn toàn trên trình duyệt, chỉ mục ở /kien-thuc/tim-kiem.json.
//
// Bỏ dấu CẢ HAI PHÍA trước khi so khớp: người Việt hay gõ không dấu, "ung thu da day"
// phải ra "ung thư dạ dày". Thiếu bước này thì ô tìm kiếm coi như không dùng được.
// Mọi từ gõ vào đều phải có mặt (AND), bài khớp ở tiêu đề xếp trước.
//
// Không gửi nội dung người dùng gõ lên analytics — người đọc site y tế hay gõ đúng bệnh
// của mình. Umami chỉ nhận số kết quả.
(function () {
  var form = document.querySelector('.tim-kiem');
  if (!form) return;

  var input = form.querySelector('input');
  var trangThai = form.querySelector('.tim-kiem-trang-thai');
  var ketQua = form.querySelector('.tim-kiem-ket-qua');
  var danhSach = document.querySelector('.article-list:not(.tim-kiem-ket-qua)');
  var phanTrang = document.querySelector('.pagination');

  // NFD tách dấu thanh và dấu mũ khỏi chữ cái; riêng "đ" là một ký tự riêng trong
  // Unicode, không tách được, nên phải đổi tay.
  function boDau(s) {
    return s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // viết bằng escape: ký tự tổ hợp gõ thẳng sẽ bị trình soạn thảo chuẩn hoá mất
      .replace(/[đĐ]/g, 'd')
      .toLowerCase();
  }

  // Chuẩn hoá thành " tieng tieng tieng " (dấu câu thành khoảng trắng, có khoảng trắng
  // hai đầu) để so khớp ở ĐẦU mỗi tiếng bằng indexOf(' ' + tu). Khớp giữa chữ thì từ
  // ngắn như "an" dính cả "than", "ban".
  function chuoiTieng(s) {
    // NFC trước: bộ gõ để "Unicode tổ hợp" (hay chữ dán từ nơi khác) gửi dấu thành ký tự
    // rời, mà ký tự dấu rời không thuộc \p{L} nên bị cắt thành khoảng trắng — "dạ dày"
    // vỡ thành "da", "da", "y".
    return ' ' + s.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + ' ';
  }
  function tachTu(q) {
    return chuoiTieng(q).split(' ').filter(Boolean);
  }
  function co(chuoi, tu) {
    return chuoi.indexOf(' ' + tu) !== -1;
  }

  // Giữ lại chính Promise (không phải kết quả): gõ nhanh lúc chỉ mục chưa về thì mọi phím
  // dùng chung một request, thay vì mỗi phím một request về lệch thứ tự nhau.
  var hua = null;
  function napChiMuc() {
    if (hua) return hua;
    hua = fetch('/kien-thuc/tim-kiem.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (ds) {
        return ds.map(function (b) {
          var tatCa = [b.t, b.d].concat(b.g || []).join(' ');
          b._tieuDeGoc = chuoiTieng(b.t);
          b._tatCaGoc = chuoiTieng(tatCa);
          b._tieuDe = boDau(b._tieuDeGoc);
          b._tatCa = boDau(b._tatCaGoc);
          return b;
        });
      })
      .catch(function (e) {
        hua = null; // lỗi mạng thì lần gõ sau thử tải lại, không kẹt mãi ở lỗi
        throw e;
      });
    return hua;
  }

  // Lọc: mọi từ phải có mặt, so KHÔNG dấu (gõ "da day" ra "dạ dày").
  // Xếp hạng: khớp ở tiêu đề hơn khớp ở mô tả; và nếu người dùng CÓ gõ dấu thì bài khớp
  // đúng dấu lên trước — bỏ dấu thì "đau", "dấu", "đầu" đều thành "dau", nhưng ai đã gõ
  // "đau" thì rõ ràng muốn bài về đau.
  function tim(ds, q) {
    var tuGoc = tachTu(q);
    var tu = tuGoc.map(boDau);
    return ds
      .filter(function (b) {
        return tu.every(function (t) { return co(b._tatCa, t); });
      })
      .map(function (b) {
        var diem = 0;
        tu.forEach(function (t, i) {
          if (co(b._tieuDe, t)) diem += 2;
          if (tuGoc[i] !== t && co(b._tatCaGoc, tuGoc[i])) diem += 3; // khớp đúng dấu
          if (tuGoc[i] !== t && co(b._tieuDeGoc, tuGoc[i])) diem += 1;
        });
        return { b: b, diem: diem };
      })
      .sort(function (x, y) { return y.diem - x.diem; }) // sort ổn định: cùng điểm giữ mới nhất trước
      .map(function (x) { return x.b; });
  }

  // Thay toàn bộ con của el. Không dùng el.replaceChildren(): chỉ có từ Safari 14 / iOS 14,
  // còn site phải chạy trên máy cũ hơn (xem docs/do-luong.md).
  function thayNoiDung(el, dsCon) {
    while (el.firstChild) el.removeChild(el.firstChild);
    dsCon.forEach(function (c) {
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
  }

  // Dựng card bằng textContent, không nối chuỗi HTML
  function the(tag, cls, chu) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (chu) el.textContent = chu;
    return el;
  }
  function card(b) {
    var a = the('a', 'article-item');
    a.href = b.u;
    var body = the('div', 'article-item-body');
    body.appendChild(the('h2', null, b.t));
    body.appendChild(the('p', null, b.d));
    body.appendChild(the('span', 'article-item-meta', b.n + ' · Đọc tiếp →'));
    a.appendChild(body);
    return a;
  }

  var hen = null;
  var daDem = '';
  function demSauKhiNgungGo(q, soKetQua) {
    clearTimeout(hen);
    // Đợi người dùng ngừng gõ rồi mới đếm, để "u", "un", "ung"… không thành 3 lượt tìm
    hen = setTimeout(function () {
      if (q.length < 2 || q === daDem || !window.umami) return;
      daDem = q;
      window.umami.track('tim-kiem', { so_ket_qua: soKetQua });
    }, 1500);
  }

  function hienThi(q) {
    q = q.trim();
    // Ô trống, hoặc chỉ gõ dấu câu ("?!" không có từ nào): coi như chưa tìm, trả lại danh
    // sách gốc. Không có dòng này thì "không từ nào" khớp với mọi bài.
    if (!tachTu(q).length) {
      clearTimeout(hen); // xoá trước khi hết 1,5 giây thì truy vấn dở dang không bị đếm
      ketQua.hidden = true;
      trangThai.textContent = '';
      danhSach.hidden = false;
      if (phanTrang) phanTrang.hidden = false;
      return;
    }
    napChiMuc().then(function (ds) {
      // Chỉ mục về trễ mà người dùng đã gõ tiếp (hoặc xoá hết) thì bỏ kết quả cũ này
      if (input.value.trim() !== q) return;
      var kq = tim(ds, q);
      thayNoiDung(ketQua, kq.map(card));
      ketQua.hidden = kq.length === 0;
      danhSach.hidden = true;
      if (phanTrang) phanTrang.hidden = true;
      if (kq.length) {
        trangThai.textContent = 'Tìm thấy ' + kq.length + ' bài.';
      } else {
        // Không có bài thì đưa người đọc tới bác sĩ thay vì bỏ họ ở ngõ cụt.
        // Link này do js/do-luong.js đếm (bam-zalo, vi_tri tim-kiem) như mọi nút Zalo khác.
        var zalo = the('a', null, 'nhắn Zalo hỏi trực tiếp bác sĩ');
        zalo.href = 'https://zalo.me/0776196601';
        zalo.target = '_blank';
        zalo.rel = 'noopener';
        thayNoiDung(trangThai, ['Chưa có bài nào khớp. Thử từ khác, hoặc ', zalo, '.']);
      }
      demSauKhiNgungGo(q, kq.length);
    }, function () {
      if (input.value.trim() !== q) return;
      trangThai.textContent = 'Không tải được danh sách bài. Thử lại sau giây lát.';
    });
  }

  input.addEventListener('input', function () { hienThi(input.value); });
  form.hidden = false;
})();
