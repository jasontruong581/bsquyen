# Routine viết bài Kiến thức — bản gốc

Đây là **bản gốc (source of truth)** của prompt routine tự động viết bài.
Routine thật nằm ngoài repo, ở `~/.claude/scheduled-tasks/viet-bai-kien-thuc-bsquyen/SKILL.md`
trên máy đang chạy Claude Desktop.

**Đổi máy / cài lại:** không cần copy dotfile. Mở Claude Code trong repo này rồi nói:

> Tạo scheduled task hàng tuần (sáng thứ Hai) từ `docs/routine-viet-bai.md`,
> thay `<ĐƯỜNG-DẪN-REPO>` bằng đường dẫn repo trên máy này.

**Sửa routine:** sửa file này trước, rồi cập nhật scheduled task cho khớp. Nếu chỉ sửa
scheduled task mà không sửa file này thì lần đổi máy sau sẽ mất thay đổi đó.

Cấu hình: `cronExpression: 7 9 * * 1` · `taskId: viet-bai-kien-thuc-bsquyen` ·
`notifyOnCompletion: true`

---
Viết một bài mới cho mục Kiến thức của website BS.CKI Hạnh Quyên, rồi mở Pull Request. Làm tuần tự các bước dưới đây, KHÔNG bỏ bước 0.

Repo: <ĐƯỜNG-DẪN-REPO>

## BƯỚC 0 — CỔNG CHẶN (làm trước tiên, bắt buộc)

```bash
cd <ĐƯỜNG-DẪN-REPO> && git checkout main && git pull --ff-only
gh pr list --state open --json number,title
```

**Nếu đang có PR bài viết mở chờ duyệt** (tiêu đề chứa "bài Kiến thức"): DỪNG NGAY, không viết bài. Báo: "Còn PR #<số> chờ bác sĩ duyệt — bỏ lượt tuần này để không dồn PR."

Đây là cổng duy nhất và là chủ ý thiết kế: nút thắt của quy trình là bác sĩ duyệt, không phải tốc độ viết. Nhờ cổng này, tốc độ ra bài tự khớp tốc độ duyệt — tối đa 1 bài/tuần, và không bao giờ có 2 PR bài viết cùng chờ.

Không cần kiểm tra khoảng cách ngày giữa các bài. Lịch cron đã giới hạn 1 lần/tuần.

## BƯỚC 1 — CHỌN CHỦ ĐỀ

Đọc `docs/chu-de-bai-viet.md`.

- Lấy chủ đề ĐẦU TIÊN trong mục "Hàng đợi" mà file `kien-thuc/<slug>.md` chưa tồn tại.
- **Ngoại lệ mùa**: nếu trong hàng đợi có chủ đề gắn nhãn `(mùa: tháng N)` và tháng hiện tại đúng bằng N, ưu tiên chủ đề đó trước, bất kể vị trí.
- Dùng đúng `slug` đã ghim trong file, KHÔNG tự tạo slug mới từ tiêu đề.
- Tuyệt đối không lấy chủ đề từ mục "Cần xử lý riêng" hay "Backlog" — những mục đó chưa sẵn sàng viết.
- Nếu file `docs/chu-de-bai-viet.md` không tồn tại, hoặc hàng đợi đã hết: DỪNG và báo lại, không tự bịa chủ đề.

## BƯỚC 2 — VIẾT BÀI

Gọi skill `bai-kien-thuc` (`.claude/skills/bai-kien-thuc/SKILL.md`) và tuân thủ đầy đủ:
khung bài theo đúng cột "Loại" (A/B/C) trong hàng đợi, văn phong, ràng buộc YMYL, và checklist cuối skill.

Lưu ý riêng cho lần chạy tự động này:
- Không có ai giám sát, nên **đừng cắt việc xác minh số liệu y khoa** để tiết kiệm token. Con số nào không tìm được nguồn uy tín thì diễn đạt định tính, đừng đoán.
- Vẫn phải Read file PNG của ảnh minh họa và ảnh OG để tự kiểm tra hình có rõ nghĩa, chữ không tràn.
- **Liên kết nội bộ**: chạy `ls kien-thuc/` xem đã có bài nào liên quan; chèn 2–3 link nội bộ tới các bài đó ở chỗ tự nhiên trong bài (hoặc mục "Đọc thêm" cuối bài, trước blockquote kết). Đây là việc rẻ mà tăng cả SEO lẫn trải nghiệm đọc.

## BƯỚC 3 — MỞ PR

Theo bước 6 của skill: feature branch `feat/bai-<slug>`, conventional commit, push, `gh pr create`.

**TUYỆT ĐỐI KHÔNG merge.** Bác sĩ duyệt nội dung trên Vercel preview URL rồi user tự merge. PR body phải có dòng "⚠️ Chờ bác sĩ duyệt nội dung trước khi merge".

## BƯỚC 4 — BÁO CÁO

Báo ngắn gọn: chủ đề đã viết, link PR, số token đã dùng, và bất kỳ điều gì cần user quyết (ví dụ số liệu không tìm được nguồn, hoặc chủ đề vướng ràng buộc YMYL).