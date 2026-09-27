// Giao diện công cụ "Tôi nên tầm soát gì?" (/cong-cu/tam-soat/).
// Quy tắc nằm ở js/tam-soat-quy-tac.js; file này chỉ đọc form và vẽ kết quả.
//
// Câu trả lời không rời khỏi trình duyệt: không fetch, không lưu, không đưa lên URL.
// Umami chỉ nhận đúng một sự kiện "dung-cong-cu", không kèm câu trả lời nào.
(function () {
  var QT = window.TamSoatQuyTac;
  var form = document.getElementById('tsForm');
  var ketQua = document.getElementById('tsKetQua');
  if (!QT || !form || !ketQua) return;

  var oTuoi = document.getElementById('tsTuoi');
  var loiTuoi = document.getElementById('tsTuoiLoi');
  var noiDung = document.getElementById('tsNoiDung');
  var tieuDe = document.getElementById('tsKetQuaTieuDe');

  function tao(the, lop, chu) {
    var el = document.createElement(the);
    if (lop) el.className = lop;
    if (chu) el.textContent = chu;
    return el;
  }

  function link(href, chu, ngoai) {
    var a = tao('a', null, chu);
    a.href = href;
    if (ngoai) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    return a;
  }

  function daChon(nhom) {
    var ds = form.querySelectorAll('input[data-nhom="' + nhom + '"]:checked');
    var kq = [];
    for (var i = 0; i < ds.length; i++) kq.push(ds[i].value);
    return kq;
  }

  function giaTriRadio(ten) {
    var o = form.querySelector('input[name="' + ten + '"]:checked');
    return o ? o.value : null;
  }

  function veCanhBao() {
    var hop = tao('div', 'ts-hop ts-canh-bao');
    hop.appendChild(tao('h3', null, 'Nên đi khám sớm'));
    hop.appendChild(tao('p', null, QT.CHU.R0));
    var dong = tao('p', 'ts-hanh-dong');
    dong.appendChild(link('tel:0776196601', 'Gọi 0776 196 601'));
    dong.appendChild(document.createTextNode(' · '));
    dong.appendChild(link('https://zalo.me/0776196601', 'Nhắn Zalo', true));
    dong.appendChild(document.createTextNode(' · '));
    dong.appendChild(link(QT.BAI['dau-hieu'].url, 'Đọc bài ' + QT.BAI['dau-hieu'].ten));
    hop.appendChild(dong);
    return hop;
  }

  function veLich(kq) {
    var khoi = tao('div', 'ts-lich');
    if (kq.duoiTuoi) {
      var hop = tao('div', 'ts-hop');
      hop.appendChild(tao('p', null, QT.CHU.T0));
      var p = tao('p');
      p.appendChild(link(QT.BAI['vac-xin'].url, 'Đọc bài ' + QT.BAI['vac-xin'].ten));
      hop.appendChild(p);
      khoi.appendChild(hop);
      return khoi;
    }
    if (!kq.muc.length) {
      khoi.appendChild(tao('p', 'ts-hop', QT.CHU.KHONG_KHOP));
      return khoi;
    }
    // Gom theo loại ung thư, giữ thứ tự quy tắc trả về; link bài đặt cuối mỗi nhóm.
    var hopNhom = null;
    var baiNhom = null;
    function dongNhom() {
      if (!hopNhom) return;
      var p = tao('p', 'ts-doc-bai');
      p.appendChild(link(baiNhom.url, 'Đọc bài ' + baiNhom.ten));
      hopNhom.appendChild(p);
      khoi.appendChild(hopNhom);
    }
    kq.muc.forEach(function (m, i) {
      if (i === 0 || m.nhom !== kq.muc[i - 1].nhom) {
        dongNhom();
        hopNhom = tao('div', 'ts-hop');
        hopNhom.appendChild(tao('h3', null, m.tenNhom));
        baiNhom = m.bai;
      }
      hopNhom.appendChild(tao('p', null, m.chu));
    });
    dongNhom();
    return khoi;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var tuoi = Number(oTuoi.value);
    if (!oTuoi.value || !isFinite(tuoi) || tuoi < 1 || tuoi > 120 || Math.floor(tuoi) !== tuoi) {
      loiTuoi.hidden = false;
      oTuoi.setAttribute('aria-invalid', 'true');
      oTuoi.focus();
      return;
    }
    loiTuoi.hidden = true;
    oTuoi.removeAttribute('aria-invalid');

    var kq = QT.ketQua({
      tuoi: tuoi,
      gioi: giaTriRadio('gioi'),
      dauHieu: giaTriRadio('dauHieu') === 'co',
      giaDinh: daChon('giaDinh'),
      banThan: daChon('banThan')
    });

    while (noiDung.firstChild) noiDung.removeChild(noiDung.firstChild);
    var lich = veLich(kq);
    if (kq.dauHieu) {
      noiDung.appendChild(veCanhBao());
      // Triệu chứng thắng tất cả: lịch tầm soát chỉ hiện khi người dùng chủ động mở.
      lich.hidden = true;
      var nut = tao('button', 'btn btn-outline ts-xem-them', 'Xem thêm lịch tầm soát');
      nut.type = 'button';
      nut.addEventListener('click', function () {
        lich.hidden = false;
        nut.hidden = true;
      });
      noiDung.appendChild(nut);
    }
    noiDung.appendChild(lich);
    document.getElementById('tsMienTru').textContent = QT.CHU.MIEN_TRU;

    form.hidden = true;
    ketQua.hidden = false;
    tieuDe.focus();
    if (ketQua.scrollIntoView) ketQua.scrollIntoView({ block: 'start' });
    if (window.umami) window.umami.track('dung-cong-cu', { cong_cu: 'tam-soat' });
  });

  document.getElementById('tsLamLai').addEventListener('click', function () {
    ketQua.hidden = true;
    form.hidden = false;
    oTuoi.focus();
  });

  form.hidden = false;
})();
