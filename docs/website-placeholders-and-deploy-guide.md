# Cấu trúc website & hướng dẫn deploy

Website tĩnh (HTML/CSS/JS thuần), không backend. Cấu trúc:

- `index.html` (gốc) — trang hub tổng hợp, link tới 3 phiên bản (preview iframe thu nhỏ)
- `landing-warm/` — phiên bản Ấm áp (cam – navy, form đặt lịch soạn tin Zalo/email)
- `landing-page-bundle/` — phiên bản Hiện đại (xanh glassmorphism, song ngữ + dark mode)
- `landing-mix/` — phiên bản Tổng hợp (khung liên hệ của Ấm áp + nội dung của Hiện đại + header pill, scroll progress)
- `bsquyen/` — ảnh chân dung bác sĩ (các trang tham chiếu `../bsquyen/bsquyen.jpg`)

## Thông tin liên hệ chính thức (đã áp dụng cả 3 phiên bản)

- SĐT/Zalo: `0776196601` (hiển thị `0776 196 601`)
- Email: `bsquyen1407@gmail.com`
- Địa chỉ: 297A Bùi Hữu Nghĩa, Phường Gia Định, TP.HCM (khu chợ Bà Chiểu)
- Giờ làm việc: T2–T6 17:00–19:30 · T7 & CN 9:00–17:00

Khi cần đổi: sửa `CONTACT` đầu file `landing-warm/js/main.js` và `landing-mix/js/main.js`, các link `tel:`/`zalo.me`/`mailto:` trong 3 file `index.html`, và key `ctaText/ctaCall/profileSoft` trong `landing-page-bundle/script.js` (cả `vi` lẫn `en`). Tìm nhanh: `grep -rln "0776196601"`.

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
