# Mở rộng giai đoạn chạy thử (5 phase, 5 PR chờ merge)

**Date**: 2026-09-27 01:23
**Severity**: Medium
**Component**: analytics, trang Kiến thức, bot duyệt PR, báo cáo tháng, công cụ tầm soát
**Status**: Ongoing (code xong, chưa merge, phase 4 chờ bác sĩ)

## What Happened

Code xong plan "mở rộng giai đoạn chạy thử 3–6 tháng" — 5 phase, mỗi phase một PR:

1. **#34** — Umami analytics + track lượt bấm gọi/zalo/mailto/`#dat-lich` (kèm `vi_tri`) + `utm_source=facebook`. Chọn Umami thay Cloudflare (không có custom event) và Vercel Analytics (khoá vào project Vercel, gói Hobby chỉ cho phi thương mại, host có thể đổi).
2. **#35** — tìm kiếm không phân biệt dấu (tự hiện khi >15 bài), mục lục, thời gian đọc, bài liên quan, nút chia sẻ (Web Share API → Zalo không cần OA).
3. **#39** — bot comment tóm tắt duyệt trên PR bài viết (caption khớp file dùng chung `caption-facebook.mjs`, ảnh, trạng thái link nguồn, cảnh báo YMYL) + CI `kiem-tra.yml` chạy `npm test` mọi PR.
4. **#37** — bảng quy tắc công cụ tầm soát, chỉ là docs, chờ bác sĩ duyệt + trả lời 7 câu hỏi; chưa code trang.
5. **#40** — issue báo cáo tháng (số liệu FB, job chạy, bảng Umami thủ công).

Thứ tự merge: #34 → #35 → #39 (nối tiếp, cùng nhánh gốc); #37 và #40 độc lập. Thử gộp cả 5 vào một nhánh: không xung đột, 41/41 test qua.

## The Brutal Truth

Không có gì "chạy được là xong" trong đợt này — gần như mỗi phase đều giấu một lỗi mà chỉ lộ ra khi đo/test đúng cách, không phải khi nhìn qua trình duyệt một lần rồi tự tin merge. Cái ơn huệ duy nhất là tool review + CI bắt được trước khi lên production, chứ không phải bác sĩ hay người đọc thật phát hiện ra.

## Technical Details

- Form đặt lịch không có `method` → mặc định GET, tên/SĐT/nội dung sức khoẻ sẽ lộ ra URL và bị Umami ghi lại. Sửa `method=post`.
- Optional chaining trong `main.js` sẽ làm trắng trang chủ trên iOS cũ.
- `hidden` attribute bị `.btn{display:inline-flex}` đè — người code test lần đầu đọc property `.hidden` (vẫn `true`) thay vì computed style nên không thấy phần tử vẫn hiện. Sửa bằng `[hidden]{display:none!important}` toàn cục.
- TOC bị double-escape `&quot;` trên một bài đã publish.
- Search: fetch index theo từng phím gõ có thể bị race (kết quả cũ đè kết quả mới); input NFD phá match; "đau"/"dấu"/"đầu" gộp lại nếu bỏ dấu nên phải ưu tiên kết quả khớp dấu chính xác trước.
- Bot review gắn cờ ✗ cho 9 bài cũ không có caption; test đếm cảnh báo lại quét luôn bài mới của chính PR đó nên một cảnh báo advisory làm CI đỏ — phát hiện qua PR nháp #38, sửa bằng cách khoá test vào bộ 12 bài đã duyệt cố định.
- Link checker: WHO trả 403 cho bot, moh.gov.vn lỗi `ERR_SSL_DH_KEY_TOO_SMALL` trong Node nhưng mở bình thường trên trình duyệt → tách loại riêng, không gộp chung "chết".
- Meta ngừng hẳn metric "impressions" (thay bằng views, mọi phiên bản API, từ 15/11/2025) → báo cáo sẽ không bao giờ ra số tiếp cận và đổ lỗi sai cho token; sửa để thử tên metric mới, fallback, và nói đúng nguyên nhân.
- Báo cáo tháng đếm bài theo ngày viết trong frontmatter thay vì ngày merge (bài "morphin" viết 14/9, merge 21/9) → đổi qua `git --first-parent` lấy ngày merge thật.
- Chạy thử workflow giữa tháng suýt khoá vĩnh viễn issue báo cáo thật của tháng đó (cùng title, job xanh) → thêm nhãn "(tạm tính tới DD/MM)" cho tháng chưa hết.

## What We Tried

Dùng agent general-purpose với PowerShell + git worktree tách biệt để test/review song song, vì Bash tool bị hỏng hoàn toàn trong session chính lẫn mọi subagent (không có output, lệnh không chạy) và các agent type tester/code-reviewer không có PowerShell.

## Root Cause Analysis

Phần lớn lỗi không phải do thiếu kiến thức mà do kiểm tra hời hợt: đọc property JS thay vì computed style, test tự quét luôn dữ liệu nó vừa tạo ra, giả định ngày viết = ngày xuất bản. Cách khắc phục thực sự chỉ đến khi có review/test độc lập buộc phải nhìn lại từ góc khác.

## Lessons Learned

Khi kiểm tra CSS ẩn/hiện, luôn xem computed style, không tin property JS. Test đo cảnh báo/metric cần cố định corpus, không tự quét dữ liệu PR đang mở. Ngày "merge" và ngày "viết" là hai thứ khác nhau — báo cáo định kỳ phải dùng ngày merge. API bên thứ ba (Meta insights) đổi tên field âm thầm — luôn có fallback + thông báo nguyên nhân thật thay vì đổ lỗi token.

## Next Steps

- Bác sĩ duyệt `docs/quy-tac-cong-cu-tam-soat.md` (PR #37) + trả lời 7 câu hỏi cuối file, rồi mới code `/cong-cu/tam-soat/`.
- Sau khi merge #34: bấm thử nút Gọi trên site thật, xem sự kiện `bam-goi` có lên Umami không.
- Sau khi merge #40: chạy tay workflow báo cáo tháng một lần; đổi lại token Facebook có quyền `read_insights`.
- Sau khi merge #35: đồng bộ scheduled task routine viết bài (bỏ mục "Đọc thêm" cho bài mới); còn 6 bài cũ có "Đọc thêm" trùng với khối bài liên quan mới — chưa quyết xử lý.
- Quyết định Vercel preview protection có nên cho bác sĩ vào xem không (hiện preview yêu cầu đăng nhập Vercel).
