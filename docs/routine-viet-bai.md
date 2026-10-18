# Routine viết bài Kiến thức — bản gốc

Đây là **bản gốc (source of truth)** của prompt routine tự động viết bài.

Routine chạy trên **cloud** (Claude Code routines), không phụ thuộc máy nào bật:
<https://claude.ai/code/routines/trig_01KEKMjeM9eDcjDZ2ezD4VSe>

Cấu hình: `cron_expression: 7 2 * * 1` (UTC = **9:07 sáng thứ Hai giờ VN**) · repo
`jasontruong581/bsquyen` · tools: Bash, Read, Write, Edit, Glob, Grep, WebSearch, WebFetch.
Kết quả mỗi lượt: một PR "feat: bài Kiến thức — …", hoặc log "bỏ lượt" xem ở trang routine.

**Sửa routine:** sửa file này trước, rồi nhờ Claude Code cập nhật routine cho khớp ("cập
nhật routine viết bài trên cloud theo `docs/routine-viet-bai.md`"). Tạm dừng / xoá: trang
routine ở trên.

*(Trước 18/10/2026 routine là scheduled task trên Claude Desktop của máy cũ — đã tắt. Đừng
bật lại song song với bản cloud: hai nơi cùng chạy lúc 9:07 thì cổng chặn không kịp chặn.)*

---
Viết một bài mới cho mục Kiến thức của website BS.CKI Hạnh Quyên (repo jasontruong581/bsquyen, đã được checkout sẵn ở thư mục làm việc), rồi mở Pull Request. Làm tuần tự các bước dưới đây, KHÔNG bỏ bước 0. Bạn đang chạy trên cloud, không có ai giám sát.

## BƯỚC 0 — CỔNG CHẶN (bắt buộc, làm trước tiên)

```bash
git checkout main && git pull --ff-only
gh pr list --repo jasontruong581/bsquyen --state open --json number,title
```

Nếu `gh` không có hoặc chưa đăng nhập, dùng GitHub API công khai: `curl -s 'https://api.github.com/repos/jasontruong581/bsquyen/pulls?state=open'` và đọc trường `title`.

**Nếu đang có PR mở mà tiêu đề chứa "bài Kiến thức"**: DỪNG NGAY, không viết bài. Báo: "Còn PR #<số> chờ bác sĩ duyệt — bỏ lượt tuần này để không dồn PR."

Đây là chủ ý thiết kế: nút thắt là bác sĩ duyệt, không phải tốc độ viết — tối đa 1 bài/tuần và không bao giờ có 2 PR bài viết cùng chờ.

## BƯỚC 1 — CHỌN CHỦ ĐỀ

Đọc `docs/chu-de-bai-viet.md`.
- Lấy chủ đề ĐẦU TIÊN trong mục "Hàng đợi" mà file `kien-thuc/<slug>.md` chưa tồn tại.
- **Ngoại lệ mùa**: chủ đề gắn nhãn `(mùa: tháng N)` mà tháng hiện tại (giờ Việt Nam) đúng bằng N thì ưu tiên trước.
- Dùng đúng `slug` đã ghim, KHÔNG tự tạo slug mới.
- Không lấy chủ đề từ mục "Cần xử lý riêng" hay "Backlog".
- File không tồn tại hoặc hàng đợi hết: DỪNG và báo lại, không tự bịa chủ đề.

## BƯỚC 2 — VIẾT BÀI

Chạy `npm ci` (hoặc `npm install`) trước — các script tạo ảnh cần `@resvg/resvg-js`.

Đọc kỹ `CLAUDE.md` và **toàn bộ** `.claude/skills/bai-kien-thuc/SKILL.md`, rồi làm đúng theo skill: khung bài theo cột "Loại" (A/B/C) trong hàng đợi, văn phong, ràng buộc YMYL, frontmatter bắt buộc (gồm `thumb`, `facebook`), ảnh minh họa, ảnh OG, ảnh Facebook `assets/kien-thuc/<slug>-fb.png`, và checklist cuối skill.

Lưu ý:
- **Đừng cắt việc xác minh số liệu y khoa** để tiết kiệm token. Dùng WebSearch/WebFetch tìm nguồn uy tín (WHO, Bộ Y tế, hiệp hội chuyên khoa, bài báo y khoa). Con số nào không tìm được nguồn thì diễn đạt định tính, đừng đoán.
- Read file PNG của ảnh minh họa, ảnh OG và ảnh Facebook để tự kiểm tra hình rõ nghĩa, chữ không tràn.
- **Liên kết nội bộ**: `ls kien-thuc/` xem bài liên quan; chèn 2–3 link nội bộ ở chỗ tự nhiên trong thân bài. **Không** thêm mục "Đọc thêm" cuối bài (layout đã tự sinh "Bài liên quan").
- Caption `facebook:` và ảnh Facebook **không nêu tên bác sĩ**.
- `npm run build` phải sạch, `npm test` phải đạt.

## BƯỚC 3 — MỞ PR

Trước khi commit, **dọn hàng đợi trong cùng PR**: trong `docs/chu-de-bai-viet.md`, xoá dòng vừa viết khỏi bảng "Hàng đợi" và thêm vào cuối bảng "Đã xuất bản" (2 cột: slug, chủ đề).

Feature branch `feat/bai-<slug>`, conventional commit (không nhắc tới AI, không thêm dòng Co-Authored-By), `git add` gồm bài, ảnh `assets/kien-thuc/<slug>-*` và `docs/chu-de-bai-viet.md`. Push rồi tạo PR vào `main`:

`gh pr create --base main --title "feat: bài Kiến thức — <Tiêu đề>" --body "..."`

Tiêu đề PR **phải chứa** "bài Kiến thức" (cổng chặn bước 0 dựa vào đó). PR body tóm tắt bài, liệt kê nguồn, nêu điểm cần bác sĩ chú ý, KHÔNG có dòng "Generated with Claude Code", và phải có dòng "⚠️ Chờ bác sĩ duyệt nội dung trước khi merge". Nếu không tạo được PR bằng `gh`, dùng công cụ tạo PR có sẵn trong môi trường; vẫn không được thì push nhánh và báo link `https://github.com/jasontruong581/bsquyen/compare/main...feat/bai-<slug>?expand=1`.

**TUYỆT ĐỐI KHÔNG merge, không push thẳng vào main.** Bác sĩ duyệt trên Vercel preview rồi chủ repo tự merge.

## BƯỚC 4 — BÁO CÁO

Báo ngắn gọn: chủ đề đã viết, link PR, và điều gì cần chủ repo quyết (số liệu không tìm được nguồn, chủ đề vướng YMYL…).
