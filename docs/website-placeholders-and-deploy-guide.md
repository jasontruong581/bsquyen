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
cd <đường-dẫn-repo>
npm run dev
# mở URL mà Eleventy in ra (mặc định http://localhost:8080)
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
- JSON-LD `MedicalWebPage` + byline/`reviewedBy` bác sĩ cho mỗi bài Kiến thức (trong `_includes/layouts/bai-viet.njk`)
- Open Graph + canonical cho trang gốc, trang demo, trang danh sách `/kien-thuc/` và từng bài viết
- `robots.txt` (cho phép GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot…), `llms.txt`
- `sitemap.xml` **sinh tự động khi build** từ `sitemap.njk` — bài mới tự vào, kèm `lastmod`

### Checklist khi mua domain chính thức (bsquyen.com)

1. Trỏ domain vào Vercel (Project Settings → Domains), đặt làm **primary** để `*.vercel.app` tự 301 redirect — nhờ đó các URL đã được Google index không mất giá trị.

2. Thay toàn bộ URL trong **source** (34 chỗ / 8 file — con số này thay đổi khi thêm
   template mới, nên **luôn chạy lệnh `grep` bên dưới** thay vì tin bảng này):

   | File | Số chỗ | Chứa gì |
   |---|---|---|
   | `index.html` | 10 | canonical, Open Graph, JSON-LD `Physician`/`MedicalClinic` |
   | `_includes/layouts/bai-viet.njk` | 7 | canonical, `og:url`, `og:image`, JSON-LD của **mọi bài viết** |
   | `kien-thuc/index.njk` | 5 | canonical + Open Graph trang danh sách (kèm `rel=prev/next`) |
   | `kien-thuc/chu-de.njk` | 3 | canonical + Open Graph **6 trang lọc chủ đề** |
   | `sitemap.njk` | 3 | `<loc>` trang gốc, trang danh sách, và từng bài |
   | `llms.txt` | 2 | |
   | `robots.txt` | 1 | dòng `Sitemap:` |
   | `demo/index.html` | 3 | canonical bản demo (`noindex, follow`) |

   ```bash
   grep -rl 'bsquyen\.vercel\.app' --include='*.html' --include='*.njk' --include='*.txt' . \
     | grep -v '^./_site' | grep -v node_modules \
     | xargs sed -i 's|bsquyen\.vercel\.app|bsquyen.com|g'
   ```

   ⚠️ **Sửa `sitemap.njk`, KHÔNG sửa `sitemap.xml`** — `sitemap.xml` là file Eleventy sinh ra khi build, sửa vào đó sẽ bị ghi đè. Tương tự: đừng sửa gì trong `_site/`.

   ⚠️ Bỏ sót `_includes/layouts/bai-viet.njk` là lỗi tốn kém nhất: các bài viết sẽ có `canonical` trỏ về domain cũ, tức báo Google "bản chính thức nằm ở vercel.app" → domain mới không lên hạng.

3. Hậu kiểm — build lại rồi xác nhận không còn URL cũ nào trong output:

   ```bash
   npm run build
   grep -rc 'bsquyen\.vercel\.app' _site/ | grep -v ':0$'   # không ra dòng nào = sạch
   grep -o '<loc>[^<]*</loc>' _site/sitemap.xml             # phải toàn bsquyen.com
   ```

4. Đăng ký Google Search Console + Bing Webmaster Tools cho domain mới, submit `sitemap.xml`
5. Tạo Google Business Profile cho phòng khám (cần hướng dẫn riêng — xem ghi chú bên dưới)
6. Kiểm tra structured data bằng https://search.google.com/test/rich-results (test cả trang gốc **và** một trang bài viết — hai schema khác nhau: `Physician`/`MedicalClinic` vs `MedicalWebPage`)

### Việc chưa làm (chờ domain)

- Google Business Profile: bác sĩ tự đăng ký bằng tài khoản Google, xác minh qua video/bưu thiếp; sẽ soạn hướng dẫn từng bước khi user mua domain xong
- `lastmod` của bài viết **tự sinh** từ frontmatter (`updated` nếu có, không thì `date`) — khi sửa một bài đáng kể thì thêm `updated: YYYY-MM-DD` vào frontmatter bài đó, sitemap tự cập nhật khi build. Không sửa tay `sitemap.xml`.

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
3. Chạy `npm run build` kiểm tra local (hoặc `npm run dev` để xem trực tiếp)
4. Mở PR riêng cho bài viết → bác sĩ duyệt trên Vercel preview URL → merge = xuất bản

Tự động khi build: trang danh sách `/kien-thuc/`, sitemap.xml (kèm lastmod), schema `MedicalWebPage` + byline bác sĩ, khối CTA đặt lịch + disclaimer cuối bài.

Lưu ý nội dung (YMYL): bác sĩ là người duyệt cuối; không hứa hẹn kết quả điều trị; có nguồn tham khảo; cập nhật `updated` khi sửa đáng kể.
