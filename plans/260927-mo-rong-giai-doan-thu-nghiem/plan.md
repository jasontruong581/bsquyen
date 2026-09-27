# Mở rộng giai đoạn chạy thử (3–6 tháng)

**Trạng thái:** phase 1, 2, 3, 5 đã merge · phase 4: bảng quy tắc đã duyệt (#37), công cụ chờ bác sĩ duyệt trên PR · **Mở:** 27/09/2026

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
| 1 | Đo lường: Umami + lượt bấm Gọi/Zalo + UTM | ✅ merged | #34 | — | [phase-01](phase-01-do-luong.md) |
| 2 | Trang Kiến thức: tìm kiếm, bài liên quan, mục lục, chia sẻ | ✅ merged | #35 | #34 | [phase-02](phase-02-trang-kien-thuc.md) |
| 3 | Bot tóm tắt duyệt trên PR bài viết | ✅ merged | #39 | #35 | [phase-03](phase-03-bot-duyet-pr.md) |
| 4 | Công cụ "Tôi nên tầm soát gì?" | 🔄 bảng quy tắc merged (#37); công cụ code xong, **chờ bác sĩ duyệt** trên PR `feat/cong-cu-tam-soat` | #37 + PR mới | bác sĩ duyệt | [phase-04](phase-04-cong-cu-tam-soat.md) |
| 5 | Báo cáo tháng | ✅ merged | #40 | cột tiếp cận cần token có `read_insights` | [phase-05](phase-05-bao-cao-thang.md) |

## Việc còn lại

- **Phase 4:** bác sĩ thử công cụ trên preview và trả lời các câu hỏi nội dung trong PR
  (lối cấp cứu ở R0, giới hạn tuổi C3, người dưới 18 đang theo dõi bệnh gan…).
- **User:** bấm thử nút Gọi trên site thật, xem sự kiện `bam-goi` trong Umami.
- **User:** lấy lại token Facebook có `read_insights`, rồi chạy tay workflow "Báo cáo tháng".
- ~~Đồng bộ scheduled task routine (bỏ "Đọc thêm")~~ — xong 27/09.

## Tiêu chí hoàn thành chung

- Số liệu Umami chỉ đến từ site thật (không lẫn preview, localhost, bản demo).
- Biết được **bài nào / vị trí nào** khiến người đọc bấm Gọi hoặc Zalo.
- Mỗi tháng có một báo cáo lưu lại (issue GitHub), đủ để so sánh ở mốc 3–6 tháng.
