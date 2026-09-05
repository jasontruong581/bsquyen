# Tự động đăng bài Kiến thức lên Facebook Page

Khi một PR bài viết được merge vào `main`, GitHub Actions đăng bài đó lên Facebook Page
dưới dạng **bài ảnh đã hẹn giờ sau 2 tiếng**. Trong 2 tiếng đó bạn sửa hoặc huỷ được
trong Meta Business Suite; không làm gì thì bài tự lên.

- Workflow: `.github/workflows/dang-facebook.yml`
- Script: `scripts/dang-facebook.mjs`
- Caption: field `facebook:` trong frontmatter bài viết — bác sĩ duyệt cùng lúc duyệt bài

## Job chạy khi nào

Chỉ khi có file `kien-thuc/*.md` **được thêm mới** ở commit đẩy lên `main`
(`git diff --diff-filter=A`). Sửa một bài đã có **không** làm bài đăng lại.

Chạy tay được: tab **Actions → Đăng bài mới lên Facebook → Run workflow**, nhập `slug`
và chọn `dry_run`. Mặc định `dry_run` bật, phải tự tắt mới đăng thật.

## Chuẩn bị một lần

Cần đúng hai secret trong repo: `FB_PAGE_ID` và `FB_PAGE_ACCESS_TOKEN`.

### 1. Page ID

Page hiện tại: <https://www.facebook.com/profile.php?id=61594348400419> → Page ID là
**`61594348400419`**.

Xác nhận lại ở bước 3 bằng `GET /me/accounts` — con số trong URL và Page ID của Graph API
gần như luôn trùng nhau, nhưng đừng tin mà không kiểm.

### 2. Tạo Meta app

1. Vào <https://developers.facebook.com/apps> → **Create App** → loại **Business**
2. Thêm sản phẩm **Facebook Login**
3. Để app ở chế độ **Development**

**Không cần App Review.** Đây là chỗ nhiều người tưởng nhầm rồi bỏ cuộc: App Review chỉ
bắt buộc khi *người khác* dùng app của bạn. App ở chế độ Development vẫn cấp đủ quyền cho
chính admin/developer/tester của app — tức là bạn.

*(Meta thỉnh thoảng đòi Business Verification cho một số quyền. Nếu bị chặn ở bước 3 thì
làm xác minh doanh nghiệp trong Business Manager rồi quay lại.)*

### 3. Lấy Page Access Token vĩnh viễn

Vào **Graph API Explorer** (<https://developers.facebook.com/tools/explorer>):

1. Chọn app vừa tạo, chọn **User Token**, cấp hai quyền:
   `pages_manage_posts` và `pages_read_engagement`
2. **Generate Access Token** → được *short-lived user token* (sống 1–2 giờ)
3. Đổi sang **long-lived user token** (sống 60 ngày):

   ```
   GET /oauth/access_token
       ?grant_type=fb_exchange_token
       &client_id=<APP_ID>
       &client_secret=<APP_SECRET>
       &fb_exchange_token=<SHORT_LIVED_USER_TOKEN>
   ```

4. Dùng long-lived user token vừa nhận để gọi:

   ```
   GET /me/accounts
   ```

   Trong kết quả, tìm đúng page và lấy `access_token` của nó — **đây mới là token cần
   dùng**. Đối chiếu luôn `id` với Page ID ở bước 1.

Điểm mấu chốt: Page Access Token dẫn xuất từ một **long-lived** user token thì
**không có hạn dùng**. Nếu bạn lỡ lấy page token từ short-lived user token thì nó chết
sau vài giờ — đó là lý do phổ biến nhất khiến job đang chạy tốt bỗng hỏng.

Kiểm tra hạn của token tại <https://developers.facebook.com/tools/debug/accesstoken> —
ô **Expires** phải ghi *Never*.

### 4. Nạp secret vào repo

> ⚠️ Token là mật khẩu của page. **Đừng dán vào chat, commit, hay PR.** Chỉ nhập thẳng
> vào GitHub.

Cách 1 — giao diện: **Settings → Secrets and variables → Actions → New repository secret**

Cách 2 — dòng lệnh (dán token vào lời nhắc, không để nó vào lịch sử shell):

```bash
gh secret set FB_PAGE_ID
gh secret set FB_PAGE_ACCESS_TOKEN
```

## Chạy thử trước khi dùng thật

```bash
node scripts/dang-facebook.mjs --slug=tam-soat-ung-thu-vu --dry-run
```

In ra caption hoàn chỉnh (đã nối link + hashtag) và kiểm tra URL bài/ảnh có live chưa,
**không gọi Facebook**. Chạy được kể cả khi chưa có token.

Khi đã nạp secret, chạy `Run workflow` với `dry_run` tắt trên một bài cũ để kiểm tra
đường đi thật. Bài sẽ nằm ở mục *Đã lên lịch* — vào Business Suite huỷ là xong, không
có gì lên page.

## Caption được ghép thế nào

```
<field `facebook:` trong frontmatter, đã gộp dòng gãy thành đoạn liền>

<link bài>

<hashtag suy từ `tags`> #BSCKIHanhQuyen
```

Frontmatter **chỉ chứa phần chữ**. Link và hashtag nối lúc đăng, vì:

- link gõ tay trong frontmatter nghĩa là đổi domain phải sửa 50–100 file bài viết
- hashtag suy từ `tags` thì luôn nhất quán, không lệch dần theo thời gian

Nguồn hard-wrap ~76 ký tự theo quy ước repo; script tự gộp các dòng gãy lại thành đoạn,
chỉ giữ ngắt đoạn ở chỗ có dòng trống. Nhờ vậy caption trên Facebook không bị câu cụt.

Bảng hashtag nằm trong `scripts/dang-facebook.mjs`, khớp 6 tag cố định ở `_data/chuDe.js`.
Tag lạ bị bỏ qua kèm cảnh báo, không làm job fail.

## Khi có sự cố

Job fail thì GitHub gửi mail cho chủ repo. Log ở tab **Actions**.

| Triệu chứng | Nguyên nhân thường gặp |
|---|---|
| `thiếu field facebook` | Bài merge mà quên caption. Bài vẫn lên web. Bổ sung `facebook:` rồi Run workflow với slug đó. |
| `Token hoặc Page ID không dùng được` | Token hết hạn hoặc bị thu hồi (đổi mật khẩu Facebook, gỡ app). Lấy lại token theo bước 3. |
| `không lên sau 5 phút` | Vercel deploy fail hoặc quá chậm. Kiểm tra deploy, rồi Run workflow lại với slug đó. |
| Lỗi nhắc tới version | Phiên bản Graph API đã hết hạn (~2 năm/phiên bản). Đổi `FB_API_VERSION` trong workflow theo <https://developers.facebook.com/docs/graph-api/changelog>. |

Job **không** tự thử lại. Cố ý: đăng nhầm hai lần lên page của bác sĩ tệ hơn là đăng trễ.

## Bảo trì

- **Đổi domain sang bsquyen.com**: sửa `SITE_URL` trong `.github/workflows/dang-facebook.yml`.
  Đã có trong checklist đổi domain ở `website-placeholders-and-deploy-guide.md`.
- **Đổi cửa sổ huỷ**: `DELAY_PHUT` trong workflow. Facebook yêu cầu ≥ 10 phút.
- **Ảnh đăng lên** là ảnh OG 1200×630 của bài. Tỉ lệ này chuẩn cho thẻ link preview nhưng
  hơi dẹt khi làm ảnh chính trên feed điện thoại. Muốn đẹp hơn thì thêm biến thể vuông
  1200×1200 vào `scripts/tao-anh-og.mjs` rồi trỏ script đăng sang ảnh đó.
