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

Page: **Hiểu Đúng Y Khoa**, Page ID **`1326029250593644`**
(Meta Business Suite → Cài đặt → Trang cá nhân → chọn page → *ID Trang*).

⚠️ **Đừng lấy số trong URL `facebook.com/profile.php?id=...`.** Page tạo theo New Pages
Experience hiện URL kèm một ID khác (ở đây là `61594348400419`) — đó không phải ID mà
Graph API dùng. Số đúng là số Business Suite gọi là *ID Trang*, và `GET /me/accounts`
trả về đúng số đó.

Script `lay-token-facebook.mjs` ở mục dưới tự đọc ID từ `/me/accounts`, nên cách chắc
chắn nhất là để nó điền hộ thay vì chép tay.

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

1. Chọn app vừa tạo, chọn **User Token**, cấp **ba** quyền:
   `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`

   Thiếu `pages_show_list` thì bước sau trả về danh sách page **rỗng** dù bạn là admin
   của page. Lỗi này không có thông báo gì — chỉ là không thấy page nào.

2. **Generate Access Token** → đăng nhập → **tick chọn đúng page** trong hộp thoại
3. Copy token vừa hiện ra. Đây là *short-lived user token*, sống 1–2 giờ — đủ cho bước 4.

### 4. Đổi thành Page Access Token vĩnh viễn

Ba bước còn lại (đổi sang long-lived, tìm đúng page, kiểm tra hạn dùng) đều dễ sai, nên
có script làm hộ:

```bash
node scripts/lay-token-facebook.mjs
```

Script hỏi **App ID**, **App Secret** (Meta app → Settings → Basic) và **short-lived user
token** vừa lấy, rồi:

1. đổi short-lived → long-lived user token
2. gọi `/me/accounts`, cho bạn chọn page, lấy Page Access Token của page đó
3. gọi `debug_token` xác nhận token **không có hạn dùng** — sai là nó dừng và báo, chứ
   không để bạn nạp nhầm một token sẽ chết sau vài giờ
4. `gh secret set FB_PAGE_ID` và `FB_PAGE_ACCESS_TOKEN`

Token đi qua stdin sang `gh`, **không in ra màn hình** và không nằm lại trong lịch sử
terminal. Không có `gh` thì chạy `node scripts/lay-token-facebook.mjs --chi-in` để in ra
rồi tự dán vào **Settings → Secrets and variables → Actions**.

> ⚠️ Token là mật khẩu của page. **Đừng dán vào chat, commit, hay PR.**

Điểm mấu chốt script đang bảo vệ bạn: Page Access Token chỉ **vĩnh viễn** khi được dẫn
xuất từ một user token **long-lived**. Lấy từ short-lived thì page token cũng chết theo
sau vài giờ — đây là lý do phổ biến nhất khiến job đang chạy tốt bỗng hỏng, và nhìn bằng
mắt thì hai token trông y hệt nhau.

Muốn tự kiểm bất cứ lúc nào: <https://developers.facebook.com/tools/debug/accesstoken> —
ô **Expires** phải ghi *Never*.

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
| Lỗi nhắc tới version | Phiên bản Graph API hết hạn ~2 năm sau khi ra. Đang pin `v26.0` (ra 29/07/2026). Đổi `FB_API_VERSION` trong workflow theo <https://developers.facebook.com/docs/graph-api/changelog>. |
| `/me/accounts` không thấy page nào | User token thiếu `pages_show_list`, hoặc lúc đăng nhập chưa tick chọn page. Lấy lại token từ bước 3. |

Job **không** tự thử lại. Cố ý: đăng nhầm hai lần lên page của bác sĩ tệ hơn là đăng trễ.

## Bảo trì

- **Đổi domain sang bsquyen.com**: sửa `SITE_URL` trong `.github/workflows/dang-facebook.yml`.
  Đã có trong checklist đổi domain ở `website-placeholders-and-deploy-guide.md`.
- **Đổi cửa sổ huỷ**: `DELAY_PHUT` trong workflow. Facebook yêu cầu ≥ 10 phút.
- **Ảnh đăng lên** là ảnh OG 1200×630 của bài. Tỉ lệ này chuẩn cho thẻ link preview nhưng
  hơi dẹt khi làm ảnh chính trên feed điện thoại. Muốn đẹp hơn thì thêm biến thể vuông
  1200×1200 vào `scripts/tao-anh-og.mjs` rồi trỏ script đăng sang ảnh đó.
