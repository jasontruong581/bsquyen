// Quy tắc công cụ "Tôi nên tầm soát gì?" — bản code của bảng đã được bác sĩ duyệt ở
// docs/quy-tac-cong-cu-tam-soat.md. Chữ ở đây phải khớp nguyên văn với cột "Người dùng
// thấy" trong bảng; scripts/tam-soat-quy-tac.test.mjs đọc file docs để so từng dòng.
//
// Chạy trên trình duyệt (window.TamSoatQuyTac) và trong Node (module.exports) để test.
// Không có hàm nào gửi dữ liệu đi đâu.
(function (goc) {
  var BAI = {
    'dau-hieu': { url: '/kien-thuc/dau-hieu-canh-bao-ung-thu/', ten: '10 dấu hiệu cảnh báo ung thư' },
    'vac-xin': { url: '/kien-thuc/vac-xin-phong-ung-thu/', ten: 'Vắc-xin phòng ung thư' },
    vu: { url: '/kien-thuc/tam-soat-ung-thu-vu/', ten: 'Tầm soát ung thư vú' },
    'co-tu-cung': { url: '/kien-thuc/tam-soat-ung-thu-co-tu-cung/', ten: 'Tầm soát ung thư cổ tử cung' },
    'dai-truc-trang': { url: '/kien-thuc/tam-soat-ung-thu-dai-truc-trang/', ten: 'Tầm soát ung thư đại trực tràng' },
    gan: { url: '/kien-thuc/tam-soat-ung-thu-gan/', ten: 'Tầm soát ung thư gan' },
    'da-day': { url: '/kien-thuc/tam-soat-ung-thu-da-day/', ten: 'Tầm soát ung thư dạ dày' }
  };

  var CHU = {
    R0: 'Những dấu hiệu bạn chọn nên được bác sĩ khám sớm, không nên chờ tới lịch tầm soát. Chúng có thể do bệnh lành tính, nhưng dù nguyên nhân là gì thì bản thân triệu chứng cũng cần được xử trí.',
    T0: 'Ở tuổi của bạn, thường chưa cần tầm soát ung thư: cơ thể còn khỏe và các hướng dẫn tầm soát đều bắt đầu từ tuổi trưởng thành. Chỉ nên đi khám khi có dấu hiệu bất thường rõ. Việc đáng làm lúc này là tiêm phòng: vắc-xin HPV và viêm gan B giúp phòng một số bệnh ung thư về sau.',
    V1: 'Nên trao đổi với bác sĩ về chụp nhũ ảnh định kỳ. Các hướng dẫn quốc tế lấy mốc 40 tuổi (USPSTF 2024: mỗi 2 năm từ 40 đến 74 tuổi).',
    V2: 'Chưa cần chụp nhũ ảnh định kỳ. Việc nên làm là biết vú mình bình thường thế nào để nhận ra ngay khi có thay đổi, và đi khám khi thấy bất thường.',
    V3: 'Bạn thuộc nhóm nên tầm soát sớm hơn và kỹ hơn. Hãy mang tiền sử gia đình cụ thể tới gặp bác sĩ để có kế hoạch riêng, thay vì tự đặt lịch theo bài viết.',
    V4: 'Sau 74 tuổi, bạn vẫn nên tầm soát vú khoảng 2–3 năm một lần; bác sĩ sẽ giúp chọn cách phù hợp. Nếu thấy thay đổi lạ ở vú thì nên đi khám ngay, không chờ tới lịch.',
    C1: 'Nên trao đổi với bác sĩ về tầm soát ung thư cổ tử cung và lặp lại đều đặn theo lịch. Tùy phương pháp, các hướng dẫn bắt đầu từ 21 tuổi (Pap) hoặc 30 tuổi (xét nghiệm HPV).',
    C2: 'Người suy giảm miễn dịch nên tầm soát sớm hơn và dày hơn (WHO: từ 25 tuổi, mỗi 3–5 năm). Hãy trao đổi với bác sĩ về lịch riêng.',
    C3: 'Người lớn chưa tiêm vắc-xin HPV vẫn có thể tiêm ở nhiều độ tuổi, dù lợi ích thấp hơn tiêm sớm. Bạn có thể hỏi bác sĩ xem với tuổi và hoàn cảnh của mình thì có nên tiêm không.',
    C4: 'Sau 65 tuổi, bạn vẫn nên tầm soát cổ tử cung khoảng 2–3 năm một lần; bác sĩ sẽ giúp chọn cách phù hợp. Nếu có ra máu bất thường hay triệu chứng lạ thì nên đi khám ngay, không chờ tới lịch.',
    D1: 'Nên trao đổi với bác sĩ về tầm soát ung thư đại trực tràng. Các hướng dẫn quốc tế khuyến cáo bắt đầu từ 45 tuổi với người nguy cơ trung bình.',
    D2: 'Bạn thuộc nhóm cần bắt đầu sớm hơn mốc 45 tuổi. Hãy trao đổi kỹ với bác sĩ về thời điểm và phương pháp.',
    D3: 'Sau 75 tuổi, bạn vẫn nên tầm soát đại trực tràng khoảng 2–3 năm một lần; bác sĩ sẽ giúp chọn cách phù hợp. Nếu đi cầu ra máu, đổi thói quen đi cầu hay sụt cân không rõ lý do thì nên đi khám ngay.',
    G1: 'Nên trao đổi với bác sĩ về lịch theo dõi gan định kỳ. Với nhóm nguy cơ, các hướng dẫn chuyên khoa khuyến cáo siêu âm bụng khoảng 6 tháng một lần, có thể kèm xét nghiệm máu AFP.',
    G2: 'Việc nên làm trước tiên là xét nghiệm viêm gan B và C một lần, để biết mình có thuộc nhóm cần theo dõi gan hay không.',
    DD1: 'Khoảng 40 tuổi là mốc hợp lý để bắt đầu trao đổi với bác sĩ về tầm soát ung thư dạ dày. Việt Nam chưa có chương trình tầm soát toàn dân, nhưng người Việt có xu hướng mắc bệnh ở tuổi trẻ hơn so với phương Tây.',
    DD2: 'Bạn thuộc nhóm nên cân nhắc tầm soát dạ dày sớm và kỹ hơn. Hãy trao đổi với bác sĩ.',
    KHONG_KHOP: 'Với những gì bạn chọn, hiện chưa có loại tầm soát nào các hướng dẫn khuyến cáo riêng cho bạn. Hãy giữ lối sống lành mạnh và đi khám khi có dấu hiệu bất thường. Bạn có thể quay lại công cụ khi bước sang mốc tuổi mới.',
    MIEN_TRU: 'Kết quả này chỉ gợi ý những điều bạn nên hỏi bác sĩ, dựa trên các hướng dẫn phổ biến. Nó không phải chẩn đoán và không thay thế việc thăm khám. Mỗi người có hoàn cảnh riêng, bác sĩ sẽ tư vấn cụ thể sau khi khám.'
  };

  var TEN_NHOM = {
    vu: 'Ung thư vú',
    'co-tu-cung': 'Ung thư cổ tử cung',
    'dai-truc-trang': 'Ung thư đại trực tràng',
    gan: 'Ung thư gan',
    'da-day': 'Ung thư dạ dày'
  };

  function co(ds, x) {
    return ds.indexOf(x) !== -1;
  }

  // traLoi: { tuoi: số, gioi: 'nu' | 'nam', dauHieu: bool, giaDinh: [...], banThan: [...] }
  //   giaDinh: 'vu' · 'dai-truc-trang' · 'da-day' · 'gan'
  //   banThan: 'viem-gan-b' · 'viem-gan-c' · 'xo-gan' · 'chua-xn-viem-gan' · 'hp' · 'polyp'
  //            · 'viem-ruot' · 'suy-giam-mien-dich' · 'brca' · 'xa-tri-nguc' · 'thuoc-ruou'
  //            · 'chua-tiem-hpv'
  // Trả về { dauHieu: bool, duoiTuoi: bool, muc: [{ id, nhom, tenNhom, chu, bai }] }.
  function ketQua(traLoi) {
    var tuoi = traLoi.tuoi;
    var nu = traLoi.gioi === 'nu';
    var gd = traLoi.giaDinh || [];
    var bt = traLoi.banThan || [];
    var muc = [];

    function them(id, nhom) {
      muc.push({ id: id, nhom: nhom, tenNhom: TEN_NHOM[nhom], chu: CHU[id], bai: BAI[nhom] });
    }

    if (tuoi < 18) return { dauHieu: !!traLoi.dauHieu, duoiTuoi: true, muc: muc };

    if (nu) {
      var vuNguyCo = co(gd, 'vu') || co(bt, 'brca') || co(bt, 'xa-tri-nguc');
      if (tuoi <= 74 && vuNguyCo) them('V3', 'vu');
      else if (tuoi >= 75) them('V4', 'vu');
      else if (tuoi >= 40) them('V1', 'vu');
      else them('V2', 'vu');

      var sgmd = co(bt, 'suy-giam-mien-dich');
      if (tuoi >= 25 && tuoi <= 65 && sgmd) them('C2', 'co-tu-cung');
      else if (tuoi >= 21 && tuoi <= 65) them('C1', 'co-tu-cung');
      else if (tuoi >= 66) them('C4', 'co-tu-cung');
      if (co(bt, 'chua-tiem-hpv')) them('C3', 'co-tu-cung');
    }

    var ruotNguyCo = co(gd, 'dai-truc-trang') || co(bt, 'polyp') || co(bt, 'viem-ruot');
    if (tuoi <= 75 && ruotNguyCo) them('D2', 'dai-truc-trang');
    else if (tuoi >= 76) them('D3', 'dai-truc-trang');
    else if (tuoi >= 45) them('D1', 'dai-truc-trang');

    var ganNguyCo = co(bt, 'viem-gan-b') || co(bt, 'viem-gan-c') || co(bt, 'xo-gan') || co(gd, 'gan');
    if (ganNguyCo) them('G1', 'gan');
    else if (co(bt, 'chua-xn-viem-gan')) them('G2', 'gan');

    var dayNguyCo = co(bt, 'hp') || co(gd, 'da-day') || co(bt, 'thuoc-ruou');
    if (dayNguyCo) them('DD2', 'da-day');
    else if (tuoi >= 40) them('DD1', 'da-day');

    return { dauHieu: !!traLoi.dauHieu, duoiTuoi: false, muc: muc };
  }

  var api = { ketQua: ketQua, CHU: CHU, BAI: BAI };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else goc.TamSoatQuyTac = api;
})(this);
