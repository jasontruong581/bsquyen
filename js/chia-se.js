// Nút chia sẻ cuối bài Kiến thức.
//
// Trên điện thoại, nút chính mở bảng chia sẻ của máy (Web Share API) — Zalo, Messenger
// nằm sẵn trong đó, không cần SDK hay tài khoản Zalo OA. Máy không hỗ trợ thì chỉ còn
// nút Facebook và nút sao chép link.
// Link chia sẻ gắn utm_source=chia-se để Umami đếm được lượt đọc nhờ người đọc chia sẻ.
(function () {
  var khoi = document.querySelector('.chia-se');
  var canonical = document.querySelector('link[rel="canonical"]');
  if (!khoi || !canonical) return;

  var url = canonical.href + '?utm_source=chia-se';
  var tieuDe = document.title;
  var nutHeThong = khoi.querySelector('[data-chia-se="he-thong"]');
  var nutFacebook = khoi.querySelector('[data-chia-se="facebook"]');
  var nutSaoChep = khoi.querySelector('[data-chia-se="sao-chep"]');
  var baoDaChep = khoi.querySelector('.chia-se-da-chep');

  function dem(kenh) {
    if (window.umami) window.umami.track('chia-se', { kenh: kenh });
  }

  nutFacebook.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
  nutFacebook.addEventListener('click', function () { dem('facebook'); });

  if (navigator.share) {
    nutHeThong.hidden = false;
    nutHeThong.addEventListener('click', function () {
      navigator
        .share({ title: tieuDe, url: url })
        .then(function () { dem('he-thong'); })
        // Người dùng đóng bảng chia sẻ cũng ra lỗi (AbortError) — không có gì phải xử lý
        .catch(function () {});
    });
  }

  // Clipboard API chỉ có trên HTTPS; thiếu thì ẩn nút thay vì để một nút bấm không ăn
  if (!navigator.clipboard) nutSaoChep.hidden = true;
  nutSaoChep.addEventListener('click', function () {
    navigator.clipboard.writeText(url).then(
      function () {
        baoDaChep.textContent = 'Đã sao chép link bài viết.';
        baoDaChep.hidden = false;
        dem('sao-chep');
      },
      // Trình duyệt từ chối quyền clipboard: vẫn đưa link để người đọc tự chép
      function () {
        baoDaChep.textContent = 'Không sao chép được. Link bài: ' + url;
        baoDaChep.hidden = false;
      }
    );
  });

  khoi.hidden = false;
})();
