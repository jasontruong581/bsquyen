# Phase 2 — Trang Kiến thức dễ đọc, dễ lan truyền

## Việc

1. **Tìm kiếm không dấu** trên `/kien-thuc/`: chỉ mục JSON sinh lúc build (tiêu đề,
   mô tả, tag), so khớp sau khi bỏ dấu cả hai phía (NFD + bỏ dấu + `đ`→`d` + chữ thường).
   Ô tìm kiếm **chỉ hiện khi vượt 15 bài** — ngưỡng đã đặt ở
   `docs/thiet-lap-workstation.md`.
2. **Bài liên quan** cuối bài: 3 bài cùng tag, mới nhất trước; thiếu thì bù bằng bài mới nhất.
3. **Mục lục** cho bài có từ 4 mục `##` trở lên; **thời gian đọc** cạnh ngày đăng.
4. **Nút chia sẻ**: điện thoại dùng Web Share API (bảng chia sẻ của máy, có Zalo);
   máy tính có nút Facebook + sao chép link. Không SDK bên thứ ba.
5. Sự kiện Umami: `tim-kiem` (không gửi nội dung gõ, chỉ số kết quả), `chia-se`.

## Tiêu chí

- Gõ "ung thu da day" ra bài "ung thư dạ dày"; gõ "đ" và "d" như nhau.
- Hiện có 12 bài → ô tìm kiếm chưa hiện; giả lập >15 bài thì hiện.
- Bài liên quan không bao giờ chứa chính bài đang đọc.
- Lighthouse không tụt điểm; trang vẫn đọc được khi tắt JavaScript.
