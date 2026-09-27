# Duyệt bài trên PR — comment tóm tắt tự động

Mỗi PR đụng tới `kien-thuc/*.md` hoặc ảnh trong `assets/kien-thuc/` có **một comment
"📋 Tóm tắt duyệt bài"** do GitHub Actions đăng. Đẩy thêm commit thì comment đó được sửa
lại, không đăng comment mới.

- Workflow: `.github/workflows/tom-tat-duyet.yml`
- Script: `scripts/tom-tat-duyet.mjs` · test: `scripts/tom-tat-duyet.test.mjs`
- Caption dựng bằng `scripts/caption-facebook.mjs` — **cùng module** với job đăng Facebook,
  nên thứ bác sĩ đọc trên PR đúng từng chữ với thứ sẽ lên page.

## Comment có gì

1. **Cần xem lại** — thiếu field bắt buộc, tag lạ, thiếu file ảnh, frontmatter hỏng (✗); và
   câu nên liếc lại (⚠) kèm đoạn trích, mỗi loại một dòng:
   - tiêu đề + mô tả + thân bài + caption: hứa hẹn kết quả ("chữa khỏi", "dứt điểm",
     "100%"…), có vẻ là lời chứng thực của người bệnh, giật tít ("chết người", "ai cũng
     mắc"…), liều thuốc ("10 mg"), giá tiền / khuyến mãi ("1.500.000 đồng", "giảm giá")
   - riêng caption: nêu tên bác sĩ (cả "BS Quyên", "BS.CK1", "Hanh Quyen"…), có số điện
     thoại / Zalo / địa chỉ, có link hay hashtag (script tự nối), dài ngoài 400–700 ký tự,
     câu mở dài quá 125 ký tự
   - bài chưa có nguồn tham khảo
2. **Bài đăng Facebook** — caption hoàn chỉnh, 125 ký tự đầu người đọc thấy trước "Xem
   thêm", và giờ hẹn đăng (đọc từ `GIO_DANG` trong workflow đăng, nên không nói sai khi đổi giờ).
3. **Ảnh** — ảnh Facebook, ảnh OG, thumbnail, hiện thẳng trong comment. File chưa có thì hiện "—".

**Bài đã xuất bản** (có sẵn trên nhánh gốc) thì bỏ mọi thứ về Facebook — sửa bài không đăng
lại, và các bài xuất bản trước khi có job Facebook vốn không có caption hay ảnh Facebook.
PR đụng hơn 8 bài (vd tạo lại toàn bộ ảnh OG) thì 8 bài đầu trình bày đầy đủ, còn lại gom
thành danh sách ngắn — comment GitHub tối đa 65 536 ký tự.
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

Regex nằm ở đầu `scripts/tom-tat-duyet.mjs` (`MAU_NOI_DUNG`, `MAU_CAPTION`). Thêm mẫu thì
thêm cả test trong `scripts/tom-tat-duyet.test.mjs`.

Một test chạy qua **tập cố định 12 bài bác sĩ đã duyệt** (`BAI_DA_DUYET` trong file test)
và khoá số cảnh báo ở mức đã biết (hiện là 1). Nới mẫu mà con số tăng → mẫu đang bắt nhầm
bài đã duyệt → thu hẹp lại. Test chạy tự động trên mọi PR (`.github/workflows/kiem-tra.yml`).

Tập bài là **cố định chứ không quét mọi file** trong `kien-thuc/`, có chủ đích: nếu quét cả
bài mới của PR, bài mới nào có một câu bị cảnh báo cũng làm CI đỏ — cảnh báo "chỉ để gợi ý"
thành chặn merge. Bài mới đã có comment của bot lo.

Tránh bắt chữ trơn dễ nhầm: "giá" (dính "giá trị", "đánh giá"), "chi phí" ("chi phí thấp"),
"quyên" ("quyên góp"), "triệu"/"nghìn" không kèm đơn vị tiền (số liệu thống kê).

## An toàn

Dùng sự kiện `pull_request` (không phải `pull_request_target`), quyền chỉ `contents: read`
và `pull-requests: write`: code của PR chạy mà không đọc được secret nào, kể cả token
Facebook.
