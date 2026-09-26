# Duyệt bài trên PR — comment tóm tắt tự động

Mỗi PR đụng tới `kien-thuc/*.md` hoặc ảnh trong `assets/kien-thuc/` có **một comment
"📋 Tóm tắt duyệt bài"** do GitHub Actions đăng. Đẩy thêm commit thì comment đó được sửa
lại, không đăng comment mới.

- Workflow: `.github/workflows/tom-tat-duyet.yml`
- Script: `scripts/tom-tat-duyet.mjs` · test: `scripts/tom-tat-duyet.test.mjs`
- Caption dựng bằng `scripts/caption-facebook.mjs` — **cùng module** với job đăng Facebook,
  nên thứ bác sĩ đọc trên PR đúng từng chữ với thứ sẽ lên page.

## Comment có gì

1. **Cần xem lại** — thiếu field bắt buộc, tag lạ, thiếu file ảnh (✗); và câu nên liếc lại
   (⚠) kèm đoạn trích:
   - thân bài + caption: hứa hẹn kết quả ("chữa khỏi", "dứt điểm", "100%"…), có vẻ là lời
     chứng thực của người bệnh, giật tít ("chết người", "ai cũng mắc"…)
   - riêng caption: nêu tên bác sĩ, có số điện thoại / Zalo / địa chỉ, có link hay hashtag
     (script tự nối), dài ngoài 400–700 ký tự, câu mở dài quá 125 ký tự
2. **Bài đăng Facebook** — caption hoàn chỉnh, và đoạn người đọc thấy trước "Xem thêm".
   Bài đã xuất bản thì bỏ phần này (sửa bài không đăng lại).
3. **Ảnh** — ảnh Facebook, ảnh OG, thumbnail, hiện thẳng trong comment.
4. **Nguồn tham khảo** — tình trạng từng link:
   - ✓ còn sống · ↪ chuyển hướng (kèm địa chỉ mới) · ✗ lỗi (404, không kết nối được…)
   - ⚠ **trang chặn kiểm tra tự động** (401/403/429): WHO, nhiều trang y tế chặn bot — mở tay
   - ⚠ **cấu hình SSL cũ phía trang**: vd `moh.gov.vn` dùng khoá DH quá yếu, Node từ chối
     nhưng trình duyệt vẫn mở được — mở tay
5. **Bác sĩ xác nhận** — checklist ngắn.

**Cảnh báo chỉ để gợi ý, không bao giờ chặn merge.** Bộ quy tắc cố ý bắt rộng: chạy qua
12 bài đã duyệt thì chỉ có 1 cảnh báo ("điều trị dứt điểm vi khuẩn HP" — thuật ngữ hợp lệ).
Báo nhầm một câu còn hơn sót một lời hứa hẹn điều trị.

## Chạy tay

```bash
node scripts/tom-tat-duyet.mjs --files=kien-thuc/<slug>.md                  # in Markdown ra màn hình
node scripts/tom-tat-duyet.mjs --files=kien-thuc/<slug>.md --khong-kiem-link  # không gọi mạng
```

## Sửa bộ quy tắc

Regex nằm ở đầu `scripts/tom-tat-duyet.mjs` (`MAU_THAN_BAI`, `MAU_CAPTION`). Thêm mẫu thì
thêm cả test trong `scripts/tom-tat-duyet.test.mjs`. Có một test chạy qua **mọi bài đã
xuất bản** và phải không ra lỗi — thêm mẫu làm bài cũ ra lỗi nghĩa là mẫu quá rộng.

## An toàn

Dùng sự kiện `pull_request` (không phải `pull_request_target`), quyền chỉ `contents: read`
và `pull-requests: write`: code của PR chạy mà không đọc được secret nào, kể cả token
Facebook.
