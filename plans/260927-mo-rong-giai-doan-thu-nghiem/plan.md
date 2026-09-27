# Mở rộng giai đoạn chạy thử (3–6 tháng)

**Trạng thái:** đang làm · **Mở:** 27/09/2026

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

| # | Phase | Trạng thái | Phụ thuộc | File |
|---|---|---|---|---|
| 1 | Đo lường: Umami + lượt bấm Gọi/Zalo + UTM | chưa làm | Website ID (đã có) | [phase-01](phase-01-do-luong.md) |
| 2 | Trang Kiến thức: tìm kiếm, bài liên quan, mục lục, chia sẻ | chưa làm | — | [phase-02](phase-02-trang-kien-thuc.md) |
| 3 | Bot tóm tắt duyệt trên PR bài viết | chưa làm | — | [phase-03](phase-03-bot-duyet-pr.md) |
| 4 | Công cụ "Tôi nên tầm soát gì?" | chưa làm | **Bác sĩ duyệt bảng quy tắc** | [phase-04](phase-04-cong-cu-tam-soat.md) |
| 5 | Báo cáo tháng | chưa làm | Phase 1; token FB có `read_insights` | [phase-05](phase-05-bao-cao-thang.md) |

## Tiêu chí hoàn thành chung

- Số liệu Umami chỉ đến từ site thật (không lẫn preview, localhost, bản demo).
- Biết được **bài nào / vị trí nào** khiến người đọc bấm Gọi hoặc Zalo.
- Mỗi tháng có một báo cáo lưu lại (issue GitHub), đủ để so sánh ở mốc 3–6 tháng.
