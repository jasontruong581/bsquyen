# Báo cáo tháng

Ngày 1 hàng tháng (~09:00 giờ VN), GitHub Actions mở một **issue "Báo cáo tháng MM/YYYY"**
cho tháng vừa xong. Mục đích: tới mốc 3–6 tháng chạy thử có đủ số liệu để quyết định có đẩy
mạnh (mua domain, Google Business Profile, chọn host) hay không.

- Workflow: `.github/workflows/bao-cao-thang.yml`
- Script: `scripts/bao-cao-thang.mjs` · test: `scripts/bao-cao-thang.test.mjs`

## Issue có gì

| Phần | Nguồn | Tự động? |
|---|---|---|
| Bài mới trong tháng | field `date` của các bài | ✓ |
| Facebook: reaction, bình luận, chia sẻ từng bài | Graph API, quyền `pages_read_engagement` | ✓ |
| Facebook: lượt tiếp cận, lượt bấm vào bài | Graph API, quyền **`read_insights`** | ✓ nếu token có quyền |
| Job đăng Facebook: số lần thành công / lỗi, link log lần lỗi | GitHub Actions API | ✓ |
| Umami: lượt xem, nguồn Facebook / chia sẻ, bấm Gọi / Zalo | dashboard Umami | ✗ **điền tay** (~2 phút) |

Umami phải điền tay vì gói Hobby **không có API**. Điền vào bảng có sẵn trong issue. Issue
là **bản lưu lâu dài** — Umami Hobby chỉ giữ 6 tháng dữ liệu, số liệu đã chép vào issue thì
không mất.

## Thiếu quyền hay lỗi thì sao

Báo cáo **luôn được tạo**. Phần nào không lấy được thì ghi rõ lý do ngay trong issue:

- thiếu secret → "Chưa có secret…"
- token hỏng / hết hạn → nguyên văn lỗi của Facebook
- token chưa có `read_insights` → vẫn có reaction/bình luận/chia sẻ, kèm ghi chú thiếu tiếp cận

Muốn có lượt tiếp cận: chạy lại `node scripts/lay-token-facebook.mjs`, lần này thêm quyền
`read_insights` (vào use case của app trước, rồi vào ô Quyền của Graph API Explorer). Script
sẽ cảnh báo nếu token mới vẫn thiếu quyền này. Chi tiết lấy token: `tu-dong-dang-facebook.md`.

Meta hay đổi tên hoặc khai tử chỉ số insights giữa các phiên bản Graph API, nên script thử
từng chỉ số và chỉ hiện cột nào Facebook còn trả.

## Chạy tay

GitHub → **Actions → Báo cáo tháng → Run workflow**, nhập tháng `YYYY-MM` (bỏ trống = tháng
trước). Đã có issue của tháng đó thì **không ghi đè** — có thể bạn đã điền tay bảng Umami.
Muốn tạo lại: đóng và đổi tên (hoặc xoá) issue cũ trước.

Xem trước ở máy mình (không tạo issue, không có số liệu Facebook/job vì thiếu secret):

```bash
node scripts/bao-cao-thang.mjs --thang=2026-09
```

## Lưu ý

- Lịch `schedule` của GitHub **chỉ chạy trên nhánh `main`**, và có thể trễ vài chục phút.
- Repo public mà **60 ngày không có commit nào**, GitHub tự tắt workflow có lịch. Routine
  viết bài hàng tuần giữ repo luôn có hoạt động; nếu dừng viết bài lâu thì vào Actions bật lại.
