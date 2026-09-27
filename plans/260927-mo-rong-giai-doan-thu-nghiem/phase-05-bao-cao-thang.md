# Phase 5 — Báo cáo tháng

## Việc

GitHub Action chạy **ngày 1 hàng tháng** (và chạy tay được), mở một issue:

1. **Facebook** (Graph API, quyền `read_insights`): mỗi bài đăng trong tháng — lượt
   tiếp cận, tương tác, lượt bấm link.
2. **Nội dung**: số bài xuất bản trong tháng, job đăng Facebook nào lỗi.
3. **Umami**: gói Hobby không có API → issue có sẵn bảng trống (lượt xem, người xem, bấm
   Gọi, bấm Zalo, nguồn Facebook) để user điền từ dashboard, ~2 phút.

Issue là bản lưu lâu dài — Umami Hobby chỉ giữ 6 tháng dữ liệu.

## Tiêu chí

- Chạy tay ra issue đúng mẫu với tháng hiện tại.
- Token thiếu `read_insights` → issue vẫn được tạo, phần Facebook ghi rõ lý do thiếu
  thay vì job fail.

## Phụ thuộc

Phase 1 đã chạy. User lấy lại token Facebook có thêm `read_insights`.
