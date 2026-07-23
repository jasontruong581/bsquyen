# Cấu trúc website & hướng dẫn deploy

Website tĩnh (HTML/CSS/JS thuần), không backend. Cấu trúc:

- `index.html` + `css/` + `js/` + `assets/` (gốc) — **bản chính thức** (phiên bản Ấm áp), được index
- `demo/` — trang hub demo 3 phiên bản cho khách hàng (noindex)
- `landing-page-bundle/` — phiên bản Hiện đại (noindex, chỉ demo)
- `landing-mix/` — phiên bản Tổng hợp (noindex, chỉ demo)
- `bsquyen/` — ảnh chân dung bác sĩ

## Thông tin liên hệ chính thức (đã áp dụng cả 3 phiên bản)

- SĐT/Zalo: `0776196601` (hiển thị `0776 196 601`)
- Email: `bsquyen1407@gmail.com`
- Địa chỉ: 297A Bùi Hữu Nghĩa, Phường Gia Định, TP.HCM (khu chợ Bà Chiểu)
- Giờ làm việc: T2–T6 17:00–19:30 · T7 & CN 9:00–17:00

Khi cần đổi: sửa `CONTACT` đầu file `js/main.js` và `landing-mix/js/main.js`, các link `tel:`/`zalo.me`/`mailto:` trong các file `index.html`, và key `ctaText/ctaCall/profileSoft` trong `landing-page-bundle/script.js` (cả `vi` lẫn `en`). Tìm nhanh: `grep -rln "0776196601"`.

## Ghi chú nội dung

- Section "Phản hồi bệnh nhân" (bản Hiện đại) đã thay bằng "Cam kết đồng hành": quảng cáo dịch vụ khám chữa bệnh không được dùng lời chứng thực của người bệnh theo quy định quảng cáo y tế VN.

## Chạy thử local

```bash
cd /home/hoang/project/bsquyen
python3 -m http.server 8080
# mở http://localhost:8080
```

## Deploy (miễn phí)

- **Cloudflare Pages / Vercel / Netlify**: kéo thả thư mục hoặc kết nối git repo, không cần cấu hình build (static site).
- **GitHub Pages**: push repo → Settings → Pages → chọn branch.

## Nâng cấp sau này (nếu cần)

- Form gửi thẳng về email không cần backend: dùng Formspree hoặc FormSubmit (cần email thật để kích hoạt), đổi `form` sang POST endpoint của dịch vụ.
- Hệ thống đặt lịch chọn khung giờ: cần backend + database — cân nhắc khi lượng bệnh nhân đặt qua web đủ lớn.

## Tối ưu SEO / AI search (đã triển khai 07/2026)

Base URL hiện tại: `https://bsquyen.vercel.app`. Bản chính thức được index nằm ở trang gốc `/`; các bản demo (`demo/`, `landing-mix/`, `landing-page-bundle/`) gắn `noindex, follow`. Domain đã chốt: **bsquyen.com** (chưa mua — khi trỏ xong thì thay URL theo checklist).

Đã có:

- JSON-LD schema.org trong `index.html` (gốc): `Physician` + `MedicalClinic` (địa chỉ, giờ mở cửa, dịch vụ) + `FAQPage`
- Open Graph + canonical cho trang gốc và trang demo
- `robots.txt` (cho phép GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot…), `sitemap.xml`, `llms.txt`

### Checklist khi mua domain chính thức (ví dụ bsquyen.com)

1. Trỏ domain vào Vercel (Project Settings → Domains), đặt làm primary để `*.vercel.app` tự redirect
2. Thay toàn bộ URL: `grep -rln "bsquyen.vercel.app"` → thay bằng `bsquyen.com` (index.html, demo/index.html, robots.txt, sitemap.xml, llms.txt)
3. Đăng ký Google Search Console + Bing Webmaster Tools, submit sitemap
4. Tạo Google Business Profile cho phòng khám (cần hướng dẫn riêng — xem ghi chú bên dưới)
5. Kiểm tra structured data bằng https://search.google.com/test/rich-results

### Việc chưa làm (chờ domain)

- Google Business Profile: bác sĩ tự đăng ký bằng tài khoản Google, xác minh qua video/bưu thiếp; sẽ soạn hướng dẫn từng bước khi user mua domain xong
- Cập nhật `lastmod` trong sitemap.xml khi nội dung thay đổi lớn

## Mục Kiến thức (Eleventy) — thêm bài viết mới

Stack: Eleventy v3 (`npm run build` → output `_site/`, Vercel build theo `vercel.json`). Site tĩnh cũ được passthrough copy nguyên trạng; chỉ `/kien-thuc/` sinh từ Markdown.

Quy trình mỗi bài (2 bài/tháng, AI soạn — bác sĩ duyệt):

1. Tạo `kien-thuc/<slug-khong-dau>.md` với frontmatter:
   ```yaml
   ---
   title: "Tiêu đề bài viết"
   description: "Mô tả 1-2 câu (hiện ở đầu bài, meta description, schema)"
   date: 2026-08-01          # ngày đăng
   updated: 2026-08-15       # tùy chọn, khi sửa nội dung
   sources:                  # tùy chọn nhưng nên có (E-E-A-T)
     - title: "Tên nguồn"
       url: "https://..."
   ---
   ```
2. Viết nội dung Markdown bên dưới (h2 `##`, h3 `###`, blockquote `>` cho câu nhấn mạnh)
3. Chạy `npm run build` kiểm tra local (`python3 -m http.server 8081 -d _site`)
4. Mở PR riêng cho bài viết → bác sĩ duyệt trên Vercel preview URL → merge = xuất bản

Tự động khi build: trang danh sách `/kien-thuc/`, sitemap.xml (kèm lastmod), schema `MedicalWebPage` + byline bác sĩ, khối CTA đặt lịch + disclaimer cuối bài.

Lưu ý nội dung (YMYL): bác sĩ là người duyệt cuối; không hứa hẹn kết quả điều trị; có nguồn tham khảo; cập nhật `updated` khi sửa đáng kể.
