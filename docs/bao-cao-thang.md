# Báo cáo tháng

Ngày 1 hàng tháng (~09:17 giờ VN, dự phòng ngày 2), GitHub Actions mở một **issue "Báo cáo tháng MM/YYYY"**
cho tháng vừa xong. Mục đích: tới mốc 3–6 tháng chạy thử có đủ số liệu để quyết định có đẩy
mạnh (mua domain, Google Business Profile, chọn host) hay không.

- Workflow: `.github/workflows/bao-cao-thang.yml`
- Script: `scripts/bao-cao-thang.mjs` · test: `scripts/bao-cao-thang.test.mjs`

## Issue có gì

| Phần | Nguồn | Tự động? |
|---|---|---|
| Bài xuất bản trong tháng | ngày **merge vào `main`** (lịch sử git) | ✓ |
| Facebook: reaction, bình luận, chia sẻ từng bài | Graph API, quyền `pages_read_engagement` | ✓ |
| Facebook: tiếp cận, lượt xem, lượt bấm vào bài | Graph API, quyền **`read_insights`** | ✓ nếu token có quyền |
| Job đăng Facebook: lần lỗi / quá giờ, link log | GitHub Actions API | ✓ |

Bài tính theo **ngày merge**, không theo field `date` (ngày viết). Bài chỉ lên site sau khi
bác sĩ duyệt; bài viết 28/9 mà merge 3/10 thì tính theo `date` sẽ lọt khỏi cả hai báo cáo.
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

Meta đã thay toàn bộ chỉ số "impressions" bằng "views" trên mọi phiên bản API từ
15/11/2025, và còn có thể đổi tiếp. Mỗi cột (`COT_INSIGHTS` trong script) thử vài tên chỉ số
theo thứ tự, lấy cái đầu tiên còn chạy. Cột nào không tên nào chạy thì issue ghi **đúng lý
do**: thiếu quyền `read_insights` (cần lấy lại token), hay Facebook không còn nhận tên đó
(cần sửa danh sách tên trong script). Hai việc khác nhau — đừng lấy lại token khi lý do là
đổi tên.

## Chạy tay

GitHub → **Actions → Báo cáo tháng → Run workflow**, nhập tháng `YYYY-MM` (bỏ trống = tháng
trước). Đã có issue trùng tên thì **không ghi đè** — có thể bạn đã điền tay bảng Umami. Muốn
tạo lại: đổi tên hoặc xoá issue cũ (đóng thôi chưa đủ).

Chạy cho **tháng chưa hết** (vd thử ngay sau khi merge) thì tiêu đề là "Báo cáo tháng MM/YYYY
(tạm tính tới DD/MM)" — khác tên bản đầy đủ, nên không chặn báo cáo thật ngày 1 tháng sau.

Xem trước ở máy mình (không tạo issue, không có số liệu Facebook/job vì thiếu secret):

```bash
node scripts/bao-cao-thang.mjs --thang=2026-09
```

## Lưu ý

- Lịch `schedule` của GitHub **chỉ chạy trên nhánh `main`**, có thể trễ hoặc thỉnh thoảng bỏ
  lượt. Vì vậy có lượt dự phòng ngày 2; đã có issue thì lượt đó tự bỏ qua.
- Repo public mà **60 ngày không có commit nào**, GitHub tự tắt workflow có lịch. Routine
  viết bài hàng tuần giữ repo luôn có hoạt động; nếu dừng viết bài lâu thì vào Actions bật lại.
