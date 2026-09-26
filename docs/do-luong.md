# Đo lường truy cập (Umami)

Dashboard: <https://cloud.umami.is> — gói **Hobby** miễn phí: 100K sự kiện/tháng,
1 website, **giữ dữ liệu 6 tháng**, không có API. Mỗi lượt xem trang hay mỗi lượt bấm
tính là 1 sự kiện.

Chọn Umami thay vì Vercel Analytics hay Cloudflare Web Analytics vì hai lý do:
đo được **lượt bấm** (Cloudflare chưa hỗ trợ sự kiện tuỳ chỉnh), và **không phụ thuộc
host** (Vercel Analytics gắn với project Vercel — chuyển host là mất lịch sử). Không dùng
cookie nên không cần banner xin đồng ý.

## Gắn ở đâu

- `_includes/partials/do-luong.njk` — mọi trang Kiến thức
- `index.html` — bản sao hai dòng script (file này không đi qua template)
- **Không** gắn vào `demo/`, `landing-mix/`, `landing-page-bundle/`

`data-domains="bsquyen.vercel.app"` nghĩa là chỉ site thật gửi số liệu. Mở preview
Vercel hay chạy `npm run dev` sẽ không bị đếm — kiểm tra bằng tab Network: có tải
`script.js` nhưng không có request nào tới `/api/send`.

## Sự kiện

| Sự kiện | Khi nào | Thuộc tính |
|---|---|---|
| `bam-goi` | bấm link `tel:` bất kỳ | `vi_tri` |
| `bam-zalo` | bấm link `zalo.me`, hoặc nút "Sao chép & mở Zalo" của form | `vi_tri` |
| `bam-email` | bấm link `mailto:` (kể cả nút "Gửi qua email" của form) | `vi_tri` |
| `bam-dat-lich` | bấm link tới `#dat-lich` | `vi_tri` |
| `dat-lich-soan` | điền form đặt lịch hợp lệ, bấm soạn | — |
| `tim-kiem` | ngừng gõ 1,5 giây trong ô tìm kiếm `/kien-thuc/` (mỗi truy vấn đếm 1 lần) | `so_ket_qua` — **không** gửi chữ người dùng gõ |
| `chia-se` | chia sẻ bài thành công | `kenh`: `he-thong` (bảng chia sẻ của máy — Zalo, Messenger…), `facebook`, `sao-chep` |

`vi_tri` là nơi đặt nút: `dau-trang` (khối lớn đầu trang chủ), `header`, `thanh-nhanh` (thanh dưới đáy màn hình điện thoại), `tim-kiem` (gợi ý nhắn Zalo khi tìm không ra bài),
`cuoi-bai` (khối CTA cuối bài Kiến thức), `form-dat-lich`, `footer`, hoặc tên section
trên trang chủ (`gioi-thieu`, `phong-kham`…), hoặc `khac` khi không thuộc khối nào ở
trên (vd link gọi nằm trong thân bài viết). Trang cụ thể thì Umami đã tự ghi theo URL.

Listener nằm ở `js/do-luong.js` và bắt theo `href`, nên **nút liên hệ mới tự được đếm**.
Chỉ cần đo thêm khi đó là `<button>` chứ không phải `<a>` — xem cách làm với nút Zalo của
form trong `js/main.js`.

**Không gửi dữ liệu cá nhân:** không họ tên, SĐT, dịch vụ chọn trong form, không nội
dung người dùng gõ. Giữ nguyên tắc này khi thêm sự kiện mới.

Umami ghi **cả query string** của URL mỗi lượt xem trang. Vì vậy không form nào được gửi
bằng GET: form đặt lịch để `method="post"`, dù bình thường JavaScript chặn việc gửi — để
lỡ JS không chạy thì họ tên, SĐT, lời nhắn cũng không bao giờ nằm trên URL.

**JavaScript của site không dùng `?.` hay cú pháp mới hơn ES2019.** Trình duyệt cũ gặp
cú pháp không hiểu là bỏ cả file: với `js/main.js` nghĩa là menu chết và trang chủ trắng.
Viết `if (window.umami) window.umami.track(...)`.

## Nguồn Facebook

Link trong caption Facebook có `?utm_source=facebook` (thêm tự động bởi
`scripts/dang-facebook.mjs`). Xem ở dashboard → **UTM** hoặc lọc `utm_source`.
Trình duyệt trong app Facebook không phải lúc nào cũng gửi referrer, nên số ở mục
Referrers sẽ thấp hơn thực tế — tin số UTM.

Link chia sẻ từ nút cuối bài có `?utm_source=chia-se`, nên lượt đọc nhờ người đọc chuyển
bài cho nhau (nhóm Zalo gia đình…) cũng tách riêng được trong mục **UTM**.

## Đổi domain

1. Sửa `data-domains` ở hai chỗ trên — đã nằm trong lệnh `sed` của checklist đổi domain.
2. Trong Umami: **Settings → Websites → sửa Domain** của website hiện có. Gói Hobby chỉ
   1 website, nên sửa chứ đừng thêm mới — sửa thì dữ liệu cũ vẫn liền mạch.
