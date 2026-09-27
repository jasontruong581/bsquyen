# Phase 1 — Đo lường

## Việc

1. Gắn script Umami (Hobby, Website ID `49f61013-fee7-4dcd-9387-41591119e827`) vào
   các trang chính thức: `index.html`, `_includes/layouts/bai-viet.njk`,
   `kien-thuc/index.njk`, `kien-thuc/chu-de.njk`. **Không** gắn vào `demo/`,
   `landing-mix/`, `landing-page-bundle/`.
2. `data-domains="bsquyen.vercel.app"` — chỉ đếm site thật; preview Vercel (bác sĩ duyệt
   bài) và localhost không bị tính.
3. Đo lượt bấm bằng một listener dùng chung (`js/do-luong.js`), tự bắt mọi link
   `tel:`, `zalo.me`, `#dat-lich` — thêm nút mới sau này không phải nhớ gắn tay.
   Mỗi sự kiện kèm `vi_tri` (header, thanh nhanh, cuối bài, footer, section trang chủ).
4. Form đặt lịch: sự kiện khi soạn xong và khi chọn kênh gửi (Zalo / email).
5. Link trong caption Facebook thêm `?utm_source=facebook`.
6. Docs: sự kiện nào nghĩa là gì, xem ở đâu; thêm Umami vào checklist đổi domain.

## Tiêu chí

- Mở site thật, bấm Gọi/Zalo → thấy sự kiện trong dashboard Umami kèm `vi_tri`.
- Preview Vercel và localhost không gửi gì lên Umami.
- Script bị chặn (adblock) thì các nút vẫn hoạt động bình thường.
- `npm run build`, `npm test` sạch.

## Rủi ro

Umami Hobby chỉ 1 website → đổi domain thì **sửa domain** trong Umami, không thêm mới.
