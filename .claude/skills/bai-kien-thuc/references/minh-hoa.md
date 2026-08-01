# Ảnh minh họa — palette & layout đã dùng

Rút từ 4 file SVG của các bài đã publish (`tam-soat-ung-thu-dai-truc-trang-1/-2`,
`tam-soat-ung-thu-da-day-1/-2`). Chép layout gần nhất rồi đổi hình/chữ —
đừng thiết kế lại từ đầu.

## Palette (không đổi màu ngoài danh sách này)

| Vai trò | Mã |
|---|---|
| Nền ảnh minh họa | `#fff9f4` |
| Khối trang trí ấm (góc phải dưới) | `#fdeee2` |
| Khối trang trí lạnh (góc trái trên) | `#e8f1fa` |
| Cơ quan/giải phẫu (fill) | `#f2a56e` |
| Nét viền cơ quan | `#e08b4f` |
| Lòng ống/khoang rỗng | `#fdeee2` |
| Cam thương hiệu (tổn thương, nhấn) | `#f26e21` |
| Cam đậm (nét viền vật nhấn) | `#d85a10` |
| Điểm sáng (highlight nhỏ) | `#ffd9bd` |
| Navy (dụng cụ, chữ tiêu đề) | `#123b63` |
| Chữ phụ | `#5b6b7b` |
| Viền thẻ | `#ecdfd3` |
| Trắng | `#ffffff` |

Nền OG (chỉ dùng cho ảnh og): gradient `#173f66` → `#0e2c49`, khối `#1c4a76`,
chữ phụ `#9fb6cc` / `#c9d7e5`, nhấn `#f2a56e`.

## Quy ước chung

- Thẻ mở: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="..." role="img" aria-label="<mô tả>">`
- SVG có chữ: thêm `font-family="'Be Vietnam Pro', system-ui, sans-serif"` trên thẻ `<svg>`
- Không dùng ảnh raster, không nhúng font, không script — chỉ shape + text
- Comment tiếng Việt trong SVG để lần sau sửa nhanh
- Kèm `width`/`height` trong `<img>` khớp `viewBox` để tránh layout shift

## Layout A — ảnh khái niệm, `viewBox="0 0 760 440"`

Dùng cho ảnh 1 (hero): giải phẫu + dụng cụ + tổn thương được phát hiện.

```
Khung nền:
  <rect width="760" height="440" fill="#fff9f4"/>
  <circle cx="690" cy="380" r="110" fill="#fdeee2"/>
  <circle cx="70" cy="65" r="80" fill="#e8f1fa"/>

Cơ quan: path fill="#f2a56e" stroke="#e08b4f" stroke-width="4" stroke-linejoin="round"
Lòng cơ quan: path fill="#fdeee2" (nhỏ hơn, nằm trong)
Nếp niêm mạc: <g stroke="#f2a56e" stroke-width="6" stroke-linecap="round" opacity=".55" fill="none">
Dụng cụ (ống soi): stroke="#123b63" stroke-width="14" stroke-linecap="round"
Chùm sáng: <path fill="#ffd9bd" opacity=".85"/>  (tam giác từ đầu dụng cụ tới tổn thương)
Tổn thương: <circle r="15" fill="#f26e21" stroke="#d85a10" stroke-width="5"/>
            + <circle r="4" fill="#ffd9bd"/> lệch trên-trái làm highlight
Huy hiệu dấu tích góc phải trên:
  <circle cx="640" cy="105" r="36" fill="#f26e21"/>
  <path d="M623 105 l13 13 l23 -26" fill="none" stroke="#fff" stroke-width="8"
        stroke-linecap="round" stroke-linejoin="round"/>
```

Bẫy đã gặp: **đặt chùm sáng TRƯỚC tổn thương** trong thứ tự vẽ, nếu không tam giác
sáng sẽ phủ lên tổn thương. Và giữ dụng cụ cách tổn thương một khoảng — vẽ chồng
lên nhau thì người xem không đọc được là "đang soi thấy".

## Layout B — thẻ 3 cột, `viewBox="0 0 760 320"`

Dùng cho ảnh 2: 3 nhóm nguy cơ, 3 phương pháp, hoặc 3 mức độ.
Cột 3 luôn được nhấn (nền ấm + viền cam) vì là cột "cần hành động".

```
<rect width="760" height="320" fill="#fff9f4"/>

Thẻ 1: <rect x="20"  y="20" width="226" height="280" rx="18" fill="#ffffff" stroke="#ecdfd3"/>
Thẻ 2: <rect x="267" y="20" width="226" height="280" rx="18" fill="#ffffff" stroke="#ecdfd3"/>
Thẻ 3: <rect x="514" y="20" width="226" height="280" rx="18" fill="#fdeee2" stroke="#f2a56e"/>

Tâm ngang mỗi thẻ: x = 133 / 380 / 627
Icon: nằm trong vùng y ≈ 47–160, cao ~110px, dùng cam #f26e21 + nét #d85a10
Chữ (đều text-anchor="middle"):
  y="205" font-size="21|22" font-weight="700" fill="#123b63"   ← tiêu đề thẻ
  y="235" font-size="16|17" fill="#5b6b7b"                      ← mô tả phụ
  y="272" font-size="17|18" font-weight="700" fill="#d85a10"    ← hành động/tần suất
Ghi chú chân ảnh (nếu cần):
  <text x="380" y="313" text-anchor="middle" font-size="12" fill="#5b6b7b">*...</text>
```

Giới hạn ký tự để không tràn thẻ 226px: tiêu đề ≤ 18 ký tự, mô tả phụ ≤ 30, hành động ≤ 22.
Quá dài thì rút chữ, **đừng** giảm cỡ chữ dưới mức trong bảng.

## Icon đã có (chép lại được)

```
Vi khuẩn xoắn (HP):
  <path d="M108 70 q28 12 0 26 q-28 14 0 28 q28 14 0 28" fill="none"
        stroke="#f26e21" stroke-width="12" stroke-linecap="round"/>
  + 4 <path> roi ngắn stroke="#d85a10" stroke-width="6" stroke-linecap="round"

Vòng tuổi:
  <circle cx="380" cy="108" r="42" fill="none" stroke="#f2a56e" stroke-width="10"/>
  <text x="380" y="118" text-anchor="middle" font-size="30" font-weight="800" fill="#f26e21">40+</text>

Cây gia đình (tiền sử):
  2 <circle r="16" fill="#f26e21"/> cạnh nhau + <path> nối chữ T
  + 1 <circle r="14" fill="#f2a56e"/> phía dưới

Ống nghiệm (xét nghiệm):
  <rect width="40" height="105" rx="20" fill="#e8f1fa" stroke="#123b63" stroke-width="6"/>
  + <path> phần dịch fill="#f26e21" + <rect rx="7" fill="#123b63"/> nắp

Chuông cảnh báo (dấu hiệu cần khám):
  <path d="M627 60 a34 34 0 0 1 34 34 v28 l12 18 h-92 l12 -18 v-28 a34 34 0 0 1 34 -34 Z"
        fill="#f26e21" stroke="#d85a10" stroke-width="5"/>
  + <circle r="10" fill="#d85a10"/> làm quả chuông

Kính lúp (phát hiện sớm):
  <circle r="88" fill="#ffffff" stroke="#123b63" stroke-width="10"/> + clipPath phóng to bên trong
  + tay cầm <path stroke="#123b63" stroke-width="22" stroke-linecap="round"/>
```

## Kiểm tra ảnh

```bash
node .claude/skills/bai-kien-thuc/scripts/render-svg.mjs \
  assets/kien-thuc/<slug>-1.svg /tmp/check.png 760
```
Rồi Read `/tmp/check.png`. Nhìn 3 điểm: hình có đọc ra đúng thứ cần thể hiện không,
chữ có tràn/đè nhau không, tổn thương/vật nhấn có bị dụng cụ che không.
**Sửa tối đa 1 lượt** — ảnh minh họa không cần hoàn hảo, cần rõ nghĩa.
