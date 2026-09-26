# Mở rộng giai đoạn chạy thử (3–6 tháng)

**Trạng thái:** code xong cả 5 phase, chờ merge · phase 4 chờ bác sĩ duyệt bảng quy tắc · **Mở:** 27/09/2026

## Mục tiêu

Trong giai đoạn chạy thử, có **số liệu thật** để quyết định có đẩy mạnh hay không
(mua domain, Google Business Profile, chọn host), đồng thời làm trang Kiến thức dễ
đọc, dễ lan truyền, và giảm tải khâu duyệt bài của bác sĩ.

## Ràng buộc

- **Miễn phí.** Không dùng dịch vụ tính phí (đã loại Zalo OA, video AI trả phí).
- Nội dung y tế là YMYL — mọi thứ hiển thị cho người đọc tuân theo ràng buộc trong
  skill `bai-kien-thuc`.
- **Không thu dữ liệu sức khoẻ cá nhân.** Công cụ tầm soát chạy hoàn toàn trên máy
  người dùng; analytics không nhận câu trả lời của họ.
- Không phụ thuộc host: có thể chuyển khỏi Vercel ở mốc 3–6 tháng (gói Hobby chỉ cho
  dùng phi thương mại) mà không mất dữ liệu.
- Mỗi phase = 1 PR, user merge.

## Ngoài phạm vi

Zalo OA · tài liệu in cho người chăm bệnh · video ngắn (user thử tay trước) ·
domain + Google Business Profile + đổi host (quyết ở mốc 3–6 tháng).

## Các phase

| # | Phase | Trạng thái | PR | Phụ thuộc | File |
|---|---|---|---|---|---|
| 1 | Đo lường: Umami + lượt bấm Gọi/Zalo + UTM | ✅ xong, chờ merge | #34 | — | [phase-01](phase-01-do-luong.md) |
| 2 | Trang Kiến thức: tìm kiếm, bài liên quan, mục lục, chia sẻ | ✅ xong, chờ merge | #35 | #34 | [phase-02](phase-02-trang-kien-thuc.md) |
| 3 | Bot tóm tắt duyệt trên PR bài viết | ✅ xong, chờ merge | #39 | #35 | [phase-03](phase-03-bot-duyet-pr.md) |
| 4 | Công cụ "Tôi nên tầm soát gì?" | ⏸ bước 1 xong (bảng quy tắc) — **chờ bác sĩ duyệt** rồi mới code | #37 | bác sĩ duyệt | [phase-04](phase-04-cong-cu-tam-soat.md) |
| 5 | Báo cáo tháng | ✅ xong, chờ merge | #40 | độc lập; cột tiếp cận cần token có `read_insights` | [phase-05](phase-05-bao-cao-thang.md) |

**Thứ tự merge:** #34 → #35 → #39 (nối tiếp nhau; GitHub tự đổi base về `main` khi PR trước
được merge). #37 và #40 độc lập, merge lúc nào cũng được. Đã thử gộp cả 5 vào một nhánh tạm:
không xung đột, build sạch, 41/41 test.

## Việc còn lại

- **Phase 4:** bác sĩ duyệt `docs/quy-tac-cong-cu-tam-soat.md` (PR #37) và trả lời 7 câu hỏi
  cuối file → code trang `/cong-cu/tam-soat/` + mục menu "Công cụ", mỗi quy tắc một test.
- **Sau khi merge #34:** bấm thử nút Gọi trên site thật, xem sự kiện `bam-goi` trong Umami.
- **Sau khi merge #40:** chạy tay workflow "Báo cáo tháng" một lần; lấy lại token Facebook có
  `read_insights`.
- **Sau khi merge #35:** đồng bộ scheduled task routine với `docs/routine-viet-bai.md` (bỏ
  mục "Đọc thêm" cho bài mới).

## Tiêu chí hoàn thành chung

- Số liệu Umami chỉ đến từ site thật (không lẫn preview, localhost, bản demo).
- Biết được **bài nào / vị trí nào** khiến người đọc bấm Gọi hoặc Zalo.
- Mỗi tháng có một báo cáo lưu lại (issue GitHub), đủ để so sánh ở mốc 3–6 tháng.
