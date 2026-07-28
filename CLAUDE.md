# CLAUDE.md

Website giới thiệu **BS.CKI Hạnh Quyên** — chuyên khoa Ung bướu & Chăm sóc giảm nhẹ.
Static site + Eleventy v3 (chỉ cho mục Kiến thức), deploy Vercel tại `bsquyen.vercel.app`.
Domain đã chốt: **bsquyen.com** (chưa mua — khi trỏ xong, chạy checklist đổi domain trong
`docs/website-placeholders-and-deploy-guide.md`).

## Lệnh

- `npm run build` — build Eleventy → `_site/`
- `npm run dev` — dev server có watch
- `python3 -m http.server 8081 -d _site` — preview output đã build

## Cấu trúc

- `index.html` + `css/` + `js/` + `assets/` — **bản chính thức** (phiên bản "Ấm áp"), được index
- `demo/`, `landing-mix/`, `landing-page-bundle/` — bản demo cho khách hàng, gắn `noindex` — **giữ lại, đừng xóa**
- `kien-thuc/*.md` — bài viết Kiến thức; layout ở `_includes/layouts/bai-viet.njk`, partials header/footer dùng chung
- `sitemap.njk` — sitemap tự sinh khi build (bài mới tự vào, kèm lastmod)
- `bsquyen/` — ảnh chân dung bác sĩ

## Quy trình bài viết Kiến thức (QUAN TRỌNG)

- **Viết bài mới: dùng skill `bai-kien-thuc`** (`.claude/skills/bai-kien-thuc/`) — đã mã hoá
  cấu trúc, văn phong, ràng buộc YMYL và script tạo ảnh OG của các bài đã publish.
  Không dùng `/ckm:write:good` cho việc này (tốn >120k token/bài vì fan-out subagent).
- Mục tiêu 50–100 bài, ~2 bài/tháng. **Mỗi bài = 1 PR riêng** → bác sĩ duyệt nội dung trên Vercel preview URL → merge = xuất bản. Không bao giờ merge bài chưa được bác sĩ duyệt.
- Frontmatter bắt buộc: `title`, `description`, `date`; nên có `sources` (E-E-A-T); thêm `updated` khi sửa đáng kể.
- Ảnh minh họa: lưu `assets/kien-thuc/<slug>-N.(svg|jpg)`, alt text rõ nghĩa, nén ≤200KB với ảnh raster; ảnh AI phải chú thích "Ảnh minh họa".
- Nội dung y tế là YMYL: không hứa hẹn kết quả điều trị, không dùng testimonial bệnh nhân (quy định quảng cáo y tế VN — site dùng section "Cam kết đồng hành" thay thế), giọng trấn an, có nguồn tham khảo.

## Thông tin liên hệ chuẩn (single source of truth)

SĐT/Zalo `0776196601` (hiển thị `0776 196 601`) · Email `bsquyen1407@gmail.com` ·
Địa chỉ 297A Bùi Hữu Nghĩa, Phường Gia Định, TP.HCM · Giờ: T2–T6 17:00–19:30, T7–CN 9:00–17:00.
Khi thay đổi: làm theo mục "Thông tin liên hệ chính thức" trong `docs/website-placeholders-and-deploy-guide.md`.

## Git

- Không push thẳng `main` — luôn feature branch + PR, user merge thủ công.
- Conventional commits, không đề cập AI trong message.
