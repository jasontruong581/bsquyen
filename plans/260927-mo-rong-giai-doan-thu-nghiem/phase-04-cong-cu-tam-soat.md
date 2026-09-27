# Phase 4 — Công cụ "Tôi nên tầm soát gì?"

## Việc

1. **Bảng quy tắc trước, code sau.** Soạn `docs/quy-tac-cong-cu-tam-soat.md`: tuổi, giới,
   tiền sử (gia đình, viêm gan B/C, hút thuốc…) → loại tầm soát nên bàn với bác sĩ, mỗi
   dòng dẫn nguồn — lấy từ hướng dẫn đã trích trong các bài tầm soát.
   **Mở PR riêng cho bảng này để bác sĩ duyệt.**
2. Sau khi bảng được duyệt: trang `/cong-cu/tam-soat/`, mục menu mới **"Công cụ"** trên
   header (site chính + partial header của mục Kiến thức).
3. Kết quả: danh sách tầm soát nên hỏi bác sĩ + link bài liên quan + mời nhắn Zalo.
4. Chạy hoàn toàn trên trình duyệt. **Câu trả lời không gửi đi đâu**, kể cả Umami —
   Umami chỉ nhận sự kiện "đã dùng công cụ".
5. Dòng miễn trừ rõ ràng: không chẩn đoán, không thay thế thăm khám.

## Tiêu chí

- Mọi kết quả truy được về một dòng trong bảng quy tắc đã duyệt.
- Không có request mạng nào chứa câu trả lời (kiểm bằng tab Network).
- Trang công cụ được index; kết quả chỉ hiện tại chỗ, không sinh URL riêng theo câu trả lời
  (URL chứa tuổi/tiền sử sẽ lọt vào lịch sử trình duyệt và log).

## Phụ thuộc

Bác sĩ duyệt bảng quy tắc. Chưa duyệt thì không code phần 2–5.
